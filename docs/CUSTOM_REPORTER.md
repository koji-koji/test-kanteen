# カスタムレポーターガイド

Test Kanteenは独自のレポート形式を作成できます。HTMLレポート、Slack通知、CSV出力、カスタムMarkdownなど、用途に応じたレポーターを実装可能です。

## 目次

- [基本構造](#基本構造)
- [ファイル構成と命名規則](#ファイル構成と命名規則)
- [実装方法](#実装方法)
- [実装例](#実装例)
  - [1. HTMLレポーター](#1-htmlレポーター)
  - [2. Slackレポーター](#2-slackレポーター)
  - [3. CSVレポーター](#3-csvレポーター)
  - [4. カバレッジ差分レポーター](#4-カバレッジ差分レポーター)
  - [5. Runtimeレポーター](#5-runtimeレポーター実行結果を表示)
  - [6. Compare結果レポーター](#6-compare結果レポーターastruntime比較--runtime情報を表示)
- [フック](#フック)
- [ベストプラクティス](#ベストプラクティス)

## 基本構造

カスタムレポーターは `BaseReporter` を継承して作成します：

```typescript
import { BaseReporter } from 'test-kanteen';
import type { TestCatalog, TestSuite, TestCase } from 'test-kanteen';

export class MyCustomReporter extends BaseReporter {
  // 必須: レポート生成ロジック
  generate(): string | object {
    const catalog = this.catalog as TestCatalog;
    // カタログデータを使ってレポートを生成
    return '...';
  }

  // オプション: テストスイートごとの処理
  onTestSuite(suite: TestSuite): void {
    // 各テストスイートの処理
  }

  // オプション: テストケースごとの処理
  onTestCase(testCase: TestCase): void {
    // 各テストケースの処理
  }

  // オプション: 完了時の処理
  onComplete(catalog: TestCatalog): void {
    super.onComplete(catalog);
    // 追加の完了処理
  }
}
```

## ファイル構成と命名規則

### ⚠️ 重要: 公式カタログとの分離

カスタムレポートは**公式カタログを上書きしない**ようにしてください：

#### ✅ 推奨構成

```
プロジェクトルート/
├── aaa_test_kanteen/          # 公式カタログ（kanteen CLIが生成）
│   ├── catalog.json           # 🔒 上書き禁止
│   ├── catalog.md             # 🔒 上書き禁止
│   └── exports/
│       ├── exports.json
│       └── exports.md
├── test-reports/              # カスタムレポート専用ディレクトリ
│   ├── github.md              # ✅ カスタムMarkdown
│   ├── html-report.html       # ✅ HTMLレポート
│   ├── coverage-diff.csv      # ✅ CSVレポート
│   └── slack-summary.json     # ✅ Slack用JSON
└── scripts/
    └── generate-reports.ts    # レポート生成スクリプト
```

#### ❌ 避けるべき構成

```
aaa_test_kanteen/
├── catalog.md                 # ❌ 公式カタログを上書き
├── catalog.json               # ❌ 公式カタログを上書き
└── my-report.html             # ❌ 公式ディレクトリに混在
```

### 推奨ディレクトリ名

- `test-reports/` - カスタムレポート専用
- `test-catalog/reports/` - 公式カタログ内にサブディレクトリを作る場合
- `docs/test-reports/` - ドキュメントとして管理する場合

## 実装方法

### ステップ1: BaseReporterを継承

```typescript
import { BaseReporter } from 'test-kanteen';
import type { TestCatalog, ReporterOptions } from 'test-kanteen';

export class GitHubMarkdownReporter extends BaseReporter {
  constructor(options?: ReporterOptions) {
    super(options);
  }

  generate(): string {
    const catalog = this.catalog as TestCatalog;

    let markdown = `# 📊 Test Report\n\n`;
    markdown += `> Generated: ${catalog.metadata.generatedAt}\n\n`;

    // テストサマリー
    markdown += `## 📈 Summary\n\n`;
    markdown += `- **Total Tests**: ${catalog.coverage.totalTests}\n`;
    markdown += `- **Total Suites**: ${catalog.coverage.totalSuites}\n`;
    markdown += `- **Framework**: ${catalog.metadata.framework}\n\n`;

    // テストスイート詳細
    markdown += `## 📝 Test Suites\n\n`;
    catalog.testSuites.forEach(suite => {
      markdown += `### ${suite.name}\n\n`;
      markdown += `**File**: \`${suite.filePath}\`\n\n`;

      suite.tests.forEach(test => {
        markdown += `- ✅ ${test.name}\n`;
      });
      markdown += '\n';
    });

    return markdown;
  }
}
```

### ステップ2: レポーターを使用

```typescript
import { parseTests } from 'test-kanteen';
import { GitHubMarkdownReporter } from './reporters/github-markdown';

async function main() {
  // 1. テストカタログを生成
  const catalog = await parseTests('tests/**/*.test.ts', {
    framework: 'jest',
    verbose: true,
  });

  // 2. カスタムレポーターでレポート生成
  const reporter = new GitHubMarkdownReporter();
  reporter.onComplete(catalog);

  // 3. ファイルに保存（公式カタログと別のパスに保存）
  await reporter.writeToFile('./test-reports/github.md');

  console.log('✅ Custom report generated: ./test-reports/github.md');
}

main();
```

## 実装例

### 1. HTMLレポーター

```typescript
import { BaseReporter } from 'test-kanteen';
import type { TestCatalog } from 'test-kanteen';

export class HTMLReporter extends BaseReporter {
  generate(): string {
    const catalog = this.catalog as TestCatalog;

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test Report - ${catalog.metadata.framework}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
    .suite { margin: 20px 0; border-left: 3px solid #4CAF50; padding-left: 15px; }
    .test { margin: 5px 0; padding: 5px; }
    .test::before { content: "✓ "; color: green; }
  </style>
</head>
<body>
  <h1>📊 Test Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Total Tests:</strong> ${catalog.coverage.totalTests}</p>
    <p><strong>Total Suites:</strong> ${catalog.coverage.totalSuites}</p>
    <p><strong>Generated:</strong> ${catalog.metadata.generatedAt}</p>
  </div>
`;

    catalog.testSuites.forEach(suite => {
      html += `
  <div class="suite">
    <h3>${suite.name}</h3>
    <p><code>${suite.filePath}</code></p>
`;
      suite.tests.forEach(test => {
        html += `    <div class="test">${test.name}</div>\n`;
      });
      html += `  </div>\n`;
    });

    html += `
</body>
</html>`;

    return html;
  }
}

// 使用例
const catalog = await parseTests('tests/**/*.test.ts');
const htmlReporter = new HTMLReporter();
htmlReporter.onComplete(catalog);
await htmlReporter.writeToFile('./test-reports/report.html');
```

### 2. Slackレポーター

```typescript
import { BaseReporter } from 'test-kanteen';
import type { TestCatalog } from 'test-kanteen';

export class SlackReporter extends BaseReporter {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    super();
    this.webhookUrl = webhookUrl;
  }

  generate(): object {
    const catalog = this.catalog as TestCatalog;

    return {
      text: `📊 Test Report (${catalog.metadata.framework})`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📊 Test Report',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Total Tests:*\n${catalog.coverage.totalTests}`,
            },
            {
              type: 'mrkdwn',
              text: `*Total Suites:*\n${catalog.coverage.totalSuites}`,
            },
            {
              type: 'mrkdwn',
              text: `*Framework:*\n${catalog.metadata.framework}`,
            },
            {
              type: 'mrkdwn',
              text: `*Generated:*\n${new Date(catalog.metadata.generatedAt).toLocaleString()}`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Test Suites:*\n${catalog.testSuites.map(s => `• ${s.name} (${s.tests.length} tests)`).join('\n')}`,
          },
        },
      ],
    };
  }

  async post(): Promise<void> {
    const payload = this.generate();

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack post failed: ${response.statusText}`);
    }
  }
}

// 使用例
const catalog = await parseTests('tests/**/*.test.ts');
const slackReporter = new SlackReporter(process.env.SLACK_WEBHOOK_URL!);
slackReporter.onComplete(catalog);
await slackReporter.post();

// JSONとしても保存可能
await slackReporter.writeToFile('./test-reports/slack-payload.json');
```

### 3. CSVレポーター

```typescript
import { BaseReporter } from 'test-kanteen';
import type { TestCatalog } from 'test-kanteen';

export class CSVReporter extends BaseReporter {
  generate(): string {
    const catalog = this.catalog as TestCatalog;

    let csv = 'Suite,Test Name,File Path,Line,Assertions\n';

    catalog.testSuites.forEach(suite => {
      suite.tests.forEach(test => {
        const assertions = test.assertions?.length || 0;
        csv += `"${suite.name}","${test.name}","${suite.filePath}",${test.location?.line || ''},${assertions}\n`;
      });
    });

    return csv;
  }
}

// 使用例
const catalog = await parseTests('tests/**/*.test.ts');
const csvReporter = new CSVReporter();
csvReporter.onComplete(catalog);
await csvReporter.writeToFile('./test-reports/tests.csv');
```

### 4. カバレッジ差分レポーター

前回のカタログと比較して、追加/削除されたテストを検出します：

```typescript
import { BaseReporter } from 'test-kanteen';
import type { TestCatalog } from 'test-kanteen';
import * as fs from 'fs/promises';

export class CoverageDiffReporter extends BaseReporter {
  private previousCatalogPath: string;

  constructor(previousCatalogPath: string) {
    super();
    this.previousCatalogPath = previousCatalogPath;
  }

  async generate(): Promise<string> {
    const currentCatalog = this.catalog as TestCatalog;

    // 前回のカタログを読み込み
    const previousContent = await fs.readFile(this.previousCatalogPath, 'utf-8');
    const previousCatalog: TestCatalog = JSON.parse(previousContent);

    // テスト数の差分
    const testDiff = currentCatalog.coverage.totalTests - previousCatalog.coverage.totalTests;

    let report = `# 📊 Coverage Diff Report\n\n`;
    report += `## Summary\n\n`;
    report += `- **Previous Tests**: ${previousCatalog.coverage.totalTests}\n`;
    report += `- **Current Tests**: ${currentCatalog.coverage.totalTests}\n`;
    report += `- **Diff**: ${testDiff > 0 ? '+' : ''}${testDiff}\n\n`;

    // 新しいテストスイートを検出
    const previousSuiteNames = new Set(previousCatalog.testSuites.map(s => s.name));
    const newSuites = currentCatalog.testSuites.filter(s => !previousSuiteNames.has(s.name));

    if (newSuites.length > 0) {
      report += `## ✨ New Test Suites\n\n`;
      newSuites.forEach(suite => {
        report += `- **${suite.name}** (${suite.tests.length} tests)\n`;
      });
      report += '\n';
    }

    return report;
  }
}

// 使用例
const catalog = await parseTests('tests/**/*.test.ts');
const diffReporter = new CoverageDiffReporter('./test-reports/previous-catalog.json');
diffReporter.onComplete(catalog);
const diff = await diffReporter.generate();
await fs.writeFile('./test-reports/coverage-diff.md', diff, 'utf-8');
```

### 5. Runtimeレポーター（実行結果を表示）

テストの実行結果（status, duration, errors）を可視化します：

```typescript
import { BaseReporter } from 'test-kanteen';
import type { RuntimeCatalog, RuntimeTestCase } from 'test-kanteen';
import * as fs from 'fs/promises';

export class RuntimeReporter extends BaseReporter {
  private runtimeCatalog?: RuntimeCatalog;

  async loadRuntimeCatalog(runtimeCatalogPath: string): Promise<void> {
    const content = await fs.readFile(runtimeCatalogPath, 'utf-8');
    this.runtimeCatalog = JSON.parse(content);
  }

  generate(): string {
    if (!this.runtimeCatalog) {
      throw new Error('Runtime catalog not loaded. Call loadRuntimeCatalog() first.');
    }

    const catalog = this.runtimeCatalog;
    const summary = catalog.executionSummary;

    let report = `# 🧪 Test Execution Report\n\n`;

    // 実行サマリー
    report += `## 📊 Execution Summary\n\n`;
    report += `- **Total Tests**: ${summary.totalTests}\n`;
    report += `- **✅ Passed**: ${summary.passed}\n`;
    report += `- **❌ Failed**: ${summary.failed}\n`;
    report += `- **⏭️  Skipped**: ${summary.skipped}\n`;
    report += `- **⏱️  Total Duration**: ${summary.totalDuration}ms\n`;
    report += `- **Execution Time**: ${new Date(summary.startTime).toLocaleString()}\n\n`;

    // 失敗したテストを強調表示
    if (summary.failed > 0) {
      report += `## ❌ Failed Tests\n\n`;
      catalog.testSuites.forEach(suite => {
        this.collectFailedTests(suite).forEach(test => {
          report += `### ${test.name}\n\n`;
          report += `**File**: \`${test.location.file}:${test.location.line}\`\n\n`;
          report += `**Duration**: ${test.runtime.duration}ms\n\n`;
          if (test.runtime.error) {
            report += `**Error**:\n\`\`\`\n${test.runtime.error.message}\n\`\`\`\n\n`;
            if (test.runtime.error.stack) {
              report += `**Stack Trace**:\n\`\`\`\n${test.runtime.error.stack}\n\`\`\`\n\n`;
            }
          }
        });
      });
    }

    // すべてのテストスイートの詳細
    report += `## 📝 Test Suites\n\n`;
    catalog.testSuites.forEach(suite => {
      report += this.generateSuiteReport(suite);
    });

    return report;
  }

  private collectFailedTests(suite: RuntimeCatalog['testSuites'][0]): RuntimeTestCase[] {
    const failed: RuntimeTestCase[] = [];

    suite.tests.forEach(test => {
      if (test.runtime.status === 'failed') {
        failed.push(test);
      }
    });

    suite.nestedSuites?.forEach(nested => {
      failed.push(...this.collectFailedTests(nested));
    });

    return failed;
  }

  private generateSuiteReport(suite: RuntimeCatalog['testSuites'][0], indent = 0): string {
    const prefix = '  '.repeat(indent);
    let report = `${prefix}### ${suite.name}\n\n`;

    if (suite.runtime) {
      report += `${prefix}**Duration**: ${suite.runtime.duration}ms\n\n`;
    }

    suite.tests.forEach(test => {
      const statusIcon = this.getStatusIcon(test.runtime.status);
      report += `${prefix}- ${statusIcon} **${test.name}** (${test.runtime.duration}ms)\n`;
    });

    report += '\n';

    suite.nestedSuites?.forEach(nested => {
      report += this.generateSuiteReport(nested, indent + 1);
    });

    return report;
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      case 'pending': return '⏸️';
      case 'todo': return '📝';
      default: return '❓';
    }
  }
}

// 使用例
const reporter = new RuntimeReporter();
await reporter.loadRuntimeCatalog('./test-kanteen-runtime/runtime-catalog.json');
const report = reporter.generate();
await fs.writeFile('./test-reports/runtime-report.md', report, 'utf-8');
```

### 6. Compare結果レポーター（AST×Runtime比較 + Runtime情報を表示）

AST×Runtime比較結果と実行結果を組み合わせて表示します：

```typescript
import { BaseReporter } from 'test-kanteen';
import { TestMatcher } from 'test-kanteen';
import type { TestCatalog, RuntimeCatalog, ComparisonResult } from 'test-kanteen';
import * as fs from 'fs/promises';

export class CompareRuntimeReporter extends BaseReporter {
  private astCatalog?: TestCatalog;
  private runtimeCatalog?: RuntimeCatalog;
  private comparisonResult?: ComparisonResult;

  async loadCatalogs(astPath: string, runtimePath: string): Promise<void> {
    // ASTカタログを読み込み
    const astContent = await fs.readFile(astPath, 'utf-8');
    this.astCatalog = JSON.parse(astContent);

    // Runtimeカタログを読み込み
    const runtimeContent = await fs.readFile(runtimePath, 'utf-8');
    this.runtimeCatalog = JSON.parse(runtimeContent);

    // 比較実行
    const matcher = new TestMatcher();
    this.comparisonResult = matcher.compare(this.astCatalog, this.runtimeCatalog);
  }

  generate(): string {
    if (!this.astCatalog || !this.runtimeCatalog || !this.comparisonResult) {
      throw new Error('Catalogs not loaded. Call loadCatalogs() first.');
    }

    const stats = this.comparisonResult.statistics;
    const summary = this.runtimeCatalog.executionSummary;

    let report = `# 📊 AST×Runtime Comparison Report\n\n`;

    // 1. 実行サマリー（Runtime情報）
    report += `## 🧪 Execution Summary\n\n`;
    report += `- **Total Tests Executed**: ${summary.totalTests}\n`;
    report += `- **✅ Passed**: ${summary.passed}\n`;
    report += `- **❌ Failed**: ${summary.failed}\n`;
    report += `- **⏭️  Skipped**: ${summary.skipped}\n`;
    report += `- **⏱️  Total Duration**: ${summary.totalDuration}ms\n`;
    report += `- **Execution Time**: ${new Date(summary.startTime).toLocaleString()}\n\n`;

    // 2. AST×Runtime比較統計
    report += `## 📈 AST×Runtime Comparison Statistics\n\n`;
    report += `- **AST Tests**: ${stats.totalAstTests}\n`;
    report += `- **Runtime Tests**: ${stats.totalRuntimeTests}\n`;
    report += `- **Perfect Matches**: ${stats.perfectMatches}\n`;
    report += `- **High Confidence Matches**: ${stats.highConfidenceMatches}\n`;
    report += `- **Medium Confidence Matches**: ${stats.mediumConfidenceMatches}\n`;
    report += `- **Unmatched AST (not executed)**: ${stats.unmatchedAst}\n`;
    report += `- **Unmatched Runtime (dynamically generated)**: ${stats.unmatchedRuntime}\n\n`;

    // 3. 未実行テスト（ASTにあるがRuntimeにない）
    if (this.comparisonResult.astOnly.length > 0) {
      report += `## ⚠️  Tests Not Executed (AST only)\n\n`;
      report += `これらのテストはコードに存在しますが、実行されませんでした（スキップまたは条件分岐）：\n\n`;
      this.comparisonResult.astOnly.forEach(test => {
        report += `- **${test.name}**\n`;
        report += `  - File: \`${test.location.file}:${test.location.line}\`\n`;
      });
      report += '\n';
    }

    // 4. 動的生成テスト（Runtimeにのみ存在）
    if (this.comparisonResult.runtimeOnly.length > 0) {
      report += `## ✨ Dynamically Generated Tests (Runtime only)\n\n`;
      report += `これらのテストは実行時に動的生成されました（test.each等）：\n\n`;
      this.comparisonResult.runtimeOnly.forEach(test => {
        const statusIcon = this.getStatusIcon(test.runtime.status);
        report += `- ${statusIcon} **${test.name}** (${test.runtime.duration}ms)\n`;
        report += `  - File: \`${test.location.file}:${test.location.line}\`\n`;
        report += `  - Status: ${test.runtime.status}\n`;
      });
      report += '\n';
    }

    // 5. 失敗したテスト（Runtime情報から）
    const failedTests = this.comparisonResult.matches.filter(
      match => match.runtimeTest?.runtime.status === 'failed'
    );

    if (failedTests.length > 0) {
      report += `## ❌ Failed Tests\n\n`;
      failedTests.forEach(match => {
        const test = match.runtimeTest!;
        report += `### ${test.name}\n\n`;
        report += `**File**: \`${test.location.file}:${test.location.line}\`\n\n`;
        report += `**Duration**: ${test.runtime.duration}ms\n\n`;
        report += `**Match Type**: ${match.matchType} (confidence: ${match.confidence}%)\n\n`;

        if (test.runtime.error) {
          report += `**Error**:\n\`\`\`\n${test.runtime.error.message}\n\`\`\`\n\n`;

          if (test.runtime.error.expected !== undefined && test.runtime.error.actual !== undefined) {
            report += `**Expected**: \`${JSON.stringify(test.runtime.error.expected)}\`\n\n`;
            report += `**Actual**: \`${JSON.stringify(test.runtime.error.actual)}\`\n\n`;
          }

          if (test.runtime.error.stack) {
            report += `<details>\n<summary>Stack Trace</summary>\n\n\`\`\`\n${test.runtime.error.stack}\n\`\`\`\n</details>\n\n`;
          }
        }
      });
    }

    // 6. すべてのマッチング結果（詳細）
    report += `## 📝 All Test Matches\n\n`;
    report += `| Test Name | AST | Runtime | Status | Duration | Match |\n`;
    report += `|-----------|-----|---------|--------|----------|-------|\n`;

    this.comparisonResult.matches.forEach(match => {
      const name = match.astTest?.name || match.runtimeTest?.name || 'Unknown';
      const hasAst = match.astTest ? '✓' : '✗';
      const hasRuntime = match.runtimeTest ? '✓' : '✗';
      const status = match.runtimeTest ? this.getStatusIcon(match.runtimeTest.runtime.status) : '-';
      const duration = match.runtimeTest ? `${match.runtimeTest.runtime.duration}ms` : '-';
      const matchType = match.matchType;

      report += `| ${name} | ${hasAst} | ${hasRuntime} | ${status} | ${duration} | ${matchType} |\n`;
    });

    return report;
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      case 'pending': return '⏸️';
      case 'todo': return '📝';
      default: return '❓';
    }
  }
}

// 使用例
const reporter = new CompareRuntimeReporter();

// ASTとRuntimeのカタログを読み込んで比較
await reporter.loadCatalogs(
  './aaa_test_kanteen/catalog.json',
  './test-kanteen-runtime/runtime-catalog.json'
);

// レポート生成
const report = reporter.generate();
await fs.writeFile('./test-reports/compare-runtime-report.md', report, 'utf-8');

console.log('✅ Compare+Runtime report generated!');
```

このレポーターは以下を表示します：

1. **実行サマリー** - テストの実行結果統計（passed/failed/skipped）
2. **AST×Runtime比較統計** - マッチング精度
3. **未実行テスト** - ASTにあるがRuntimeにないテスト
4. **動的生成テスト** - Runtimeにのみ存在するテスト（test.each等）
5. **失敗したテスト** - エラーメッセージとスタックトレース付き
6. **すべてのマッチング結果** - テーブル形式で一覧表示

## フック

カスタムレポーターは以下のフックを利用できます：

### `onTestSuite(suite: TestSuite): void`

各テストスイートが解析されたときに呼ばれます。

```typescript
export class MyReporter extends BaseReporter {
  private suiteCount = 0;

  onTestSuite(suite: TestSuite): void {
    this.suiteCount++;
    console.log(`Processing suite ${this.suiteCount}: ${suite.name}`);
  }
}
```

### `onTestCase(testCase: TestCase): void`

各テストケースが解析されたときに呼ばれます。

```typescript
export class MyReporter extends BaseReporter {
  private testCount = 0;

  onTestCase(testCase: TestCase): void {
    this.testCount++;
    if (testCase.assertions && testCase.assertions.length === 0) {
      console.warn(`⚠️  Test without assertions: ${testCase.name}`);
    }
  }
}
```

### `onComplete(catalog: TestCatalog): void`

すべての解析が完了したときに呼ばれます。

```typescript
export class MyReporter extends BaseReporter {
  onComplete(catalog: TestCatalog): void {
    super.onComplete(catalog);
    console.log(`✅ Analysis complete: ${catalog.coverage.totalTests} tests`);
  }
}
```

### `generate(): string | object`

**必須メソッド**。レポートの内容を生成します。

- Markdown/HTML/CSV等のテキスト形式: `string`を返す
- JSON/オブジェクト形式: `object`を返す

```typescript
export class MyReporter extends BaseReporter {
  generate(): string {
    const catalog = this.catalog as TestCatalog;
    return `Total tests: ${catalog.coverage.totalTests}`;
  }
}
```

## ベストプラクティス

### ✅ DO: 推奨事項

1. **別ディレクトリに保存**
   ```typescript
   // ✅ Good
   await reporter.writeToFile('./test-reports/custom-report.md');
   await reporter.writeToFile('./test-catalog/reports/github.md');
   ```

2. **わかりやすいファイル名を使用**
   ```typescript
   // ✅ Good - 用途が明確
   await reporter.writeToFile('./test-reports/github-pr-comment.md');
   await reporter.writeToFile('./test-reports/slack-summary.json');
   await reporter.writeToFile('./test-reports/html-dashboard.html');
   ```

3. **ReporterOptionsを活用**
   ```typescript
   export class MyReporter extends BaseReporter {
     constructor(options?: ReporterOptions) {
       super(options);
     }
   }

   const reporter = new MyReporter({
     outputPath: './test-reports/my-report.md',
     format: { pretty: true, indent: 2 },
   });
   ```

4. **型安全を保つ**
   ```typescript
   import type { TestCatalog, TestSuite, TestCase } from 'test-kanteen';

   generate(): string {
     const catalog = this.catalog as TestCatalog;
     // TypeScript が型チェックしてくれる
   }
   ```

### ❌ DON'T: 避けるべき事項

1. **公式カタログを上書きしない**
   ```typescript
   // ❌ Bad - 公式カタログを上書き
   await reporter.writeToFile('./aaa_test_kanteen/catalog.md');
   await reporter.writeToFile('./aaa_test_kanteen/catalog.json');
   ```

2. **不明瞭なファイル名を使わない**
   ```typescript
   // ❌ Bad - 用途が不明
   await reporter.writeToFile('./test-reports/report.md');
   await reporter.writeToFile('./test-reports/output.md');
   ```

3. **公式ディレクトリに混在させない**
   ```typescript
   // ❌ Bad - 公式カタログと混在
   await reporter.writeToFile('./aaa_test_kanteen/my-custom-report.html');
   ```

## まとめ

### カスタムレポーターの種類

Test Kanteenでは、用途に応じて以下のカスタムレポーターを作成できます：

1. **ASTカタログレポーター** - 静的解析結果を独自フォーマットで出力（HTML, CSV等）
2. **Runtimeレポーター** - テスト実行結果（status, duration, errors）を可視化
3. **Compare結果レポーター** - AST×Runtime比較結果とRuntime情報を組み合わせて表示

### 基本方針

- `BaseReporter`を継承してカスタムレポーターを作成
- `generate()`メソッドでレポート内容を実装
- **公式カタログ（catalog.md, catalog.json）を上書きしない**
- カスタムレポートは`test-reports/`等の別ディレクトリに保存
- フック（`onTestSuite`, `onTestCase`, `onComplete`）を活用して柔軟な処理を実装

### Runtimeレポーター利用時の注意

Runtimeカタログは以下の方法で生成されます：

1. **Jest/Vitest/Playwrightのカスタムレポーター**を設定
2. テストを実行すると`test-kanteen-runtime/runtime-catalog.json`が生成される
3. カスタムレポーターで`runtime-catalog.json`を読み込んで処理

詳細は [Jest Reporter](./JEST_REPORTER.md) | [Vitest Reporter](./VITEST_REPORTER.md) | [Playwright Reporter](./PLAYWRIGHT_REPORTER.md) を参照してください。

### 実装例

上記のコード例を参考に、プロジェクトのニーズに合わせたカスタムレポーターを実装してください。
