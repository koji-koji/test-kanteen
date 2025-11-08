/**
 * Coverage Gap Analyzer
 * エクスポートとテストをマッチングしてカバレッジギャップを検出
 */

import { SourceLoader } from '../parser/source-loader';
import { ASTParser } from '../parser/ast-parser';
import { TestFrameworkDetector } from '../parser/test-framework-detector';
import { TestAnalyzer } from './test-analyzer';
import { ExportExtractor } from './export-extractor';
import { TestTargetExtractor } from './test-target-extractor';
import type {
  CoverageGapReport,
  CoverageGap,
  CoverageGapSummary,
  ExportInfo,
  TestTarget,
  CoverageStatus,
  Impact,
} from '../types';

/**
 * カバレッジギャップ分析のオプション
 */
export interface CoverageGapAnalyzerOptions {
  /**
   * ソースファイルの除外パターン
   */
  excludeSource?: string[];

  /**
   * テストファイルの除外パターン
   */
  excludeTests?: string[];

  /**
   * テストフレームワーク（自動検出の場合は'auto'）
   */
  framework?: 'jest' | 'vitest' | 'mocha' | 'auto';

  /**
   * 詳細なログ出力
   */
  verbose?: boolean;
}

/**
 * カバレッジギャップアナライザー
 */
export class CoverageGapAnalyzer {
  private sourceLoader: SourceLoader;
  private parser: ASTParser;
  private detector: TestFrameworkDetector;
  private testAnalyzer: TestAnalyzer;
  private exportExtractor: ExportExtractor;
  private testTargetExtractor: TestTargetExtractor;

  constructor() {
    this.sourceLoader = new SourceLoader();
    this.parser = new ASTParser();
    this.detector = new TestFrameworkDetector();
    this.testAnalyzer = new TestAnalyzer();
    this.exportExtractor = new ExportExtractor();
    this.testTargetExtractor = new TestTargetExtractor();
  }

  /**
   * カバレッジギャップを分析
   */
  async analyze(
    sourcePattern: string | string[],
    testPattern: string | string[],
    options: CoverageGapAnalyzerOptions = {}
  ): Promise<CoverageGapReport> {
    const startTime = Date.now();

    if (options.verbose) {
      console.log('🔍 Analyzing coverage gaps...');
    }

    // 1. ソースコードからエクスポートを抽出
    if (options.verbose) {
      console.log('📦 Extracting exports from source files...');
    }
    const exports = await this.extractExports(sourcePattern, options);

    if (options.verbose) {
      console.log(`   Found ${exports.length} exports`);
    }

    // 2. テストコードからテスト対象を抽出
    if (options.verbose) {
      console.log('🧪 Extracting test targets from test files...');
    }
    const testTargets = await this.extractTestTargets(testPattern, options);

    if (options.verbose) {
      console.log(`   Found ${testTargets.length} test targets`);
    }

    // 3. マッチング
    if (options.verbose) {
      console.log('🔗 Matching exports with tests...');
    }
    const gaps = this.matchExportsWithTests(exports, testTargets);

    // 4. レポート生成
    const report = this.generateReport(
      gaps,
      sourcePattern,
      testPattern,
      exports.length,
      testTargets.length
    );

    const elapsed = Date.now() - startTime;
    if (options.verbose) {
      console.log(`✅ Analysis complete in ${elapsed}ms`);
    }

    return report;
  }

  /**
   * ソースコードからエクスポートを抽出
   */
  private async extractExports(
    pattern: string | string[],
    options: CoverageGapAnalyzerOptions
  ): Promise<ExportInfo[]> {
    const sources = await this.sourceLoader.loadByPattern(pattern, {
      ignore: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.test.js',
        '**/*.test.jsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/*.spec.js',
        '**/*.spec.jsx',
        '**/tests/**',
        '**/test/**',
        ...(options.excludeSource || []),
      ],
    });

    const allExports: ExportInfo[] = [];

    for (const [filePath, source] of sources) {
      try {
        const parseResult = this.parser.parse(source, filePath);
        const fileExports = this.exportExtractor.extract(parseResult);
        allExports.push(...fileExports);
      } catch (error) {
        if (options.verbose) {
          console.warn(`   ⚠️  Failed to parse ${filePath}:`, error);
        }
      }
    }

    return allExports;
  }

  /**
   * テストファイルからテスト対象を抽出
   */
  private async extractTestTargets(
    pattern: string | string[],
    options: CoverageGapAnalyzerOptions
  ): Promise<TestTarget[]> {
    const sources = await this.sourceLoader.loadByPattern(pattern, {
      ignore: options.excludeTests || [],
    });

    const allTargets: TestTarget[] = [];

    for (const [filePath, source] of sources) {
      try {
        const parseResult = this.parser.parse(source, filePath);

        // フレームワーク検出
        const frameworkName = options.framework || 'auto';
        const framework =
          frameworkName === 'auto'
            ? await this.detector.autoDetect(source, parseResult.ast)
            : this.detector.getFramework(frameworkName)!;

        // テストスイート解析
        const suites = this.testAnalyzer.analyze(parseResult, framework);

        // テスト対象抽出
        const targets = this.testTargetExtractor.extract(parseResult, suites);
        allTargets.push(...targets);
      } catch (error) {
        if (options.verbose) {
          console.warn(`   ⚠️  Failed to parse ${filePath}:`, error);
        }
      }
    }

    return allTargets;
  }

  /**
   * エクスポートとテストをマッチング
   */
  private matchExportsWithTests(
    exports: ExportInfo[],
    testTargets: TestTarget[]
  ): CoverageGap[] {
    const gaps: CoverageGap[] = [];

    for (const exp of exports) {
      // このエクスポートに関連するテストを探す
      const matchingTests = this.findMatchingTests(exp, testTargets);

      // ステータス判定
      const status = this.determineStatus(exp, matchingTests);

      // インパクト評価
      const impact = this.calculateImpact(exp);

      // 推奨アクション
      const recommendation = this.generateRecommendation(exp, status, matchingTests);

      gaps.push({
        export: exp,
        tests: matchingTests,
        status,
        impact,
        recommendation,
      });
    }

    return gaps;
  }

  /**
   * マッチするテストを探す
   */
  private findMatchingTests(exp: ExportInfo, testTargets: TestTarget[]): TestTarget[] {
    const matches: TestTarget[] = [];

    for (const target of testTargets) {
      if (this.isMatch(exp, target)) {
        matches.push(target);
      }
    }

    return matches;
  }

  /**
   * エクスポートとテストターゲットがマッチするか判定
   */
  private isMatch(exp: ExportInfo, target: TestTarget): boolean {
    // 名前が完全一致
    if (exp.name === target.targetName) {
      return true;
    }

    // クラスの場合、メソッドもチェック
    if (exp.type === 'method' && exp.parent) {
      // メソッドのテストは親クラス名でマッチする可能性
      if (exp.parent === target.targetName) {
        return true;
      }

      // または "ClassName.methodName" のような形式
      const fullName = `${exp.parent}.${exp.name}`;
      if (fullName === target.targetName) {
        return true;
      }
    }

    return false;
  }

  /**
   * カバレッジステータスを判定
   */
  private determineStatus(exp: ExportInfo, matchingTests: TestTarget[]): CoverageStatus {
    if (matchingTests.length === 0) {
      return 'untested';
    }

    // クラスの場合、すべてのメソッドがテストされているか確認
    if (exp.type === 'class') {
      // 簡易版: テストが1つでもあれば tested とする
      // より高度な実装では、すべてのメソッドがテストされているか確認
      return 'tested';
    }

    // 高信頼度のテストがあれば tested
    const highConfidenceTests = matchingTests.filter(t => t.confidence === 'high');
    if (highConfidenceTests.length > 0) {
      return 'tested';
    }

    // 中程度の信頼度のテストがあれば partial
    const mediumConfidenceTests = matchingTests.filter(t => t.confidence === 'medium');
    if (mediumConfidenceTests.length > 0) {
      return 'partial';
    }

    // 低信頼度のみの場合は partial
    return 'partial';
  }

  /**
   * インパクト（優先度）を計算
   */
  private calculateImpact(exp: ExportInfo): Impact {
    // 公開APIは高優先度
    if (exp.isExported && exp.isPublic && exp.kind !== 'namespace') {
      // 関数とクラスは特に重要
      if (exp.type === 'function' || exp.type === 'class') {
        return 'high';
      }

      // インターフェースや型も重要だが少し優先度を下げる
      if (exp.type === 'interface' || exp.type === 'type') {
        return 'medium';
      }

      // 変数は中優先度
      if (exp.type === 'variable') {
        return 'medium';
      }
    }

    // パブリックメソッドは中優先度
    if (exp.type === 'method' && exp.isPublic) {
      return 'medium';
    }

    // その他は低優先度
    return 'low';
  }

  /**
   * 推奨アクションを生成
   */
  private generateRecommendation(
    exp: ExportInfo,
    status: CoverageStatus,
    matchingTests: TestTarget[]
  ): string {
    if (status === 'tested') {
      return '';
    }

    if (status === 'untested') {
      // テストファイルのパスを推測
      const suggestedTestFile = this.suggestTestFilePath(exp.filePath);

      if (exp.type === 'function') {
        return `Add test for function '${exp.name}' in ${suggestedTestFile}`;
      }

      if (exp.type === 'class') {
        return `Add test suite for class '${exp.name}' in ${suggestedTestFile}`;
      }

      if (exp.type === 'method') {
        return `Add test for method '${exp.parent}.${exp.name}' in ${suggestedTestFile}`;
      }

      return `Add test for '${exp.name}' in ${suggestedTestFile}`;
    }

    if (status === 'partial') {
      const confidences = matchingTests.map(t => t.confidence).join(', ');
      return `Improve test confidence (current: ${confidences}). Add more explicit tests.`;
    }

    return '';
  }

  /**
   * テストファイルパスを推測
   */
  private suggestTestFilePath(sourcePath: string): string {
    // src/foo/bar.ts → tests/unit/foo/bar.test.ts
    const directory = sourcePath.includes('src/')
      ? sourcePath.replace('src/', 'tests/unit/')
      : sourcePath;

    return directory.replace(/\.tsx?$/, '.test.ts');
  }

  /**
   * レポートを生成
   */
  private generateReport(
    gaps: CoverageGap[],
    sourcePattern: string | string[],
    testPattern: string | string[],
    totalExports: number,
    totalTestTargets: number
  ): CoverageGapReport {
    // サマリー統計を計算
    const summary = this.calculateSummary(gaps);

    // 推奨事項を生成
    const recommendations = this.generateRecommendations(gaps, summary);

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '0.1.0',
        sourceFiles: totalExports,
        testFiles: totalTestTargets,
        sourcePattern,
        testPattern,
      },
      summary,
      gaps,
      recommendations,
    };
  }

  /**
   * サマリー統計を計算
   */
  private calculateSummary(gaps: CoverageGap[]): CoverageGapSummary {
    const totalExports = gaps.length;
    const tested = gaps.filter(g => g.status === 'tested').length;
    const untested = gaps.filter(g => g.status === 'untested').length;
    const partiallyTested = gaps.filter(g => g.status === 'partial').length;

    const coverageRate = totalExports > 0 ? (tested / totalExports) * 100 : 0;

    // タイプ別の統計
    const byType: Record<string, number> = {};
    for (const gap of gaps) {
      const type = gap.export.type;
      byType[type] = (byType[type] || 0) + 1;
    }

    // インパクト別の統計
    const byImpact = {
      high: gaps.filter(g => g.impact === 'high' && g.status === 'untested').length,
      medium: gaps.filter(g => g.impact === 'medium' && g.status === 'untested').length,
      low: gaps.filter(g => g.impact === 'low' && g.status === 'untested').length,
    };

    return {
      totalExports,
      tested,
      untested,
      partiallyTested,
      coverageRate: Math.round(coverageRate * 10) / 10,
      byType,
      byImpact,
    };
  }

  /**
   * 推奨事項を生成
   */
  private generateRecommendations(gaps: CoverageGap[], summary: CoverageGapSummary): string[] {
    const recommendations: string[] = [];

    // 高優先度の未テストがある場合
    if (summary.byImpact.high > 0) {
      recommendations.push(
        `Add ${summary.byImpact.high} high-priority test(s) to improve API coverage`
      );
    }

    // カバレッジ率が低い場合
    if (summary.coverageRate < 80) {
      const needed = Math.ceil((0.8 * summary.totalExports - summary.tested));
      recommendations.push(
        `Add ${needed} more test(s) to reach 80% coverage (current: ${summary.coverageRate}%)`
      );
    }

    // 部分的なテストが多い場合
    if (summary.partiallyTested > summary.totalExports * 0.2) {
      recommendations.push(
        `Improve ${summary.partiallyTested} partially tested export(s) with more explicit tests`
      );
    }

    // 特定のタイプが未テスト
    const untestedFunctions = gaps.filter(
      g => g.export.type === 'function' && g.status === 'untested'
    );
    if (untestedFunctions.length > 0) {
      recommendations.push(
        `${untestedFunctions.length} exported function(s) have no tests`
      );
    }

    // 推奨事項がない場合
    if (recommendations.length === 0 && summary.coverageRate >= 95) {
      recommendations.push('Excellent coverage! All critical exports are tested.');
    }

    return recommendations;
  }
}
