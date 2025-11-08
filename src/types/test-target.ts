/**
 * テスト対象の型定義
 */

import type { SourceLocation } from './catalog';

/**
 * マッチング方法
 */
export type MatchMethod = 'suite-name' | 'import' | 'function-call' | 'manual';

/**
 * マッチング信頼度
 */
export type Confidence = 'high' | 'medium' | 'low';

/**
 * テスト対象情報
 */
export interface TestTarget {
  /**
   * テスト名（it/test の description）
   */
  testName: string;

  /**
   * テストファイルパス
   */
  testFile: string;

  /**
   * テスト対象の名前（関数名、クラス名など）
   */
  targetName: string;

  /**
   * マッチング信頼度
   */
  confidence: Confidence;

  /**
   * マッチング方法
   */
  matchMethod: MatchMethod;

  /**
   * テストの位置
   */
  location: SourceLocation;

  /**
   * テストスイート名（describe の名前）
   */
  suiteName?: string;
}

/**
 * インポート情報
 */
export interface ImportInfo {
  /**
   * インポートされた名前
   */
  name: string;

  /**
   * インポート元のパス
   */
  source: string;

  /**
   * default import か
   */
  isDefault: boolean;

  /**
   * namespace import か (import * as foo)
   */
  isNamespace: boolean;

  /**
   * 位置情報
   */
  location: SourceLocation;
}
