#!/usr/bin/env node

import { Command } from 'commander';
import { parseTests, parseTestsWithConfig } from '../index';
import { CoverageGapAnalyzer } from '../analyzer/coverage-gap-analyzer';
import type { TestFramework, OutputFormat } from '../types';
import * as path from 'path';
import * as fs from 'fs/promises';

const program = new Command();

program
  .name('kanteen')
  .description('AST×Reporterでテストから観点カタログを自動生成')
  .version('0.1.0');

// analyze コマンド
program
  .command('analyze')
  .description('テストファイルを解析してカタログを生成')
  .argument('[pattern]', 'テストファイルのパターン', '**/*.test.ts')
  .option('-c, --config <path>', '設定ファイルのパス')
  .option('-o, --output <path>', '出力先ディレクトリ', './aaa_test_kanteen')
  .option(
    '-f, --format <formats>',
    '出力フォーマット (json,yaml,markdown)',
    'json'
  )
  .option(
    '-w, --framework <framework>',
    'テストフレームワーク (jest,vitest,mocha,auto)',
    'auto'
  )
  .option(
    '-m, --mode <mode>',
    '出力モード (simple: テストスイートのみ, detailed: 全情報)',
    'detailed'
  )
  .option('-v, --verbose', '詳細な出力を表示')
  .action(async (pattern: string, options) => {
    try {
      console.log('🔍 Analyzing test files...\n');

      let catalog;

      if (options.config) {
        // 設定ファイルから読み込み
        const configPath = path.resolve(process.cwd(), options.config);
        catalog = await parseTestsWithConfig(configPath);
      } else {
        // コマンドラインオプションから設定
        const formats = options.format.split(',') as OutputFormat[];

        catalog = await parseTests(pattern, {
          framework: options.framework as TestFramework,
          output: options.output,
          reporters: formats,
          verbose: options.verbose,
        });
      }

      // 簡易モードの場合は aspects と coverage を除外
      if (options.mode === 'simple') {
        const simpleCatalog = {
          metadata: catalog.metadata,
          testSuites: catalog.testSuites,
        };

        // 簡易版を再出力
        const outputPath = path.resolve(process.cwd(), options.output);
        await fs.mkdir(outputPath, { recursive: true });

        const formats = options.format.split(',') as OutputFormat[];
        for (const format of formats) {
          const fileName = `catalog-simple.${format === 'yaml' ? 'yaml' : format}`;
          const filePath = path.join(outputPath, fileName);

          if (format === 'json') {
            await fs.writeFile(filePath, JSON.stringify(simpleCatalog, null, 2), 'utf-8');
          } else if (format === 'markdown') {
            const mdContent = generateSimpleMarkdown(simpleCatalog);
            await fs.writeFile(filePath, mdContent, 'utf-8');
          }
        }

        console.log('✅ Analysis complete!\n');
        console.log('📊 Summary (Simple Mode):');
        console.log(`  - Total test suites: ${catalog.testSuites.length}`);
        console.log(`  - Total tests: ${catalog.coverage.totalTests}`);
        console.log(`  - Framework: ${catalog.metadata.framework}`);
        console.log(`  - Mode: simple (testSuites only)`);
        console.log(`\n📁 Output: ${options.output}`);
      } else {
        console.log('✅ Analysis complete!\n');
        console.log('📊 Summary:');
        console.log(`  - Total test suites: ${catalog.testSuites.length}`);
        console.log(`  - Total tests: ${catalog.coverage.totalTests}`);
        console.log(`  - Framework: ${catalog.metadata.framework}`);
        console.log(`  - Mode: detailed`);
        console.log(`\n📁 Output: ${options.output}`);
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// init コマンド（設定ファイルを生成）
program
  .command('init')
  .description('設定ファイルを生成')
  .option('-t, --typescript', 'TypeScript設定ファイルを生成')
  .action(async (options) => {
    try {
      const fs = await import('fs/promises');
      const fileName = options.typescript ? 'kanteen.config.ts' : 'kanteen.config.js';

      const configContent = options.typescript
        ? generateTypeScriptConfig()
        : generateJavaScriptConfig();

      await fs.writeFile(fileName, configContent, 'utf-8');
      console.log(`✅ Created ${fileName}`);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// coverage-gap コマンド
program
  .command('coverage-gap')
  .description('テストされていない関数を検出')
  .argument('<source>', 'ソースファイルのパターン (例: src/**/*.ts)')
  .argument('<tests>', 'テストファイルのパターン (例: tests/**/*.test.ts)')
  .option('-o, --output <path>', '出力先ディレクトリ', './aaa_test_kanteen/coverage-gap')
  .option(
    '-f, --format <formats>',
    '出力フォーマット (json,markdown)',
    'json,markdown'
  )
  .option(
    '-w, --framework <framework>',
    'テストフレームワーク (jest,vitest,mocha,auto)',
    'auto'
  )
  .option('-v, --verbose', '詳細な出力を表示')
  .action(async (source: string, tests: string, options) => {
    try {
      const analyzer = new CoverageGapAnalyzer();

      const report = await analyzer.analyze(source, tests, {
        framework: options.framework as any,
        verbose: options.verbose,
      });

      // コンソール出力
      console.log('\n📊 Coverage Gap Report\n');
      console.log('Summary:');
      console.log(`  Total Exports: ${report.summary.totalExports}`);
      console.log(`  ✅ Tested: ${report.summary.tested} (${report.summary.coverageRate}%)`);
      console.log(`  ❌ Untested: ${report.summary.untested}`);
      console.log(`  ⚠️  Partially Tested: ${report.summary.partiallyTested}\n`);

      // 未テストのエクスポートを表示
      if (report.summary.untested > 0) {
        console.log('⚠️  Untested Exports:\n');

        const untestedGaps = report.gaps
          .filter(g => g.status === 'untested')
          .sort((a, b) => {
            // 優先度順にソート
            const impactOrder = { high: 0, medium: 1, low: 2 };
            return impactOrder[a.impact] - impactOrder[b.impact];
          })
          .slice(0, 10); // 最初の10件

        for (const gap of untestedGaps) {
          const impactIcon = gap.impact === 'high' ? '🔴' : gap.impact === 'medium' ? '🟡' : '⚪';
          console.log(`  ${impactIcon} ${gap.export.name} (${gap.export.type})`);
          console.log(`     File: ${gap.export.filePath}:${gap.export.location.line}`);
          if (gap.recommendation) {
            console.log(`     💡 ${gap.recommendation}`);
          }
          console.log('');
        }

        if (report.summary.untested > 10) {
          console.log(`  ... and ${report.summary.untested - 10} more\n`);
        }
      }

      // 推奨事項
      if (report.recommendations.length > 0) {
        console.log('📝 Recommendations:\n');
        for (const rec of report.recommendations) {
          console.log(`  • ${rec}`);
        }
        console.log('');
      }

      // ファイル出力
      const formats = options.format.split(',');
      await fs.mkdir(options.output, { recursive: true });

      for (const format of formats) {
        if (format === 'json') {
          const jsonPath = path.join(options.output, 'coverage-gap.json');
          await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
          console.log(`💾 JSON report saved to: ${jsonPath}`);
        } else if (format === 'markdown') {
          const markdownPath = path.join(options.output, 'coverage-gap.md');
          const markdown = generateMarkdownReport(report);
          await fs.writeFile(markdownPath, markdown, 'utf-8');
          console.log(`💾 Markdown report saved to: ${markdownPath}`);
        }
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// list-frameworks コマンド
program
  .command('list-frameworks')
  .description('サポートされているテストフレームワークを表示')
  .action(() => {
    console.log('📋 Supported frameworks:');
    console.log('  - jest');
    console.log('  - vitest');
    console.log('  - mocha');
    console.log('  - auto (自動検出)');
  });

program.parse();

/**
 * TypeScript設定ファイルを生成
 */
function generateTypeScriptConfig(): string {
  return `import type { KanteenConfig } from 'test-kanteen';

const config: KanteenConfig = {
  include: ['**/*.test.ts', '**/*.spec.ts'],
  exclude: ['**/node_modules/**', '**/dist/**'],
  framework: 'auto',
  reporters: ['json', 'markdown'],
  output: './aaa_test_kanteen',  // GitHubで最初に表示される
  llm: {
    enabled: false,
  },
  verbose: false,
};

export default config;
`;
}

/**
 * JavaScript設定ファイルを生成
 */
function generateJavaScriptConfig(): string {
  return `/** @type {import('test-kanteen').KanteenConfig} */
const config = {
  include: ['**/*.test.js', '**/*.spec.js'],
  exclude: ['**/node_modules/**', '**/dist/**'],
  framework: 'auto',
  reporters: ['json', 'markdown'],
  output: './aaa_test_kanteen',  // GitHubで最初に表示される
  llm: {
    enabled: false,
  },
  verbose: false,
};

module.exports = config;
`;
}

/**
 * Markdownレポートを生成
 */
function generateMarkdownReport(report: any): string {
  const lines: string[] = [];

  // ヘッダー
  lines.push('# Coverage Gap Report');
  lines.push('');
  lines.push(`> Generated by Test Kanteen v${report.metadata.version}`);
  lines.push(`> Date: ${new Date(report.metadata.generatedAt).toLocaleString()}`);
  lines.push('');

  // サマリー
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Count | Percentage |');
  lines.push('|--------|-------|------------|');
  lines.push(
    `| Total Exports | ${report.summary.totalExports} | 100% |`
  );
  lines.push(
    `| ✅ Tested | ${report.summary.tested} | ${report.summary.coverageRate}% |`
  );
  lines.push(
    `| ❌ Untested | ${report.summary.untested} | ${Math.round((report.summary.untested / report.summary.totalExports) * 100)}% |`
  );
  lines.push(
    `| ⚠️ Partially Tested | ${report.summary.partiallyTested} | ${Math.round((report.summary.partiallyTested / report.summary.totalExports) * 100)}% |`
  );
  lines.push('');

  // カバレッジビジュアル
  const coverageRate = report.summary.coverageRate;
  const filled = Math.round(coverageRate / 2.5); // 40文字中の割合
  const empty = 40 - filled;
  lines.push('### Coverage Visualization');
  lines.push('');
  lines.push('```');
  lines.push('█'.repeat(filled) + '░'.repeat(empty) + ` ${coverageRate}%`);
  lines.push('```');
  lines.push('');

  // インパクト別統計
  lines.push('## Untested Exports by Impact');
  lines.push('');
  lines.push('| Priority | Count |');
  lines.push('|----------|-------|');
  lines.push(`| 🔴 High | ${report.summary.byImpact.high} |`);
  lines.push(`| 🟡 Medium | ${report.summary.byImpact.medium} |`);
  lines.push(`| ⚪ Low | ${report.summary.byImpact.low} |`);
  lines.push('');

  // Jest風の階層表示を追加
  lines.push('## Export Coverage (Jest-style)');
  lines.push('');
  lines.push('```');
  lines.push(generateJestStyleCoverageTree(report.gaps));
  lines.push('```');
  lines.push('');

  // 未テストのエクスポート
  const untestedGaps = report.gaps.filter((g: any) => g.status === 'untested');

  if (untestedGaps.length > 0) {
    lines.push('## Untested Exports');
    lines.push('');

    // 優先度ごとにグループ化
    const byImpact = {
      high: untestedGaps.filter((g: any) => g.impact === 'high'),
      medium: untestedGaps.filter((g: any) => g.impact === 'medium'),
      low: untestedGaps.filter((g: any) => g.impact === 'low'),
    };

    for (const [impact, gaps] of Object.entries(byImpact)) {
      if (gaps.length > 0) {
        const icon = impact === 'high' ? '🔴' : impact === 'medium' ? '🟡' : '⚪';
        lines.push(`### ${icon} ${impact.charAt(0).toUpperCase() + impact.slice(1)} Priority (${gaps.length})`);
        lines.push('');

        for (const gap of gaps) {
          lines.push(`#### \`${gap.export.name}\``);
          lines.push('');
          lines.push(`- **Type**: ${gap.export.type}`);
          lines.push(`- **File**: \`${gap.export.filePath}:${gap.export.location.line}\``);
          if (gap.export.signature) {
            lines.push(`- **Signature**: \`${gap.export.name}${gap.export.signature}\``);
          }
          if (gap.recommendation) {
            lines.push(`- **Recommendation**: ${gap.recommendation}`);
          }
          lines.push('');
        }
      }
    }
  }

  // 推奨事項
  if (report.recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    for (const rec of report.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  }

  // メタデータ
  lines.push('---');
  lines.push('');
  lines.push('## Metadata');
  lines.push('');
  lines.push(`- **Source Pattern**: \`${report.metadata.sourcePattern}\``);
  lines.push(`- **Test Pattern**: \`${report.metadata.testPattern}\``);
  lines.push(`- **Generated At**: ${new Date(report.metadata.generatedAt).toISOString()}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Jest風の階層ツリーを生成
 */
function generateJestStyleCoverageTree(gaps: any[]): string {
  const lines: string[] = [];

  // ファイルごとにグループ化
  const byFile = new Map<string, any[]>();

  for (const gap of gaps) {
    const filePath = gap.export.filePath;
    if (!byFile.has(filePath)) {
      byFile.set(filePath, []);
    }
    byFile.get(filePath)!.push(gap);
  }

  // ファイルごとに表示
  for (const [filePath, fileGaps] of byFile) {
    // ファイル名を抽出（相対パス）
    const fileName = filePath.replace(/^.*\//, '').replace(/\.ts$/, '');
    lines.push(fileName);

    // クラスごとにグループ化
    const byClass = new Map<string, any[]>();
    const topLevel: any[] = [];

    for (const gap of fileGaps) {
      if (gap.export.type === 'method' && gap.export.parent) {
        if (!byClass.has(gap.export.parent)) {
          byClass.set(gap.export.parent, []);
        }
        byClass.get(gap.export.parent)!.push(gap);
      } else {
        topLevel.push(gap);
      }
    }

    // トップレベルのエクスポート（関数、クラス本体など）
    for (const gap of topLevel) {
      const icon = gap.status === 'tested' ? '✓' : '✗';

      if (gap.export.type === 'class') {
        // クラスの場合は子メソッドをインデント
        lines.push(`  ${icon} ${gap.export.name}`);

        // このクラスのメソッド
        const methods = byClass.get(gap.export.name) || [];
        for (const method of methods) {
          const methodIcon = method.status === 'tested' ? '✓' : '✗';
          lines.push(`    ${methodIcon} ${method.export.name}()`);
        }
      } else {
        // 関数や変数
        lines.push(`  ${icon} ${gap.export.name}`);
      }
    }

    lines.push(''); // ファイル間の空行
  }

  return lines.join('\n');
}

/**
 * 簡易モード用のMarkdownを生成
 */
function generateSimpleMarkdown(catalog: any): string {
  const lines: string[] = [];

  // ヘッダー
  lines.push('# Test Catalog (Simple)');
  lines.push('');
  lines.push(`> Generated by Test Kanteen v${catalog.metadata.version}`);
  lines.push('');

  // メタデータ
  lines.push('## Metadata');
  lines.push('');
  lines.push(`- **Generated At**: ${new Date(catalog.metadata.generatedAt).toLocaleString()}`);
  lines.push(`- **Framework**: ${catalog.metadata.framework}`);
  lines.push(`- **Source Files**: ${catalog.metadata.sourceFiles.length}`);
  lines.push('');

  // テストスイート
  lines.push('## Test Suites');
  lines.push('');
  lines.push('```');
  lines.push(generateTestSuiteTree(catalog.testSuites));
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

/**
 * テストスイートをツリー表示
 */
function generateTestSuiteTree(testSuites: any[], indent: number = 0): string {
  const lines: string[] = [];
  const indentStr = '  '.repeat(indent);

  for (const suite of testSuites) {
    lines.push(`${indentStr}${suite.name}`);

    // テストケース
    if (suite.tests && suite.tests.length > 0) {
      for (const test of suite.tests) {
        lines.push(`${indentStr}  ✓ ${test.name}`);
      }
    }

    // ネストされたスイート
    if (suite.nestedSuites && suite.nestedSuites.length > 0) {
      lines.push(generateTestSuiteTree(suite.nestedSuites, indent + 1));
    }
  }

  return lines.join('\n');
}
