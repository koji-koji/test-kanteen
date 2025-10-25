import { AspectClassifier } from '../../../src/analyzer/aspect-classifier';
import { AspectCategory } from '../../../src/types';

describe('AspectClassifier', () => {
  let classifier: AspectClassifier;

  beforeEach(() => {
    classifier = new AspectClassifier();
  });

  describe('classifyFromTestName', () => {
    it('should classify error handling tests', () => {
      const aspects = classifier.classifyFromTestName('should throw error when invalid');

      expect(aspects).toContain(AspectCategory.ErrorHandling);
    });

    it('should classify edge case tests', () => {
      const aspects = classifier.classifyFromTestName('should handle empty array');

      expect(aspects).toContain(AspectCategory.EdgeCase);
    });

    it('should classify security tests', () => {
      const aspects = classifier.classifyFromTestName('should prevent SQL injection');

      expect(aspects).toContain(AspectCategory.Security);
    });

    it('should classify performance tests', () => {
      const aspects = classifier.classifyFromTestName('should process large dataset efficiently');

      expect(aspects).toContain(AspectCategory.Performance);
    });

    it('should classify validation tests', () => {
      const aspects = classifier.classifyFromTestName('should validate email format');

      expect(aspects).toContain(AspectCategory.DataValidation);
    });

    it('should default to functionality for generic tests', () => {
      const aspects = classifier.classifyFromTestName('should work correctly');

      expect(aspects).toContain(AspectCategory.Functionality);
    });

    it('should identify multiple aspects', () => {
      const aspects = classifier.classifyFromTestName(
        'should handle empty input and throw error'
      );

      expect(aspects.length).toBeGreaterThan(1);
      expect(aspects).toContain(AspectCategory.EdgeCase);
      expect(aspects).toContain(AspectCategory.ErrorHandling);
    });
  });

  describe('classifyFromAssertions', () => {
    it('should identify error handling from error assertions', () => {
      const aspects = classifier.classifyFromAssertions(['error']);

      expect(aspects).toContain(AspectCategory.ErrorHandling);
    });

    it('should identify edge cases from comparison assertions', () => {
      const aspects = classifier.classifyFromAssertions(['comparison']);

      expect(aspects).toContain(AspectCategory.EdgeCase);
    });

    it('should identify integration from mock assertions', () => {
      const aspects = classifier.classifyFromAssertions(['mock']);

      expect(aspects).toContain(AspectCategory.Integration);
    });
  });

  describe('classifyFromContext', () => {
    it('should combine test name and suite name', () => {
      const aspects = classifier.classifyFromContext({
        testName: 'should validate input',
        suiteName: 'Error Handling',
      });

      expect(aspects).toContain(AspectCategory.DataValidation);
      expect(aspects).toContain(AspectCategory.ErrorHandling);
    });

    it('should detect async integration tests from code', () => {
      const aspects = classifier.classifyFromContext({
        testName: 'should fetch data',
        code: 'await fetchData()',
      });

      expect(aspects).toContain(AspectCategory.Integration);
    });

    it('should detect unit behavior from mocks', () => {
      const aspects = classifier.classifyFromContext({
        testName: 'should call function',
        code: 'const mock = jest.fn()',
      });

      expect(aspects).toContain(AspectCategory.UnitBehavior);
    });
  });

  describe('getPriority', () => {
    it('should return high priority for critical aspects', () => {
      expect(classifier.getPriority(AspectCategory.ErrorHandling)).toBe('high');
      expect(classifier.getPriority(AspectCategory.Security)).toBe('high');
      expect(classifier.getPriority(AspectCategory.DataValidation)).toBe('high');
    });

    it('should return medium priority for functional aspects', () => {
      expect(classifier.getPriority(AspectCategory.Functionality)).toBe('medium');
      expect(classifier.getPriority(AspectCategory.EdgeCase)).toBe('medium');
    });

    it('should return low priority for other aspects', () => {
      expect(classifier.getPriority(AspectCategory.Performance)).toBe('low');
    });
  });

  describe('addCustomRule', () => {
    it('should add custom classification rule', () => {
      classifier.addCustomRule(/custom-pattern/i, AspectCategory.Custom);

      const aspects = classifier.classifyFromTestName('should handle custom-pattern');

      expect(aspects).toContain(AspectCategory.Custom);
    });
  });
});
