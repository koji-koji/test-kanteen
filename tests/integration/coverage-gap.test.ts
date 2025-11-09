import { CoverageGapAnalyzer } from '../../src/analyzer/coverage-gap-analyzer';

describe('Coverage Gap Integration Tests', () => {
  let analyzer: CoverageGapAnalyzer;

  beforeEach(() => {
    analyzer = new CoverageGapAnalyzer();
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
        'src/index.ts',
        'tests/**/*.test.ts'
      );

      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);

      // カバレッジ向上の推奨事項がある
      const hasRecommendation = report.recommendations.some(
        r => r.includes('test') || r.includes('coverage')
      );
      expect(hasRecommendation).toBe(true);
    });

    it('should include location information', async () => {
      const report = await analyzer.analyze(
        'src/index.ts',
        'tests/**/*.test.ts'
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
