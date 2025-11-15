# Compare Command - AST vs Runtime Catalog Comparison

`kanteen compare` コマンドは、ASTカタログとランタイムカタログを比較し、テストカバレッジのGap分析を行います。

## 概要

ASTカタログ（静的解析）とランタイムカタログ（実行時情報）を比較することで、以下の情報を得られます:

- **実行されたテスト**: ASTとランタイムで一致するテスト
- **未実行テスト**: ASTにあるがランタイムで実行されていないテスト（スキップされたテスト等）
- **動的生成テスト**: ランタイムにのみ存在するテスト（`test.each`等で生成されたテスト）
- **テスト実行カバレッジ**: AST上のテストのうち何%が実行されたか

## 基本的な使い方

```bash
# ASTカタログとランタイムカタログを比較
npx kanteen compare \
  ./aaa_test_kanteen/catalog.json \
  ./test-kanteen-runtime/runtime-catalog.json
```

## オプション

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `<ast-catalog>` | `string` | 必須 | ASTカタログのJSONファイルパス |
| `<runtime-catalog>` | `string` | 必須 | ランタイムカタログのJSONファイルパス |
| `-o, --output <path>` | `string` | `'./test-kanteen-comparison'` | 出力先ディレクトリ |
| `-f, --format <formats>` | `string` | `'json,markdown'` | 出力フォーマット (json, markdown) |
| `-v, --verbose` | `boolean` | `false` | 詳細ログを表示 |

## ワークフロー例

### Step 1: ASTカタログを生成

```bash
# テストファイルを静的解析
npx kanteen analyze "tests/**/*.test.ts" \
  --output ./aaa_test_kanteen \
  --format json
```

### Step 2: ランタイムカタログを生成

#### Jestの場合

```bash
# Jest設定でカスタムレポーターを追加
# jest.config.js に以下を追加:
# reporters: [
#   'default',
#   ['@koji-koji/test-kanteen/jest', {
#     output: './test-kanteen-runtime',
#     format: ['json']
#   }]
# ]

npm test
```

#### Vitestの場合

```bash
# Vitest設定でカスタムレポーターを追加
# vitest.config.ts に以下を追加:
# test: {
#   reporters: [
#     'default',
#     ['@koji-koji/test-kanteen/vitest', {
#       output: './test-kanteen-runtime',
#       format: ['json']
#     }]
#   ]
# }

npm run test
```

#### Playwrightの場合

```bash
# Playwright設定でカスタムレポーターを追加
# playwright.config.ts に以下を追加:
# reporter: [
#   ['list'],
#   ['@koji-koji/test-kanteen/playwright', {
#     output: './test-kanteen-runtime',
#     format: ['json']
#   }]
# ]

npx playwright test
```

### Step 3: カタログを比較

```bash
npx kanteen compare \
  ./aaa_test_kanteen/catalog.json \
  ./test-kanteen-runtime/runtime-catalog.json \
  --output ./test-comparison \
  --format json,markdown \
  --verbose
```

## 出力フォーマット

### JSON形式 (`comparison.json`)

```json
{
  "matches": [
    {
      "astTest": {
        "id": "test-1",
        "name": "should add numbers",
        "location": { "file": "tests/math.test.ts", "line": 10, "column": 3 }
      },
      "runtimeTest": {
        "id": "test-1",
        "name": "should add numbers",
        "runtime": {
          "status": "passed",
          "duration": 50
        }
      },
      "matchType": "perfect",
      "confidence": 100
    }
  ],
  "astOnly": [
    {
      "id": "test-3",
      "name": "should multiply numbers (not executed)",
      "location": { "file": "tests/math.test.ts", "line": 20, "column": 3 }
    }
  ],
  "runtimeOnly": [
    {
      "id": "test-4",
      "name": "should add 1 + 2 = 3 (dynamically generated)",
      "runtime": {
        "status": "passed",
        "duration": 25
      }
    }
  ],
  "statistics": {
    "totalAstTests": 3,
    "totalRuntimeTests": 3,
    "perfectMatches": 2,
    "highConfidenceMatches": 0,
    "mediumConfidenceMatches": 0,
    "unmatchedAst": 1,
    "unmatchedRuntime": 1
  }
}
```

### Markdown形式 (`comparison.md`)

````markdown
# Test Catalog Comparison

> AST Catalog vs Runtime Catalog Comparison Report

## Metadata

- **Generated At**: 11/15/2025, 10:30:00 AM
- **AST Catalog**: ./aaa_test_kanteen/catalog.json
- **Runtime Catalog**: ./test-kanteen-runtime/runtime-catalog.json

## Summary

| Metric | Count |
|--------|-------|
| AST Tests | 3 |
| Runtime Tests | 3 |
| Perfect Matches | 2 ✅ |
| High Confidence Matches | 0 🟢 |
| Medium Confidence Matches | 0 🟡 |
| AST Only (Not Executed) | 1 ⚠️ |
| Runtime Only (Dynamically Generated) | 1 🔵 |

### Test Execution Coverage

**66.7%** of AST tests were executed at runtime

## AST Only Tests (Not Executed) ⚠️

These tests exist in the source code but were not executed:

- **should multiply numbers**
  - File: tests/math.test.ts:20

## Runtime Only Tests (Dynamically Generated) 🔵

These tests were executed but not found in the AST (likely generated dynamically):

- **should add 1 + 2 = 3**
  - Status: passed
  - Duration: 25ms

## Matched Tests ✅

2 tests were successfully matched between AST and Runtime:

### Status Breakdown

- ✅ Passed: 2
- ❌ Failed: 0
- ⏭️ Skipped: 0

## Recommendations

### Unexecuted Tests ⚠️

1 tests were not executed. Consider:

- Are these tests skipped intentionally?
- Do test file patterns exclude these tests?
- Are there conditional skips (e.g., `test.skip`)?

### Dynamically Generated Tests 🔵

1 tests appear to be dynamically generated. This is common with:

- `test.each()` / `describe.each()`
- Parameterized tests
- Tests generated from data sources
````

## コンソール出力例

```bash
$ npx kanteen compare \
  ./aaa_test_kanteen/catalog.json \
  ./test-kanteen-runtime/runtime-catalog.json \
  --verbose

🔍 Comparing catalogs...

📄 AST Catalog: ./aaa_test_kanteen/catalog.json
📄 Runtime Catalog: ./test-kanteen-runtime/runtime-catalog.json

✅ Comparison complete!

📊 Summary:
  - AST Tests: 3
  - Runtime Tests: 3
  - Perfect Matches: 2
  - High Confidence: 0
  - Medium Confidence: 0
  - AST Only (not executed): 1
  - Runtime Only (dynamically generated): 1

📄 JSON: ./test-kanteen-comparison/comparison.json
📄 Markdown: ./test-kanteen-comparison/comparison.md

📁 Output: ./test-kanteen-comparison
```

## ユースケース

### 1. テストカバレッジの確認

AST上に存在するテストが実際に実行されているかを確認:

```bash
npx kanteen compare \
  ./aaa_test_kanteen/catalog.json \
  ./test-kanteen-runtime/runtime-catalog.json
```

**発見できること:**
- スキップされているテスト（`test.skip`, `it.skip`）
- 条件付きで実行されないテスト
- テストファイルパターンから除外されているテスト

### 2. 動的生成テストの検出

`test.each`や`describe.each`で生成されるテストを確認:

```bash
npx kanteen compare \
  ./aaa_test_kanteen/catalog.json \
  ./test-kanteen-runtime/runtime-catalog.json
```

**発見できること:**
- パラメータ化テストで生成されたテストケース
- データドリブンテスト
- ループで生成されたテスト

### 3. CI/CDでの自動チェック

```yaml
# GitHub Actions example
- name: Generate AST Catalog
  run: npx kanteen analyze "tests/**/*.test.ts" --output ./ast-catalog

- name: Run Tests with Runtime Reporter
  run: npm test  # Jest/Vitest/Playwrightのレポーター設定済み

- name: Compare Catalogs
  run: |
    npx kanteen compare \
      ./ast-catalog/catalog.json \
      ./test-kanteen-runtime/runtime-catalog.json \
      --output ./comparison

- name: Check Coverage
  run: |
    COVERAGE=$(cat ./comparison/comparison.json | jq '.statistics.totalAstTests')
    EXECUTED=$(cat ./comparison/comparison.json | jq '.statistics.perfectMatches')
    RATIO=$(echo "scale=2; $EXECUTED * 100 / $COVERAGE" | bc)
    echo "Test Execution Coverage: $RATIO%"
    if (( $(echo "$RATIO < 80" | bc -l) )); then
      echo "::error::Test execution coverage is below 80%"
      exit 1
    fi
```

### 4. テスト品質の可視化

```bash
# 詳細レポートを生成
npx kanteen compare \
  ./aaa_test_kanteen/catalog.json \
  ./test-kanteen-runtime/runtime-catalog.json \
  --format markdown \
  --output ./docs/test-coverage

# 生成されたMarkdownをGitHub Pagesやドキュメントサイトで公開
```

## マッチング精度

TestMatcherは以下の基準でテストをマッチングします:

### Perfect Match (100%)
- テスト名が完全一致
- ファイルパスが一致
- スイートパスが一致

### High Confidence Match (90%以上)
- テスト名がほぼ一致（大文字小文字の違い等）
- ファイルパスが一致

### Medium Confidence Match (70%以上)
- テスト名が部分的に一致
- 同じスイート内

### Unmatched
- 上記いずれにも該当しない

## トラブルシューティング

### エラー: Cannot parse catalog JSON

**原因**: カタログファイルが不正なJSON

**解決策**:
```bash
# JSONが正しいか確認
cat ./aaa_test_kanteen/catalog.json | jq '.'
cat ./test-kanteen-runtime/runtime-catalog.json | jq '.'
```

### 警告: 多数のunmatched tests

**原因**: テスト名やファイルパスが大きく異なる

**解決策**:
- カタログが同じテストファイルから生成されているか確認
- テストファイルを移動・リネームしていないか確認
- 異なるブランチのカタログを比較していないか確認

### すべてのテストがAST Onlyになる

**原因**: ランタイムカタログが生成されていない

**解決策**:
```bash
# ランタイムカタログが正しく生成されているか確認
ls -la ./test-kanteen-runtime/runtime-catalog.json

# レポーター設定を確認
# Jest: jest.config.js の reporters 設定
# Vitest: vitest.config.ts の reporters 設定
# Playwright: playwright.config.ts の reporter 設定
```

## 制限事項

- カタログはJSON形式のみサポート（比較時）
- マッチングはヒューリスティックベース（100%の精度保証はなし）
- 大規模プロジェクト（10,000+テスト）ではパフォーマンス低下の可能性

## 関連ドキュメント

- [README.md](../README.md) - 基本的な使い方
- [JEST_REPORTER.md](./JEST_REPORTER.md) - Jestレポーター
- [VITEST_REPORTER.md](./VITEST_REPORTER.md) - Vitestレポーター
- [PLAYWRIGHT_REPORTER.md](./PLAYWRIGHT_REPORTER.md) - Playwrightレポーター
- [TestMatcher API](../src/utils/test-matcher.ts) - マッチングロジック詳細

## サポート

問題が発生した場合:
- [GitHub Issues](https://github.com/koji-koji/test-kanteen/issues)
- [Discussion](https://github.com/koji-koji/test-kanteen/discussions)
