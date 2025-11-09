# 出力ディレクトリについて

## デフォルトディレクトリ: `aaa_test_kanteen`

Test Kanteenはデフォルトで`./aaa_test_kanteen`ディレクトリに結果を出力します。

### なぜ `aaa_` プレフィックス？

GitHubのリポジトリブラウザは、ファイルとディレクトリをアルファベット順に表示します。
`aaa_`プレフィックスを付けることで、Test Kanteenの出力が**常にリストの最上部**に表示されます。

#### メリット

1. **即座の発見性**: リポジトリを訪れた人がすぐにテストカタログを見つけられる
2. **ドキュメントとして機能**: READMEの次に重要なドキュメント
3. **LLMフレンドリー**: LLMエージェントがコードベースを探索する際に最初に見つける

#### 例: GitHubでの表示

```
リポジトリルート/
├── aaa_test_kanteen/          ← 最初に表示される！
│   ├── catalog.md
│   └── coverage-gap/
├── src/
├── tests/
├── package.json
└── README.md
```

---

## ディレクトリ構造

### テスト観点カタログ

```
aaa_test_kanteen/
├── catalog.json          # JSON形式のカタログ
├── catalog.md            # Markdown形式のカタログ
└── catalog.yaml          # YAML形式のカタログ（オプション）
```

### カバレッジギャップレポート

```
aaa_test_kanteen/
└── coverage-gap/
    ├── coverage-gap.json     # JSON形式のレポート
    └── coverage-gap.md       # Markdown形式のレポート
```

---

## カスタマイズ

出力先ディレクトリは自由に変更できます。

### CLI経由

```bash
# analyzeコマンド
npx kanteen analyze "tests/**/*.test.ts" --output ./my-custom-dir

# coverage-gapコマンド
npx kanteen coverage-gap "src/**/*.ts" "tests/**/*.test.ts" --output ./my-coverage
```

### 設定ファイル経由

```javascript
// kanteen.config.js
export default {
  output: './docs/test-reports',  // カスタムパス
  // ...
};
```

### プログラマティック使用

```typescript
import { parseTests } from 'test-kanteen';

const catalog = await parseTests('tests/**/*.test.ts', {
  output: './custom-output'
});
```

---

## .gitignore について

生成されたファイルをGitにコミットするかは、プロジェクトの方針次第です。

### コミットする場合（推奨）

```gitignore
# .gitignore

# aaa_test_kanteen はコミットする（コメントアウトまたは記載しない）
```

**メリット**:
- GitHubで閲覧可能
- 変更履歴が追跡できる
- CI/CDで生成したレポートをPRに含められる

### コミットしない場合

```gitignore
# .gitignore

# Test Kanteen output
aaa_test_kanteen/
```

**メリット**:
- リポジトリサイズを抑えられる
- 各開発者がローカルで生成

---

## CI/CDでの活用

### GitHub Actions

```yaml
name: Test Catalog

on: [push, pull_request]

jobs:
  catalog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npx kanteen analyze "tests/**/*.test.ts"
      - run: npx kanteen coverage-gap "src/**/*.ts" "tests/**/*.test.ts"

      # 生成されたファイルをコミット
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "chore: update test catalog [skip ci]"
          file_pattern: aaa_test_kanteen/**
```

---

## ベストプラクティス

### 推奨: コミットする

Test Kanteenの出力は**ドキュメント**として機能するため、Gitにコミットすることを推奨します。

**理由**:
1. レポート自体が価値のあるドキュメント
2. 変更履歴が追跡できる
3. PRレビュー時に差分確認できる
4. GitHubで誰でも閲覧可能

### 例外: コミットしない

以下の場合はコミットしない方が良いかもしれません：
- CI/CDで毎回大きく変わる
- プライベートな情報を含む
- リポジトリサイズの制約

---

## FAQ

### Q: `aaa_`が気に入らないのですが？

**A**: `--output`オプションで自由に変更できます。

```bash
npx kanteen analyze "tests/**/*.test.ts" --output ./test-reports
```

### Q: カタログとカバレッジギャップを別ディレクトリにしたい？

**A**: それぞれのコマンドで`--output`を指定できます。

```bash
npx kanteen analyze "tests/**/*.test.ts" --output ./catalogs
npx kanteen coverage-gap "src/**/*.ts" "tests/**/*.test.ts" --output ./coverage
```

### Q: 複数プロジェクトで同じ設定を共有したい？

**A**: 設定ファイル（`kanteen.config.js`）を使うか、npmスクリプトで共通化できます。

```json
// package.json
{
  "scripts": {
    "test:catalog": "kanteen analyze tests/**/*.test.ts",
    "test:coverage-gap": "kanteen coverage-gap src/**/*.ts tests/**/*.test.ts"
  }
}
```

---

## まとめ

- ✅ デフォルト: `./aaa_test_kanteen`（GitHubで最初に表示）
- ✅ カスタマイズ可能: `--output`オプション
- ✅ コミット推奨: ドキュメントとして価値がある
- ✅ CI/CD統合: 自動生成・自動コミット可能
