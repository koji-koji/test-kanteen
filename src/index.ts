/**
 * Test Kanteen
 * AST×Reporterでテストから"観点カタログ"を自動生成
 */

import { SourceLoader, ASTParser, TestFrameworkDetector } from './parser';
import { TestAnalyzer } from './analyzer';
import { CatalogGenerator } from './generator';
import { JSONReporter, MarkdownReporter } from './reporter';
import type { KanteenConfig, TestCatalog } from './types';
import { defaultConfig } from './types/config';

// すべてのエクスポート
export * from './types';
export * from './parser';
export * from './analyzer';
export * from './generator';
export * from './reporter';

/**
 * メインのAPI: テストファイルを解析してカタログを生成
 */
export async function parseTests(
  pattern: string | string[],
  config?: Partial<KanteenConfig>
): Promise<TestCatalog> {
  const finalConfig = { ...defaultConfig, ...config };

  // 1. ソースファイルの読み込み
  const loader = new SourceLoader();
  const sources = await loader.loadByPattern(pattern, {
    ignore: finalConfig.exclude,
  });

  if (sources.size === 0) {
    throw new Error(`No test files found matching pattern: ${pattern}`);
  }

  // 2. ASTパース
  const parser = new ASTParser();
  const parseResults = parser.parseMultiple(sources);

  // 3. フレームワーク検出
  const detector = new TestFrameworkDetector();
  const firstSource = sources.values().next().value;
  const framework =
    finalConfig.framework === 'auto'
      ? await detector.autoDetect(firstSource)
      : detector.getFramework(finalConfig.framework!)!;

  // 4. テスト解析
  const analyzer = new TestAnalyzer();
  const allSuites = [];

  for (const [_filePath, parseResult] of parseResults) {
    const suites = analyzer.analyze(parseResult, framework);
    allSuites.push(...suites);
  }

  // 5. カタログ生成
  const generator = new CatalogGenerator();
  const catalog = generator.generate(allSuites, {
    framework: framework.name,
    sourceFiles: Array.from(sources.keys()),
  });

  // 6. レポート出力（設定されている場合）
  if (finalConfig.output && finalConfig.reporters) {
    await outputReports(catalog, finalConfig);
  }

  return catalog;
}

/**
 * 設定ファイルからテストを解析
 */
export async function parseTestsWithConfig(configPath: string): Promise<TestCatalog> {
  const config = await loadConfig(configPath);
  return parseTests(config.include, config);
}

/**
 * レポートを出力
 */
async function outputReports(catalog: TestCatalog, config: KanteenConfig) {
  const reporters = config.reporters || ['json'];

  for (const reporter of reporters) {
    const reporterName = typeof reporter === 'string' ? reporter : reporter.name;

    let reporterInstance;
    let extension = '';

    switch (reporterName) {
      case 'json':
        reporterInstance = new JSONReporter();
        extension = 'json';
        break;
      case 'markdown':
        reporterInstance = new MarkdownReporter();
        extension = 'md';
        break;
      default:
        console.warn(`Unknown reporter: ${reporterName}`);
        continue;
    }

    reporterInstance.onComplete(catalog);
    const outputPath = `${config.output}/catalog.${extension}`;
    await reporterInstance.writeToFile(outputPath);

    if (config.verbose) {
      console.log(`Report written to: ${outputPath}`);
    }
  }
}

/**
 * 設定ファイルを読み込む
 */
async function loadConfig(configPath: string): Promise<KanteenConfig> {
  try {
    // Dynamic importで設定ファイルを読み込む
    const config = await import(configPath);
    return { ...defaultConfig, ...(config.default || config) };
  } catch (error) {
    throw new Error(`Failed to load config from ${configPath}: ${error}`);
  }
}

/**
 * ヘルパー: 単一ファイルを解析
 */
export async function parseTestFile(filePath: string): Promise<TestCatalog> {
  return parseTests(filePath);
}
