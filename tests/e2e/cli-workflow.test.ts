/**
 * E2E tests for CLI complete workflow:
 * Reduced to essential test cases for stability and maintainability
 *
 * Phase 1, Round 3: IMPROVEMENT_PLAN_ROUND3.md
 * - Reduced from 7 tests to 2 essential tests
 * - Focus on core workflow and multi-format support
 * - Detailed scenarios covered by unit and integration tests
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

describe('CLI E2E Workflow', () => {
  const tempDir = path.join(__dirname, '../tmp', `cli-e2e-${process.pid}-${Date.now()}`);
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
    // Clean up temp directories
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should execute full analyze workflow from CLI with nested test suites', async () => {
    // Arrange: Create comprehensive test fixture with nested structure
    const uniqueId = `comprehensive-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const testDir = path.join(tempDir, uniqueId);
    await fs.mkdir(testDir, { recursive: true });

    const testFixturePath = path.join(testDir, 'comprehensive.test.ts');
    const testFixtureContent = `
describe('Math Operations', () => {
  describe('Addition', () => {
    it('should add positive numbers', () => {
      expect(2 + 3).toBe(5);
    });

    it('should add negative numbers', () => {
      expect(-2 + -3).toBe(-5);
    });
  });
});

describe('String Operations', () => {
  it('should concatenate strings', () => {
    expect('hello' + ' world').toBe('hello world');
  });
});
`;
    await fs.writeFile(testFixturePath, testFixtureContent, 'utf-8');

    const outputDir = path.join(testDir, 'output');

    // Act: Execute CLI command with JSON format
    const result = execSync(
      `node "${cliPath}" analyze "${testFixturePath}" --output "${outputDir}" --format json`,
      {
        encoding: 'utf-8',
      }
    );

    // Assert: Verify CLI output and execution
    expect(result).toContain('Analyzing test files');
    expect(result).toContain('Analysis complete');
    expect(result).toContain('Total tests: 3');

    // Verify JSON file was created
    const jsonPath = path.join(outputDir, 'catalog.json');
    const jsonExists = await fs.access(jsonPath).then(() => true).catch(() => false);
    expect(jsonExists).toBe(true);

    // Verify JSON content structure
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);
    expect(catalog.coverage.totalTests).toBe(3);
    expect(catalog.metadata.framework).toBe('jest');
    expect(catalog.testSuites).toHaveLength(2);

    // Verify nested suite structure
    const mathSuite = catalog.testSuites.find((s: any) => s.name === 'Math Operations');
    expect(mathSuite.nestedSuites).toHaveLength(1);
    expect(mathSuite.nestedSuites[0].name).toBe('Addition');
    expect(mathSuite.nestedSuites[0].tests).toHaveLength(2);
  }, 30000);

  it('should handle multiple output formats and glob patterns', async () => {
    // Arrange: Create multiple test fixtures to test glob pattern support
    const uniqueId = `multi-format-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const subDir = path.join(tempDir, uniqueId);
    await fs.mkdir(subDir, { recursive: true });

    const test1 = path.join(subDir, 'test1.test.ts');
    const test2 = path.join(subDir, 'test2.test.ts');

    await fs.writeFile(
      test1,
      `
describe('Feature A', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
`,
      'utf-8'
    );

    await fs.writeFile(
      test2,
      `
describe('Feature B', () => {
  it('should also work correctly', () => {
    expect(true).toBe(true);
  });
});
`,
      'utf-8'
    );

    const outputDir = path.join(tempDir, 'multi-format-output');
    const pattern = path.join(subDir, '**/*.test.ts');

    // Act: Execute CLI with multiple formats (json, markdown) and glob pattern
    const result = execSync(
      `node "${cliPath}" analyze "${pattern}" --output "${outputDir}" --format json,markdown`,
      {
        encoding: 'utf-8',
      }
    );

    // Assert: Verify both test files were analyzed
    expect(result).toContain('Analysis complete');
    expect(result).toContain('Total tests: 2');

    // Verify both output formats were created
    const jsonPath = path.join(outputDir, 'catalog.json');
    const mdPath = path.join(outputDir, 'catalog.md');

    const jsonExists = await fs.access(jsonPath).then(() => true).catch(() => false);
    const mdExists = await fs.access(mdPath).then(() => true).catch(() => false);

    expect(jsonExists).toBe(true);
    expect(mdExists).toBe(true);

    // Verify JSON content
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);
    expect(catalog.coverage.totalTests).toBe(2);
    expect(catalog.testSuites).toHaveLength(2);

    const suiteNames = catalog.testSuites.map((s: any) => s.name);
    expect(suiteNames).toContain('Feature A');
    expect(suiteNames).toContain('Feature B');

    // Verify Markdown content
    const mdContent = await fs.readFile(mdPath, 'utf-8');
    expect(mdContent).toContain('# Test Catalog');
    expect(mdContent).toContain('Feature A');
    expect(mdContent).toContain('Feature B');
    expect(mdContent).toContain('**Total Tests**: 2'); // Markdown bold format
  }, 30000);
});
