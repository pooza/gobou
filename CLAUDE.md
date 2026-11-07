# gobou

Node.js と PHP のプロジェクト共通の設定（Biome／PHP-CS-Fixer・PHPStan・phpcs）を配るリポジトリ。⚠ **規約の正本は [ginseng-style](https://github.com/pooza/ginseng-style)**（`docs/` と CLAUDE.md）。作業の作法（Issue 駆動・リリース前レビュー・Codex のレビュー）もそちらに従う。

- 配布物は `biome.json` / `package.json`（Node）と `php/` / `composer.json`（PHP）。⚠ タグは Node と PHP で共有する。⚠ **触ったら `package.json` の `version` を上げる**
- ⚠⚠ **タグは手で打つ（ginseng-style の「タグを手で打たない」の例外・2026-11-07 オーナー判断）。** gobou は規約の入れ物で、gem のような実装を持たないので、自動で打つ仕組み（`release-tag`）や週次の見張りまでは作らない。打つのは設定を変えたときだけ
  - 手順: `package.json` の `version` を上げた PR をマージ → `main` の HEAD に `v<version>` を打つ（`gh api repos/pooza/gobou/git/refs -f ref=refs/tags/v<version> -f sha=<SHA>`）→ GitHub Release を作る
  - ⚠ 打ち忘れると、利用側は新しい設定を指せない（`github:pooza/gobou#v<version>` で固定している）。⚠ 一度打ったタグは動かさない
- ⚠⚠ **Biome の版は `package.json` の `peerDependencies` と `devDependencies` で同じ値に固定する。** PHP の道具の版は `composer.json` の `require-dev` と README で同じ値にする
- ルールを足す・外すときは、`test/fixtures/` に検体を足して `test/expected.json` に期待値を書く。期待値は実測から書く
- ⚠ public なリポジトリなので、他 org のリポジトリ名を書かない
