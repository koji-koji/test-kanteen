import { AspectCategory } from './catalog';

/**
 * テストフレームワークの種類
 */
export type TestFramework = 'jest' | 'vitest' | 'mocha' | 'auto';

/**
 * 出力フォーマットの種類
 */
export type OutputFormat = 'json' | 'yaml' | 'markdown' | 'llm';

/**
 * LLMプロバイダーの種類
 */
export type LLMProvider = 'anthropic' | 'openai' | 'custom';

/**
 * LLM関連の設定
 */
export interface LLMConfig {
  enabled: boolean;
  provider?: LLMProvider;
  format?: string;
  includeContext?: boolean;
  maxTokens?: number;
}

/**
 * カスタム観点カテゴリの設定
 */
export interface CustomAspectConfig {
  [key: string]: string[];
}

/**
 * Reporterの設定
 */
export interface ReporterConfig {
  name: string;
  enabled: boolean;
  options?: Record<string, unknown>;
}

/**
 * 観点抽出のルール設定
 */
export interface AspectExtractionRules {
  keywords?: Record<string, AspectCategory>;
  patterns?: Array<{
    pattern: RegExp | string;
    category: AspectCategory;
  }>;
  custom?: Array<{
    name: string;
    matcher: (testName: string, code: string) => boolean;
    category: AspectCategory;
  }>;
}

/**
 * Test Kanteenの設定
 */
export interface KanteenConfig {
  /**
   * 解析対象のファイルパターン
   */
  include: string[];

  /**
   * 除外するファイルパターン
   */
  exclude?: string[];

  /**
   * テストフレームワーク（autoで自動検出）
   */
  framework?: TestFramework;

  /**
   * 使用するReporter
   */
  reporters?: (OutputFormat | string | ReporterConfig)[];

  /**
   * 出力先ディレクトリ
   */
  output?: string;

  /**
   * カスタム観点カテゴリ
   */
  aspectCategories?: CustomAspectConfig;

  /**
   * 観点抽出のルール
   */
  extractionRules?: AspectExtractionRules;

  /**
   * LLM統合の設定
   */
  llm?: LLMConfig;

  /**
   * 並列処理の設定
   */
  parallel?: boolean;

  /**
   * 詳細なログ出力
   */
  verbose?: boolean;

  /**
   * ソースマップのサポート
   */
  sourceMap?: boolean;
}

/**
 * デフォルト設定
 */
export const defaultConfig: KanteenConfig = {
  include: ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
  exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  framework: 'auto',
  reporters: ['json'],
  output: './aaa_test_kanteen',
  llm: {
    enabled: false,
  },
  parallel: false,
  verbose: false,
  sourceMap: true,
};
