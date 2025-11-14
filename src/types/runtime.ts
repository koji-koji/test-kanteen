/**
 * Runtime type definitions for test execution information
 */

import type { TestSuite, TestCase, CatalogMetadata } from './index';

/**
 * Test execution status
 */
export type TestStatus = 'passed' | 'failed' | 'skipped' | 'pending' | 'todo';

/**
 * Runtime information for a single test
 */
export interface TestRuntime {
  /** Test execution duration in milliseconds */
  duration: number;
  /** Test execution status */
  status: TestStatus;
  /** Test start time */
  startTime?: Date;
  /** Test end time */
  endTime?: Date;
  /** Number of retries (for frameworks that support retries like Playwright) */
  retries?: number;
  /** Error information if the test failed */
  error?: TestError;
}

/**
 * Error information from test execution
 */
export interface TestError {
  /** Error message */
  message: string;
  /** Stack trace */
  stack?: string;
  /** Expected value (for assertion errors) */
  expected?: unknown;
  /** Actual value (for assertion errors) */
  actual?: unknown;
  /** Matcher name (e.g., 'toEqual', 'toBe') */
  matcherName?: string;
}

/**
 * Runtime information for a test suite
 */
export interface SuiteRuntime {
  /** Suite execution duration in milliseconds */
  duration: number;
  /** Suite start time */
  startTime?: Date;
  /** Suite end time */
  endTime?: Date;
}

/**
 * Test catalog with runtime information
 */
export interface RuntimeCatalog {
  metadata: RuntimeMetadata;
  testSuites: RuntimeTestSuite[];
  /** Coverage information */
  coverage: {
    totalTests: number;
    totalSuites: number;
  };
  /** Execution summary statistics */
  executionSummary: ExecutionSummary;
}

/**
 * Metadata with runtime execution information
 */
export interface RuntimeMetadata extends CatalogMetadata {
  /** Execution date and time */
  executionDate: string;
  /** Total execution duration in milliseconds */
  totalDuration: number;
  /** Whether tests were run in parallel */
  parallel?: boolean;
  /** Number of workers (for parallel execution) */
  workers?: number;
}

/**
 * Test suite with runtime information
 */
export interface RuntimeTestSuite extends Omit<TestSuite, 'tests' | 'nestedSuites'> {
  /** Runtime information for this suite */
  runtime?: SuiteRuntime;
  /** Test cases with runtime information */
  tests: RuntimeTestCase[];
  /** Nested suites with runtime information */
  nestedSuites?: RuntimeTestSuite[];
}

/**
 * Test case with runtime information
 */
export interface RuntimeTestCase extends Omit<TestCase, 'assertions' | 'dependencies' | 'tags'> {
  /** Runtime information (always present in runtime catalogs) */
  runtime: TestRuntime;
  /** Assertions (optional in runtime) */
  assertions?: TestCase['assertions'];
  /** Dependencies (optional in runtime) */
  dependencies?: TestCase['dependencies'];
  /** Tags (optional in runtime) */
  tags?: TestCase['tags'];
}

/**
 * Summary of test execution results
 */
export interface ExecutionSummary {
  /** Total number of tests executed */
  totalTests: number;
  /** Number of passed tests */
  passed: number;
  /** Number of failed tests */
  failed: number;
  /** Number of skipped tests */
  skipped: number;
  /** Number of pending tests */
  pending: number;
  /** Number of todo tests */
  todo: number;
  /** Total execution duration in milliseconds */
  totalDuration: number;
  /** Execution start time */
  startTime: Date;
  /** Execution end time */
  endTime: Date;
}

/**
 * Test result data from framework reporters
 */
export interface TestResultData {
  /** File path of the test */
  filePath: string;
  /** Suite hierarchy (ancestor titles) */
  suitePath: string[];
  /** Test name */
  testName: string;
  /** Test status */
  status: TestStatus;
  /** Test duration in milliseconds */
  duration: number;
  /** Test start time */
  startTime?: Date;
  /** Test end time */
  endTime?: Date;
  /** Number of retries */
  retries?: number;
  /** Error information */
  error?: TestError;
  /** Location information */
  location: {
    line?: number;
    column?: number;
  };
}
