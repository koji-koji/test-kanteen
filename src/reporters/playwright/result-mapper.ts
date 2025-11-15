/**
 * Playwright Result Mapper - Maps Playwright test results to TestResultData
 */

import type { TestCase, TestResult as PlaywrightTestResult } from '@playwright/test/reporter';
import type { TestResultData, TestStatus } from '../../types';

/**
 * Maps Playwright test results to Test Kanteen format
 */
export class PlaywrightResultMapper {
  /**
   * Map a Playwright TestCase to TestResultData
   */
  mapTestResult(testCase: TestCase, result: PlaywrightTestResult): TestResultData {
    const suitePath = this.getSuitePath(testCase);
    const status = this.mapStatus(result.status);

    return {
      filePath: testCase.location.file,
      suitePath: suitePath,
      testName: testCase.title,
      status: status,
      duration: result.duration,
      error: this.mapError(result),
      location: {
        line: testCase.location.line,
        column: testCase.location.column,
      },
    };
  }

  /**
   * Get suite path from test case hierarchy
   */
  private getSuitePath(testCase: TestCase): string[] {
    const path: string[] = [];

    // Build suite path by traversing parent hierarchy
    const buildPath = (suite: typeof testCase.parent): void => {
      if (!suite) return;

      // Recurse first to build from root
      if (suite.parent) {
        buildPath(suite.parent);
      }

      // Add title if it exists
      if (suite.title) {
        path.push(suite.title);
      }
    };

    buildPath(testCase.parent);
    return path;
  }

  /**
   * Map Playwright status to TestStatus
   */
  private mapStatus(status: string): TestStatus {
    const statusMap: Record<string, TestStatus> = {
      passed: 'passed',
      failed: 'failed',
      timedOut: 'failed',
      skipped: 'skipped',
      interrupted: 'skipped',
    };

    return statusMap[status] || 'failed';
  }

  /**
   * Map Playwright error information
   */
  private mapError(result: PlaywrightTestResult) {
    const error = result.errors?.[0];

    if (error) {
      // Extract error message
      const message = error.message || String(error);
      const stack = error.stack;

      // Try to extract matcher name from error message
      const matcherMatch = message.match(/expect\(.*?\)\.(\w+)/);
      const matcherName = matcherMatch ? matcherMatch[1] : undefined;

      // Try to extract expected/actual values from Playwright error format
      const expectedMatch = message.match(/Expected: (.*?)$/m);
      const receivedMatch = message.match(/Received: (.*?)$/m);

      return {
        message,
        stack,
        expected: expectedMatch ? expectedMatch[1] : undefined,
        actual: receivedMatch ? receivedMatch[1] : undefined,
        matcherName,
      };
    }

    return undefined;
  }
}
