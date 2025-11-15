/**
 * Integration tests for Vitest Reporter
 */

import KanteenVitestReporter from '../../../src/reporters/vitest';
import type { File, Task, Suite } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('KanteenVitestReporter Integration', () => {
  const outputDir = path.join(__dirname, '../../tmp/vitest-reporter');

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
    const reporter = new KanteenVitestReporter({
      output: outputDir,
      format: ['json', 'markdown'],
      verbose: false,
    });

    // Start run
    reporter.onInit();

    // Create mock test file with tasks
    const mockFile: File = {
      type: 'suite',
      id: '1',
      name: 'math.test.ts',
      mode: 'run',
      filepath: '/path/to/math.test.ts',
      tasks: [
        {
          type: 'suite',
          id: '2',
          name: 'Math',
          mode: 'run',
          suite: undefined as any,
          tasks: [
            {
              type: 'suite',
              id: '3',
              name: 'Addition',
              mode: 'run',
              suite: undefined as any,
              tasks: [
                {
                  type: 'test',
                  id: '4',
                  name: 'should add two numbers',
                  mode: 'run',
                  suite: undefined as any,
                  result: {
                    state: 'pass',
                    duration: 15,
                  },
                  location: { line: 10, column: 3 },
                } as Task,
                {
                  type: 'test',
                  id: '5',
                  name: 'should handle negative numbers',
                  mode: 'run',
                  suite: undefined as any,
                  result: {
                    state: 'pass',
                    duration: 8,
                  },
                  location: { line: 15, column: 3 },
                } as Task,
              ],
            } as Task,
            {
              type: 'suite',
              id: '6',
              name: 'Division',
              mode: 'run',
              suite: undefined as any,
              tasks: [
                {
                  type: 'test',
                  id: '7',
                  name: 'should divide numbers',
                  mode: 'run',
                  suite: undefined as any,
                  result: {
                    state: 'fail',
                    duration: 12,
                    errors: [
                      {
                        message: 'expect(received).toBe(expected)\n\nExpected: 3\nReceived: 2',
                        stack: 'Error: ...',
                      },
                    ],
                  },
                  location: { line: 25, column: 3 },
                } as Task,
              ],
            } as Task,
          ],
        } as Task,
      ],
    } as File;

    // Set up suite hierarchy
    const mathSuite = mockFile.tasks![0] as Suite;
    const additionSuite = mathSuite.tasks![0] as Suite;
    const divisionSuite = mathSuite.tasks![1] as Suite;

    mathSuite.suite = mockFile as any;
    additionSuite.suite = mathSuite;
    divisionSuite.suite = mathSuite;

    (additionSuite.tasks![0] as Task).suite = additionSuite;
    (additionSuite.tasks![1] as Task).suite = additionSuite;
    (divisionSuite.tasks![0] as Task).suite = divisionSuite;

    // Process test results
    reporter.onTaskUpdate([[mockFile.id, mockFile]]);

    // Complete run
    await reporter.onFinished();

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
    expect(catalog.metadata.framework).toBe('vitest');
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
    expect(mdContent).toContain('# Runtime Test Catalog (Vitest)');
    expect(mdContent).toContain('✅');
    expect(mdContent).toContain('❌');
  });

  it('should handle multiple test files', async () => {
    const reporter = new KanteenVitestReporter({
      output: outputDir,
      format: ['json'],
      verbose: false,
    });

    reporter.onInit();

    // First test file
    const mockFile1: File = {
      type: 'suite',
      id: '1',
      name: 'math.test.ts',
      mode: 'run',
      filepath: '/path/to/math.test.ts',
      tasks: [
        {
          type: 'suite',
          id: '2',
          name: 'Math',
          mode: 'run',
          suite: undefined as any,
          tasks: [
            {
              type: 'test',
              id: '3',
              name: 'test 1',
              mode: 'run',
              suite: undefined as any,
              result: {
                state: 'pass',
                duration: 10,
              },
              location: { line: 5, column: 3 },
            } as Task,
          ],
        } as Task,
      ],
    } as File;

    // Second test file
    const mockFile2: File = {
      type: 'suite',
      id: '4',
      name: 'string.test.ts',
      mode: 'run',
      filepath: '/path/to/string.test.ts',
      tasks: [
        {
          type: 'suite',
          id: '5',
          name: 'String',
          mode: 'run',
          suite: undefined as any,
          tasks: [
            {
              type: 'test',
              id: '6',
              name: 'test 2',
              mode: 'run',
              suite: undefined as any,
              result: {
                state: 'pass',
                duration: 8,
              },
              location: { line: 7, column: 3 },
            } as Task,
          ],
        } as Task,
      ],
    } as File;

    // Set up suite hierarchy
    const mathSuite = mockFile1.tasks![0] as Suite;
    mathSuite.suite = mockFile1 as any;
    (mathSuite.tasks![0] as Task).suite = mathSuite;

    const stringSuite = mockFile2.tasks![0] as Suite;
    stringSuite.suite = mockFile2 as any;
    (stringSuite.tasks![0] as Task).suite = stringSuite;

    reporter.onTaskUpdate([
      [mockFile1.id, mockFile1],
      [mockFile2.id, mockFile2],
    ]);

    await reporter.onFinished();

    const jsonPath = path.join(outputDir, 'runtime-catalog.json');
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    expect(catalog.executionSummary.totalTests).toBe(2);
    expect(catalog.testSuites).toHaveLength(2);
  });

  it('should capture error details', async () => {
    const reporter = new KanteenVitestReporter({
      output: outputDir,
      format: ['json'],
      verbose: false,
    });

    reporter.onInit();

    const mockFile: File = {
      type: 'suite',
      id: '1',
      name: 'failing.test.ts',
      mode: 'run',
      filepath: '/path/to/failing.test.ts',
      tasks: [
        {
          type: 'suite',
          id: '2',
          name: 'FailingTest',
          mode: 'run',
          suite: undefined as any,
          tasks: [
            {
              type: 'test',
              id: '3',
              name: 'should fail',
              mode: 'run',
              suite: undefined as any,
              result: {
                state: 'fail',
                duration: 5,
                errors: [
                  {
                    message:
                      'expect(received).toBe(expected)\n\nExpected: 5\nReceived: 3',
                    stack: 'Error: ...',
                  },
                ],
              },
              location: { line: 10, column: 3 },
            } as Task,
          ],
        } as Task,
      ],
    } as File;

    // Set up suite hierarchy
    const suite = mockFile.tasks![0] as Suite;
    suite.suite = mockFile as any;
    (suite.tasks![0] as Task).suite = suite;

    reporter.onTaskUpdate([[mockFile.id, mockFile]]);
    await reporter.onFinished();

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

  it('should handle tests without nested suite', async () => {
    const reporter = new KanteenVitestReporter({
      output: outputDir,
      format: ['json'],
      verbose: false,
    });

    reporter.onInit();

    const mockFile: File = {
      type: 'suite',
      id: '1',
      name: 'simple.test.ts',
      mode: 'run',
      filepath: '/path/to/simple.test.ts',
      tasks: [
        {
          type: 'test',
          id: '2',
          name: 'standalone test',
          mode: 'run',
          suite: undefined as any,
          result: {
            state: 'pass',
            duration: 3,
          },
          location: { line: 1, column: 1 },
        } as Task,
      ],
    } as File;

    // Set up suite hierarchy (test directly under file)
    (mockFile.tasks![0] as Task).suite = mockFile as any;

    reporter.onTaskUpdate([[mockFile.id, mockFile]]);
    await reporter.onFinished();

    const jsonPath = path.join(outputDir, 'runtime-catalog.json');
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    expect(catalog.executionSummary.totalTests).toBe(1);
    expect(catalog.testSuites).toHaveLength(1);
  });

  it('should handle different test statuses', async () => {
    const reporter = new KanteenVitestReporter({
      output: outputDir,
      format: ['json'],
      verbose: false,
    });

    reporter.onInit();

    const mockFile: File = {
      type: 'suite',
      id: '1',
      name: 'status.test.ts',
      mode: 'run',
      filepath: '/path/to/status.test.ts',
      tasks: [
        {
          type: 'suite',
          id: '2',
          name: 'StatusTests',
          mode: 'run',
          suite: undefined as any,
          tasks: [
            {
              type: 'test',
              id: '3',
              name: 'passed test',
              mode: 'run',
              suite: undefined as any,
              result: { state: 'pass', duration: 5 },
            } as Task,
            {
              type: 'test',
              id: '4',
              name: 'skipped test',
              mode: 'run',
              suite: undefined as any,
              result: { state: 'skip', duration: 0 },
            } as Task,
            {
              type: 'test',
              id: '5',
              name: 'todo test',
              mode: 'run',
              suite: undefined as any,
              result: { state: 'todo', duration: 0 },
            } as Task,
          ],
        } as Task,
      ],
    } as File;

    // Set up suite hierarchy
    const suite = mockFile.tasks![0] as Suite;
    suite.suite = mockFile as any;
    suite.tasks!.forEach((task: Task) => {
      task.suite = suite;
    });

    reporter.onTaskUpdate([[mockFile.id, mockFile]]);
    await reporter.onFinished();

    const jsonPath = path.join(outputDir, 'runtime-catalog.json');
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    expect(catalog.executionSummary.totalTests).toBe(3);
    expect(catalog.executionSummary.passed).toBe(1);
    expect(catalog.executionSummary.skipped).toBe(1);
    expect(catalog.executionSummary.todo).toBe(1);
  });
});
