#!/usr/bin/env node

import { Command } from 'commander';
import { parseTests, parseTestsWithConfig } from '../index';
import type { TestFramework, OutputFormat } from '../types';
import * as path from 'path';
import * as fs from 'fs/promises';

const program = new Command();

program
  .name('kanteen')
  .description('AST×Reporterでテストから観点カタログを自動生成')
  .version('0.4.0');

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
    'json,markdown'
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
        console.log(`  - Mode: simple (testSuites only)`);
        console.log(`\n📁 Output: ${options.output}`);
      } else {
        console.log('✅ Analysis complete!\n');
        console.log('📊 Summary:');
        console.log(`  - Total test suites: ${catalog.testSuites.length}`);
        console.log(`  - Total tests: ${catalog.coverage.totalTests}`);
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

// extract コマンド
program
  .command('extract')
  .description('ソースコードから関数・クラスを抽出')
  .argument('[pattern]', 'ソースファイルのパターン', '**/*.{ts,tsx}')
  .option('-o, --output <path>', '出力先ディレクトリ', './aaa_test_kanteen/exports')
  .option(
    '-f, --format <formats>',
    '出力フォーマット (json,markdown)',
    'json,markdown'
  )
  .option('-v, --verbose', '詳細な出力を表示')
  .action(async (pattern: string, options) => {
    try {
      const { SourceLoader } = await import('../parser/source-loader');
      const { ASTParser } = await import('../parser/ast-parser');
      const { ExportExtractor } = await import('../analyzer/export-extractor');

      console.log('🔍 Extracting exports...\n');

      // ソースファイルを読み込み
      const loader = new SourceLoader();
      const sources = await loader.loadByPattern([pattern]);

      if (sources.size === 0) {
        console.log('⚠️  No source files found');
        return;
      }

      // ASTをパース
      const parser = new ASTParser();
      const extractor = new ExportExtractor();

      const allExports: any[] = [];
      const exportsByFile = new Map<string, any[]>();

      for (const [filePath, content] of sources.entries()) {
        try {
          const parseResult = parser.parse(content, filePath);
          const exports = extractor.extract(parseResult);

          // 関数とクラス（メソッド含む）のみにフィルタ
          const filtered = exports.filter(exp =>
            exp.type === 'function' ||
            exp.type === 'class' ||
            exp.type === 'method'
          );

          allExports.push(...filtered);
          exportsByFile.set(filePath, filtered);

          if (options.verbose) {
            console.log(`✓ ${filePath}: ${exports.length} exports`);
          }
        } catch (error) {
          if (options.verbose) {
            console.error(`✗ ${filePath}: ${error instanceof Error ? error.message : error}`);
          }
        }
      }

      console.log('\n📊 Summary:');
      console.log(`  - Total files: ${sources.size}`);
      console.log(`  - Total exports: ${allExports.length}`);

      // タイプ別の集計
      const byType = allExports.reduce((acc, exp) => {
        acc[exp.type] = (acc[exp.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('\n  By type:');
      for (const [type, count] of Object.entries(byType)) {
        console.log(`    - ${type}: ${count}`);
      }

      // 出力
      const outputPath = path.resolve(process.cwd(), options.output);
      await fs.mkdir(outputPath, { recursive: true });

      const formats = options.format.split(',');

      for (const format of formats) {
        if (format === 'json') {
          const jsonPath = path.join(outputPath, 'exports.json');
          const jsonData = {
            summary: {
              totalFiles: sources.size,
              totalExports: allExports.length,
              byType,
              generatedAt: new Date().toISOString(),
            },
            exports: allExports,
            byFile: Object.fromEntries(exportsByFile),
          };
          await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');
          console.log(`\n📄 JSON: ${jsonPath}`);
        } else if (format === 'markdown') {
          const mdPath = path.join(outputPath, 'exports.md');
          let markdown = '# Functions and Classes\n\n';
          markdown += `> Generated at ${new Date().toISOString()}\n\n`;
          markdown += '## Summary\n\n';
          markdown += `- **Total Files**: ${sources.size}\n`;
          markdown += `- **Total Functions**: ${byType['function'] || 0}\n`;
          markdown += `- **Total Classes**: ${byType['class'] || 0}\n`;
          markdown += `- **Total Methods**: ${byType['method'] || 0}\n\n`;
          markdown += '## Functions and Classes by File\n\n';

          for (const [filePath, exports] of exportsByFile.entries()) {
            if (exports.length === 0) continue;

            const relativePath = path.relative(process.cwd(), filePath);

            // 関数とクラスのみをグループ化
            const functions = exports.filter(e => e.type === 'function');
            const classes = exports.filter(e => e.type === 'class');
            const methods = exports.filter(e => e.type === 'method');

            if (functions.length === 0 && classes.length === 0) continue;

            markdown += `### ${relativePath}\n\n`;

            // 関数
            if (functions.length > 0) {
              markdown += '**Functions:**\n\n';
              for (const func of functions) {
                markdown += `- 📦 **${func.name}**`;
                if (func.signature) {
                  markdown += `\`${func.signature}\``;
                }
                markdown += ` (line ${func.location.line})\n`;
              }
              markdown += '\n';
            }

            // クラス（メソッドと一緒に表示）
            if (classes.length > 0) {
              markdown += '**Classes:**\n\n';
              for (const cls of classes) {
                markdown += `- 🏛️ **${cls.name}** (line ${cls.location.line})\n`;

                // このクラスのメソッドを探す
                const classMethods = methods.filter(m =>
                  m.location.file === cls.location.file &&
                  m.location.line > cls.location.line &&
                  m.location.line < (cls.location.line + 200) // 簡易的な範囲チェック
                );

                if (classMethods.length > 0) {
                  markdown += '  - Methods:\n';
                  for (const method of classMethods) {
                    markdown += `    - ${method.name}()`;
                    if (method.signature) {
                      markdown += ` \`${method.signature}\``;
                    }
                    markdown += '\n';
                  }
                }
              }
              markdown += '\n';
            }
          }

          await fs.writeFile(mdPath, markdown, 'utf-8');
          console.log(`📄 Markdown: ${mdPath}`);
        }
      }

      console.log('\n✅ Extraction complete!\n');
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// compare コマンド
program
  .command('compare')
  .description('ASTカタログとランタイムカタログを比較')
  .argument('<ast-catalog>', 'ASTカタログのパス (JSON)')
  .argument('<runtime-catalog>', 'ランタイムカタログのパス (JSON)')
  .option('-o, --output <path>', '出力先ディレクトリ', './test-kanteen-comparison')
  .option(
    '-f, --format <formats>',
    '出力フォーマット (json,markdown)',
    'json,markdown'
  )
  .option('-v, --verbose', '詳細な出力を表示')
  .action(async (astCatalogPath: string, runtimeCatalogPath: string, options) => {
    try {
      console.log('🔍 Comparing catalogs...\n');

      // カタログファイルを読み込み
      const astCatalogContent = await fs.readFile(
        path.resolve(process.cwd(), astCatalogPath),
        'utf-8'
      );
      const runtimeCatalogContent = await fs.readFile(
        path.resolve(process.cwd(), runtimeCatalogPath),
        'utf-8'
      );

      const astCatalog = JSON.parse(astCatalogContent);
      const runtimeCatalog = JSON.parse(runtimeCatalogContent);

      if (options.verbose) {
        console.log(`📄 AST Catalog: ${astCatalogPath}`);
        console.log(`📄 Runtime Catalog: ${runtimeCatalogPath}\n`);
      }

      // TestMatcherを使用して比較
      const { TestMatcher } = await import('../utils/test-matcher');
      const matcher = new TestMatcher();
      const comparisonResult = matcher.compare(astCatalog, runtimeCatalog);

      // サマリーを表示
      console.log('✅ Comparison complete!\n');
      console.log('📊 Summary:');
      console.log(`  - AST Tests: ${comparisonResult.statistics.totalAstTests}`);
      console.log(`  - Runtime Tests: ${comparisonResult.statistics.totalRuntimeTests}`);
      console.log(`  - Perfect Matches: ${comparisonResult.statistics.perfectMatches}`);
      console.log(`  - High Confidence: ${comparisonResult.statistics.highConfidenceMatches}`);
      console.log(`  - Medium Confidence: ${comparisonResult.statistics.mediumConfidenceMatches}`);
      console.log(`  - AST Only (not executed): ${comparisonResult.statistics.unmatchedAst}`);
      console.log(`  - Runtime Only (dynamically generated): ${comparisonResult.statistics.unmatchedRuntime}`);

      // 出力
      const outputPath = path.resolve(process.cwd(), options.output);
      await fs.mkdir(outputPath, { recursive: true });

      const formats = options.format.split(',');

      for (const format of formats) {
        if (format === 'json') {
          const jsonPath = path.join(outputPath, 'comparison.json');
          await fs.writeFile(
            jsonPath,
            JSON.stringify(comparisonResult, null, 2),
            'utf-8'
          );
          console.log(`\n📄 JSON: ${jsonPath}`);
        } else if (format === 'markdown') {
          const mdPath = path.join(outputPath, 'comparison.md');
          const markdown = generateComparisonMarkdown(comparisonResult, {
            astCatalogPath,
            runtimeCatalogPath,
          });
          await fs.writeFile(mdPath, markdown, 'utf-8');
          console.log(`📄 Markdown: ${mdPath}`);
        }
      }

      console.log(`\n📁 Output: ${options.output}\n`);
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

// デフォルトコマンド: 引数なしの場合はanalyzeを実行
const args = process.argv.slice(2);
const knownCommands = ['analyze', 'extract', 'init', 'compare', 'list-frameworks'];
const hasCommand = args.length > 0 && knownCommands.includes(args[0]);

if (!hasCommand && args.length === 0) {
  // 引数なしの場合、analyze をデフォルトで実行
  process.argv.splice(2, 0, 'analyze');
}

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

/**
 * 比較結果のMarkdownを生成
 */
function generateComparisonMarkdown(
  comparisonResult: any,
  metadata: { astCatalogPath: string; runtimeCatalogPath: string }
): string {
  const lines: string[] = [];

  // ヘッダー
  lines.push('# Test Catalog Comparison');
  lines.push('');
  lines.push('> AST Catalog vs Runtime Catalog Comparison Report');
  lines.push('');

  // メタデータ
  lines.push('## Metadata');
  lines.push('');
  lines.push(`- **Generated At**: ${new Date().toLocaleString()}`);
  lines.push(`- **AST Catalog**: ${metadata.astCatalogPath}`);
  lines.push(`- **Runtime Catalog**: ${metadata.runtimeCatalogPath}`);
  lines.push('');

  // サマリー
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| AST Tests | ${comparisonResult.statistics.totalAstTests} |`);
  lines.push(`| Runtime Tests | ${comparisonResult.statistics.totalRuntimeTests} |`);
  lines.push(`| Perfect Matches | ${comparisonResult.statistics.perfectMatches} ✅ |`);
  lines.push(`| High Confidence Matches | ${comparisonResult.statistics.highConfidenceMatches} 🟢 |`);
  lines.push(`| Medium Confidence Matches | ${comparisonResult.statistics.mediumConfidenceMatches} 🟡 |`);
  lines.push(`| AST Only (Not Executed) | ${comparisonResult.statistics.unmatchedAst} ⚠️ |`);
  lines.push(`| Runtime Only (Dynamically Generated) | ${comparisonResult.statistics.unmatchedRuntime} 🔵 |`);
  lines.push('');

  // Coverage率
  const matchedTests = comparisonResult.statistics.perfectMatches +
    comparisonResult.statistics.highConfidenceMatches +
    comparisonResult.statistics.mediumConfidenceMatches;
  const coverageRate = comparisonResult.statistics.totalAstTests > 0
    ? ((matchedTests / comparisonResult.statistics.totalAstTests) * 100).toFixed(1)
    : '0.0';

  lines.push('### Test Execution Coverage');
  lines.push('');
  lines.push(`**${coverageRate}%** of AST tests were executed at runtime`);
  lines.push('');

  // AST Only Tests (未実行)
  if (comparisonResult.astOnly && comparisonResult.astOnly.length > 0) {
    lines.push('## AST Only Tests (Not Executed) ⚠️');
    lines.push('');
    lines.push('These tests exist in the source code but were not executed:');
    lines.push('');

    for (const test of comparisonResult.astOnly) {
      const suitePath = test.suitePath ? test.suitePath.join(' > ') : '';
      lines.push(`- **${test.name}**`);
      if (suitePath) {
        lines.push(`  - Suite: ${suitePath}`);
      }
      lines.push(`  - File: ${test.location?.file || 'unknown'}:${test.location?.line || '?'}`);
    }
    lines.push('');
  }

  // Runtime Only Tests (動的生成)
  if (comparisonResult.runtimeOnly && comparisonResult.runtimeOnly.length > 0) {
    lines.push('## Runtime Only Tests (Dynamically Generated) 🔵');
    lines.push('');
    lines.push('These tests were executed but not found in the AST (likely generated dynamically):');
    lines.push('');

    for (const test of comparisonResult.runtimeOnly) {
      const suitePath = test.suitePath ? test.suitePath.join(' > ') : '';
      lines.push(`- **${test.name}**`);
      if (suitePath) {
        lines.push(`  - Suite: ${suitePath}`);
      }
      lines.push(`  - Status: ${test.status}`);
      if (test.duration !== undefined) {
        lines.push(`  - Duration: ${test.duration}ms`);
      }
    }
    lines.push('');
  }

  // Match Details (Perfect + High Confidence)
  const goodMatches = comparisonResult.matches.filter(
    (m: any) => m.matchType === 'perfect' || m.matchType === 'high-confidence'
  );

  // Group by status (declare at top level for use in recommendations)
  const passed = goodMatches.filter((m: any) => m.runtimeTest?.status === 'passed');
  const failed = goodMatches.filter((m: any) => m.runtimeTest?.status === 'failed');
  const skipped = goodMatches.filter((m: any) => m.runtimeTest?.status === 'skipped');

  if (goodMatches.length > 0) {
    lines.push('## Matched Tests ✅');
    lines.push('');
    lines.push(`${goodMatches.length} tests were successfully matched between AST and Runtime:`);
    lines.push('');

    lines.push('### Status Breakdown');
    lines.push('');
    lines.push(`- ✅ Passed: ${passed.length}`);
    lines.push(`- ❌ Failed: ${failed.length}`);
    lines.push(`- ⏭️ Skipped: ${skipped.length}`);
    lines.push('');

    // Show failed tests
    if (failed.length > 0) {
      lines.push('### Failed Tests ❌');
      lines.push('');
      for (const match of failed) {
        const test = match.runtimeTest;
        const suitePath = test.suitePath ? test.suitePath.join(' > ') : '';
        lines.push(`- **${test.name}**`);
        if (suitePath) {
          lines.push(`  - Suite: ${suitePath}`);
        }
        if (test.error?.message) {
          const errorPreview = test.error.message.split('\n')[0];
          lines.push(`  - Error: ${errorPreview}`);
        }
      }
      lines.push('');
    }
  }

  // Medium Confidence Matches
  const mediumMatches = comparisonResult.matches.filter(
    (m: any) => m.matchType === 'medium-confidence'
  );

  if (mediumMatches.length > 0) {
    lines.push('## Medium Confidence Matches 🟡');
    lines.push('');
    lines.push('These tests were matched with medium confidence. Please verify manually:');
    lines.push('');

    for (const match of mediumMatches) {
      lines.push(`- **${match.astTest?.name || match.runtimeTest?.name}**`);
      lines.push(`  - Confidence: ${match.confidence}%`);
      if (match.reasons && match.reasons.length > 0) {
        lines.push(`  - Reasons: ${match.reasons.join(', ')}`);
      }
    }
    lines.push('');
  }

  // Recommendations
  lines.push('## Recommendations');
  lines.push('');

  if (comparisonResult.statistics.unmatchedAst > 0) {
    lines.push('### Unexecuted Tests ⚠️');
    lines.push('');
    lines.push(`${comparisonResult.statistics.unmatchedAst} tests were not executed. Consider:`);
    lines.push('');
    lines.push('- Are these tests skipped intentionally?');
    lines.push('- Do test file patterns exclude these tests?');
    lines.push('- Are there conditional skips (e.g., `test.skip`)?');
    lines.push('');
  }

  if (comparisonResult.statistics.unmatchedRuntime > 0) {
    lines.push('### Dynamically Generated Tests 🔵');
    lines.push('');
    lines.push(`${comparisonResult.statistics.unmatchedRuntime} tests appear to be dynamically generated. This is common with:`);
    lines.push('');
    lines.push('- `test.each()` / `describe.each()`');
    lines.push('- Parameterized tests');
    lines.push('- Tests generated from data sources');
    lines.push('');
  }

  if (failed.length > 0) {
    lines.push('### Failed Tests ❌');
    lines.push('');
    lines.push(`${failed.length} tests failed during execution. Priority actions:`);
    lines.push('');
    lines.push('1. Review error messages above');
    lines.push('2. Fix failing tests');
    lines.push('3. Re-run comparison after fixes');
    lines.push('');
  }

  return lines.join('\n');
}
