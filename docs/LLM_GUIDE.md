# LLMを活用したテスト分析ガイド

Test Kanteenは、**テスト観点カタログ**と**関数・クラス一覧**を生成します。これらの出力をLLMに渡すことで、より高度な分析が可能になります。

## クイックスタート：LLMへの統合

### 自動生成されるガイドを活用

test-kanteenは、LLMが理解しやすいガイドを自動生成します。

```bash
npx kanteen analyze "tests/**/*.test.ts"
# → aaa_test_kanteen/TEST_KANTEEN_GUIDE.md が自動生成
```

### LLMへの導入方法

**方法1: ファイル読み込み可能なLLM（Claude Code等）**
```
aaa_test_kanteen/TEST_KANTEEN_GUIDE.md を読んで、
test-kanteenを理解して積極的に活用してください。
```

**方法2: コピペでオンボーディング**
1. `aaa_test_kanteen/TEST_KANTEEN_GUIDE.md` を開く
2. 🤖マークの「LLMへのコピペ用メッセージ」セクションをコピー
3. LLMに貼り付け

これでLLMがtest-kanteenを理解し、以下のような支援ができるようになります：
- 新機能開発時のテストケース提案
- コードレビュー時のカバレッジ確認
- リファクタリング時の影響分析
- 定期的なテスト品質改善提案

---

## 従来の方法：手動でカタログを渡す

以下は、カタログファイルを手動でLLMに渡して分析する方法です。

### 基本的なワークフロー

### 1. 関数・クラス一覧を抽出

```bash
npx kanteen extract "src/**/*.ts"
```

**出力**: `aaa_test_kanteen/exports/exports.md`

```markdown
# Functions and Classes

## Summary
- **Total Files**: 26
- **Total Functions**: 15
- **Total Classes**: 8
- **Total Methods**: 28

## Exports by File

### src/index.ts

**Functions:**
- 📦 **parseTests** `(pattern: string | string[], options?: ParserOptions): Promise<Catalog>` (line 25)
- 📦 **parseTestFile** `(filePath: string, options?: ParserOptions): Promise<TestSuite[]>` (line 45)

**Classes:**
- 🏛️ **TestAnalyzer** (line 65)
  - 🔧 **analyze** (line 70)
  - 🔧 **extractAssertions** (line 85)
```

### 2. テスト観点カタログを生成

```bash
npx kanteen analyze "tests/**/*.test.ts"
```

**出力**: `aaa_test_kanteen/catalog.md`

```markdown
# Test Catalog

ASTParser
  parse
    ✓ should parse simple JavaScript code
    ✓ should parse TypeScript code
  parseMultiple
    ✓ should parse multiple sources

TestAnalyzer
  analyze
    ✓ should analyze simple test suite
    ✓ should handle nested describe blocks
```

### 3. LLMで分析

両方のファイルをLLMに渡して分析を依頼します。

## LLMプロンプト例

### 基本: テストされていない関数を検出

```
以下の2つのファイルを比較して、テストされていない関数を教えてください：

【関数一覧】
[aaa_test_kanteen/exports/exports.md の内容をペースト]

【テスト観点カタログ】
[aaa_test_kanteen/catalog.md の内容をペースト]

テストされていない関数をリストアップし、優先度を付けてください。
- 🔴 High: 公開API、重要な関数
- 🟡 Medium: 内部関数、ユーティリティ
- ⚪ Low: プライベートメソッド、補助関数
```

### 応用1: テストカバレッジの質を評価

```
以下のテスト観点カタログを分析して、テストの質を評価してください：

[aaa_test_kanteen/catalog.md の内容をペースト]

評価ポイント:
1. 正常系と異常系のバランス
2. エッジケースのカバレッジ
3. テストの網羅性
4. 改善すべき点
```

### 応用2: 不足しているテストケースを提案

```
関数一覧とテスト観点カタログを比較して、追加すべきテストケースを提案してください：

【関数一覧】
[exports.md]

【現在のテスト】
[catalog.md]

以下の観点で提案してください:
- エッジケース
- エラーハンドリング
- 境界値テスト
- 統合テスト
```

### 応用3: テスト実装コードの生成

```
以下の関数についてテストコードを生成してください：

【関数情報】
- 名前: parseTests
- シグネチャ: (pattern: string | string[], options?: ParserOptions): Promise<Catalog>
- ファイル: src/index.ts

【要件】
- Jestを使用
- 正常系、異常系、エッジケースをカバー
- 既存のテストスタイルに合わせる

【既存のテストスタイル】
[catalog.md から関連テストを抜粋]
```

## ユースケース別ガイド

### ケース1: 新機能開発後のテストチェック

```bash
# 1. 新機能をコミット後
git add .
git commit -m "feat: add new feature"

# 2. 関数一覧を抽出
npx kanteen extract "src/**/*.ts"

# 3. テスト観点カタログを生成
npx kanteen analyze "tests/**/*.test.ts"

# 4. LLMで分析
# 「新しく追加された関数のテストが不足していないか確認してください」
```

### ケース2: リファクタリング後の影響確認

```bash
# 1. リファクタリング前にカタログ生成
npx kanteen analyze "tests/**/*.test.ts" --output ./before

# 2. リファクタリング実行

# 3. リファクタリング後にカタログ生成
npx kanteen analyze "tests/**/*.test.ts" --output ./after

# 4. LLMで比較
# 「before/catalog.md と after/catalog.md を比較して、
#  テストカバレッジが低下していないか確認してください」
```

### ケース3: CI/CDでの自動チェック

```yaml
# .github/workflows/test-coverage.yml
name: Test Coverage Check

on: [pull_request]

jobs:
  check-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Extract functions
        run: npx kanteen extract "src/**/*.ts"

      - name: Generate test catalog
        run: npx kanteen analyze "tests/**/*.test.ts"

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: test-analysis
          path: aaa_test_kanteen/

      # Optional: LLM統合
      - name: Analyze with LLM
        run: |
          # Anthropic Claude API や OpenAI API を使用して自動分析
          # 結果をPRコメントに投稿
```

## LLM活用のメリット

### 1. 高精度なマッチング

完全一致だけでなく、文脈を理解してマッチングできます：

```typescript
// ソースコード
export function parseTests() { ... }

// テストコード
describe('Main API', () => {
  test('parseTests should work', () => { ... })
})
```

→ LLMは「Main API」内の「parseTests」を正しくマッチングできます。

### 2. 柔軟な分析

- テストの質（正常系/異常系のバランス）
- エッジケースのカバレッジ
- テスト名の適切さ
- リファクタリングの提案

### 3. 学習・改善

プロジェクト固有のテストパターンを学習して、より適切な提案ができます。

## ベストプラクティス

### 1. 定期的な実行

```bash
# 週次でチェック
npx kanteen extract "src/**/*.ts"
npx kanteen analyze "tests/**/*.test.ts"
# LLMで「先週から追加された関数でテストが不足しているものは？」
```

### 2. プロンプトのテンプレート化

よく使うプロンプトをプロジェクトの`.prompts/`ディレクトリに保存：

```
.prompts/
  check-coverage.md      - カバレッジチェック用
  suggest-tests.md       - テスト提案用
  evaluate-quality.md    - 品質評価用
```

### 3. チーム共有

```bash
# チーム全体で同じ分析を共有
npx kanteen extract "src/**/*.ts"
npx kanteen analyze "tests/**/*.test.ts"

# aaa_test_kanteen/ をGitにコミット
git add aaa_test_kanteen/
git commit -m "docs: update test catalog"
```

## トラブルシューティング

### Q: 出力が大きすぎてLLMに渡せない

**A**: ファイルを分割して分析

```bash
# ディレクトリごとに分析
npx kanteen extract "src/parser/**/*.ts" --output ./analysis/parser
npx kanteen extract "src/analyzer/**/*.ts" --output ./analysis/analyzer

# または、JSON形式で必要な部分のみ抽出
npx kanteen extract "src/**/*.ts" --format json
# jq で必要な部分のみ抽出
```

### Q: LLMのAPI費用が心配

**A**: ローカルLLMを使用

```bash
# Ollama などのローカルLLMで分析
ollama run llama3

# プロンプトにカタログの内容を渡す
```

### Q: テストとソースのマッチング精度を上げたい

**A**: LLMに詳細な指示を与える

```
【マッチングルール】
1. 関数名が完全一致
2. テストのdescribe名に関数名が含まれる
3. テストの内容に関数名が含まれる
4. クラスのメソッドは「ClassName.methodName」でマッチ

このルールに基づいてマッチングしてください。
```

## 次のステップ

1. **自動化**: CI/CDに組み込んで毎回実行
2. **カスタマイズ**: プロジェクト固有のプロンプトを作成
3. **チーム展開**: テスト文化の向上に活用

---

**関連ドキュメント**:
- [README.md](../README.md) - 基本的な使い方
- [TEST_PLAN.md](./TEST_PLAN.md) - テスト計画
- [SELF_ANALYSIS.md](./SELF_ANALYSIS.md) - 自己分析レポート
