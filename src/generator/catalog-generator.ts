import {
  AspectCategory,
  type TestCatalog,
  type TestSuite,
  type TestAspect,
  type CatalogMetadata,
  type CoverageInfo,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

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
    const aspects = this.extractAspects(testSuites);
    const coverage = this.calculateCoverage(testSuites, aspects);

    return {
      metadata,
      testSuites,
      aspects,
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
   * テストスイートから観点を抽出
   */
  private extractAspects(testSuites: TestSuite[]): TestAspect[] {
    const aspectMap = new Map<string, TestAspect>();

    const processTestSuite = (suite: TestSuite) => {
      // テストケースから観点を抽出
      suite.tests.forEach((test) => {
        test.aspects.forEach((aspectCategory) => {
          const key = aspectCategory;

          if (!aspectMap.has(key)) {
            aspectMap.set(key, {
              id: uuidv4(),
              category: aspectCategory as AspectCategory,
              description: this.getAspectDescription(aspectCategory as AspectCategory),
              examples: [],
              testCases: [],
              priority: this.getAspectPriority(aspectCategory as AspectCategory),
            });
          }

          const aspect = aspectMap.get(key)!;
          aspect.testCases.push(test.id);

          // 例として最初の3つのテスト名を追加
          if (aspect.examples.length < 3) {
            aspect.examples.push(test.name);
          }
        });
      });

      // ネストされたスイートも処理
      if (suite.nestedSuites) {
        suite.nestedSuites.forEach(processTestSuite);
      }
    };

    testSuites.forEach(processTestSuite);

    return Array.from(aspectMap.values());
  }

  /**
   * カバレッジ情報を計算
   */
  private calculateCoverage(testSuites: TestSuite[], aspects: TestAspect[]): CoverageInfo {
    let totalTests = 0;

    const countTests = (suite: TestSuite): number => {
      let count = suite.tests.length;
      if (suite.nestedSuites) {
        suite.nestedSuites.forEach((nested) => {
          count += countTests(nested);
        });
      }
      return count;
    };

    testSuites.forEach((suite) => {
      totalTests += countTests(suite);
    });

    const aspectCategories: Record<string, number> = {};
    aspects.forEach((aspect) => {
      aspectCategories[aspect.category] = aspect.testCases.length;
    });

    return {
      totalTests,
      totalAspects: aspects.length,
      aspectCategories,
    };
  }

  /**
   * 観点の説明を取得
   */
  private getAspectDescription(category: AspectCategory): string {
    const descriptions: Record<AspectCategory, string> = {
      [AspectCategory.Functionality]: '機能の正常な動作を確認するテスト',
      [AspectCategory.EdgeCase]: 'エッジケースや境界値をテストするケース',
      [AspectCategory.ErrorHandling]: 'エラーハンドリングと例外処理のテスト',
      [AspectCategory.Performance]: 'パフォーマンスと速度に関するテスト',
      [AspectCategory.Security]: 'セキュリティ上の懸念事項をテストするケース',
      [AspectCategory.Integration]: '統合テストや外部システムとの連携テスト',
      [AspectCategory.UnitBehavior]: 'ユニット単位での振る舞いを確認するテスト',
      [AspectCategory.DataValidation]: 'データのバリデーションと整合性のテスト',
      [AspectCategory.StateManagement]: '状態管理と状態遷移のテスト',
      [AspectCategory.Accessibility]: 'アクセシビリティに関するテスト',
      [AspectCategory.Custom]: 'カスタム観点のテスト',
    };

    return descriptions[category] || 'その他のテスト観点';
  }

  /**
   * 観点の優先度を取得
   */
  private getAspectPriority(category: AspectCategory): 'high' | 'medium' | 'low' {
    const highPriority = [
      AspectCategory.ErrorHandling,
      AspectCategory.Security,
      AspectCategory.DataValidation,
    ];

    const mediumPriority = [
      AspectCategory.Functionality,
      AspectCategory.EdgeCase,
      AspectCategory.Integration,
    ];

    if (highPriority.includes(category)) {
      return 'high';
    } else if (mediumPriority.includes(category)) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}
