/**
 * Vitest Result Mapper - Maps Vitest test results to TestResultData
 */

import type { Task } from 'vitest';
import type { TestResultData, TestStatus } from '../../types';

/**
 * Maps Vitest test results to Test Kanteen format
 */
export class VitestResultMapper {
  /**
   * Map a Vitest Task to TestResultData
   */
  mapTestResult(task: Task, filePath: string): TestResultData {
    const suitePath = this.getSuitePath(task);
    const state = task.result?.state || 'skip';

    return {
      filePath: filePath,
      suitePath: suitePath,
      testName: task.name,
      status: this.mapStatus(state),
      duration: task.result?.duration ?? 0,
      error: this.mapError(task),
      location: {
        line: task.location?.line,
        column: task.location?.column,
      },
    };
  }

  /**
   * Get suite path from task hierarchy
   */
  private getSuitePath(task: Task): string[] {
    const path: string[] = [];
    let current = task.suite;

    while (current) {
      // Skip file-level suite
      if (current.type === 'suite' && current.name) {
        path.unshift(current.name);
      }
      current = current.suite;
    }

    return path;
  }

  /**
   * Map Vitest state to TestStatus
   */
  private mapStatus(state: string): TestStatus {
    const statusMap: Record<string, TestStatus> = {
      pass: 'passed',
      fail: 'failed',
      skip: 'skipped',
      todo: 'todo',
      only: 'passed', // 'only' tests that pass
    };

    return statusMap[state] || 'failed';
  }

  /**
   * Map Vitest error information
   */
  private mapError(task: Task) {
    const error = task.result?.errors?.[0];

    if (error) {
      // Extract error message
      let message = '';
      if (typeof error === 'string') {
        message = error;
      } else if (error instanceof Error) {
        message = error.message;
      } else if ((error as any).message) {
        message = (error as any).message;
      }

      // Extract stack trace
      let stack: string | undefined;
      if (error instanceof Error && error.stack) {
        stack = error.stack;
      } else if ((error as any).stack) {
        stack = (error as any).stack;
      }

      // Try to extract matcher name from error message
      const matcherMatch = message.match(/expect\(.*?\)\.(.*?)\(/);
      const matcherName = matcherMatch ? matcherMatch[1] : undefined;

      // Try to extract expected/actual values
      const expectedMatch = message.match(/Expected: (.*?)$/m);
      const actualMatch = message.match(/Received: (.*?)$/m);

      return {
        message,
        stack,
        expected: expectedMatch ? expectedMatch[1] : undefined,
        actual: actualMatch ? actualMatch[1] : undefined,
        matcherName,
      };
    }

    return undefined;
  }
}
