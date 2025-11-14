# Test Kanteen - プロジェクトプラン

## プロジェクト概要

**目的**: テストコードのASTを解析し、テスト観点を抽出・カタログ化することで、LLMと人間が共通理解できる仕様(Spec)を生成する

**技術スタック**:
- **AST解析**: ESTree (標準的なJavaScript AST仕様)
- **パーサー**: @typescript-eslint/parser または acorn + acorn-typescript
- **Node.js環境管理**: volta (推奨)
- **言語**: TypeScript

## アーキテクチャ設計

### システムフロー

```
┌─────────────────┐
│  Test Files     │
│  (.test.ts)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  AST Parser             │
│  - Parse test files     │
│  - Extract test suites  │
│  - Identify assertions  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Test Analyzer          │
│  - Extract test intent  │
│  - Categorize tests     │
│  - Extract metadata     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Reporter (Visitor)     │
│  - Traverse AST nodes   │
│  - Collect observations │
│  - Build catalog data   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Catalog Generator      │
│  - Format catalog       │
│  - Generate output      │
│  - Export formats       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Output                 │
│  - JSON/YAML/Markdown   │
│  - LLM-friendly format  │
└─────────────────────────┘
```

## 主要コンポーネント

### A. AST Parser Module
- テストファイルをパースしてESTree準拠のASTを生成
- TypeScriptとJavaScriptの両方に対応
- Jest, Vitest, Mocha などのテストフレームワークを認識

### B. Reporter (Visitor Pattern)
- ASTを走査して観点を収集
- カスタマイズ可能なReporterインターフェース
- 複数のReporterを組み合わせ可能

### C. Test Aspect Extractor
テストケースから以下を抽出:
- テスト名/説明
- テスト対象 (describe/it構造)
- アサーション内容
- Setup/Teardown処理
- モック/スタブの使用状況
- エッジケース/境界値テスト

### D. Catalog Generator
- 観点カタログの生成
- 出力形式: JSON, YAML, Markdown, LLM用プロンプト形式

## データモデル

### TestCatalog

```typescript
interface TestCatalog {
  metadata: CatalogMetadata;
  testSuites: TestSuite[];
  aspects: TestAspect[];
  coverage: CoverageInfo;
}

interface CatalogMetadata {
  generatedAt: string;
  version: string;
  sourceFiles: string[];
  framework: string;
}

interface CoverageInfo {
  totalTests: number;
  totalAspects: number;
  aspectCategories: Record<string, number>;
}
```

### TestSuite

```typescript
interface TestSuite {
  name: string;
  description?: string;
  filePath: string;
  tests: TestCase[];
  setup?: SetupInfo;
  teardown?: TeardownInfo;
}

interface SetupInfo {
  type: 'beforeAll' | 'beforeEach';
  description: string;
  location: SourceLocation;
}

interface TeardownInfo {
  type: 'afterAll' | 'afterEach';
  description: string;
  location: SourceLocation;
}
```

### TestCase

```typescript
interface TestCase {
  id: string;
  name: string;
  aspects: string[];
  assertions: Assertion[];
  dependencies: string[];
  tags: string[];
  location: SourceLocation;
}

interface Assertion {
  type: string;
  expected?: any;
  actual?: string;
  matcher: string;
  description: string;
}

interface SourceLocation {
  file: string;
  line: number;
  column: number;
}
```

### TestAspect

```typescript
interface TestAspect {
  id: string;
  category: AspectCategory;
  description: string;
  examples: string[];
  testCases: string[];
  priority?: 'high' | 'medium' | 'low';
}

enum AspectCategory {
  Functionality = 'functionality',
  EdgeCase = 'edge-case',
  ErrorHandling = 'error-handling',
  Performance = 'performance',
  Security = 'security',
  Integration = 'integration',
  UnitBehavior = 'unit-behavior',
  DataValidation = 'data-validation',
  StateManagement = 'state-management',
  Custom = 'custom'
}
```

## 実装フェーズ

### Phase 1: 基盤構築
1. プロジェクトセットアップ (TypeScript, ESLint, Prettier)
2. 基本的なAST Parser実装
3. シンプルなReporterインターフェース定義

**成果物**:
- 動作するTypeScriptプロジェクト
- ESTreeベースのパーサー
- 基本的な型定義

### Phase 2: コア機能
1. Test Analyzer実装
2. 主要テストフレームワーク対応 (Jest/Vitest)
3. 基本的な観点抽出ロジック

**成果物**:
- テストファイルの解析機能
- describe/itブロックの認識
- 基本的なアサーション抽出

### Phase 3: Reporter拡張
1. カスタムReporter作成機能
2. 複数Reporterのチェーン実行
3. フィルタリング・変換機能

**成果物**:
- Reporterインターフェースの完全実装
- ビルトインReporterの提供
- プラグインシステムの基盤

### Phase 4: Catalog生成
1. Catalog Generatorの実装
2. 複数出力フォーマット対応
3. LLM用プロンプト最適化

**成果物**:
- JSON/YAML/Markdown出力
- LLMフレンドリーなフォーマット
- カスタムテンプレートサポート

### Phase 5: 統合・最適化
1. CLI ツール作成
2. 設定ファイルサポート
3. パフォーマンス最適化

**成果物**:
- CLIツール
- 設定ファイル (kanteen.config.js)
- ドキュメント

## ディレクトリ構造

```
test-kanteen/
├── src/
│   ├── parser/
│   │   ├── ast-parser.ts           # メインパーサー
│   │   ├── test-framework-detector.ts  # フレームワーク検出
│   │   └── source-loader.ts        # ソースファイル読み込み
│   ├── analyzer/
│   │   ├── test-analyzer.ts        # テスト解析のメイン
│   │   ├── assertion-extractor.ts  # アサーション抽出
│   │   └── aspect-classifier.ts    # 観点分類
│   ├── reporter/
│   │   ├── base-reporter.ts        # 基底クラス
│   │   ├── reporter-interface.ts   # インターフェース定義
│   │   └── built-in-reporters/
│   │       ├── json-reporter.ts
│   │       ├── markdown-reporter.ts
│   │       └── llm-reporter.ts
│   ├── generator/
│   │   ├── catalog-generator.ts    # カタログ生成のメイン
│   │   └── formatters/
│   │       ├── json-formatter.ts
│   │       ├── yaml-formatter.ts
│   │       └── markdown-formatter.ts
│   ├── types/
│   │   ├── ast.ts                  # AST関連の型定義
│   │   ├── catalog.ts              # カタログの型定義
│   │   └── config.ts               # 設定の型定義
│   ├── cli/
│   │   └── index.ts                # CLIエントリーポイント
│   └── index.ts                     # ライブラリエントリーポイント
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── examples/
│   ├── basic-usage/
│   ├── custom-reporter/
│   └── llm-integration/
├── docs/
│   ├── getting-started.md
│   ├── api-reference.md
│   └── custom-reporters.md
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
└── README.md
```

## 主要な技術的課題と解決策

### 課題1: テストフレームワークごとの構文差異
**解決策**:
- テストフレームワーク検出器を実装
- フレームワークごとのアダプターパターンを使用
- 共通インターフェースで抽象化

### 課題2: 複雑なアサーションの意図抽出
**解決策**:
- アサーションライブラリのAPIマッピング
- LLMによる補助的な意図推論
- ヒューリスティックルールの組み合わせ

### 課題3: 観点の分類・カテゴライズ
**解決策**:
- 事前定義されたカテゴリの提供
- カスタムカテゴリのサポート
- 機械学習ベースの分類（将来的）

### 課題4: 大規模なテストスイートのパフォーマンス
**解決策**:
- ストリーミング処理
- 並列処理のサポート
- インクリメンタル解析

## 拡張性のポイント

### プラグインシステム
- カスタムReporterを追加可能
- カスタムアナライザーの実装
- カスタムフォーマッターの追加

### 設定ファイル
```typescript
// kanteen.config.js
export default {
  include: ['**/*.test.ts', '**/*.spec.ts'],
  exclude: ['**/node_modules/**'],
  framework: 'auto', // 'jest' | 'vitest' | 'mocha' | 'auto'
  reporters: ['json', 'markdown'],
  output: './test-catalog',
  aspectCategories: {
    custom: ['my-custom-aspect']
  },
  llm: {
    enabled: true,
    format: 'anthropic' // 'anthropic' | 'openai' | 'custom'
  }
}
```

### カスタムReporter例
```typescript
import { BaseReporter, TestCase, TestSuite } from 'test-kanteen';

export class MyCustomReporter extends BaseReporter {
  onTestSuite(suite: TestSuite) {
    // カスタムロジック
  }

  onTestCase(testCase: TestCase) {
    // カスタムロジック
  }

  generate() {
    // 最終的な出力を生成
    return this.formatOutput();
  }
}
```

## API設計

### メインAPI

```typescript
import { parseTests, generateCatalog } from 'test-kanteen';

// 基本的な使用
const catalog = await parseTests('./tests/**/*.test.ts');

// カスタム設定
const catalog = await parseTests('./tests/**/*.test.ts', {
  framework: 'jest',
  reporters: ['json', 'markdown'],
  output: './catalog'
});

// プログラマティックな使用
import { ASTParser, TestAnalyzer, CatalogGenerator } from 'test-kanteen';

const parser = new ASTParser();
const ast = await parser.parse('./my-test.test.ts');

const analyzer = new TestAnalyzer();
const analysis = analyzer.analyze(ast);

const generator = new CatalogGenerator();
const catalog = generator.generate(analysis);
```

## LLM統合の考慮事項

### 出力形式の最適化
- 構造化されたJSON/YAML
- 自然言語の説明文
- コンテキスト情報の付与

### プロンプトテンプレート
```markdown
# Test Specification Catalog

## Overview
This catalog contains test aspects extracted from the codebase.

## Test Suites
{{#each testSuites}}
### {{name}}
{{description}}

Tests:
{{#each tests}}
- {{name}}: {{aspects}}
{{/each}}
{{/each}}

## Aspects
{{#each aspects}}
### {{category}}: {{description}}
Examples: {{examples}}
{{/each}}
```

## 次のステップ

1. **即座に開始可能なタスク**:
   - プロジェクト初期化
   - 基本的なTypeScript設定
   - パーサーのプロトタイプ実装

2. **短期目標 (1-2週間)**:
   - Phase 1の完了
   - シンプルなテストファイルのパース
   - 基本的な観点抽出

3. **中期目標 (1ヶ月)**:
   - Phase 2-3の完了
   - 主要フレームワーク対応
   - Reporter システムの実装

4. **長期目標 (2-3ヶ月)**:
   - 全フェーズの完了
   - プロダクションレディ
   - ドキュメント整備

## 参考資料

- [ESTree Specification](https://github.com/estree/estree)
- [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [@typescript-eslint/parser](https://typescript-eslint.io/packages/parser)
- [Acorn Parser](https://github.com/acornjs/acorn)
- [Visitor Pattern](https://refactoring.guru/design-patterns/visitor)
