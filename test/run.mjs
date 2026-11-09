// 検体を Biome にかけ、test/expected.json と照らし合わせる。
//
// 🔴 Biome の Vue のルールは preset の recommended に入っていない（2.6.6 で実測）。
// biome.json で明示して有効にしているので、版を上げたときに名前が変わる・グループが移るなどで
// 黙って外れると、検査が減ったことに誰も気づかない。ここで赤にする。
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const expected = JSON.parse(readFileSync(new URL('./expected.json', import.meta.url), 'utf8'));
delete expected._comment;

const root = fileURLToPath(new URL('..', import.meta.url));
// ⚠ `npx biome` は名前で解決するので、手元に @biomejs/biome が無いと npm の別物（`biome` パッケージ）を入れて走らせる。直接のパスで呼ぶ
const biome = fileURLToPath(new URL('../node_modules/@biomejs/biome/bin/biome', import.meta.url));

const fail = (message, detail) => {
  console.error(message);
  if (detail) console.error(detail);
  process.exit(1);
};

let out;
try {
  out = execFileSync(
    process.execPath,
    [biome, 'lint', '--reporter=json', '--max-diagnostics=1000', 'test/fixtures'],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
} catch (e) {
  // 診断があると終了コードは 1。それ以外（設定の誤り・未知のルール名など）は Biome の stderr を出して止める
  if (e.status !== 1 || !e.stdout)
    fail(`Biome が異常終了した（終了コード ${e.status}）`, e.stderr || e.message);
  out = e.stdout;
}

let report;
try {
  report = JSON.parse(out);
} catch {
  fail('Biome の出力が JSON ではない', out.slice(0, 2000));
}

// 🔴 検体が lint の対象から外れると、「何も出ない」の期待値は黙って緑になる。検査したファイル数を数える
const fixtures = readdirSync(new URL('./fixtures', import.meta.url)).length;
const summary = report.summary ?? {};
const checked = (summary.changed ?? 0) + (summary.unchanged ?? 0);
if (checked !== fixtures || summary.skipped) {
  fail(
    `検体 ${fixtures} 個のうち、検査されたのは ${checked} 個（skipped: ${summary.skipped ?? '不明'}）`,
  );
}

// 🔴 既定で対象から外しているもの（#12 の `*.md`）が、また対象に戻っていないか。整形で見る（表を揃えるのは整形）
// 🔴 検体が無くても「0 個」で緑になる（存在しないパスでも summary は 0 件）ので、先に数える
if (readdirSync(new URL('./excluded', import.meta.url)).length === 0) fail('test/excluded に検体が無い');
let excluded;
try {
  excluded = execFileSync(process.execPath, [biome, 'format', '--reporter=json', 'test/excluded'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (e) {
  // 対象が 1 つも無いと終了コードは 1（「No files were processed」）。それでも JSON は出る。
  // それ以外（設定の誤りなど）は Biome の stderr を出して止める（lint 側と同じ）
  if (e.status !== 1 || !e.stdout)
    fail(`Biome が異常終了した（test/excluded・終了コード ${e.status}）`, e.stderr || e.message);
  excluded = e.stdout;
}
let excludedReport;
try {
  excludedReport = JSON.parse(excluded);
} catch {
  fail('Biome の出力が JSON ではない（test/excluded）', String(excluded).slice(0, 2000));
}
const excludedSummary = excludedReport.summary ?? {};
const formatted = (excludedSummary.changed ?? 0) + (excludedSummary.unchanged ?? 0);
if (formatted !== 0) {
  fail(`test/excluded の ${formatted} 個が整形の対象に入っている（既定で外しているはず）`);
}
// ⚠ 読めなかったなど、外したのではない理由で 0 件になっていないか
if ((excludedReport.diagnostics ?? []).length > 0) {
  fail('test/excluded の整形で診断が出た', JSON.stringify(excludedReport.diagnostics).slice(0, 2000));
}

const actual = new Map();
for (const d of report.diagnostics ?? []) {
  const path = d.location?.path;
  const file = basename(typeof path === 'string' ? path : (path?.file ?? ''));
  if (!actual.has(file)) actual.set(file, new Set());
  actual.get(file).add(d.category);
  // 重さまで見る期待値（`<category>@<severity>`）のために、組でも持つ
  actual.get(file).add(`${d.category}@${d.severity}`);
}

const failures = [];
for (const [file, categories] of Object.entries(expected)) {
  const got = actual.get(file) ?? new Set();
  if (categories.length === 0 && got.size > 0) {
    failures.push(
      `${file}: 何も出ないはずが ${[...got].filter((x) => !x.includes('@')).join(', ')}`,
    );
  }
  for (const c of categories) {
    if (!got.has(c))
      failures.push(
        `${file}: ${c} が出ていない（出たもの: ${[...got].filter((x) => x.includes('@')).join(', ') || 'なし'}）`,
      );
  }
}
const unlisted = [...actual.keys()].filter((f) => !(f in expected));
for (const f of unlisted) failures.push(`${f}: expected.json に無い検体`);

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`${Object.keys(expected).length} 個の検体が期待どおり`);
