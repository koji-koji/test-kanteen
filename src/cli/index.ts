#!/usr/bin/env node

import { Command } from 'commander';
import { parseTests, parseTestsWithConfig } from '../index';
import type { TestFramework, OutputFormat } from '../types';
import * as path from 'path';

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
  .option('-o, --output <path>', '出力先ディレクトリ', './test-catalog')
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

      console.log('✅ Analysis complete!\n');
      console.log('📊 Summary:');
      console.log(`  - Total test suites: ${catalog.testSuites.length}`);
      console.log(`  - Total tests: ${catalog.coverage.totalTests}`);
      console.log(`  - Total aspects: ${catalog.coverage.totalAspects}`);
      console.log(`  - Framework: ${catalog.metadata.framework}`);
      console.log(`\n📁 Output: ${options.output}`);
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
  output: './test-catalog',
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
  output: './test-catalog',
  llm: {
    enabled: false,
  },
  verbose: false,
};

module.exports = config;
`;
}
