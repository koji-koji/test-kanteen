/**
 * Integration tests for compare functionality
 */

import { TestMatcher } from '../../src/utils/test-matcher';
import type { TestCatalog, RuntimeCatalog } from '../../src/types';

describe('Compare Functionality Integration', () => {
  it('should compare AST and Runtime catalogs successfully', () => {
    // Create AST catalog with 3 tests
    const astCatalog: TestCatalog = {
      metadata: {
        version: '0.5.0',
        generatedAt: '2025-01-01T00:00:00Z',
        sourceFiles: ['tests/example.test.ts'],
        framework: 'jest',
        toolVersion: '0.5.0',
      },
      testSuites: [
        {
          id: 'suite-1',
          name: 'Math',
          filePath: 'tests/example.test.ts',
          tests: [
            {
              id: 'test-1',
              name: 'should add numbers',
              location: {
                file: 'tests/example.test.ts',
                line: 10,
                column: 3,
              },
              assertions: [],
              dependencies: [],
              tags: [],
            },
            {
              id: 'test-2',
              name: 'should subtract numbers',
              location: {
                file: 'tests/example.test.ts',
                line: 15,
                column: 3,
              },
              assertions: [],
              dependencies: [],
              tags: [],
            },
            {
              id: 'test-3',
              name: 'should multiply numbers',
              location: {
                file: 'tests/example.test.ts',
                line: 20,
                column: 3,
              },
              assertions: [],
              dependencies: [],
              tags: [],
            },
          ],
        },
      ],
      coverage: {
        totalTests: 3,
        totalSuites: 1,
      },
    };

    // Create Runtime catalog - only 2 tests executed, 1 dynamically generated
    const runtimeCatalog: RuntimeCatalog = {
      metadata: {
        version: '0.5.0',
        generatedAt: '2025-01-01T00:00:01Z',
        executionDate: '2025-01-01T00:00:00Z',
        totalDuration: 150,
        sourceFiles: ['tests/example.test.ts'],
        framework: 'jest',
        toolVersion: '0.5.0',
      },
      testSuites: [
        {
          id: 'suite-1',
          name: 'Math',
          filePath: 'tests/example.test.ts',
          tests: [
            {
              id: 'test-1',
              name: 'should add numbers',
              location: {
                file: 'tests/example.test.ts',
                line: 10,
                column: 3,
              },
              runtime: {
                status: 'passed',
                duration: 50,
              },
            },
            {
              id: 'test-2',
              name: 'should subtract numbers',
              location: {
                file: 'tests/example.test.ts',
                line: 15,
                column: 3,
              },
              runtime: {
                status: 'failed',
                duration: 30,
                error: {
                  message: 'Expected 5 to equal 6',
                  matcherName: 'toBe',
                  expected: '6',
                  actual: '5',
                },
              },
            },
            {
              id: 'test-4',
              name: 'should divide numbers (generated)',
              location: {
                file: 'tests/example.test.ts',
                line: 25,
                column: 3,
              },
              runtime: {
                status: 'passed',
                duration: 70,
              },
            },
          ],
          runtime: {
            duration: 150,
          },
        },
      ],
      coverage: {
        totalTests: 3,
        totalSuites: 1,
      },
      executionSummary: {
        totalTests: 3,
        passed: 2,
        failed: 1,
        skipped: 0,
        pending: 0,
        todo: 0,
        totalDuration: 150,
        startTime: new Date('2025-01-01T00:00:00Z'),
        endTime: new Date('2025-01-01T00:00:02Z'),
      },
    };

    // Compare catalogs
    const matcher = new TestMatcher();
    const result = matcher.compare(astCatalog, runtimeCatalog);

    // Verify basic statistics
    expect(result.statistics.totalAstTests).toBe(3);
    expect(result.statistics.totalRuntimeTests).toBe(3);

    // Should have some matched tests
    expect(result.statistics.perfectMatches).toBeGreaterThanOrEqual(1);

    // Verify that comparison contains all expected data
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.statistics).toHaveProperty('totalAstTests');
    expect(result.statistics).toHaveProperty('totalRuntimeTests');
    expect(result.statistics).toHaveProperty('perfectMatches');

    // Find specific matched tests
    const addTest = result.matches.find((m) => m.astTest?.name === 'should add numbers');
    const subtractTest = result.matches.find((m) => m.astTest?.name === 'should subtract numbers');

    // Verify add test was matched
    expect(addTest).toBeDefined();
    if (addTest?.runtimeTest) {
      expect(addTest.runtimeTest.runtime.status).toBe('passed');
    }

    // Verify subtract test was matched and has error details
    expect(subtractTest).toBeDefined();
    if (subtractTest?.runtimeTest) {
      expect(subtractTest.runtimeTest.runtime.status).toBe('failed');
      expect(subtractTest.runtimeTest.runtime.error?.message).toBe('Expected 5 to equal 6');
    }
  });

  it('should handle empty catalogs', () => {
    const emptyAstCatalog: TestCatalog = {
      metadata: {
        version: '0.5.0',
        generatedAt: '2025-01-01T00:00:00Z',
        sourceFiles: [],
        framework: 'jest',
        toolVersion: '0.5.0',
      },
      testSuites: [],
      coverage: {
        totalTests: 0,
        totalSuites: 0,
      },
    };

    const emptyRuntimeCatalog: RuntimeCatalog = {
      metadata: {
        version: '0.5.0',
        generatedAt: '2025-01-01T00:00:00Z',
        executionDate: '2025-01-01T00:00:00Z',
        totalDuration: 0,
        sourceFiles: [],
        framework: 'jest',
        toolVersion: '0.5.0',
      },
      testSuites: [],
      coverage: {
        totalTests: 0,
        totalSuites: 0,
      },
      executionSummary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        pending: 0,
        todo: 0,
        totalDuration: 0,
        startTime: new Date('2025-01-01T00:00:00Z'),
        endTime: new Date('2025-01-01T00:00:00Z'),
      },
    };

    const matcher = new TestMatcher();
    const result = matcher.compare(emptyAstCatalog, emptyRuntimeCatalog);

    expect(result.statistics.totalAstTests).toBe(0);
    expect(result.statistics.totalRuntimeTests).toBe(0);
    expect(result.statistics.perfectMatches).toBe(0);
    expect(result.astOnly).toHaveLength(0);
    expect(result.runtimeOnly).toHaveLength(0);
  });

  it('should handle all tests executed scenario', () => {
    const astCatalog: TestCatalog = {
      metadata: {
        version: '0.5.0',
        generatedAt: '2025-01-01T00:00:00Z',
        sourceFiles: ['tests/example.test.ts'],
        framework: 'jest',
        toolVersion: '0.5.0',
      },
      testSuites: [
        {
          id: 'suite-1',
          name: 'Math',
          filePath: 'tests/example.test.ts',
          tests: [
            {
              id: 'test-1',
              name: 'should add numbers',
              location: {
                file: 'tests/example.test.ts',
                line: 10,
                column: 3,
              },
              assertions: [],
              dependencies: [],
              tags: [],
            },
          ],
        },
      ],
      coverage: {
        totalTests: 1,
        totalSuites: 1,
      },
    };

    const runtimeCatalog: RuntimeCatalog = {
      metadata: {
        version: '0.5.0',
        generatedAt: '2025-01-01T00:00:01Z',
        executionDate: '2025-01-01T00:00:00Z',
        totalDuration: 50,
        sourceFiles: ['tests/example.test.ts'],
        framework: 'jest',
        toolVersion: '0.5.0',
      },
      testSuites: [
        {
          id: 'suite-1',
          name: 'Math',
          filePath: 'tests/example.test.ts',
          tests: [
            {
              id: 'test-1',
              name: 'should add numbers',
              location: {
                file: 'tests/example.test.ts',
                line: 10,
                column: 3,
              },
              runtime: {
                status: 'passed',
                duration: 50,
              },
            },
          ],
          runtime: {
            duration: 50,
          },
        },
      ],
      coverage: {
        totalTests: 1,
        totalSuites: 1,
      },
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

    const matcher = new TestMatcher();
    const result = matcher.compare(astCatalog, runtimeCatalog);

    expect(result.statistics.totalAstTests).toBe(1);
    expect(result.statistics.totalRuntimeTests).toBe(1);
    expect(result.statistics.perfectMatches).toBe(1);
    expect(result.statistics.unmatchedAst).toBe(0); // All tests executed
    expect(result.statistics.unmatchedRuntime).toBe(0); // No dynamic tests
  });
});
