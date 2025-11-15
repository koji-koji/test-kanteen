import { TestMatcher } from '../../../src/utils/test-matcher';
import type {
  TestCatalog,
  RuntimeCatalog,
} from '../../../src/types';

describe('TestMatcher', () => {
  let matcher: TestMatcher;

  beforeEach(() => {
    matcher = new TestMatcher();
  });

  describe('compare', () => {
    it('should match identical tests perfectly', () => {
      const astCatalog: TestCatalog = {
        metadata: {
          generatedAt: '2025-01-01T00:00:00Z',
          version: '0.5.0',
          sourceFiles: ['test.ts'],
          framework: 'jest',
          toolVersion: '0.5.0',
        },
        testSuites: [
          {
            id: 'suite-1',
            name: 'Math',
            filePath: 'test.ts',
            tests: [
              {
                id: 'test-1',
                name: 'should add numbers',
                location: { file: 'test.ts', line: 10, column: 3 },
                assertions: [],
                dependencies: [],
                tags: [],
              },
            ],
          },
        ],
        coverage: { totalTests: 1, totalSuites: 1 },
      };

      const runtimeCatalog: RuntimeCatalog = {
        metadata: {
          generatedAt: '2025-01-01T00:00:00Z',
          version: '0.5.0',
          sourceFiles: ['test.ts'],
          framework: 'jest',
          toolVersion: '0.5.0',
          executionDate: '2025-01-01T00:00:00Z',
          totalDuration: 100,
        },
        testSuites: [
          {
            id: 'suite-1',
            name: 'Math',
            filePath: 'test.ts',
            tests: [
              {
                id: 'test-1',
                name: 'should add numbers',
                location: { file: 'test.ts', line: 10, column: 3 },
                runtime: {
                  duration: 50,
                  status: 'passed',
                },
              },
            ],
          },
        ],
        coverage: { totalTests: 1, totalSuites: 1 },
        executionSummary: {
          totalTests: 1,
          passed: 1,
          failed: 0,
          skipped: 0,
          pending: 0,
          todo: 0,
          totalDuration: 50,
          startTime: new Date('2025-01-01T00:00:00Z'),
          endTime: new Date('2025-01-01T00:00:01Z'),
        },
      };

      const result = matcher.compare(astCatalog, runtimeCatalog);

      expect(result.statistics.perfectMatches).toBe(1);
      expect(result.statistics.unmatchedAst).toBe(0);
      expect(result.statistics.unmatchedRuntime).toBe(0);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].matchType).toBe('perfect');
      expect(result.matches[0].confidence).toBeGreaterThanOrEqual(100);
    });

    it('should detect runtime-only tests (dynamically generated)', () => {
      const astCatalog: TestCatalog = {
        metadata: {
          generatedAt: '2025-01-01T00:00:00Z',
          version: '0.5.0',
          sourceFiles: ['test.ts'],
          framework: 'jest',
          toolVersion: '0.5.0',
        },
        testSuites: [
          {
            id: 'suite-1',
            name: 'Math',
            filePath: 'test.ts',
            tests: [
              {
                id: 'test-1',
                name: 'should add numbers',
                location: { file: 'test.ts', line: 10, column: 3 },
                assertions: [],
                dependencies: [],
                tags: [],
              },
            ],
          },
        ],
        coverage: { totalTests: 1, totalSuites: 1 },
      };

      const runtimeCatalog: RuntimeCatalog = {
        metadata: {
          generatedAt: '2025-01-01T00:00:00Z',
          version: '0.5.0',
          sourceFiles: ['test.ts'],
          framework: 'jest',
          toolVersion: '0.5.0',
          executionDate: '2025-01-01T00:00:00Z',
          totalDuration: 200,
        },
        testSuites: [
          {
            id: 'suite-1',
            name: 'Math',
            filePath: 'test.ts',
            tests: [
              {
                id: 'test-1',
                name: 'should add numbers',
                location: { file: 'test.ts', line: 10, column: 3 },
                runtime: { duration: 50, status: 'passed' },
              },
              {
                id: 'test-2',
                name: 'should add 1 + 2 = 3',
                location: { file: 'test.ts', line: 15, column: 5 },
                runtime: { duration: 25, status: 'passed' },
              },
              {
                id: 'test-3',
                name: 'should add 2 + 3 = 5',
                location: { file: 'test.ts', line: 15, column: 5 },
                runtime: { duration: 25, status: 'passed' },
              },
            ],
          },
        ],
        coverage: { totalTests: 3, totalSuites: 1 },
        executionSummary: {
          totalTests: 3,
          passed: 3,
          failed: 0,
          skipped: 0,
          pending: 0,
          todo: 0,
          totalDuration: 100,
          startTime: new Date('2025-01-01T00:00:00Z'),
          endTime: new Date('2025-01-01T00:00:01Z'),
        },
      };

      const result = matcher.compare(astCatalog, runtimeCatalog);

      expect(result.statistics.unmatchedRuntime).toBe(2);
      expect(result.runtimeOnly).toHaveLength(2);
      expect(result.runtimeOnly[0].name).toContain('should add 1 + 2 = 3');
      expect(result.runtimeOnly[1].name).toContain('should add 2 + 3 = 5');
    });

    it('should detect AST-only tests (not executed)', () => {
      const astCatalog: TestCatalog = {
        metadata: {
          generatedAt: '2025-01-01T00:00:00Z',
          version: '0.5.0',
          sourceFiles: ['test.ts'],
          framework: 'jest',
          toolVersion: '0.5.0',
        },
        testSuites: [
          {
            id: 'suite-1',
            name: 'Math',
            filePath: 'test.ts',
            tests: [
              {
                id: 'test-1',
                name: 'should add numbers',
                location: { file: 'test.ts', line: 10, column: 3 },
                assertions: [],
                dependencies: [],
                tags: [],
              },
              {
                id: 'test-2',
                name: 'should multiply numbers',
                location: { file: 'test.ts', line: 20, column: 3 },
                assertions: [],
                dependencies: [],
                tags: [],
                skip: true,
              },
            ],
          },
        ],
        coverage: { totalTests: 2, totalSuites: 1 },
      };

      const runtimeCatalog: RuntimeCatalog = {
        metadata: {
          generatedAt: '2025-01-01T00:00:00Z',
          version: '0.5.0',
          sourceFiles: ['test.ts'],
          framework: 'jest',
          toolVersion: '0.5.0',
          executionDate: '2025-01-01T00:00:00Z',
          totalDuration: 50,
        },
        testSuites: [
          {
            id: 'suite-1',
            name: 'Math',
            filePath: 'test.ts',
            tests: [
              {
                id: 'test-1',
                name: 'should add numbers',
                location: { file: 'test.ts', line: 10, column: 3 },
                runtime: { duration: 50, status: 'passed' },
              },
            ],
          },
        ],
        coverage: { totalTests: 1, totalSuites: 1 },
        executionSummary: {
          totalTests: 1,
          passed: 1,
          failed: 0,
          skipped: 0,
          pending: 0,
          todo: 0,
          totalDuration: 50,
          startTime: new Date('2025-01-01T00:00:00Z'),
          endTime: new Date('2025-01-01T00:00:01Z'),
        },
      };

      const result = matcher.compare(astCatalog, runtimeCatalog);

      expect(result.statistics.unmatchedAst).toBe(1);
      expect(result.astOnly).toHaveLength(1);
      expect(result.astOnly[0].name).toBe('should multiply numbers');
    });

    it('should handle file path normalization', () => {
      const astCatalog: TestCatalog = {
        metadata: {
          generatedAt: '2025-01-01T00:00:00Z',
          version: '0.5.0',
          sourceFiles: ['tests/test.ts'],
          framework: 'jest',
          toolVersion: '0.5.0',
        },
        testSuites: [
          {
            id: 'suite-1',
            name: 'Math',
            filePath: 'tests/test.ts',
            tests: [
              {
                id: 'test-1',
                name: 'should work',
                location: { file: 'tests/test.ts', line: 10, column: 3 },
                assertions: [],
                dependencies: [],
                tags: [],
              },
            ],
          },
        ],
        coverage: { totalTests: 1, totalSuites: 1 },
      };

      const runtimeCatalog: RuntimeCatalog = {
        metadata: {
          generatedAt: '2025-01-01T00:00:00Z',
          version: '0.5.0',
          sourceFiles: ['tests/test.ts'],
          framework: 'jest',
          toolVersion: '0.5.0',
          executionDate: '2025-01-01T00:00:00Z',
          totalDuration: 50,
        },
        testSuites: [
          {
            id: 'suite-1',
            name: 'Math',
            filePath: 'tests/test.ts',
            tests: [
              {
                id: 'test-1',
                name: 'should work',
                location: { file: 'tests/test.ts', line: 10, column: 3 },
                runtime: { duration: 50, status: 'passed' },
              },
            ],
          },
        ],
        coverage: { totalTests: 1, totalSuites: 1 },
        executionSummary: {
          totalTests: 1,
          passed: 1,
          failed: 0,
          skipped: 0,
          pending: 0,
          todo: 0,
          totalDuration: 50,
          startTime: new Date('2025-01-01T00:00:00Z'),
          endTime: new Date('2025-01-01T00:00:01Z'),
        },
      };

      const result = matcher.compare(astCatalog, runtimeCatalog);

      // Path normalization should allow matching
      expect(result.statistics.highConfidenceMatches + result.statistics.perfectMatches).toBeGreaterThan(0);
    });

    it('should calculate statistics correctly', () => {
      const astCatalog: TestCatalog = {
        metadata: {
          generatedAt: '2025-01-01T00:00:00Z',
          version: '0.5.0',
          sourceFiles: ['test.ts'],
          framework: 'jest',
          toolVersion: '0.5.0',
        },
        testSuites: [
          {
            id: 'suite-1',
            name: 'Math',
            filePath: 'test.ts',
            tests: [
              {
                id: 'test-1',
                name: 'test 1',
                location: { file: 'test.ts', line: 10, column: 3 },
                assertions: [],
                dependencies: [],
                tags: [],
              },
              {
                id: 'test-2',
                name: 'test 2',
                location: { file: 'test.ts', line: 15, column: 3 },
                assertions: [],
                dependencies: [],
                tags: [],
              },
            ],
          },
        ],
        coverage: { totalTests: 2, totalSuites: 1 },
      };

      const runtimeCatalog: RuntimeCatalog = {
        metadata: {
          generatedAt: '2025-01-01T00:00:00Z',
          version: '0.5.0',
          sourceFiles: ['test.ts'],
          framework: 'jest',
          toolVersion: '0.5.0',
          executionDate: '2025-01-01T00:00:00Z',
          totalDuration: 100,
        },
        testSuites: [
          {
            id: 'suite-1',
            name: 'Math',
            filePath: 'test.ts',
            tests: [
              {
                id: 'test-1',
                name: 'test 1',
                location: { file: 'test.ts', line: 10, column: 3 },
                runtime: { duration: 50, status: 'passed' },
              },
            ],
          },
        ],
        coverage: { totalTests: 1, totalSuites: 1 },
        executionSummary: {
          totalTests: 1,
          passed: 1,
          failed: 0,
          skipped: 0,
          pending: 0,
          todo: 0,
          totalDuration: 50,
          startTime: new Date('2025-01-01T00:00:00Z'),
          endTime: new Date('2025-01-01T00:00:01Z'),
        },
      };

      const result = matcher.compare(astCatalog, runtimeCatalog);

      expect(result.statistics.totalAstTests).toBe(2);
      expect(result.statistics.totalRuntimeTests).toBe(1);
      expect(result.statistics.unmatchedAst).toBe(1);
    });
  });

  describe('configuration', () => {
    it('should respect custom confidence thresholds', () => {
      const customMatcher = new TestMatcher({
        perfectThreshold: 95,
        highConfidenceThreshold: 80,
        mediumConfidenceThreshold: 60,
      });

      expect(customMatcher).toBeDefined();
    });

    it('should support case-sensitive matching', () => {
      const caseSensitiveMatcher = new TestMatcher({
        caseSensitive: true,
      });

      expect(caseSensitiveMatcher).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty catalogs', () => {
      const emptyCatalog: TestCatalog = {
        metadata: {
          generatedAt: '2025-01-01T00:00:00Z',
          version: '0.5.0',
          sourceFiles: [],
          framework: 'jest',
          toolVersion: '0.5.0',
        },
        testSuites: [],
        coverage: { totalTests: 0, totalSuites: 0 },
      };

      const emptyRuntimeCatalog: RuntimeCatalog = {
        metadata: {
          generatedAt: '2025-01-01T00:00:00Z',
          version: '0.5.0',
          sourceFiles: [],
          framework: 'jest',
          toolVersion: '0.5.0',
          executionDate: '2025-01-01T00:00:00Z',
          totalDuration: 0,
        },
        testSuites: [],
        coverage: { totalTests: 0, totalSuites: 0 },
        executionSummary: {
          totalTests: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          pending: 0,
          todo: 0,
          totalDuration: 0,
          startTime: new Date('2025-01-01T00:00:00Z'),
          endTime: new Date('2025-01-01T00:00:01Z'),
        },
      };

      const result = matcher.compare(emptyCatalog, emptyRuntimeCatalog);

      expect(result.matches).toHaveLength(0);
      expect(result.statistics.totalAstTests).toBe(0);
      expect(result.statistics.totalRuntimeTests).toBe(0);
    });

    it('should handle nested test suites', () => {
      const astCatalog: TestCatalog = {
        metadata: {
          generatedAt: '2025-01-01T00:00:00Z',
          version: '0.5.0',
          sourceFiles: ['test.ts'],
          framework: 'jest',
          toolVersion: '0.5.0',
        },
        testSuites: [
          {
            id: 'suite-1',
            name: 'Math',
            filePath: 'test.ts',
            tests: [],
            nestedSuites: [
              {
                id: 'suite-2',
                name: 'Addition',
                filePath: 'test.ts',
                tests: [
                  {
                    id: 'test-1',
                    name: 'should add',
                    location: { file: 'test.ts', line: 10, column: 3 },
                    assertions: [],
                    dependencies: [],
                    tags: [],
                  },
                ],
              },
            ],
          },
        ],
        coverage: { totalTests: 1, totalSuites: 2 },
      };

      const runtimeCatalog: RuntimeCatalog = {
        metadata: {
          generatedAt: '2025-01-01T00:00:00Z',
          version: '0.5.0',
          sourceFiles: ['test.ts'],
          framework: 'jest',
          toolVersion: '0.5.0',
          executionDate: '2025-01-01T00:00:00Z',
          totalDuration: 50,
        },
        testSuites: [
          {
            id: 'suite-1',
            name: 'Math',
            filePath: 'test.ts',
            tests: [],
            nestedSuites: [
              {
                id: 'suite-2',
                name: 'Addition',
                filePath: 'test.ts',
                tests: [
                  {
                    id: 'test-1',
                    name: 'should add',
                    location: { file: 'test.ts', line: 10, column: 3 },
                    runtime: { duration: 50, status: 'passed' },
                  },
                ],
              },
            ],
          },
        ],
        coverage: { totalTests: 1, totalSuites: 2 },
        executionSummary: {
          totalTests: 1,
          passed: 1,
          failed: 0,
          skipped: 0,
          pending: 0,
          todo: 0,
          totalDuration: 50,
          startTime: new Date('2025-01-01T00:00:00Z'),
          endTime: new Date('2025-01-01T00:00:01Z'),
        },
      };

      const result = matcher.compare(astCatalog, runtimeCatalog);

      expect(result.statistics.totalAstTests).toBe(1);
      expect(result.statistics.totalRuntimeTests).toBe(1);
    });
  });
});
