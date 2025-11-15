/**
 * E2E Performance tests for large-scale project simulation:
 * Tests the performance and scalability of test-kanteen with large codebases
 *
 * Phase 4-2: IMPROVEMENT_PLAN.md
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Performance with large projects', () => {
  const tempDir = path.join(__dirname, '../tmp', `large-project-${process.pid}-${Date.now()}`);
  const cliPath = path.join(__dirname, '../../dist/cli/index.js');

  beforeAll(async () => {
    // Clean and create temp directories
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch {
      // Directory doesn't exist
    }
    await fs.mkdir(tempDir, { recursive: true });

    // Ensure CLI is built
    try {
      await fs.access(cliPath);
    } catch {
      // Build the project if dist doesn't exist
      execSync('npm run build', {
        cwd: path.join(__dirname, '../../'),
        stdio: 'inherit',
      });
    }
  });

  afterAll(async () => {
    // Clean up temp directories after all tests
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should handle 100+ test files efficiently', async () => {
    // Arrange: Generate 100 test files with multiple test cases each
    const testFilesDir = path.join(tempDir, 'many-files');
    await fs.mkdir(testFilesDir, { recursive: true });

    const numberOfFiles = 100;
    const testsPerFile = 5;

    for (let i = 0; i < numberOfFiles; i++) {
      const testFile = path.join(testFilesDir, `test${i}.test.ts`);
      const testContent = `
describe('Test Suite ${i}', () => {
  ${Array.from({ length: testsPerFile }, (_, j) => `
  it('should pass test case ${j} in file ${i}', () => {
    expect(${j} + ${i}).toBe(${j + i});
  });`).join('\n')}
});
`;
      await fs.writeFile(testFile, testContent, 'utf-8');
    }

    const outputDir = path.join(testFilesDir, 'output');
    const pattern = path.join(testFilesDir, '**/*.test.ts');

    // Act: Execute analysis and measure time
    const startTime = Date.now();
    const result = execSync(
      `node "${cliPath}" analyze "${pattern}" --output "${outputDir}" --format json`,
      {
        encoding: 'utf-8',
      }
    );
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // seconds

    // Assert: Verify analysis completed within time limit (< 30 seconds)
    expect(duration).toBeLessThan(30);
    expect(result).toContain('Analysis complete');
    expect(result).toContain(`Total tests: ${numberOfFiles * testsPerFile}`);

    // Verify output was created
    const jsonPath = path.join(outputDir, 'catalog.json');
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    expect(catalog.coverage.totalTests).toBe(numberOfFiles * testsPerFile);
    expect(catalog.testSuites).toHaveLength(numberOfFiles);

    console.log(`Performance: Analyzed ${numberOfFiles} files with ${numberOfFiles * testsPerFile} tests in ${duration.toFixed(2)}s`);
  }, 60000); // 60 second timeout

  it('should handle deeply nested test suites', async () => {
    // Arrange: Create a test file with deeply nested describe blocks
    const deepNestDir = path.join(tempDir, 'deep-nest');
    await fs.mkdir(deepNestDir, { recursive: true });

    const testFile = path.join(deepNestDir, 'deep-nest.test.ts');
    const nestingDepth = 50;

    // Generate deeply nested structure
    let testContent = '';
    for (let i = 0; i < nestingDepth; i++) {
      testContent += `describe('Level ${i}', () => {\n`;
    }
    testContent += `  it('should handle deep nesting at level ${nestingDepth}', () => {\n`;
    testContent += `    expect(true).toBe(true);\n`;
    testContent += `  });\n`;
    for (let i = 0; i < nestingDepth; i++) {
      testContent += `});\n`;
    }

    await fs.writeFile(testFile, testContent, 'utf-8');

    const outputDir = path.join(deepNestDir, 'output');

    // Act: Execute analysis
    const startTime = Date.now();
    const result = execSync(
      `node "${cliPath}" analyze "${testFile}" --output "${outputDir}" --format json`,
      {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large output
      }
    );
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // seconds

    // Assert: Verify analysis completed successfully
    expect(result).toContain('Analysis complete');
    expect(result).toContain('Total tests: 1');

    // Verify output was created and structured correctly
    const jsonPath = path.join(outputDir, 'catalog.json');
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    expect(catalog.coverage.totalTests).toBe(1);

    // Verify deep nesting was parsed (should have at least one suite with nested suites)
    expect(catalog.testSuites.length).toBeGreaterThan(0);

    console.log(`Performance: Handled ${nestingDepth} levels of nesting in ${duration.toFixed(2)}s`);
  }, 60000); // 60 second timeout

  it('should generate catalog for large codebase within time limit', async () => {
    // Arrange: Create a realistic large codebase structure
    const largeCodebaseDir = path.join(tempDir, 'large-codebase');
    await fs.mkdir(largeCodebaseDir, { recursive: true });

    // Create multiple directories with test files
    const directories = ['auth', 'api', 'database', 'utils', 'components'];
    const filesPerDirectory = 20;
    const testsPerFile = 10;
    let totalTests = 0;

    for (const dir of directories) {
      const dirPath = path.join(largeCodebaseDir, dir);
      await fs.mkdir(dirPath, { recursive: true });

      for (let i = 0; i < filesPerDirectory; i++) {
        const testFile = path.join(dirPath, `${dir}-test${i}.test.ts`);
        const testContent = `
describe('${dir.toUpperCase()} Module - File ${i}', () => {
  describe('Unit tests', () => {
    ${Array.from({ length: testsPerFile / 2 }, (_, j) => `
    it('should pass unit test ${j}', () => {
      expect(true).toBe(true);
    });`).join('\n')}
  });

  describe('Integration tests', () => {
    ${Array.from({ length: testsPerFile / 2 }, (_, j) => `
    it('should pass integration test ${j}', () => {
      expect(true).toBe(true);
    });`).join('\n')}
  });
});
`;
        await fs.writeFile(testFile, testContent, 'utf-8');
        totalTests += testsPerFile;
      }
    }

    const outputDir = path.join(largeCodebaseDir, 'output');
    const pattern = path.join(largeCodebaseDir, '**/*.test.ts');

    // Act: Execute analysis and measure performance
    const startTime = Date.now();
    const result = execSync(
      `node "${cliPath}" analyze "${pattern}" --output "${outputDir}" --format json,markdown`,
      {
        encoding: 'utf-8',
      }
    );
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // seconds

    // Assert: Verify performance benchmarks
    expect(duration).toBeLessThan(30); // Should complete within 30 seconds
    expect(result).toContain('Analysis complete');
    expect(result).toContain(`Total tests: ${totalTests}`);

    // Verify all output formats were created
    const jsonPath = path.join(outputDir, 'catalog.json');
    const mdPath = path.join(outputDir, 'catalog.md');

    const jsonExists = await fs.access(jsonPath).then(() => true).catch(() => false);
    const mdExists = await fs.access(mdPath).then(() => true).catch(() => false);

    expect(jsonExists).toBe(true);
    expect(mdExists).toBe(true);

    // Verify catalog content
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    expect(catalog.coverage.totalTests).toBe(totalTests);
    expect(catalog.testSuites.length).toBeGreaterThan(0);

    // Calculate performance metrics
    const testsPerSecond = totalTests / duration;
    const filesAnalyzed = directories.length * filesPerDirectory;
    const filesPerSecond = filesAnalyzed / duration;

    console.log(`Performance Metrics:
  - Total files: ${filesAnalyzed}
  - Total tests: ${totalTests}
  - Duration: ${duration.toFixed(2)}s
  - Tests/second: ${testsPerSecond.toFixed(2)}
  - Files/second: ${filesPerSecond.toFixed(2)}`);

    // Performance benchmarks
    expect(testsPerSecond).toBeGreaterThan(10); // At least 10 tests per second
    expect(filesPerSecond).toBeGreaterThan(1); // At least 1 file per second
  }, 60000); // 60 second timeout
});
