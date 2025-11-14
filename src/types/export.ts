/**
 * Export情報の型定義
 */

import type { SourceLocation } from './catalog';

/**
 * エクスポートの種類
 */
export type ExportType = 'function' | 'class' | 'method' | 'variable' | 'type' | 'interface';

/**
 * エクスポートの方法
 */
export type ExportKind = 'named' | 'default' | 'namespace';

/**
 * エクスポート情報
 */
export interface ExportInfo {
  /**
   * エクスポート名
   */
  name: string;

  /**
   * エクスポートの種類
   */
  type: ExportType;

  /**
   * エクスポートの方法
   */
  kind: ExportKind;

  /**
   * ファイルパス
   */
  filePath: string;

  /**
   * ソースコード上の位置
   */
  location: SourceLocation;

  /**
   * 公開されているか（export されているか）
   */
  isExported: boolean;

  /**
   * パブリックか（private/protectedでないか）
   */
  isPublic: boolean;

  /**
   * 親のクラス名（メソッドの場合）
   */
  parent?: string;

  /**
   * 関数シグネチャ
   */
  signature?: string;

  /**
   * JSDocコメント
   */
  jsDoc?: string;

  /**
   * 非同期関数か
   */
  isAsync?: boolean;
}

