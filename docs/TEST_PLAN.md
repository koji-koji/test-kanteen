# Test Kanteen - テスト計画書

## 概要

Test Kanteenの包括的なテスト戦略を定義し、品質保証のためのテストカバレッジを確保します。

## テスト戦略

### テストレベル

1. **ユニットテスト** - 個別のモジュール・クラス・関数のテスト
2. **統合テスト** - モジュール間の連携テスト
3. **E2Eテスト** - CLIを含むエンドツーエンドのテスト

### テストカバレッジ目標

- **ユニットテスト**: 80%以上のコードカバレッジ
- **統合テスト**: 主要なユースケースの100%カバー
- **E2Eテスト**: CLIコマンドの全機能カバー

## ユニットテストプラン

### 1. Parser Module

#### 1.1 ASTParser (`src/parser/ast-parser.ts`)

**テスト対象**:
- ✅ `parse()` - 単一ソースコードのパース
- ✅ `parseMultiple()` - 複数ソースコードのパース
- ✅ `isValidAST()` - AST検証

**追加テストケース**:
- JSXコードのパース
- オプションによる動作変更（loc, range, comment, tokens）
- 大規模ファイルのパフォーマンステスト

#### 1.2 SourceLoader (`src/parser/source-loader.ts`)

**テスト対象**:
- ❌ `loadFile()` - 単一ファイル読み込み
- ❌ `loadFiles()` - 複数ファイル読み込み
- ❌ `loadByPattern()` - Globパターンでの読み込み
- ❌ `exists()` - ファイル存在チェック
- ❌ `getStats()` - ファイル統計情報取得

**テストケース**:
- 正常系: 存在するファイルの読み込み
- 異常系: 存在しないファイルのエラーハンドリング
- Globパターン: 複数パターンのマッチング
- 除外パターン: ignoreオプションの動作確認
- 相対パス/絶対パスの処理
- 空ファイルの処理
- バイナリファイルの処理

#### 1.3 TestFrameworkDetector (`src/parser/test-framework-detector.ts`)

**テスト対象**:
- ❌ `detectFromSource()` - ソースコードからの検出
- ❌ `detectFromAST()` - ASTからの検出
- ❌ `detectFromPackageJson()` - package.jsonからの検出
- ❌ `autoDetect()` - 自動検出
- ❌ `getFramework()` - フレームワーク取得
- ❌ `getSupportedFrameworks()` - サポートフレームワーク一覧

**テストケース**:
- Jest: インポート文、グローバル変数での検出
- Vitest: インポート文、独自APIでの検出
- Mocha: インポート文、context()での検出
- 複数フレームワークが混在する場合
- フレームワークが検出できない場合のデフォルト動作
- package.jsonが存在しない場合

### 2. Analyzer Module

#### 2.1 TestAnalyzer (`src/analyzer/test-analyzer.ts`)

**テスト対象**:
- ❌ `analyze()` - パース結果の解析
- ❌ `extractTestBlocks()` - テストブロック抽出
- ❌ `detectTestBlock()` - テストブロック検出
- ❌ `buildTestSuites()` - テストスイート構築
- ❌ `buildTestCase()` - テストケース構築

**テストケース**:
- describe/itの基本構造
- ネストされたdescribe
- beforeEach/afterEach/beforeAll/afterAllの検出
- it.skip, it.only, fit, xitの処理
- test.each, it.eachのパラメータ化テスト
- 空のテストスイート
- テスト名の動的生成（テンプレートリテラル）
- 複雑なネスト構造（5階層以上）

#### 2.2 AssertionExtractor (`src/analyzer/assertion-extractor.ts`)

**テスト対象**:
- ❌ `extract()` - アサーション抽出
- ❌ `detectAssertion()` - アサーション検出
- ❌ `classifyAssertion()` - アサーション分類

**テストケース**:
- expect().toBe()
- expect().toEqual()
- expect().toThrow()
- expect().not.toBe()
- expect().resolves.toBe() (Promise)
- expect().rejects.toThrow() (Promise)
- チェーンされたマッチャー
- assert.equal(), assert.strictEqual()
- カスタムマッチャー
- 複数のアサーションが1つのテストに含まれる場合

#### 2.3 AspectClassifier (`src/analyzer/aspect-classifier.ts`)

**テスト対象**:
- ✅ `classifyFromTestName()` - テスト名からの分類
- ✅ `classifyFromAssertions()` - アサーションからの分類
- ✅ `classifyFromContext()` - コンテキストからの分類
- ✅ `getPriority()` - 優先度取得
- ✅ `addCustomRule()` - カスタムルール追加

**追加テストケース**:
- 日本語のテスト名
- 複数の観点が混在するテスト
- カスタムカテゴリの追加と使用

### 3. Generator Module

#### 3.1 CatalogGenerator (`src/generator/catalog-generator.ts`)

**テスト対象**:
- ✅ `generate()` - カタログ生成
- ✅ `generateMetadata()` - メタデータ生成
- ✅ `extractAspects()` - 観点抽出
- ✅ `calculateCoverage()` - カバレッジ計算

**追加テストケース**:
- 空のテストスイート
- 大量のテストケース（1000個以上）
- 同じ観点を持つ複数のテスト
- 全ての観点カテゴリが含まれるケース

#### 3.2 JSONFormatter (`src/generator/formatters/json-formatter.ts`)

**テスト対象**:
- ❌ `format()` - JSON文字列への変換
- ❌ `toObject()` - オブジェクトとして返す

**テストケース**:
- pretty=trueの場合のインデント
- pretty=falseの場合のミニファイ
- カスタムインデント設定
- 循環参照のエラーハンドリング
- 特殊文字のエスケープ

#### 3.3 YAMLFormatter (`src/generator/formatters/yaml-formatter.ts`)

**テスト対象**:
- ❌ `format()` - YAML文字列への変換
- ❌ `toDocument()` - YAML Documentとして返す

**テストケース**:
- インデント設定
- 配列の表現形式
- 複雑なオブジェクト構造
- 日本語を含むデータ
- YAMLとして不正な文字のエスケープ

#### 3.4 MarkdownFormatter (`src/generator/formatters/markdown-formatter.ts`)

**テスト対象**:
- ❌ `format()` - Markdown文字列への変換
- ❌ `generateHeader()` - ヘッダー生成
- ❌ `generateMetadata()` - メタデータセクション
- ❌ `generateTestSuites()` - テストスイートセクション
- ❌ `generateAspectsSummary()` - 観点サマリー

**テストケース**:
- 基本的なMarkdown構造
- ネストされた見出し
- テーブルの生成
- リンクとコードブロック
- 特殊文字のエスケープ（#, *, []等）

### 4. Reporter Module

#### 4.1 BaseReporter (`src/reporter/base-reporter.ts`)

**テスト対象**:
- ❌ `onTestSuite()` - テストスイートコールバック
- ❌ `onTestCase()` - テストケースコールバック
- ❌ `onComplete()` - 完了コールバック
- ❌ `writeToFile()` - ファイル出力
- ❌ `formatOutput()` - 出力フォーマット
- ❌ `filterData()` - データフィルタリング

**テストケース**:
- 継承したカスタムReporterの動作
- ファイル出力（ディレクトリ自動作成）
- オプションによるフィルタリング
- エラーハンドリング（書き込み権限なし等）

#### 4.2 JSONReporter (`src/reporter/built-in-reporters/json-reporter.ts`)

**テスト対象**:
- ❌ `generate()` - JSON生成
- ❌ `generatePretty()` - 整形JSON生成

**テストケース**:
- 基本的なカタログ出力
- オプションによる項目のフィルタリング
- 大規模カタログのパフォーマンス

#### 4.3 MarkdownReporter (`src/reporter/built-in-reporters/markdown-reporter.ts`)

**テスト対象**:
- ❌ `generate()` - Markdown生成
- ❌ `generateSuiteMarkdown()` - スイートMarkdown
- ❌ `generateTestMarkdown()` - テストMarkdown

**テストケース**:
- 見出しレベルの正確性
- ネストされたスイートの表現
- リンクとアンカーの生成

### 5. Main Module

#### 5.1 Index (`src/index.ts`)

**テスト対象**:
- ❌ `parseTests()` - メインAPI
- ❌ `parseTestsWithConfig()` - 設定ファイル使用
- ❌ `parseTestFile()` - 単一ファイル解析
- ❌ `outputReports()` - レポート出力
- ❌ `loadConfig()` - 設定読み込み

**テストケース**:
- 基本的な解析フロー
- 複数のReporter同時使用
- 設定ファイルの読み込み（JS/TS）
- エラーハンドリング（ファイルなし、パースエラー等）
- デフォルト設定の適用

## 統合テストプラン

### Integration Test Scenarios

#### Scenario 1: Jest Project Analysis
```typescript
// 実際のJestプロジェクトを解析
const catalog = await parseTests('tests/fixtures/**/*.test.ts', {
  framework: 'jest'
});
// 期待: テストスイート、観点が正しく抽出される
```

#### Scenario 2: Multiple Reporters
```typescript
// 複数フォーマットで同時出力
const catalog = await parseTests('tests/**/*.test.ts', {
  reporters: ['json', 'markdown', 'yaml'],
  output: './test-catalog'
});
// 期待: 3つのファイルが正しく生成される
```

#### Scenario 3: Custom Reporter Integration
```typescript
// カスタムReporterの使用
class CustomReporter extends BaseReporter { /* ... */ }
// 期待: カスタムReporterが正しく動作
```

#### Scenario 4: Framework Auto-Detection
```typescript
// フレームワーク自動検出
const catalog = await parseTests('tests/**/*.test.ts', {
  framework: 'auto'
});
// 期待: 正しいフレームワークが検出される
```

#### Scenario 5: Large Codebase
```typescript
// 大規模プロジェクト（100+ファイル、1000+テスト）
const catalog = await parseTests('large-project/**/*.test.ts');
// 期待: パフォーマンスが許容範囲内、メモリリークなし
```

## E2Eテストプラン

### CLI Tests

#### Test 1: Basic Analysis
```bash
kanteen analyze "tests/**/*.test.ts"
# 期待: カタログが生成され、サマリーが表示される
```

#### Test 2: Custom Output
```bash
kanteen analyze "tests/**/*.test.ts" --output ./custom-catalog --format json,markdown
# 期待: 指定ディレクトリに2つのファイルが生成
```

#### Test 3: Config File
```bash
kanteen analyze --config kanteen.config.js
# 期待: 設定ファイルが読み込まれ、適用される
```

#### Test 4: Init Command
```bash
kanteen init
# 期待: kanteen.config.jsが生成される
```

#### Test 5: Framework List
```bash
kanteen list-frameworks
# 期待: サポートフレームワーク一覧が表示
```

#### Test 6: Error Handling
```bash
kanteen analyze "non-existent/**/*.test.ts"
# 期待: エラーメッセージが表示され、適切に終了
```

## テストデータとフィクスチャ

### Fixture Files

1. **`tests/fixtures/jest/`** - Jestテストサンプル
   - 基本的なdescribe/it
   - beforeEach/afterEach
   - mock関数
   - async/await

2. **`tests/fixtures/vitest/`** - Vitestテストサンプル
   - suite/test
   - bench
   - snapshot

3. **`tests/fixtures/mocha/`** - Mochaテストサンプル
   - context/specify
   - done callback
   - チェーンアサーション

4. **`tests/fixtures/edge-cases/`** - エッジケース
   - ✅ 空配列、null、undefined
   - ネストが深いテスト
   - 動的テスト名
   - 特殊文字を含むテスト名

5. **`tests/fixtures/complex/`** - 複雑なテストケース
   - 複数フレームワーク混在
   - カスタムマッチャー
   - 大規模テストスイート

## カバレッジ設定

### Jest Coverage Configuration

```javascript
// jest.config.js
{
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

## テスト実行

### コマンド

```bash
# 全テスト実行
npm test

# カバレッジ付き実行
npm test -- --coverage

# 特定のテストファイルのみ
npm test -- tests/unit/parser/ast-parser.test.ts

# 監視モード
npm test -- --watch

# 統合テストのみ
npm test -- tests/integration

# E2Eテストのみ
npm test -- tests/e2e
```

## テスト実装の優先順位

### Phase 1: Critical Path (高優先度)
1. ✅ ASTParser - 完了
2. ✅ AspectClassifier - 完了
3. ✅ CatalogGenerator - 完了
4. ❌ TestAnalyzer - **次に実装**
5. ❌ parseTests() (メインAPI) - **次に実装**

### Phase 2: Core Features (中優先度)
6. ❌ SourceLoader
7. ❌ TestFrameworkDetector
8. ❌ AssertionExtractor
9. ❌ Formatters (JSON/YAML/Markdown)
10. ❌ Reporters (JSON/Markdown)

### Phase 3: CLI & Integration (中優先度)
11. ❌ CLI commands
12. ❌ Integration tests
13. ❌ Config file loading

### Phase 4: Edge Cases (低優先度)
14. ❌ Performance tests
15. ❌ Error handling edge cases
16. ❌ Large codebase tests

## テストメトリクス

### 現在の状況 (2024-10-24)

- **ユニットテスト**: 30 tests (3モジュール)
  - ASTParser: 7 tests ✅
  - AspectClassifier: 17 tests ✅
  - CatalogGenerator: 6 tests ✅
- **統合テスト**: 0 tests ❌
- **E2Eテスト**: 0 tests ❌
- **カバレッジ**: 未計測

### 目標 (Phase 1完了時)

- **ユニットテスト**: 150+ tests
- **統合テスト**: 10+ scenarios
- **E2Eテスト**: 6+ CLI tests
- **カバレッジ**: 80%以上

## 継続的な改善

### 自動化
- GitHub Actionsでのテスト自動実行
- PRごとのカバレッジレポート
- パフォーマンスベンチマーク

### レビュー
- 週次でテストカバレッジレビュー
- 新機能追加時のテスト必須化
- テストコードのリファクタリング

## 参考資料

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
