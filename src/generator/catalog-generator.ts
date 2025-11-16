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

    // 各スイートにtotalTestsを追加
    const suitesWithTotalTests = testSuites.map((suite) => this.addTotalTestsToSuite(suite));

    const coverage = this.calculateCoverage(suitesWithTotalTests);

    return {
      metadata,
      testSuites: suitesWithTotalTests,
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
   * テストスイートにtotalTestsフィールドを追加（再帰的）
   */
  private addTotalTestsToSuite(suite: TestSuite): TestSuite {
    // ネストされたスイートにもtotalTestsを追加
    const nestedSuites = suite.nestedSuites?.map((nested) => this.addTotalTestsToSuite(nested));

    // このスイートのテスト数を再帰的に計算
    const totalTests = this.countTests({
      ...suite,
      nestedSuites,
    });

    return {
      ...suite,
      nestedSuites,
      totalTests,
    };
  }

  /**
   * カバレッジ情報を計算
   */
  private calculateCoverage(testSuites: TestSuite[]): CoverageInfo {
    let totalTests = 0;
    let totalSuites = 0;

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
      totalTests += this.countTests(suite);
      totalSuites += countSuites(suite);
    });

    return {
      totalTests,
      totalSuites,
    };
  }

  /**
   * テストスイートの総テスト数を再帰的に計算
   */
  private countTests(suite: TestSuite): number {
    let count = suite.tests.length;
    if (suite.nestedSuites) {
      suite.nestedSuites.forEach((nested) => {
        count += this.countTests(nested);
      });
    }
    return count;
  }
}
