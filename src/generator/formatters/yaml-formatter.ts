import * as YAML from 'yaml';
import type { TestCatalog } from '../../types';

/**
 * YAML形式のフォーマッター
 */
export class YAMLFormatter {
  /**
   * カタログをYAML文字列に変換
   */
  format(catalog: TestCatalog, options?: { indent?: number }): string {
    const indent = options?.indent ?? 2;

    return YAML.stringify(catalog, {
      indent,
      lineWidth: 120,
    });
  }

  /**
   * カタログをYAML Documentとして返す
   */
  toDocument(catalog: TestCatalog): YAML.Document {
    return new YAML.Document(catalog);
  }
}
