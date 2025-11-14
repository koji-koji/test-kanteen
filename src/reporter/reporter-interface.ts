import type { TestSuite, TestCase, TestCatalog } from '../types';

/**
 * Reporterのインターフェース
 */
export interface IReporter {
  /**
   * テストスイートの処理開始
   */
  onTestSuite(suite: TestSuite): void;

  /**
   * テストケースの処理
   */
  onTestCase(testCase: TestCase): void;

  /**
   * すべてのテスト処理が完了
   */
  onComplete(catalog: TestCatalog): void;

  /**
   * レポートを生成
   */
  generate(): string | object;

  /**
   * ファイルに出力
   */
  writeToFile(outputPath: string): Promise<void>;
}

/**
 * Reporterの設定オプション
 */
export interface ReporterOptions {
  /**
   * 出力先のパス
   */
  outputPath?: string;

  /**
   * フォーマットオプション
   */
  format?: {
    indent?: number;
    pretty?: boolean;
  };

  /**
   * 含める情報のフィルター
   */
  include?: {
    metadata?: boolean;
    assertions?: boolean;
    location?: boolean;
  };

  /**
   * カスタムオプション
   */
  [key: string]: unknown;
}
