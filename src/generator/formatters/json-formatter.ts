import type { TestCatalog } from '../../types';

/**
 * JSON形式のフォーマッター
 */
export class JSONFormatter {
  /**
   * カタログをJSON文字列に変換
   */
  format(catalog: TestCatalog, options?: { pretty?: boolean; indent?: number }): string {
    const pretty = options?.pretty ?? true;
    const indent = options?.indent ?? 2;

    if (pretty) {
      return JSON.stringify(catalog, null, indent);
    }

    return JSON.stringify(catalog);
  }

  /**
   * カタログをJSONオブジェクトとして返す
   */
  toObject(catalog: TestCatalog): object {
    return catalog;
  }
}
