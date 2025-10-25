import { AspectCategory } from '../types';

/**
 * テスト観点を分類するクラス
 */
export class AspectClassifier {
  private keywordMap: Map<RegExp, AspectCategory> = new Map();

  constructor() {
    this.initializeKeywordMap();
  }

  /**
   * キーワードマップの初期化
   */
  private initializeKeywordMap() {
    // エラーハンドリング
    this.keywordMap.set(/error|exception|throw|fail|invalid/i, AspectCategory.ErrorHandling);

    // エッジケース
    this.keywordMap.set(
      /edge|boundary|empty|null|undefined|zero|max|min|limit/i,
      AspectCategory.EdgeCase
    );

    // パフォーマンス
    this.keywordMap.set(
      /performance|speed|fast|slow|timeout|efficient|large|scale/i,
      AspectCategory.Performance
    );

    // セキュリティ
    this.keywordMap.set(
      /security|xss|injection|sql|csrf|auth|permission|sanitize|escape/i,
      AspectCategory.Security
    );

    // 統合テスト
    this.keywordMap.set(/integration|e2e|end-to-end|api|database|external/i, AspectCategory.Integration);

    // データバリデーション
    this.keywordMap.set(
      /valid|invalid|validation|format|pattern|required|optional/i,
      AspectCategory.DataValidation
    );

    // 状態管理
    this.keywordMap.set(/state|session|cache|store|persist|sync/i, AspectCategory.StateManagement);
  }

  /**
   * テスト名から観点を分類
   */
  classifyFromTestName(testName: string): AspectCategory[] {
    const aspects: AspectCategory[] = [];

    for (const [pattern, category] of this.keywordMap.entries()) {
      if (pattern.test(testName)) {
        aspects.push(category);
      }
    }

    // デフォルトは機能テスト
    if (aspects.length === 0) {
      aspects.push(AspectCategory.Functionality);
    }

    return aspects;
  }

  /**
   * アサーションの種類から観点を推論
   */
  classifyFromAssertions(assertionTypes: string[]): AspectCategory[] {
    const aspects: Set<AspectCategory> = new Set();

    for (const type of assertionTypes) {
      if (type === 'error') {
        aspects.add(AspectCategory.ErrorHandling);
      } else if (type === 'comparison') {
        aspects.add(AspectCategory.EdgeCase);
      } else if (type === 'mock') {
        aspects.add(AspectCategory.Integration);
      }
    }

    return Array.from(aspects);
  }

  /**
   * コンテキスト情報から観点を分類
   */
  classifyFromContext(context: {
    testName: string;
    suiteName?: string;
    code?: string;
    assertions?: string[];
  }): AspectCategory[] {
    const aspects = new Set<AspectCategory>();

    // テスト名から分類
    const fromTestName = this.classifyFromTestName(context.testName);
    fromTestName.forEach((aspect) => aspects.add(aspect));

    // スイート名から分類
    if (context.suiteName) {
      const fromSuiteName = this.classifyFromTestName(context.suiteName);
      fromSuiteName.forEach((aspect) => aspects.add(aspect));
    }

    // アサーションから分類
    if (context.assertions) {
      const fromAssertions = this.classifyFromAssertions(context.assertions);
      fromAssertions.forEach((aspect) => aspects.add(aspect));
    }

    // コードから追加の観点を推論
    if (context.code) {
      if (/async|await|Promise/i.test(context.code)) {
        aspects.add(AspectCategory.Integration);
      }
      if (/mock|spy|stub/i.test(context.code)) {
        aspects.add(AspectCategory.UnitBehavior);
      }
    }

    return Array.from(aspects);
  }

  /**
   * 観点の優先度を決定
   */
  getPriority(category: AspectCategory): 'high' | 'medium' | 'low' {
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

  /**
   * カスタム観点ルールを追加
   */
  addCustomRule(pattern: RegExp, category: AspectCategory) {
    this.keywordMap.set(pattern, category);
  }
}
