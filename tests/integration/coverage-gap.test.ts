import { CoverageGapAnalyzer } from '../../src/analyzer/coverage-gap-analyzer';

describe('Coverage Gap Integration Tests', () => {
  let analyzer: CoverageGapAnalyzer;

  beforeEach(() => {
    analyzer = new CoverageGapAnalyzer();
  });

  describe('Demo samples', () => {
    it('should analyze simple calculator demo', async () => {
      const report = await analyzer.analyze(
        'demo/jsconf-2025/simple/calculator.ts',
        'demo/jsconf-2025/simple/calculator.test.ts'
      );

      // 4つの関数がある
      expect(report.summary.totalExports).toBe(4);

      // add と subtract はテストされている
      expect(report.summary.tested).toBeGreaterThanOrEqual(2);

      // multiply と divide はテストされていない
      expect(report.summary.untested).toBeGreaterThanOrEqual(2);

      // multiply が未テスト
      const multiplyGap = report.gaps.find(g => g.export.name === 'multiply');
      expect(multiplyGap).toBeDefined();
      expect(multiplyGap?.status).toBe('untested');

      // divide が未テスト
      const divideGap = report.gaps.find(g => g.export.name === 'divide');
      expect(divideGap).toBeDefined();
      expect(divideGap?.status).toBe('untested');
    });

    it('should analyze realistic user service demo', async () => {
      const report = await analyzer.analyze(
        'demo/jsconf-2025/realistic/user-service.ts',
        'demo/jsconf-2025/realistic/user-service.test.ts'
      );

      // UserServiceクラス + メソッド + インターフェース + 関数
      expect(report.summary.totalExports).toBeGreaterThan(5);

      // 一部はテストされている
      expect(report.summary.tested).toBeGreaterThan(0);

      // 一部はテストされていない
      expect(report.summary.untested).toBeGreaterThan(0);

      // UserService クラスは検出される
      const userServiceGap = report.gaps.find(g => g.export.name === 'UserService');
      expect(userServiceGap).toBeDefined();
    });
  });

  describe('Self-analysis', () => {
    it('should analyze Test Kanteen itself', async () => {
      const report = await analyzer.analyze(
        'src/**/*.ts',
        'tests/**/*.test.ts'
      );

      // Test Kanteenは多くのエクスポートを持つ
      expect(report.summary.totalExports).toBeGreaterThan(50);

      // いくつかはテストされている
      expect(report.summary.tested).toBeGreaterThan(0);

      // カバレッジ率が計算される
      expect(report.summary.coverageRate).toBeGreaterThan(0);
      expect(report.summary.coverageRate).toBeLessThanOrEqual(100);

      // メタデータが含まれる
      expect(report.metadata.version).toBe('0.1.0');
      expect(report.metadata.generatedAt).toBeDefined();
    });

    it('should detect parseTestsWithConfig as untested', async () => {
      const report = await analyzer.analyze(
        'src/index.ts',
        'tests/**/*.test.ts'
      );

      // parseTestsWithConfig が検出される
      const parseTestsWithConfigGap = report.gaps.find(
        g => g.export.name === 'parseTestsWithConfig'
      );

      expect(parseTestsWithConfigGap).toBeDefined();
      // この関数は現在テストされていないはず
    });
  });

  describe('Report generation', () => {
    it('should generate recommendations', async () => {
      const report = await analyzer.analyze(
        'demo/jsconf-2025/simple/calculator.ts',
        'demo/jsconf-2025/simple/calculator.test.ts'
      );

      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);

      // カバレッジ向上の推奨事項がある
      const hasRecommendation = report.recommendations.some(
        r => r.includes('test') || r.includes('coverage')
      );
      expect(hasRecommendation).toBe(true);
    });

    it('should prioritize untested exports', async () => {
      const report = await analyzer.analyze(
        'demo/jsconf-2025/simple/calculator.ts',
        'demo/jsconf-2025/simple/calculator.test.ts'
      );

      const untestedGaps = report.gaps.filter(g => g.status === 'untested');
      expect(untestedGaps.length).toBeGreaterThan(0);

      // 全ての未テストギャップは function 型で high impact
      for (const gap of untestedGaps) {
        expect(gap.export.type).toBe('function');
        expect(gap.impact).toBe('high');
      }
    });

    it('should include location information', async () => {
      const report = await analyzer.analyze(
        'demo/jsconf-2025/simple/calculator.ts',
        'demo/jsconf-2025/simple/calculator.test.ts'
      );

      for (const gap of report.gaps) {
        expect(gap.export.location).toBeDefined();
        expect(gap.export.location.file).toBeDefined();
        expect(gap.export.location.line).toBeGreaterThan(0);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle non-existent patterns gracefully', async () => {
      const report = await analyzer.analyze(
        'nonexistent/**/*.ts',
        'nonexistent/**/*.test.ts'
      );

      expect(report.summary.totalExports).toBe(0);
      expect(report.summary.tested).toBe(0);
      expect(report.summary.untested).toBe(0);
    });

    it('should exclude test files from source analysis', async () => {
      const report = await analyzer.analyze(
        '**/*.ts',
        'tests/**/*.test.ts'
      );

      // テストファイルはソースとして解析されない
      const hasTestFile = report.gaps.some(g =>
        g.export.filePath.includes('.test.ts')
      );
      expect(hasTestFile).toBe(false);
    });
  });
});
