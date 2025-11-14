import { CatalogGenerator } from '../../../src/generator/catalog-generator';
import type { TestSuite } from '../../../src/types';

describe('CatalogGenerator', () => {
  let generator: CatalogGenerator;

  beforeEach(() => {
    generator = new CatalogGenerator();
  });

  const createMockTestSuite = (): TestSuite => ({
    id: 'suite-1',
    name: 'Test Suite',
    filePath: '/test/suite.test.ts',
    tests: [
      {
        id: 'test-1',
        name: 'should work',
        assertions: [],
        dependencies: [],
        tags: [],
        location: { file: '/test/suite.test.ts', line: 10, column: 5 },
      },
      {
        id: 'test-2',
        name: 'should handle errors',
        assertions: [],
        dependencies: [],
        tags: [],
        location: { file: '/test/suite.test.ts', line: 20, column: 5 },
      },
    ],
  });

  describe('generate', () => {
    it('should generate catalog with metadata', () => {
      const testSuites = [createMockTestSuite()];
      const catalog = generator.generate(testSuites, {
        framework: 'jest',
        sourceFiles: ['/test/suite.test.ts'],
      });

      expect(catalog.metadata).toBeDefined();
      expect(catalog.metadata.framework).toBe('jest');
      expect(catalog.metadata.sourceFiles).toContain('/test/suite.test.ts');
      expect(catalog.metadata.generatedAt).toBeDefined();
    });


    it('should calculate coverage information', () => {
      const testSuites = [createMockTestSuite()];
      const catalog = generator.generate(testSuites);

      expect(catalog.coverage).toBeDefined();
      expect(catalog.coverage.totalTests).toBe(2);
      expect(catalog.coverage.totalSuites).toBe(1);
    });

    it('should handle nested test suites', () => {
      const nestedSuite: TestSuite = {
        ...createMockTestSuite(),
        id: 'nested-suite',
        name: 'Nested Suite',
      };

      const parentSuite: TestSuite = {
        ...createMockTestSuite(),
        id: 'parent-suite',
        nestedSuites: [nestedSuite],
      };

      const catalog = generator.generate([parentSuite]);

      expect(catalog.coverage.totalTests).toBe(4); // 2 from parent + 2 from nested
    });

  });
});
