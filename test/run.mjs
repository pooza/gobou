// 検体を Biome にかけ、test/expected.json と照らし合わせる。
//
// 🔴 Biome の Vue のルールは preset の recommended に入っていない（2.6.6 で実測）。
// biome.json で明示して有効にしているので、版を上げたときに名前が変わる・グループが移るなどで
// 黙って外れると、検査が減ったことに誰も気づかない。ここで赤にする。
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const expected = JSON.parse(readFileSync(new URL('./expected.json', import.meta.url), 'utf8'));
delete expected._comment;

let out;
try {
  out = execFileSync('npx', ['biome', 'lint', '--reporter=json', '--max-diagnostics=1000', 'test/fixtures'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (e) {
  // 診断があると終了コードは 1。出力が JSON なら続ける
  out = e.stdout;
}

const report = JSON.parse(out);
const actual = new Map();
for (const d of report.diagnostics ?? []) {
  const path = d.location?.path;
  const file = basename(typeof path === 'string' ? path : (path?.file ?? ''));
  if (!actual.has(file)) actual.set(file, new Set());
  actual.get(file).add(d.category);
}

const failures = [];
for (const [file, categories] of Object.entries(expected)) {
  const got = actual.get(file) ?? new Set();
  if (categories.length === 0 && got.size > 0) {
    failures.push(`${file}: 何も出ないはずが ${[...got].join(', ')}`);
  }
  for (const c of categories) {
    if (!got.has(c)) failures.push(`${file}: ${c} が出ていない（出たもの: ${[...got].join(', ') || 'なし'}）`);
  }
}
const unlisted = [...actual.keys()].filter((f) => !(f in expected));
for (const f of unlisted) failures.push(`${f}: expected.json に無い検体`);

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`${Object.keys(expected).length} 個の検体が期待どおり`);
