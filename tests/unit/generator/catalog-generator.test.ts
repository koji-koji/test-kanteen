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

    it('should add totalTests field to each test suite', () => {
      // Arrange
      const testSuites = [createMockTestSuite()];

      // Act
      const catalog = generator.generate(testSuites);

      // Assert
      expect(catalog.testSuites[0].totalTests).toBe(2);
    });

    it('should calculate totalTests correctly for nested suites', () => {
      // Arrange
      const nestedSuite: TestSuite = {
        ...createMockTestSuite(),
        id: 'nested-suite',
        name: 'Nested Suite',
      };

      const parentSuite: TestSuite = {
        id: 'parent-suite',
        name: 'Parent Suite',
        filePath: '/test/parent.test.ts',
        tests: [
          {
            id: 'parent-test-1',
            name: 'should work in parent',
            assertions: [],
            dependencies: [],
            tags: [],
            location: { file: '/test/parent.test.ts', line: 5, column: 5 },
          },
        ],
        nestedSuites: [nestedSuite],
      };

      // Act
      const catalog = generator.generate([parentSuite]);

      // Assert
      expect(catalog.testSuites[0].totalTests).toBe(3); // 1 from parent + 2 from nested
      expect(catalog.testSuites[0].nestedSuites?.[0].totalTests).toBe(2); // 2 from nested only
    });

    it('should calculate totalTests for deeply nested suites', () => {
      // Arrange
      const deeplyNestedSuite: TestSuite = {
        id: 'deeply-nested',
        name: 'Deeply Nested',
        filePath: '/test/deep.test.ts',
        tests: [
          {
            id: 'deep-test',
            name: 'should work deeply',
            assertions: [],
            dependencies: [],
            tags: [],
            location: { file: '/test/deep.test.ts', line: 10, column: 5 },
          },
        ],
      };

      const nestedSuite: TestSuite = {
        id: 'nested-suite',
        name: 'Nested Suite',
        filePath: '/test/nested.test.ts',
        tests: [
          {
            id: 'nested-test',
            name: 'should work in nested',
            assertions: [],
            dependencies: [],
            tags: [],
            location: { file: '/test/nested.test.ts', line: 5, column: 5 },
          },
        ],
        nestedSuites: [deeplyNestedSuite],
      };

      const parentSuite: TestSuite = {
        id: 'parent-suite',
        name: 'Parent Suite',
        filePath: '/test/parent.test.ts',
        tests: [],
        nestedSuites: [nestedSuite],
      };

      // Act
      const catalog = generator.generate([parentSuite]);

      // Assert
      expect(catalog.testSuites[0].totalTests).toBe(2); // 0 + 1 + 1
      expect(catalog.testSuites[0].nestedSuites?.[0].totalTests).toBe(2); // 1 + 1
      expect(catalog.testSuites[0].nestedSuites?.[0].nestedSuites?.[0].totalTests).toBe(1); // 1 only
    });

    it('should handle suite with no tests but nested suites', () => {
      // Arrange
      const nestedSuite: TestSuite = {
        ...createMockTestSuite(),
        id: 'nested-suite',
        name: 'Nested Suite',
      };

      const parentSuite: TestSuite = {
        id: 'parent-suite',
        name: 'Parent Suite',
        filePath: '/test/parent.test.ts',
        tests: [], // No direct tests
        nestedSuites: [nestedSuite],
      };

      // Act
      const catalog = generator.generate([parentSuite]);

      // Assert
      expect(catalog.testSuites[0].tests.length).toBe(0);
      expect(catalog.testSuites[0].totalTests).toBe(2); // All from nested
    });

  });
});
