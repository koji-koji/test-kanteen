import { BaseReporter } from '../base-reporter';
import type { TestCatalog } from '../../types';

/**
 * JSON形式でレポートを出力するReporter
 */
export class JSONReporter extends BaseReporter {
  /**
   * JSON形式のレポートを生成
   */
  generate(): object {
    return this.catalog as TestCatalog;
  }

  /**
   * 整形されたJSONを生成
   */
  generatePretty(): string {
    return this.formatOutput(this.catalog);
  }
}
