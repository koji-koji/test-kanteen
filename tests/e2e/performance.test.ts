/**
 * E2E Performance tests for large-scale project simulation:
 * Reduced to essential representative test case for stability
 *
 * Phase 1, Round 3: IMPROVEMENT_PLAN_ROUND3.md
 * - Reduced from 3 tests to 1 representative test
 * - Covers realistic large codebase scenario with multiple directories
 * - Performance benchmarks and detailed scenarios covered by unit tests
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

  it('should handle large codebase with multiple directories efficiently', async () => {
    // Arrange: Create a realistic large codebase structure
    // This test covers: many files, nested suites, and multiple directories
    const largeCodebaseDir = path.join(tempDir, 'large-codebase');
    await fs.mkdir(largeCodebaseDir, { recursive: true });

    // Create multiple directories with test files (realistic project structure)
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

    // Verify catalog content and structure
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    expect(catalog.coverage.totalTests).toBe(totalTests);
    expect(catalog.testSuites.length).toBe(directories.length * filesPerDirectory);

    // Verify nested structure is preserved
    const sampleSuite = catalog.testSuites[0];
    expect(sampleSuite.nestedSuites).toBeDefined();
    expect(sampleSuite.nestedSuites.length).toBe(2); // Unit tests & Integration tests

    // Calculate and verify performance metrics
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
