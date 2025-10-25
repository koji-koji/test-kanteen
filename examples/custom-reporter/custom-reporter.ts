/**
 * カスタムReporterの例
 */

import { BaseReporter, TestSuite, TestCase, TestCatalog } from 'test-kanteen';
import type { ReporterOptions } from 'test-kanteen';

/**
 * カスタムHTMLReporter
 */
export class HTMLReporter extends BaseReporter {
  private testSuites: TestSuite[] = [];

  constructor(options?: ReporterOptions) {
    super(options);
  }

  onTestSuite(suite: TestSuite): void {
    this.testSuites.push(suite);
  }

  onTestCase(testCase: TestCase): void {
    // テストケースごとの処理
  }

  onComplete(catalog: TestCatalog): void {
    super.onComplete(catalog);
  }

  generate(): string {
    const catalog = this.catalog as TestCatalog;

    let html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Catalog</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .suite {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .test {
      background: #f9f9f9;
      padding: 10px 15px;
      margin: 10px 0;
      border-left: 3px solid #4CAF50;
      border-radius: 4px;
    }
    .aspect {
      display: inline-block;
      background: #e3f2fd;
      color: #1976d2;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 12px;
      margin-right: 5px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .stat {
      background: #4CAF50;
      color: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
    }
    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Test Catalog</h1>
    <p>Generated: ${catalog.metadata?.generatedAt || 'N/A'}</p>
    <p>Framework: ${catalog.metadata?.framework || 'N/A'}</p>

    <div class="stats">
      <div class="stat">
        <div class="stat-value">${catalog.coverage?.totalTests || 0}</div>
        <div class="stat-label">Total Tests</div>
      </div>
      <div class="stat">
        <div class="stat-value">${catalog.testSuites?.length || 0}</div>
        <div class="stat-label">Test Suites</div>
      </div>
      <div class="stat">
        <div class="stat-value">${catalog.coverage?.totalAspects || 0}</div>
        <div class="stat-label">Aspects</div>
      </div>
    </div>
  </div>
`;

    // テストスイート
    catalog.testSuites?.forEach((suite) => {
      html += this.generateSuiteHTML(suite);
    });

    html += `
</body>
</html>
`;

    return html;
  }

  private generateSuiteHTML(suite: TestSuite): string {
    let html = `
  <div class="suite">
    <h2>${suite.name}</h2>
`;

    suite.tests?.forEach((test) => {
      html += `
    <div class="test">
      <strong>${test.name}</strong><br>
      <div style="margin-top: 5px;">
`;

      test.aspects?.forEach((aspect) => {
        html += `<span class="aspect">${aspect}</span>`;
      });

      html += `
      </div>
    </div>
`;
    });

    html += `
  </div>
`;

    return html;
  }
}
