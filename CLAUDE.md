# gobou

Node.js プロジェクト共通の Biome の設定を配るリポジトリ。⚠ **規約の正本は [ginseng-style](https://github.com/pooza/ginseng-style)**（`docs/` と CLAUDE.md）。作業の作法（Issue 駆動・リリース前レビュー・Codex のレビュー）もそちらに従う。

- 配布物は `biome.json` と `package.json`。⚠ **触ったら `package.json` の `version` を上げる**
- ⚠⚠ **Biome の版は `package.json` の `peerDependencies` と `devDependencies` で同じ値に固定する**
- ルールを足す・外すときは、`test/fixtures/` に検体を足して `test/expected.json` に期待値を書く。期待値は実測から書く
- ⚠ public なリポジトリなので、他 org のリポジトリ名を書かない
