/**
 * Integration tests for Playwright Reporter
 */

import KanteenPlaywrightReporter from '../../../src/reporters/playwright';
import type { TestCase, TestResult, Suite, FullConfig, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('KanteenPlaywrightReporter Integration', () => {
  const outputDir = path.join(__dirname, '../../tmp/playwright-reporter');

  beforeEach(async () => {
    // Clean output directory
    try {
      await fs.rm(outputDir, { recursive: true });
    } catch {
      // Directory doesn't exist
    }
    // Ensure directory exists
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up after tests
    try {
      await fs.rm(outputDir, { recursive: true });
    } catch {
      // Directory doesn't exist
    }
  });

  it('should capture test results and generate catalog', async () => {
    const reporter = new KanteenPlaywrightReporter({
      output: outputDir,
      format: ['json', 'markdown'],
      verbose: false,
    });

    const config: FullConfig = {
      projects: [{ name: 'chromium' }],
    } as any;

    const rootSuite: Suite = {
      title: '',
      parent: undefined,
    } as any;

    // Start run
    reporter.onBegin(config, rootSuite);

    // Create mock test cases
    const mathSuite: Suite = {
      title: 'Math',
      parent: rootSuite,
    } as any;

    const additionSuite: Suite = {
      title: 'Addition',
      parent: mathSuite,
    } as any;

    const testCase1: TestCase = {
      title: 'should add two numbers',
      parent: additionSuite,
      location: {
        file: '/path/to/math.test.ts',
        line: 10,
        column: 3,
      },
    } as any;

    const testResult1: TestResult = {
      status: 'passed',
      duration: 15,
      errors: [],
    } as any;

    const testCase2: TestCase = {
      title: 'should handle negative numbers',
      parent: additionSuite,
      location: {
        file: '/path/to/math.test.ts',
        line: 15,
        column: 3,
      },
    } as any;

    const testResult2: TestResult = {
      status: 'passed',
      duration: 8,
      errors: [],
    } as any;

    const divisionSuite: Suite = {
      title: 'Division',
      parent: mathSuite,
    } as any;

    const testCase3: TestCase = {
      title: 'should divide numbers',
      parent: divisionSuite,
      location: {
        file: '/path/to/math.test.ts',
        line: 25,
        column: 3,
      },
    } as any;

    const testResult3: TestResult = {
      status: 'failed',
      duration: 12,
      errors: [
        {
          message: 'expect(received).toBe(expected)\n\nExpected: 3\nReceived: 2',
          stack: 'Error: Expected 2 to equal 3\n    at Object.<anonymous>',
        },
      ],
    } as any;

    // Process test results
    reporter.onTestEnd(testCase1, testResult1);
    reporter.onTestEnd(testCase2, testResult2);
    reporter.onTestEnd(testCase3, testResult3);

    // Complete run
    const fullResult: FullResult = { status: 'failed' } as any;
    await reporter.onEnd(fullResult);

    // Verify JSON output
    const jsonPath = path.join(outputDir, 'runtime-catalog.json');
    const jsonExists = await fs
      .access(jsonPath)
      .then(() => true)
      .catch(() => false);
    expect(jsonExists).toBe(true);

    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    // Verify catalog structure
    expect(catalog.metadata.framework).toBe('playwright');
    expect(catalog.metadata.version).toBe('0.5.0');
    expect(catalog.executionSummary.totalTests).toBe(3);
    expect(catalog.executionSummary.passed).toBe(2);
    expect(catalog.executionSummary.failed).toBe(1);

    // Verify test suites
    expect(catalog.testSuites.length).toBeGreaterThan(0);

    // Find "Addition" and "Division" suites
    const suiteNames = catalog.testSuites.map((s: any) => s.name);
    expect(suiteNames).toContain('Addition');
    expect(suiteNames).toContain('Division');

    // Verify Markdown output
    const mdPath = path.join(outputDir, 'runtime-catalog.md');
    const mdExists = await fs
      .access(mdPath)
      .then(() => true)
      .catch(() => false);
    expect(mdExists).toBe(true);

    const mdContent = await fs.readFile(mdPath, 'utf-8');
    expect(mdContent).toContain('# Runtime Test Catalog (Playwright)');
    expect(mdContent).toContain('✅');
    expect(mdContent).toContain('❌');
  });

  it('should handle multiple test files', async () => {
    const reporter = new KanteenPlaywrightReporter({
      output: outputDir,
      format: ['json'],
      verbose: false,
    });

    const config: FullConfig = { projects: [{ name: 'chromium' }] } as any;
    const rootSuite: Suite = { title: '', parent: undefined } as any;

    reporter.onBegin(config, rootSuite);

    // First test file
    const mathSuite: Suite = {
      title: 'Math',
      parent: rootSuite,
    } as any;

    const testCase1: TestCase = {
      title: 'test 1',
      parent: mathSuite,
      location: {
        file: '/path/to/math.test.ts',
        line: 5,
        column: 3,
      },
    } as any;

    const testResult1: TestResult = {
      status: 'passed',
      duration: 10,
      errors: [],
    } as any;

    // Second test file
    const stringSuite: Suite = {
      title: 'String',
      parent: rootSuite,
    } as any;

    const testCase2: TestCase = {
      title: 'test 2',
      parent: stringSuite,
      location: {
        file: '/path/to/string.test.ts',
        line: 7,
        column: 3,
      },
    } as any;

    const testResult2: TestResult = {
      status: 'passed',
      duration: 8,
      errors: [],
    } as any;

    reporter.onTestEnd(testCase1, testResult1);
    reporter.onTestEnd(testCase2, testResult2);

    await reporter.onEnd({ status: 'passed' } as any);

    const jsonPath = path.join(outputDir, 'runtime-catalog.json');
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    expect(catalog.executionSummary.totalTests).toBe(2);
    expect(catalog.testSuites).toHaveLength(2);
  });

  it('should capture error details', async () => {
    const reporter = new KanteenPlaywrightReporter({
      output: outputDir,
      format: ['json'],
      verbose: false,
    });

    const config: FullConfig = { projects: [{ name: 'chromium' }] } as any;
    const rootSuite: Suite = { title: '', parent: undefined } as any;

    reporter.onBegin(config, rootSuite);

    const failingSuite: Suite = {
      title: 'FailingTest',
      parent: rootSuite,
    } as any;

    const testCase: TestCase = {
      title: 'should fail',
      parent: failingSuite,
      location: {
        file: '/path/to/failing.test.ts',
        line: 10,
        column: 3,
      },
    } as any;

    const testResult: TestResult = {
      status: 'failed',
      duration: 5,
      errors: [
        {
          message: 'expect(received).toBe(expected)\n\nExpected: 5\nReceived: 3',
          stack: 'Error: ...',
        },
      ],
    } as any;

    reporter.onTestEnd(testCase, testResult);
    await reporter.onEnd({ status: 'failed' } as any);

    const jsonPath = path.join(outputDir, 'runtime-catalog.json');
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    const test = catalog.testSuites[0].tests[0];
    expect(test.runtime.status).toBe('failed');
    expect(test.runtime.error).toBeDefined();
    expect(test.runtime.error.message).toContain('Expected: 5');
    expect(test.runtime.error.message).toContain('Received: 3');
    expect(test.runtime.error.matcherName).toBe('toBe');
  });

  it('should handle tests without suite', async () => {
    const reporter = new KanteenPlaywrightReporter({
      output: outputDir,
      format: ['json'],
      verbose: false,
    });

    const config: FullConfig = { projects: [{ name: 'chromium' }] } as any;
    const rootSuite: Suite = { title: '', parent: undefined } as any;

    reporter.onBegin(config, rootSuite);

    const testCase: TestCase = {
      title: 'standalone test',
      parent: rootSuite,
      location: {
        file: '/path/to/simple.test.ts',
        line: 1,
        column: 1,
      },
    } as any;

    const testResult: TestResult = {
      status: 'passed',
      duration: 3,
      errors: [],
    } as any;

    reporter.onTestEnd(testCase, testResult);
    await reporter.onEnd({ status: 'passed' } as any);

    const jsonPath = path.join(outputDir, 'runtime-catalog.json');
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    expect(catalog.executionSummary.totalTests).toBe(1);
    expect(catalog.testSuites).toHaveLength(1);
  });

  it('should handle different test statuses', async () => {
    const reporter = new KanteenPlaywrightReporter({
      output: outputDir,
      format: ['json'],
      verbose: false,
    });

    const config: FullConfig = { projects: [{ name: 'chromium' }] } as any;
    const rootSuite: Suite = { title: '', parent: undefined } as any;

    reporter.onBegin(config, rootSuite);

    const statusSuite: Suite = {
      title: 'StatusTests',
      parent: rootSuite,
    } as any;

    // Passed test
    const passedTest: TestCase = {
      title: 'passed test',
      parent: statusSuite,
      location: { file: '/path/to/status.test.ts', line: 5, column: 3 },
    } as any;

    reporter.onTestEnd(passedTest, {
      status: 'passed',
      duration: 5,
      errors: [],
    } as any);

    // Skipped test
    const skippedTest: TestCase = {
      title: 'skipped test',
      parent: statusSuite,
      location: { file: '/path/to/status.test.ts', line: 10, column: 3 },
    } as any;

    reporter.onTestEnd(skippedTest, {
      status: 'skipped',
      duration: 0,
      errors: [],
    } as any);

    // TimedOut test (maps to failed)
    const timedOutTest: TestCase = {
      title: 'timed out test',
      parent: statusSuite,
      location: { file: '/path/to/status.test.ts', line: 15, column: 3 },
    } as any;

    reporter.onTestEnd(timedOutTest, {
      status: 'timedOut',
      duration: 30000,
      errors: [{ message: 'Test timeout of 30000ms exceeded.' }],
    } as any);

    await reporter.onEnd({ status: 'failed' } as any);

    const jsonPath = path.join(outputDir, 'runtime-catalog.json');
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    expect(catalog.executionSummary.totalTests).toBe(3);
    expect(catalog.executionSummary.passed).toBe(1);
    expect(catalog.executionSummary.skipped).toBe(1);
    expect(catalog.executionSummary.failed).toBe(1); // timedOut maps to failed
  });
});
