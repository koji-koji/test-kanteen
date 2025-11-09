import * as fs from 'fs/promises';
import * as path from 'path';
import type { TestSuite, TestCase, TestCatalog } from '../types';
import type { IReporter, ReporterOptions } from './reporter-interface';

/**
 * すべてのReporterの基底クラス
 */
export abstract class BaseReporter implements IReporter {
  protected catalog: Partial<TestCatalog> = {};
  protected options: ReporterOptions;

  constructor(options: ReporterOptions = {}) {
    this.options = {
      format: {
        indent: 2,
        pretty: true,
      },
      include: {
        metadata: true,
        assertions: true,
        location: true,
      },
      ...options,
    };
  }

  /**
   * テストスイートの処理
   */
  onTestSuite(_suite: TestSuite): void {
    // サブクラスでオーバーライド可能
  }

  /**
   * テストケースの処理
   */
  onTestCase(_testCase: TestCase): void {
    // サブクラスでオーバーライド可能
  }

  /**
   * 処理完了時
   */
  onComplete(catalog: TestCatalog): void {
    this.catalog = catalog;
  }

  /**
   * レポート生成（サブクラスで実装）
   */
  abstract generate(): string | object;

  /**
   * ファイルに出力
   */
  async writeToFile(outputPath: string): Promise<void> {
    const content = this.generate();
    const outputDir = path.dirname(outputPath);

    // ディレクトリが存在しない場合は作成
    await fs.mkdir(outputDir, { recursive: true });

    // 内容を文字列に変換
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

    await fs.writeFile(outputPath, contentStr, 'utf-8');
  }

  /**
   * フォーマットされた出力を生成
   */
  protected formatOutput(data: object): string {
    if (this.options.format?.pretty) {
      return JSON.stringify(data, null, this.options.format.indent || 2);
    }
    return JSON.stringify(data);
  }

  /**
   * データをフィルタリング
   */
  protected filterData<T extends object>(data: T): Partial<T> {
    const include = this.options.include || {};
    const filtered: Partial<T> = {};

    for (const key in data) {
      const includeKey = include[key as keyof typeof include];
      if (includeKey === undefined || includeKey === true) {
        filtered[key] = data[key];
      }
    }

    return filtered;
  }
}
