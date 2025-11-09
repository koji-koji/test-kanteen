import {
  type TestCatalog,
  type TestSuite,
  type CatalogMetadata,
  type CoverageInfo,
} from '../types';

/**
 * テストカタログを生成するクラス
 */
export class CatalogGenerator {
  private version = '0.1.0';

  /**
   * テストスイートからカタログを生成
   */
  generate(
    testSuites: TestSuite[],
    options?: {
      framework?: string;
      sourceFiles?: string[];
    }
  ): TestCatalog {
    const metadata = this.generateMetadata(options);
    const coverage = this.calculateCoverage(testSuites);

    return {
      metadata,
      testSuites,
      coverage,
    };
  }

  /**
   * メタデータを生成
   */
  private generateMetadata(options?: {
    framework?: string;
    sourceFiles?: string[];
  }): CatalogMetadata {
    return {
      generatedAt: new Date().toISOString(),
      version: this.version,
      toolVersion: this.version,
      framework: options?.framework || 'auto',
      sourceFiles: options?.sourceFiles || [],
    };
  }

  /**
   * カバレッジ情報を計算
   */
  private calculateCoverage(testSuites: TestSuite[]): CoverageInfo {
    let totalTests = 0;
    let totalSuites = 0;

    const countTests = (suite: TestSuite): number => {
      let count = suite.tests.length;
      if (suite.nestedSuites) {
        suite.nestedSuites.forEach((nested) => {
          count += countTests(nested);
        });
      }
      return count;
    };

    const countSuites = (suite: TestSuite): number => {
      let count = 1; // 自分自身をカウント
      if (suite.nestedSuites) {
        suite.nestedSuites.forEach((nested) => {
          count += countSuites(nested);
        });
      }
      return count;
    };

    testSuites.forEach((suite) => {
      totalTests += countTests(suite);
      totalSuites += countSuites(suite);
    });

    return {
      totalTests,
      totalSuites,
    };
  }

}
