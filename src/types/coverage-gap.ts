/**
 * カバレッジギャップの型定義
 */

import type { ExportInfo } from './export';
import type { TestTarget } from './test-target';

/**
 * カバレッジ状態
 */
export type CoverageStatus = 'tested' | 'untested' | 'partial';

/**
 * インパクト（優先度）
 */
export type Impact = 'high' | 'medium' | 'low';

/**
 * カバレッジギャップ
 */
export interface CoverageGap {
  /**
   * エクスポート情報
   */
  export: ExportInfo;

  /**
   * マッチしたテスト一覧
   */
  tests: TestTarget[];

  /**
   * カバレッジ状態
   */
  status: CoverageStatus;

  /**
   * インパクト（優先度）
   */
  impact: Impact;

  /**
   * 推奨アクション
   */
  recommendation?: string;
}

/**
 * カバレッジギャップレポートのサマリー
 */
export interface CoverageGapSummary {
  /**
   * 総エクスポート数
   */
  totalExports: number;

  /**
   * テスト済み数
   */
  tested: number;

  /**
   * 未テスト数
   */
  untested: number;

  /**
   * 部分的にテスト済み数
   */
  partiallyTested: number;

  /**
   * カバレッジ率（%）
   */
  coverageRate: number;

  /**
   * タイプ別の統計
   */
  byType: Record<string, number>;

  /**
   * インパクト別の統計
   */
  byImpact: {
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * カバレッジギャップレポート
 */
export interface CoverageGapReport {
  /**
   * メタデータ
   */
  metadata: {
    generatedAt: string;
    version: string;
    sourceFiles: number;
    testFiles: number;
    sourcePattern: string | string[];
    testPattern: string | string[];
  };

  /**
   * サマリー統計
   */
  summary: CoverageGapSummary;

  /**
   * ギャップ一覧
   */
  gaps: CoverageGap[];

  /**
   * 推奨事項一覧
   */
  recommendations: string[];
}
