# gobou

Node.js プロジェクト共通の [Biome](https://biomejs.dev/) の設定。[ginseng-style](https://github.com/pooza/ginseng-style)（Ruby の規約の正本）の、Node.js 向けの配布物。

⚠ **規約そのものの正本は ginseng-style にある。** ここは設定を配るだけの場所。なぜこう決めたかは [ginseng-style#142](https://github.com/pooza/ginseng-style/issues/142)。

## 入れ方

`package.json`:

```json
{
  "devDependencies": {
    "@biomejs/biome": "2.6.6",
    "gobou": "github:pooza/gobou#v0.2.0"
  },
  "scripts": {
    "lint": "biome check .",
    "format": "biome check --write ."
  }
}
```

`biome.json`（リポジトリのルート）:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.6.6/schema.json",
  "extends": ["gobou/biome"],
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true }
}
```

- ⚠⚠ **`@biomejs/biome` は gobou と同じ版に固定する**（`^` を付けない）。Vue のルールの一部は nursery（安定前）で、版が変わると挙動が変わりうる
- ⚠ **gobou はタグで固定する**（`#v0.2.0`）。`#main` にしない
- ⚠ `vcs` は利用側に置く。共有の設定に入れると、Biome は gobou の側で `.gitignore` を探して落ちる

### 対象から外すもの

既定で `*.min.js` / `dist` / `build` / `coverage` を外す。同梱のベンダーのファイルがあれば、利用側で足す。⚠ **利用側では `**` を書かない**（共有の設定に既にある）。

```json
{ "files": { "includes": ["!public/vendor"] } }
```

## 中身

- `preset: recommended` を土台にする
- 🔴 **Vue のルールは recommended に入っていないので、明示して有効にしている。** correctness の Vue のルールはすべて、nursery は構文の正しさ（`useVueValid*`）・廃止された書き方（`noVueDeprecated*`）・不具合につながるものだけ。書き方の揃え方の nursery は入れていない
- `noExplicitAny` は warn
- a11y はグループごと warn（recommended に無い a11y のルールも warn で入る。0.2.0 で直した — 0.1.0 は error のままだった）
- 整形: スペース 2・1 行 100・シングルクォート・末尾のカンマ・セミコロンあり。Vue のテンプレートも Biome で整形する（`html.experimentalFullSupportEnabled`。実験的）

## 版を上げるとき

`test/fixtures/` の検体を Biome にかけ、`test/expected.json` と照らし合わせる（`npm test`）。🔴 明示したルールが Biome の版で黙って外れると、検査が減ったことに誰も気づかないので、ここで赤にする。

## License

MIT
