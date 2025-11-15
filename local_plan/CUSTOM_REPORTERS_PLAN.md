# カスタムレポーター実装プラン

## 概要

Jest/Vitest/Playwrightのカスタムレポーターとしてtest-kanteenを実装し、実行時のテスト情報（実行時間、成功/失敗、エラー詳細）を取得できるようにする。

## 目標

- 各フレームワーク（Jest/Vitest/Playwright）用のカスタムレポーターを実装
- 実行時情報（duration, status, error）を含むテストカタログを生成
- ASTで検出されなかった動的生成テストを検出する比較機能を提供
- 既存のAST解析機能との共存（Hybridマージは不要）

## アーキテクチャ

### 1. 型定義の拡張

#### 新しいランタイム型（`src/types/runtime.ts`）

```typescript
export type TestStatus = 'passed' | 'failed' | 'skipped' | 'pending' | 'todo';

export interface TestRuntime {
  duration: number;        // ミリ秒
  status: TestStatus;
  startTime?: Date;
  endTime?: Date;
  retries?: number;
  error?: TestError;
}

export interface TestError {
  message: string;
  stack?: string;
  expected?: unknown;
  actual?: unknown;
  matcherName?: string;
}

export interface SuiteRuntime {
  duration: number;
  startTime?: Date;
  endTime?: Date;
}

export interface RuntimeCatalog extends TestCatalog {
  metadata: RuntimeMetadata;
  testSuites: RuntimeTestSuite[];
  executionSummary: ExecutionSummary;
}

export interface RuntimeMetadata extends CatalogMetadata {
  executionDate: string;
  totalDuration: number;
  parallel?: boolean;
  workers?: number;
}

export interface RuntimeTestSuite extends TestSuite {
  runtime?: SuiteRuntime;
  tests: RuntimeTestCase[];
  nestedSuites?: RuntimeTestSuite[];
}

export interface RuntimeTestCase extends TestCase {
  runtime: TestRuntime;  // 必須（ランタイムでは常に存在）
}

export interface ExecutionSummary {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
  todo: number;
  totalDuration: number;
  startTime: Date;
  endTime: Date;
}
```

### 2. テストマッチングアルゴリズム

#### マッチング戦略（`src/utils/test-matcher.ts`）

```typescript
export interface MatchResult {
  astTest?: TestCase;
  runtimeTest?: RuntimeTestCase;
  matchType: 'perfect' | 'high-confidence' | 'medium-confidence' | 'unmatched';
  confidence: number;  // 0-100
  reasons?: string[];
}

export class TestMatcher {
  /**
   * ASTカタログとランタイムカタログを比較
   */
  compare(astCatalog: TestCatalog, runtimeCatalog: RuntimeCatalog): ComparisonResult {
    // 1. ファイルパスで粗いグルーピング
    // 2. スイート階層でマッチング
    // 3. テスト名でマッチング
    // 4. 行番号で検証（あれば）
  }

  /**
   * 個別テストのマッチング
   */
  private matchTest(astTest: TestCase, runtimeTest: RuntimeTestCase): number {
    let score = 0;

    // ファイルパス: 40点
    if (this.normalizeFilePath(astTest.location.file) ===
        this.normalizeFilePath(runtimeTest.location.file)) {
      score += 40;
    }

    // スイート階層: 30点
    const astSuitePath = this.getSuitePath(astTest);
    const runtimeSuitePath = this.getSuitePath(runtimeTest);
    if (astSuitePath === runtimeSuitePath) {
      score += 30;
    }

    // テスト名: 30点
    if (this.normalizeTestName(astTest.name) ===
        this.normalizeTestName(runtimeTest.name)) {
      score += 30;
    }

    // 行番号（bonus）: 10点
    if (astTest.location.line && runtimeTest.location.line) {
      const lineDiff = Math.abs(astTest.location.line - runtimeTest.location.line);
      if (lineDiff <= 5) {
        score += 10 - lineDiff;
      }
    }

    return score;
  }

  private HIGH_CONFIDENCE_THRESHOLD = 90;
  private MEDIUM_CONFIDENCE_THRESHOLD = 70;
}

export interface ComparisonResult {
  matches: MatchResult[];
  runtimeOnly: RuntimeTestCase[];  // 動的生成テスト
  astOnly: TestCase[];              // 実行されなかったテスト
  statistics: {
    totalAstTests: number;
    totalRuntimeTests: number;
    perfectMatches: number;
    highConfidenceMatches: number;
    mediumConfidenceMatches: number;
    unmatchedAst: number;
    unmatchedRuntime: number;
  };
}
```

#### マッチング精度

| 条件 | 期待精度 | 備考 |
|------|---------|------|
| 通常のテスト（describe/test） | 95-99% | ファイルパス + スイート階層 + テスト名で高精度 |
| test.each（静的データ） | 90-95% | テスト名のパターンマッチングで対応 |
| test.each（動的データ） | 70-85% | 行番号と名前の部分一致で対応 |
| 動的生成テスト | 検出可能 | Runtime only として検出 |

### 3. フレームワーク別実装

#### Jest カスタムレポーター（`src/reporters/jest/index.ts`）

```typescript
import type { Reporter, Test, TestResult, AggregatedResult } from '@jest/reporters';
import { RuntimeCatalogBuilder } from './runtime-catalog-builder';

export class KanteenJestReporter implements Reporter {
  private catalogBuilder: RuntimeCatalogBuilder;

  constructor(globalConfig: any, options: any) {
    this.catalogBuilder = new RuntimeCatalogBuilder(options);
  }

  onRunStart(results: AggregatedResult, options: any): void {
    this.catalogBuilder.startRun(new Date());
  }

  onTestResult(
    test: Test,
    testResult: TestResult,
    results: AggregatedResult
  ): void {
    // testResult.testResults から個別のテスト結果を抽出
    for (const assertionResult of testResult.testResults) {
      this.catalogBuilder.addTestResult({
        filePath: testResult.testFilePath,
        suitePath: assertionResult.ancestorTitles,
        testName: assertionResult.title,
        status: assertionResult.status,
        duration: assertionResult.duration || 0,
        error: assertionResult.failureMessages.length > 0 ? {
          message: assertionResult.failureMessages.join('\n'),
          stack: assertionResult.failureDetails?.[0]?.stack,
        } : undefined,
        location: {
          line: assertionResult.location?.line,
          column: assertionResult.location?.column,
        },
      });
    }
  }

  async onRunComplete(
    contexts: Set<any>,
    results: AggregatedResult
  ): Promise<void> {
    this.catalogBuilder.endRun(new Date());
    const catalog = this.catalogBuilder.build();

    // 出力
    await this.outputCatalog(catalog);
  }

  private async outputCatalog(catalog: RuntimeCatalog): Promise<void> {
    // JSON/Markdown形式で出力
  }
}
```

**使用方法:**

```javascript
// jest.config.js
module.exports = {
  reporters: [
    'default',
    ['@koji-koji/test-kanteen/jest', {
      output: './test-kanteen-runtime',
      format: ['json', 'markdown'],
    }],
  ],
};
```

#### Vitest カスタムレポーター（`src/reporters/vitest/index.ts`）

```typescript
import type { Reporter } from 'vitest/node';
import { RuntimeCatalogBuilder } from '../shared/runtime-catalog-builder';

export class KanteenVitestReporter implements Reporter {
  private catalogBuilder: RuntimeCatalogBuilder;

  constructor(options: any) {
    this.catalogBuilder = new RuntimeCatalogBuilder(options);
  }

  onInit(): void {
    this.catalogBuilder.startRun(new Date());
  }

  onTaskUpdate(packs: any[]): void {
    // Vitestのタスク更新を処理
    for (const pack of packs) {
      this.processTask(pack);
    }
  }

  async onFinished(): Promise<void> {
    this.catalogBuilder.endRun(new Date());
    const catalog = this.catalogBuilder.build();
    await this.outputCatalog(catalog);
  }

  private processTask(task: any): void {
    if (task.type === 'test') {
      this.catalogBuilder.addTestResult({
        filePath: task.file.filepath,
        suitePath: this.getSuitePath(task),
        testName: task.name,
        status: this.mapStatus(task.result?.state),
        duration: task.result?.duration || 0,
        error: task.result?.error ? {
          message: task.result.error.message,
          stack: task.result.error.stack,
        } : undefined,
        location: {
          line: task.location?.line,
          column: task.location?.column,
        },
      });
    }
  }
}
```

**使用方法:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: [
      'default',
      ['@koji-koji/test-kanteen/vitest', {
        output: './test-kanteen-runtime',
        format: ['json', 'markdown'],
      }],
    ],
  },
});
```

#### Playwright カスタムレポーター（`src/reporters/playwright/index.ts`）

```typescript
import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import { RuntimeCatalogBuilder } from '../shared/runtime-catalog-builder';

export class KanteenPlaywrightReporter implements Reporter {
  private catalogBuilder: RuntimeCatalogBuilder;

  constructor(options: any) {
    this.catalogBuilder = new RuntimeCatalogBuilder(options);
  }

  onBegin(): void {
    this.catalogBuilder.startRun(new Date());
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.catalogBuilder.addTestResult({
      filePath: test.location.file,
      suitePath: test.titlePath().slice(0, -1),  // 最後はテスト名なので除く
      testName: test.title,
      status: this.mapStatus(result.status),
      duration: result.duration,
      error: result.error ? {
        message: result.error.message,
        stack: result.error.stack,
      } : undefined,
      location: {
        line: test.location.line,
        column: test.location.column,
      },
      retries: result.retry,
    });
  }

  async onEnd(result: FullResult): Promise<void> {
    this.catalogBuilder.endRun(new Date());
    const catalog = this.catalogBuilder.build();
    await this.outputCatalog(catalog);
  }

  private mapStatus(status: string): TestStatus {
    const mapping: Record<string, TestStatus> = {
      'passed': 'passed',
      'failed': 'failed',
      'skipped': 'skipped',
      'timedOut': 'failed',
      'interrupted': 'failed',
    };
    return mapping[status] || 'failed';
  }
}
```

**使用方法:**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'],
    ['@koji-koji/test-kanteen/playwright', {
      output: './test-kanteen-runtime',
      format: ['json', 'markdown'],
    }],
  ],
});
```

### 4. 共通ビルダー（`src/reporters/shared/runtime-catalog-builder.ts`）

```typescript
export class RuntimeCatalogBuilder {
  private tests: Map<string, RuntimeTestCase[]> = new Map();
  private startTime?: Date;
  private endTime?: Date;

  startRun(time: Date): void {
    this.startTime = time;
  }

  endRun(time: Date): void {
    this.endTime = time;
  }

  addTestResult(result: TestResultData): void {
    const filePath = result.filePath;
    if (!this.tests.has(filePath)) {
      this.tests.set(filePath, []);
    }

    const testCase: RuntimeTestCase = {
      id: generateId(),
      name: result.testName,
      location: {
        file: filePath,
        line: result.location.line || 0,
        column: result.location.column || 0,
      },
      runtime: {
        duration: result.duration,
        status: result.status,
        startTime: result.startTime,
        endTime: result.endTime,
        retries: result.retries,
        error: result.error,
      },
    };

    this.tests.get(filePath)!.push(testCase);
  }

  build(): RuntimeCatalog {
    // テスト結果からカタログを構築
    const testSuites = this.buildSuites();
    const executionSummary = this.buildSummary();

    return {
      metadata: {
        version: '0.5.0',
        generatedAt: new Date().toISOString(),
        executionDate: this.startTime?.toISOString() || '',
        totalDuration: this.endTime && this.startTime
          ? this.endTime.getTime() - this.startTime.getTime()
          : 0,
        sourceFiles: Array.from(this.tests.keys()),
      },
      testSuites,
      executionSummary,
      coverage: this.buildCoverage(),
    };
  }

  private buildSuites(): RuntimeTestSuite[] {
    // ファイルごとにスイートを構築
    // スイート階層を再構築
  }

  private buildSummary(): ExecutionSummary {
    let passed = 0, failed = 0, skipped = 0, pending = 0, todo = 0;
    let totalDuration = 0;

    for (const tests of this.tests.values()) {
      for (const test of tests) {
        totalDuration += test.runtime.duration;
        switch (test.runtime.status) {
          case 'passed': passed++; break;
          case 'failed': failed++; break;
          case 'skipped': skipped++; break;
          case 'pending': pending++; break;
          case 'todo': todo++; break;
        }
      }
    }

    return {
      totalTests: passed + failed + skipped + pending + todo,
      passed,
      failed,
      skipped,
      pending,
      todo,
      totalDuration,
      startTime: this.startTime!,
      endTime: this.endTime!,
    };
  }
}
```

### 5. 比較コマンド（`src/cli/compare.ts`）

```typescript
program
  .command('compare')
  .description('ASTカタログとランタイムカタログを比較')
  .argument('<ast-catalog>', 'ASTカタログのパス（catalog.json）')
  .argument('<runtime-catalog>', 'ランタイムカタログのパス（runtime-catalog.json）')
  .option('-o, --output <path>', '出力先', './comparison-result')
  .option('-f, --format <formats>', '出力フォーマット', 'json,markdown')
  .action(async (astPath: string, runtimePath: string, options) => {
    const astCatalog = await loadCatalog(astPath);
    const runtimeCatalog = await loadCatalog(runtimePath);

    const matcher = new TestMatcher();
    const result = matcher.compare(astCatalog, runtimeCatalog);

    // 結果を出力
    await outputComparison(result, options);

    // サマリー表示
    console.log('📊 Comparison Summary:');
    console.log(`  - Perfect matches: ${result.statistics.perfectMatches}`);
    console.log(`  - High confidence: ${result.statistics.highConfidenceMatches}`);
    console.log(`  - Medium confidence: ${result.statistics.mediumConfidenceMatches}`);
    console.log(`  - Runtime only (動的生成): ${result.statistics.unmatchedRuntime}`);
    console.log(`  - AST only (未実行): ${result.statistics.unmatchedAst}`);
  });
```

**使用例:**

```bash
# 1. ASTカタログを生成
npx kanteen analyze "tests/**/*.test.ts"

# 2. ランタイムカタログを生成（Jestで実行）
npm test

# 3. 比較
npx kanteen compare \
  ./aaa_test_kanteen/catalog.json \
  ./test-kanteen-runtime/runtime-catalog.json
```

### 6. パッケージエクスポート設定

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./jest": {
      "import": "./dist/reporters/jest/index.js",
      "require": "./dist/reporters/jest/index.js",
      "types": "./dist/reporters/jest/index.d.ts"
    },
    "./vitest": {
      "import": "./dist/reporters/vitest/index.js",
      "require": "./dist/reporters/vitest/index.js",
      "types": "./dist/reporters/vitest/index.d.ts"
    },
    "./playwright": {
      "import": "./dist/reporters/playwright/index.js",
      "require": "./dist/reporters/playwright/index.js",
      "types": "./dist/reporters/playwright/index.d.ts"
    }
  },
  "peerDependencies": {
    "@jest/reporters": "^29.0.0",
    "vitest": "^1.0.0 || ^2.0.0",
    "@playwright/test": "^1.40.0"
  },
  "peerDependenciesMeta": {
    "@jest/reporters": {
      "optional": true
    },
    "vitest": {
      "optional": true
    },
    "@playwright/test": {
      "optional": true
    }
  }
}
```

## 実装フェーズ

### Phase 1: 基盤実装（Week 1）

**目標**: 型定義とテストマッチング基盤

- [ ] `src/types/runtime.ts` の作成
- [ ] 既存の型（TestCase, TestSuite, TestCatalog）にランタイムフィールドを追加
- [ ] `src/utils/test-matcher.ts` の実装
  - [ ] ファイルパス正規化
  - [ ] スイート階層の抽出
  - [ ] テスト名の正規化
  - [ ] マッチングスコア計算
  - [ ] 比較結果の型定義
- [ ] `src/reporters/shared/runtime-catalog-builder.ts` の実装
- [ ] テストマッチャーのユニットテスト（50+ ケース）

### Phase 2: Jest対応（Week 2）

**目標**: Jestカスタムレポーターの完全実装

- [ ] `src/reporters/jest/index.ts` の実装
  - [ ] Reporter インターフェース実装
  - [ ] onRunStart, onTestResult, onRunComplete
  - [ ] TestResult から RuntimeTestCase へのマッピング
- [ ] `src/reporters/jest/result-mapper.ts` の実装
- [ ] Jest Reporter の統合テスト
  - [ ] サンプルJestプロジェクトでの動作確認
  - [ ] JSON/Markdown出力の検証
  - [ ] エラー情報の正確性確認
- [ ] ドキュメント作成
  - [ ] `docs/JEST_REPORTER.md`
  - [ ] 設定例
  - [ ] トラブルシューティング

### Phase 3: Vitest対応（Week 3）

**目標**: Vitestカスタムレポーターの完全実装

- [ ] `src/reporters/vitest/index.ts` の実装
  - [ ] Reporter インターフェース実装
  - [ ] onInit, onTaskUpdate, onFinished
  - [ ] Vitest Task から RuntimeTestCase へのマッピング
- [ ] `src/reporters/vitest/result-mapper.ts` の実装
- [ ] Vitest Reporter の統合テスト
  - [ ] サンプルVitestプロジェクトでの動作確認
  - [ ] JSON/Markdown出力の検証
- [ ] ドキュメント作成
  - [ ] `docs/VITEST_REPORTER.md`

### Phase 4: Playwright対応（Week 4）

**目標**: Playwrightカスタムレポーターの完全実装

- [ ] `src/reporters/playwright/index.ts` の実装
  - [ ] Reporter インターフェース実装
  - [ ] onBegin, onTestEnd, onEnd
  - [ ] Playwright TestResult から RuntimeTestCase へのマッピング
  - [ ] リトライ情報の処理
- [ ] `src/reporters/playwright/result-mapper.ts` の実装
- [ ] Playwright Reporter の統合テスト
  - [ ] サンプルPlaywrightプロジェクトでの動作確認
  - [ ] JSON/Markdown出力の検証
  - [ ] ブラウザ情報の記録（オプション）
- [ ] ドキュメント作成
  - [ ] `docs/PLAYWRIGHT_REPORTER.md`

### Phase 5: 比較機能実装（Week 5）

**目標**: ASTとランタイムの比較コマンド

- [ ] `src/cli/compare.ts` の実装
  - [ ] compareコマンドの追加
  - [ ] カタログの読み込み
  - [ ] TestMatcher の使用
  - [ ] 比較結果の出力
- [ ] 比較結果のフォーマッター
  - [ ] JSON形式
  - [ ] Markdown形式（テーブル、差分表示）
- [ ] 統合テスト
  - [ ] AST + Jest Runtime の比較
  - [ ] 動的生成テストの検出確認
  - [ ] test.each パターンの検証

### Phase 6: 統合とリリース（Week 5-6）

**目標**: 全体統合とv0.5.0リリース

- [ ] E2Eテスト
  - [ ] 実際のプロジェクトでの動作確認
  - [ ] 3フレームワーク全ての統合テスト
- [ ] ドキュメント整備
  - [ ] `README.md` の更新（カスタムレポーターセクション追加）
  - [ ] `docs/CUSTOM_REPORTERS.md` の作成
  - [ ] `docs/COMPARISON.md` の作成
  - [ ] サンプルプロジェクトの作成（`examples/`）
- [ ] パフォーマンステスト
  - [ ] 大規模プロジェクト（1000+ テスト）での動作確認
  - [ ] メモリ使用量の監視
- [ ] CHANGELOG.md の更新
- [ ] バージョンアップ（0.4.0 → 0.5.0）
- [ ] npm publish

## 出力例

### ランタイムカタログ（JSON）

```json
{
  "metadata": {
    "version": "0.5.0",
    "generatedAt": "2025-11-15T10:30:00.000Z",
    "executionDate": "2025-11-15T10:29:55.000Z",
    "totalDuration": 5234,
    "sourceFiles": ["tests/unit/parser.test.ts"],
    "parallel": true,
    "workers": 4
  },
  "testSuites": [
    {
      "id": "suite-1",
      "name": "ASTParser",
      "location": {
        "file": "tests/unit/parser.test.ts",
        "line": 10,
        "column": 1
      },
      "runtime": {
        "duration": 523,
        "startTime": "2025-11-15T10:29:55.100Z",
        "endTime": "2025-11-15T10:29:55.623Z"
      },
      "tests": [
        {
          "id": "test-1",
          "name": "should parse simple JavaScript code",
          "location": {
            "file": "tests/unit/parser.test.ts",
            "line": 15,
            "column": 3
          },
          "runtime": {
            "duration": 45,
            "status": "passed",
            "startTime": "2025-11-15T10:29:55.100Z",
            "endTime": "2025-11-15T10:29:55.145Z"
          }
        },
        {
          "id": "test-2",
          "name": "should handle syntax errors",
          "location": {
            "file": "tests/unit/parser.test.ts",
            "line": 23,
            "column": 3
          },
          "runtime": {
            "duration": 12,
            "status": "failed",
            "error": {
              "message": "Expected error to be thrown",
              "stack": "Error: Expected error to be thrown\n    at Object.<anonymous> (/tests/unit/parser.test.ts:25:5)",
              "matcherName": "toThrow"
            }
          }
        }
      ]
    }
  ],
  "executionSummary": {
    "totalTests": 156,
    "passed": 154,
    "failed": 2,
    "skipped": 0,
    "pending": 0,
    "todo": 0,
    "totalDuration": 5234,
    "startTime": "2025-11-15T10:29:55.000Z",
    "endTime": "2025-11-15T10:30:00.234Z"
  }
}
```

### 比較結果（Markdown）

```markdown
# Test Comparison Report

> Generated at 2025-11-15T10:35:00.000Z

## Summary

- **Total AST Tests**: 150
- **Total Runtime Tests**: 156
- **Perfect Matches**: 142 (94.7%)
- **High Confidence Matches**: 6 (4.0%)
- **Medium Confidence Matches**: 2 (1.3%)
- **Runtime Only (動的生成)**: 6
- **AST Only (未実行)**: 0

## Runtime Only Tests (動的生成テスト)

これらのテストは実行時に動的に生成され、ASTでは検出されませんでした。

| File | Suite | Test | Duration | Status |
|------|-------|------|----------|--------|
| tests/unit/parser.test.ts | ASTParser › parseMultiple | should parse file 1 | 15ms | passed |
| tests/unit/parser.test.ts | ASTParser › parseMultiple | should parse file 2 | 12ms | passed |
| tests/unit/parser.test.ts | ASTParser › parseMultiple | should parse file 3 | 14ms | passed |

**検出理由**: test.each によるパラメータ化テスト

## Medium Confidence Matches

これらのマッチングは確度が中程度です。手動で確認することをお勧めします。

| AST Test | Runtime Test | Confidence | Reason |
|----------|--------------|------------|--------|
| tests/helper.test.ts:45 - "should normalize paths" | tests/helper.test.ts:47 - "should normalize paths on Windows" | 75% | テスト名が部分一致、行番号が近い |

## Failed Tests

| File | Suite | Test | Duration | Error |
|------|-------|------|----------|-------|
| tests/unit/parser.test.ts | ASTParser | should handle syntax errors | 12ms | Expected error to be thrown |
```

## リスクと対策

### リスク1: フレームワークAPIの変更

**リスク**: Jest/Vitest/PlaywrightのReporter APIが将来変更される可能性

**対策**:
- peerDependencies でバージョン範囲を指定
- 各フレームワークのメジャーバージョンごとにテストを実施
- CI/CDで複数バージョンのフレームワークでテストを実行

### リスク2: マッチング精度

**リスク**: 動的生成テストやtest.eachでマッチング精度が低下

**対策**:
- 信頼度スコアを表示
- 中程度以下の信頼度のマッチは手動確認を推奨
- ユーザーが手動でマッチングルールをカスタマイズできる機能を提供（将来）

### リスク3: パフォーマンス

**リスク**: 大規模プロジェクト（1000+ テスト）でのメモリ使用量と実行時間

**対策**:
- ストリーミング処理の導入（必要に応じて）
- バッチ処理でのカタログ構築
- パフォーマンステストの実施（1000, 5000, 10000テストケース）

### リスク4: エラー情報の互換性

**リスク**: フレームワークごとにエラー情報の形式が異なる

**対策**:
- 共通のTestError型に正規化
- フレームワーク固有の情報は `meta` フィールドに格納（将来拡張）

## 成功基準

### 必須要件
- [ ] Jest/Vitest/Playwrightの3フレームワークで動作
- [ ] 実行時間、成功/失敗、エラー詳細が取得できる
- [ ] JSON/Markdown形式で出力可能
- [ ] 比較機能で動的生成テストを検出できる
- [ ] 通常のテストで95%以上のマッチング精度

### 推奨要件
- [ ] 大規模プロジェクト（1000+ テスト）で5秒以内に完了
- [ ] メモリ使用量が500MB以下
- [ ] 詳細なドキュメントとサンプルプロジェクト
- [ ] test.each パターンで85%以上のマッチング精度

## 参考資料

- [Jest Reporters](https://jestjs.io/docs/configuration#reporters-arraymodulename--modulename-options)
- [Vitest Reporters](https://vitest.dev/guide/reporters.html)
- [Playwright Reporters](https://playwright.dev/docs/test-reporters)
- [カスタムレポーター実装例](https://github.com/jest-community/jest-junit)
