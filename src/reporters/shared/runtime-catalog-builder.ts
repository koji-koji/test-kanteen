/**
 * Runtime Catalog Builder - Builds test catalog from runtime execution data
 */

import type {
  RuntimeCatalog,
  RuntimeTestSuite,
  RuntimeTestCase,
  RuntimeMetadata,
  ExecutionSummary,
  TestResultData,
  SuiteRuntime,
} from '../../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Options for Runtime Catalog Builder
 */
export interface RuntimeCatalogBuilderOptions {
  /** Output directory */
  output?: string;
  /** Output formats */
  format?: string[];
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Builds a runtime test catalog from test execution results
 */
export class RuntimeCatalogBuilder {
  private tests: Map<string, TestResultData[]> = new Map();
  private startTime?: Date;
  private endTime?: Date;

  constructor(_options: RuntimeCatalogBuilderOptions = {}) {
    // Options reserved for future use
  }

  /**
   * Mark the start of test run
   */
  startRun(time: Date): void {
    this.startTime = time;
  }

  /**
   * Mark the end of test run
   */
  endRun(time: Date): void {
    this.endTime = time;
  }

  /**
   * Add a test result
   */
  addTestResult(result: TestResultData): void {
    const filePath = result.filePath;

    if (!this.tests.has(filePath)) {
      this.tests.set(filePath, []);
    }

    this.tests.get(filePath)!.push(result);
  }

  /**
   * Build the runtime catalog
   */
  build(): RuntimeCatalog {
    if (!this.startTime || !this.endTime) {
      throw new Error('Run times not set. Call startRun() and endRun() before build()');
    }

    const testSuites = this.buildSuites();
    const executionSummary = this.buildSummary();
    const metadata = this.buildMetadata(executionSummary);

    return {
      metadata,
      testSuites,
      executionSummary,
      coverage: {
        totalTests: executionSummary.totalTests,
        totalSuites: testSuites.length,
      },
    };
  }

  /**
   * Build metadata
   */
  private buildMetadata(summary: ExecutionSummary): RuntimeMetadata {
    return {
      version: '0.5.0',
      generatedAt: new Date().toISOString(),
      executionDate: this.startTime!.toISOString(),
      totalDuration: summary.totalDuration,
      sourceFiles: Array.from(this.tests.keys()),
      framework: 'runtime', // Will be set by specific reporters
      toolVersion: '0.5.0',
    };
  }

  /**
   * Build test suites from test results
   */
  private buildSuites(): RuntimeTestSuite[] {
    const suites: RuntimeTestSuite[] = [];

    for (const [filePath, results] of this.tests.entries()) {
      if (results.length === 0) continue;

      // Group by suite path
      const suiteMap = new Map<string, TestResultData[]>();

      for (const result of results) {
        const suitePath = result.suitePath.join(' › ');
        if (!suiteMap.has(suitePath)) {
          suiteMap.set(suitePath, []);
        }
        suiteMap.get(suitePath)!.push(result);
      }

      // Build suite hierarchy
      const fileSuites = this.buildSuiteHierarchy(filePath, suiteMap);
      suites.push(...fileSuites);
    }

    return suites;
  }

  /**
   * Build suite hierarchy from flat test results
   */
  private buildSuiteHierarchy(
    filePath: string,
    suiteMap: Map<string, TestResultData[]>
  ): RuntimeTestSuite[] {
    const rootSuites: RuntimeTestSuite[] = [];
    const suiteCache = new Map<string, RuntimeTestSuite>();

    // Sort suite paths by depth (root first)
    const sortedPaths = Array.from(suiteMap.keys()).sort((a, b) => {
      const depthA = a ? a.split(' › ').length : 0;
      const depthB = b ? b.split(' › ').length : 0;
      return depthA - depthB;
    });

    for (const suitePath of sortedPaths) {
      const results = suiteMap.get(suitePath)!;
      const parts = suitePath ? suitePath.split(' › ') : [];

      if (parts.length === 0) {
        // Tests without suite (shouldn't happen in well-formed tests)
        const suite = this.createSuite(filePath, 'Root', [], results);
        rootSuites.push(suite);
        continue;
      }

      const suiteName = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1).join(' › ');

      const suite = this.createSuite(filePath, suiteName, parts, results);
      suiteCache.set(suitePath, suite);

      if (parentPath === '') {
        // Root level suite
        rootSuites.push(suite);
      } else {
        // Nested suite
        const parentSuite = suiteCache.get(parentPath);
        if (parentSuite) {
          if (!parentSuite.nestedSuites) {
            parentSuite.nestedSuites = [];
          }
          parentSuite.nestedSuites.push(suite);
        } else {
          // Parent not found, add to root
          rootSuites.push(suite);
        }
      }
    }

    return rootSuites;
  }

  /**
   * Create a test suite
   */
  private createSuite(
    filePath: string,
    suiteName: string,
    _suitePath: string[],
    results: TestResultData[]
  ): RuntimeTestSuite {
    const tests: RuntimeTestCase[] = results.map((result) => this.createTestCase(result));

    // Calculate suite runtime
    const suiteRuntime = this.calculateSuiteRuntime(tests);

    return {
      id: uuidv4(),
      name: suiteName,
      filePath: filePath,
      tests,
      nestedSuites: [],
      runtime: suiteRuntime,
    };
  }

  /**
   * Create a test case
   */
  private createTestCase(result: TestResultData): RuntimeTestCase {
    return {
      id: uuidv4(),
      name: result.testName,
      location: {
        file: result.filePath,
        line: result.location.line ?? 0,
        column: result.location.column ?? 0,
      },
      runtime: {
        duration: result.duration,
        status: result.status,
        startTime: result.startTime,
        endTime: result.endTime,
        retries: result.retries,
        error: result.error,
      },
    };
  }

  /**
   * Calculate suite runtime from test results
   */
  private calculateSuiteRuntime(tests: RuntimeTestCase[]): SuiteRuntime | undefined {
    if (tests.length === 0) return undefined;

    const totalDuration = tests.reduce((sum, test) => sum + test.runtime.duration, 0);

    const startTimes = tests
      .map((t) => t.runtime.startTime)
      .filter((t): t is Date => t !== undefined);

    const endTimes = tests
      .map((t) => t.runtime.endTime)
      .filter((t): t is Date => t !== undefined);

    return {
      duration: totalDuration,
      startTime: startTimes.length > 0 ? new Date(Math.min(...startTimes.map((t) => t.getTime()))) : undefined,
      endTime: endTimes.length > 0 ? new Date(Math.max(...endTimes.map((t) => t.getTime()))) : undefined,
    };
  }

  /**
   * Build execution summary
   */
  private buildSummary(): ExecutionSummary {
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let pending = 0;
    let todo = 0;
    let totalDuration = 0;

    for (const results of this.tests.values()) {
      for (const result of results) {
        totalDuration += result.duration;

        switch (result.status) {
          case 'passed':
            passed++;
            break;
          case 'failed':
            failed++;
            break;
          case 'skipped':
            skipped++;
            break;
          case 'pending':
            pending++;
            break;
          case 'todo':
            todo++;
            break;
        }
      }
    }

    return {
      totalTests: passed + failed + skipped + pending + todo,
      passed,
      failed,
      skipped,
      pending,
      todo,
      totalDuration,
      startTime: this.startTime!,
      endTime: this.endTime!,
    };
  }
}
