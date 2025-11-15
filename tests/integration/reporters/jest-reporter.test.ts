/**
 * Integration tests for Jest Reporter
 */

import KanteenJestReporter from '../../../src/reporters/jest';
import type { TestResult, AggregatedResult } from '@jest/reporters';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('KanteenJestReporter Integration', () => {
  const outputDir = path.join(__dirname, '../../tmp/jest-reporter');

  beforeEach(async () => {
    // Clean output directory
    try {
      await fs.rm(outputDir, { recursive: true });
    } catch {
      // Directory doesn't exist
    }
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
    // Ensure directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const reporter = new KanteenJestReporter(
      {},
      {
        output: outputDir,
        format: ['json', 'markdown'],
        verbose: false,
      }
    );

    // Mock aggregated result
    const aggregatedResult: AggregatedResult = {} as any;

    // Start run
    reporter.onRunStart(aggregatedResult, {});

    // Create mock test result
    const testResult: TestResult = {
      testFilePath: '/path/to/math.test.ts',
      testResults: [
        {
          ancestorTitles: ['Math', 'Addition'],
          title: 'should add two numbers',
          status: 'passed',
          duration: 15,
          failureMessages: [],
          location: { line: 10, column: 3 },
        } as any,
        {
          ancestorTitles: ['Math', 'Addition'],
          title: 'should handle negative numbers',
          status: 'passed',
          duration: 8,
          failureMessages: [],
          location: { line: 15, column: 3 },
        } as any,
        {
          ancestorTitles: ['Math', 'Division'],
          title: 'should divide numbers',
          status: 'failed',
          duration: 12,
          failureMessages: ['Expected 2 to equal 3'],
          failureDetails: [{ message: 'Expected 2 to equal 3' }],
          location: { line: 25, column: 3 },
        } as any,
      ],
    } as any;

    // Process test result
    reporter.onTestResult({} as any, testResult, aggregatedResult);

    // Complete run
    await reporter.onRunComplete(new Set(), aggregatedResult);

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
    expect(catalog.metadata.framework).toBe('jest');
    expect(catalog.metadata.version).toBe('0.5.0');
    expect(catalog.executionSummary.totalTests).toBe(3);
    expect(catalog.executionSummary.passed).toBe(2);
    expect(catalog.executionSummary.failed).toBe(1);

    // Verify test suites (each suite path becomes a separate suite)
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
    expect(mdContent).toContain('# Runtime Test Catalog (Jest)');
    expect(mdContent).toContain('✅');
    expect(mdContent).toContain('❌');
  });

  it('should handle multiple test files', async () => {
    // Ensure directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const reporter = new KanteenJestReporter(
      {},
      {
        output: outputDir,
        format: ['json'],
        verbose: false,
      }
    );

    const aggregatedResult: AggregatedResult = {} as any;

    reporter.onRunStart(aggregatedResult, {});

    // First test file
    const testResult1: TestResult = {
      testFilePath: '/path/to/math.test.ts',
      testResults: [
        {
          ancestorTitles: ['Math'],
          title: 'test 1',
          status: 'passed',
          duration: 10,
          failureMessages: [],
          location: { line: 5, column: 3 },
        } as any,
      ],
    } as any;

    // Second test file
    const testResult2: TestResult = {
      testFilePath: '/path/to/string.test.ts',
      testResults: [
        {
          ancestorTitles: ['String'],
          title: 'test 2',
          status: 'passed',
          duration: 8,
          failureMessages: [],
          location: { line: 7, column: 3 },
        } as any,
      ],
    } as any;

    reporter.onTestResult({} as any, testResult1, aggregatedResult);
    reporter.onTestResult({} as any, testResult2, aggregatedResult);

    await reporter.onRunComplete(new Set(), aggregatedResult);

    const jsonPath = path.join(outputDir, 'runtime-catalog.json');
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    expect(catalog.executionSummary.totalTests).toBe(2);
    expect(catalog.testSuites).toHaveLength(2);
  });

  it('should capture error details', async () => {
    // Ensure directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const reporter = new KanteenJestReporter(
      {},
      {
        output: outputDir,
        format: ['json'],
        verbose: false,
      }
    );

    const aggregatedResult: AggregatedResult = {} as any;

    reporter.onRunStart(aggregatedResult, {});

    const testResult: TestResult = {
      testFilePath: '/path/to/failing.test.ts',
      testResults: [
        {
          ancestorTitles: ['FailingTest'],
          title: 'should fail',
          status: 'failed',
          duration: 5,
          failureMessages: [
            'expect(received).toBe(expected)\n\nExpected: 5\nReceived: 3',
          ],
          failureDetails: [
            {
              message: 'expect(received).toBe(expected)',
              stack: 'Error: ...',
            } as any,
          ],
          location: { line: 10, column: 3 },
        } as any,
      ],
    } as any;

    reporter.onTestResult({} as any, testResult, aggregatedResult);
    await reporter.onRunComplete(new Set(), aggregatedResult);

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
    // Ensure directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const reporter = new KanteenJestReporter(
      {},
      {
        output: outputDir,
        format: ['json'],
        verbose: false,
      }
    );

    const aggregatedResult: AggregatedResult = {} as any;

    reporter.onRunStart(aggregatedResult, {});

    const testResult: TestResult = {
      testFilePath: '/path/to/simple.test.ts',
      testResults: [
        {
          ancestorTitles: [], // No suite
          title: 'standalone test',
          status: 'passed',
          duration: 3,
          failureMessages: [],
          location: { line: 1, column: 1 },
        } as any,
      ],
    } as any;

    reporter.onTestResult({} as any, testResult, aggregatedResult);
    await reporter.onRunComplete(new Set(), aggregatedResult);

    const jsonPath = path.join(outputDir, 'runtime-catalog.json');
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    expect(catalog.executionSummary.totalTests).toBe(1);
    expect(catalog.testSuites).toHaveLength(1);
  });
});
