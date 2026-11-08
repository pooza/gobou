# gobou

Node.js と PHP のプロジェクト共通の lint・整形・静的解析の設定。Node.js は [Biome](https://biomejs.dev/)、PHP は PHP-CS-Fixer・PHPStan（WordPress には phpcs の Security の検査も）。[ginseng-style](https://github.com/pooza/ginseng-style)（Ruby の規約の正本）の、Node.js 向けの配布物。

⚠ **規約そのものの正本は ginseng-style にある。** ここは設定を配るだけの場所。なぜこう決めたかは [ginseng-style#142](https://github.com/pooza/ginseng-style/issues/142)。

## 入れ方

`package.json`:

```json
{
  "devDependencies": {
    "@biomejs/biome": "2.6.6",
    "gobou": "github:pooza/gobou#v0.3.0"
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
- ⚠ **gobou はタグで固定する**（`#v0.3.0`）。`#main` にしない
- ⚠ `vcs` は利用側に置く。共有の設定に入れると、Biome は gobou の側で `.gitignore` を探して落ちる

### 対象から外すもの

既定で `*.min.js` / `dist` / `build` / `coverage` を外す。同梱のベンダーのファイルがあれば、利用側で足す。⚠ **利用側では `**` を書かない**（共有の設定に既にある）。

```json
{ "files": { "includes": ["!public/vendor"] } }
```

### `--write` のあとは動かして確かめる

`biome check --write` が当てるのは Biome が「安全」とする修正だけだが、**実行時に壊れる形が 2 つある**（2026-11-07 に導入先で踏んだ・Biome 2.6.6 で実測。pooza/gobou#5）。🔴 **どちらもビルドや型検査では捕まらない。** `--write` のあとは、ビルドだけでなく実際に動かして確かめる。

- **`complexity/useArrowFunction`** — `this` を使わない関数式を arrow 関数にする。🔴 **`new` で呼ばれる関数**（例: CKEditor 5 の `extraPlugins` に渡す plugin の関数）は arrow にすると `TypeError` になる。**関数宣言にして名前で渡す**（宣言は対象にならない）

  ```js
  function UploadAdapterPlugin(editor) {
    // ...
  }
  ClassicEditor.create(element, { extraPlugins: [UploadAdapterPlugin] });
  ```

  - 式のまま置くなら、変数に入れて理由を添えて抑止する（`// biome-ignore lint/complexity/useArrowFunction: CKEditor が new で呼ぶ`）。🔴 **配列の要素の位置に書いた抑止は効かない**（`suppressions/unused` になり、修正もそのまま当たる。2.6.6 で実測）
  - ⚠ `this` を使っている関数は、もともと対象にならない

- **`suspicious/noRedundantUseStrict`** — `'use strict'` を消す。Biome は `.js` を ES モジュールとみなす（`package.json` に `"type": "module"` が無くても）ので冗長と判断するが、🔴 **CommonJS では strict mode が外れる。** `.cjs` は対象にならない。CommonJS の `.js` が残っているディレクトリでは、利用側でこのルールを切る

  ```json
  {
    "overrides": [
      {
        "includes": ["server/**"],
        "linter": { "rules": { "suspicious": { "noRedundantUseStrict": "off" } } }
      }
    ]
  }
  ```

  ⚠ 拡張子を `.cjs` に変えられるなら、そのほうがよい（ルールを切らずに済む）

## 中身

- `preset: recommended` を土台にする
- 🔴 **Vue のルールは recommended に入っていないので、明示して有効にしている。** correctness の Vue のルールはすべて、nursery は構文の正しさ（`useVueValid*`）・廃止された書き方（`noVueDeprecated*`）・不具合につながるものだけ。書き方の揃え方の nursery は入れていない
- `noExplicitAny` は warn
- a11y はグループごと warn（recommended に無い a11y のルールも warn で入る。0.2.0 で直した — 0.1.0 は error のままだった）
- 認知的複雑度（`noExcessiveCognitiveComplexity`）は warn・しきい値 15（Biome の既定と同じ値を明示）。⚠ 入れた時点で利用側に大量に出うる（依頼元の 1 本で 135 件）ので、error にはしていない。減らすのは各利用側で（#8）
  - ⚠ 自前の設定の `overrides` で `"includes": ["*.ts"]` と書くと、Biome 2 ではリポジトリ直下のファイルにしか当たらない。`src` の中まで効かせるなら `"**/*.ts"`。ルールの名前が書いてあっても効いているとは限らない
- CSS の Tailwind の記法を許可する（#7）。v4 のディレクティブ（`@apply`・`@theme`・`@utility` など）は `css.parser.tailwindDirectives`、⚠ **v3 の `@tailwind` はそれだけでは通らない**ので `noUnknownAtRules` の `ignore` に `tailwind` を足している。それ以外の未知の at-rule は error のまま
- 整形: スペース 2・1 行 100・シングルクォート・末尾のカンマ・セミコロンあり。Vue のテンプレートも Biome で整形する（`html.experimentalFullSupportEnabled`。実験的）

## 版を上げるとき

`test/fixtures/` の検体を Biome にかけ、`test/expected.json` と照らし合わせる（`npm test`）。PHP は `test/php/` の検体を `test/php/run.sh` で照らし合わせる。🔴 明示したルールが Biome の版で黙って外れると、検査が減ったことに誰も気づかないので、ここで赤にする。

## PHP

PHP 8.3 以降が前提（pooza/ginseng-style#142）。

| 役割 | 道具 | gobou の設定 |
| --- | --- | --- |
| 整形・書き方の規約 | PHP-CS-Fixer `3.95.29` | `php/php-cs-fixer.php`（PER-CS ＋ PHP 8.3 への移行の規則。risky な規則は入れない） |
| 静的解析 | PHPStan `2.3.5` | `php/phpstan.neon`（水準 5） |
| WordPress の Security | phpcs `3.13.6` ＋ WPCS `3.4.1` | `php/phpcs-wordpress-security.xml`（エスケープ・nonce・サニタイズ・リダイレクト・SQL の prepare だけ） |

### 入れ方

`composer.json`:

```json
{
  "repositories": [{ "type": "vcs", "url": "https://github.com/pooza/gobou" }],
  "require-dev": {
    "pooza/gobou": "0.3.0",
    "friendsofphp/php-cs-fixer": "3.95.29",
    "phpstan/phpstan": "2.3.5"
  }
}
```

- ⚠⚠ **道具の版は gobou と同じ値に固定する**（`^` を付けない）。規則や水準の中身は版で変わる
- WordPress は `squizlabs/php_codesniffer` `3.13.6` と `wp-coding-standards/wpcs` `3.4.1` も足す（`dealerdirect/phpcodesniffer-composer-installer` の `allow-plugins` も要る）

`.php-cs-fixer.dist.php`:

```php
<?php

return (require __DIR__ . '/vendor/pooza/gobou/php/php-cs-fixer.php')(
    PhpCsFixer\Finder::create()->in(__DIR__)->exclude(['vendor', 'node_modules']),
);
```

`phpstan.neon`:

```neon
includes:
  - vendor/pooza/gobou/php/phpstan.neon
  - phpstan-baseline.neon
parameters:
  paths: [src]
```

- ⚠ **既存の違反は baseline に逃がす**（`vendor/bin/phpstan analyse --generate-baseline`）。新しいコードで増やさない
- フレームワークの拡張（Laravel は Larastan、WordPress は `szepeviktor/phpstan-wordpress`）や、プラグインのスタブ（ACF など）は利用側で足す
- 同梱のライブラリは `scanDirectories` に入れて、検査はしない

WordPress の `phpcs.xml.dist`:

```xml
<rule ref="vendor/pooza/gobou/php/phpcs-wordpress-security.xml"/>
```

⚠ WPCS の書き方の規則（タブのインデントなど）は PER-CS とぶつかるので使わない。

## 依頼・指摘の出し先

| 中身 | 出し先 | 例 |
| --- | --- | --- |
| gobou の設定そのもの | **gobou**（Issue か PR） | 誤検知のルールを外したい・道具の版を上げたい・検体を足したい・除外の既定を足したい |
| 規約の考え方・言語をまたぐ判断 | **[ginseng-style](https://github.com/pooza/ginseng-style)** | ルールの重さの方針・別の言語も揃えるか・見張りを作るか |
| 利用側のリポジトリだけの事情 | 利用側の中で完結 | 同梱のベンダーのファイルを外す・プラグインのスタブを足す |

- ⚠ **PR で送ってよい。** 利用側は再現の文脈を持っているので、そのほうが往復が減る。受け取った gobou の側で Issue を起こして紐づける
- 依頼には `request` ラベルを付ける（受け取った側が付けてもよい）

## License

MIT
