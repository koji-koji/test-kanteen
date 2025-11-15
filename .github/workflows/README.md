# GitHub Actions Workflow Examples

このディレクトリには、test-kanteenをCI/CDに統合するためのGitHub Actionsワークフローサンプルが含まれています。

## 📁 利用可能なワークフロー

### 1. **kanteen-basic.yml** - 基本的な使い方

最もシンプルなセットアップ。AST catalog生成とテスト実行のみ。

**使用場面**:
- test-kanteenを初めて導入する場合
- シンプルにテストカタログを生成したい場合
- アーティファクトとして保存するだけで十分な場合

**主な機能**:
- ✅ AST catalog生成
- ✅ テスト実行（Runtime catalog自動生成）
- ✅ カタログをアーティファクトとして保存

**使い方**:
```bash
# このファイルを自分のリポジトリにコピー
cp .github/workflows/kanteen-basic.yml /path/to/your/project/.github/workflows/
```

---

### 2. **kanteen-pr-comment.yml** - PRコメント機能付き

PRに自動的にテスト比較レポートを投稿します。

**使用場面**:
- PRレビュー時にテスト結果を確認したい場合
- レビュアーにテスト変更を可視化したい場合
- 動的生成テストや未実行テストを検出したい場合

**主な機能**:
- ✅ AST catalog生成
- ✅ テスト実行（Runtime catalog自動生成）
- ✅ Compare+Runtime レポート生成
- ✅ **PRへの自動コメント投稿**

**使い方**:
```bash
# このファイルを自分のリポジトリにコピー
cp .github/workflows/kanteen-pr-comment.yml /path/to/your/project/.github/workflows/
```

---

### 3. **kanteen-full.yml** - フル機能版

すべての機能を含む包括的なワークフロー。

**使用場面**:
- test-kanteenのすべての機能を活用したい場合
- 詳細なテストレポートが必要な場合
- GitHub Actions Summaryにテスト結果を表示したい場合

**主な機能**:
- ✅ AST catalog生成
- ✅ テスト実行（Runtime catalog自動生成）
- ✅ Runtimeレポート生成
- ✅ Compare+Runtimeレポート生成
- ✅ PRへの自動コメント投稿
- ✅ GitHub Actions Summaryへの結果表示
- ✅ アーティファクト保存（30日間）

**使い方**:
```bash
# このファイルを自分のリポジトリにコピー
cp .github/workflows/kanteen-full.yml /path/to/your/project/.github/workflows/
```

---

### 4. **test-with-kanteen.yml** - 実際の運用例

test-kanteenプロジェクト自身が使用している実際のワークフロー。

**使用場面**:
- 実際の運用例を参考にしたい場合
- カスタマイズのベースとして使いたい場合

---

## 🚀 セットアップ手順

### 1. テスト設定ファイルにkanteenレポーターを追加

**Jest (`jest.config.js`)**:
```javascript
module.exports = {
  // ... 既存の設定
  reporters: [
    'default',
    ['test-kanteen/jest', {
      output: './test-kanteen-runtime',
      format: ['json', 'markdown']
    }]
  ]
};
```

**Vitest (`vitest.config.ts`)**:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: [
      'default',
      ['test-kanteen/vitest', {
        output: './test-kanteen-runtime',
        format: ['json', 'markdown']
      }]
    ]
  }
});
```

**Playwright (`playwright.config.ts`)**:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'],
    ['test-kanteen/playwright', {
      output: './test-kanteen-runtime',
      format: ['json', 'markdown']
    }]
  ]
});
```

### 2. ワークフローファイルをコピー

お好みのワークフローファイルを自分のプロジェクトにコピーします：

```bash
# 例: 基本的なワークフローを使用
cp .github/workflows/kanteen-basic.yml /path/to/your/project/.github/workflows/kanteen.yml
```

### 3. 必要に応じてカスタマイズ

- Node.jsバージョンの変更
- テストコマンドの調整
- ブランチ名の変更
- アーティファクト保存期間の調整

### 4. コミット＆プッシュ

```bash
git add .github/workflows/kanteen.yml
git commit -m "ci: add test-kanteen workflow"
git push
```

---

## 📊 生成されるレポート

### ASTカタログ (`aaa_test_kanteen/`)
- `catalog.json` - テスト構造のJSON形式
- `catalog.md` - テスト構造のMarkdown形式（人間が読みやすい）

### Runtimeカタログ (`test-kanteen-runtime/`)
- `runtime-catalog.json` - テスト実行結果のJSON形式
- `runtime-catalog.md` - テスト実行結果のMarkdown形式

### カスタムレポート (`test-reports/`)
- `runtime-report.md` - テスト実行詳細レポート
- `compare-runtime-report.md` - AST×Runtime比較レポート

---

## 🔍 .gitignoreの設定

### ✅ PRレビューで活用する場合（推奨）

**カタログをコミット**して、PRレビュー時にテスト構造の変更を可視化：

```gitignore
# .gitignore には追加しない
# aaa_test_kanteen/ をコミットすることで、
# PRレビュー時にテスト観点の変更を可視化
```

### 🚫 コミットしない場合

ローカル環境でのみ使用する場合：

```gitignore
# Test Kanteen
aaa_test_kanteen/
test-kanteen-runtime/
test-reports/
```

---

## 💡 Tips

### PRコメントのサイズ制限

GitHubのPRコメントには65,536文字の制限があります。大規模なプロジェクトでレポートが長くなる場合、ワークフローで自動的に切り詰められます。

### アーティファクトの保存期間

デフォルトでは30日間保存されます。ストレージコストを削減したい場合は `retention-days` を調整してください：

```yaml
- uses: actions/upload-artifact@v4
  with:
    retention-days: 7  # 7日間に変更
```

### 並列実行

複数のNode.jsバージョンでテストする場合は、matrixを使用できます：

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
```

---

## 🔗 関連ドキュメント

- [test-kanteen README](../../README.md)
- [カスタムレポーターガイド](../../docs/CUSTOM_REPORTER.md)
- [Jest Reporter](../../docs/JEST_REPORTER.md)
- [Vitest Reporter](../../docs/VITEST_REPORTER.md)
- [Playwright Reporter](../../docs/PLAYWRIGHT_REPORTER.md)
- [Compare Command](../../docs/COMPARE_COMMAND.md)

---

## 📝 ライセンス

MIT
