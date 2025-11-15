/**
 * Jest Result Mapper - Maps Jest test results to TestResultData
 */

import type { TestResult } from '@jest/reporters';
import type { TestResultData, TestStatus } from '../../types';

/**
 * Jest AssertionResult type (extracted from TestResult)
 */
type AssertionResult = TestResult['testResults'][0];

/**
 * Maps Jest test results to Test Kanteen format
 */
export class JestResultMapper {
  /**
   * Map a Jest TestResult to an array of TestResultData
   */
  mapTestResult(testResult: TestResult): TestResultData[] {
    const results: TestResultData[] = [];

    for (const assertionResult of testResult.testResults) {
      const result = this.mapAssertionResult(
        assertionResult,
        testResult.testFilePath
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Map a single Jest AssertionResult to TestResultData
   */
  private mapAssertionResult(
    assertion: AssertionResult,
    filePath: string
  ): TestResultData {
    return {
      filePath: filePath,
      suitePath: assertion.ancestorTitles || [],
      testName: assertion.title,
      status: this.mapStatus(assertion.status),
      duration: assertion.duration ?? 0,
      error: this.mapError(assertion),
      location: {
        line: assertion.location?.line,
        column: assertion.location?.column,
      },
    };
  }

  /**
   * Map Jest status to TestStatus
   */
  private mapStatus(status: string): TestStatus {
    const statusMap: Record<string, TestStatus> = {
      passed: 'passed',
      failed: 'failed',
      skipped: 'skipped',
      pending: 'pending',
      todo: 'todo',
      disabled: 'skipped',
    };

    return statusMap[status] || 'failed';
  }

  /**
   * Map Jest error information
   */
  private mapError(assertion: AssertionResult) {
    if (assertion.failureMessages && assertion.failureMessages.length > 0) {
      // Extract error message from first failure message
      const failureMessage = assertion.failureMessages[0];

      // Try to extract matcher name from error message
      const matcherMatch = failureMessage.match(/expect\(.*?\)\.(.*?)\(/);
      const matcherName = matcherMatch ? matcherMatch[1] : undefined;

      // Try to extract expected/actual values
      const expectedMatch = failureMessage.match(/Expected: (.*?)$/m);
      const actualMatch = failureMessage.match(/Received: (.*?)$/m);

      return {
        message: assertion.failureMessages.join('\n'),
        stack: (assertion.failureDetails?.[0] as any)?.stack,
        expected: expectedMatch ? expectedMatch[1] : undefined,
        actual: actualMatch ? actualMatch[1] : undefined,
        matcherName,
      };
    }

    return undefined;
  }
}
