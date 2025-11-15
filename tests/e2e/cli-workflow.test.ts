/**
 * E2E tests for CLI complete workflow:
 * Tests the actual CLI commands to ensure they work correctly in real-world scenarios
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

describe('CLI E2E Workflow', () => {
  const tempDir = path.join(__dirname, '../tmp/cli-e2e');
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

  it('should execute full analyze workflow from CLI', async () => {
    // Arrange: Create test fixture
    const testFixturePath = path.join(tempDir, 'example.test.ts');
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
`;
    await fs.writeFile(testFixturePath, testFixtureContent, 'utf-8');

    const outputDir = path.join(tempDir, 'analyze-output');

    // Act: Execute CLI command
    const result = execSync(
      `node "${cliPath}" analyze "${testFixturePath}" --output "${outputDir}" --format json,markdown`,
      {
        encoding: 'utf-8',
      }
    );

    // Assert: Verify CLI output
    expect(result).toContain('Analyzing test files');
    expect(result).toContain('Analysis complete');
    expect(result).toContain('Total test suites:');
    expect(result).toContain('Total tests: 2');

    // Verify JSON file was created
    const jsonPath = path.join(outputDir, 'catalog.json');
    const jsonExists = await fs.access(jsonPath).then(() => true).catch(() => false);
    expect(jsonExists).toBe(true);

    // Verify Markdown file was created
    const mdPath = path.join(outputDir, 'catalog.md');
    const mdExists = await fs.access(mdPath).then(() => true).catch(() => false);
    expect(mdExists).toBe(true);

    // Verify JSON content
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);
    expect(catalog.coverage.totalTests).toBe(2);
    expect(catalog.metadata.framework).toBe('jest');
  }, 30000);

  it('should handle multiple output formats', async () => {
    // Arrange: Create test fixture
    const testFile = path.join(tempDir, 'multi-format.test.ts');
    const testContent = `
describe('Test Suite', () => {
  it('should pass test case', () => {
    expect(true).toBe(true);
  });
});
`;
    await fs.writeFile(testFile, testContent, 'utf-8');

    const outputDir = path.join(tempDir, 'multi-format-output');

    // Act: Execute CLI with multiple formats (json and markdown)
    const result = execSync(
      `node "${cliPath}" analyze "${testFile}" --output "${outputDir}" --format json,markdown`,
      {
        encoding: 'utf-8',
      }
    );

    // Assert: Verify both formats were created
    expect(result).toContain('Analysis complete');

    const jsonPath = path.join(outputDir, 'catalog.json');
    const mdPath = path.join(outputDir, 'catalog.md');

    const jsonExists = await fs.access(jsonPath).then(() => true).catch(() => false);
    const mdExists = await fs.access(mdPath).then(() => true).catch(() => false);

    expect(jsonExists).toBe(true);
    expect(mdExists).toBe(true);

    // Verify content
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);
    expect(catalog.coverage.totalTests).toBe(1);

    const mdContent = await fs.readFile(mdPath, 'utf-8');
    expect(mdContent).toContain('# Test Catalog');
    expect(mdContent).toContain('Test Suite');
  }, 30000);

  it('should respect output directory flag', async () => {
    // Arrange: Create test fixture
    const testFile = path.join(tempDir, 'custom-dir.test.ts');
    const testContent = `
describe('Custom Dir Test', () => {
  it('should work', () => {
    expect(1).toBe(1);
  });
});
`;
    await fs.writeFile(testFile, testContent, 'utf-8');

    const customOutputDir = path.join(tempDir, 'custom-output');

    // Act: Execute CLI with custom output directory
    const result = execSync(
      `node "${cliPath}" analyze "${testFile}" --output "${customOutputDir}" --format json`,
      {
        encoding: 'utf-8',
      }
    );

    // Assert: Verify output was created in custom directory
    expect(result).toContain('Analysis complete');
    expect(result).toContain(`Output: ${customOutputDir}`);

    const jsonPath = path.join(customOutputDir, 'catalog.json');
    const jsonExists = await fs.access(jsonPath).then(() => true).catch(() => false);
    expect(jsonExists).toBe(true);

    // Verify content
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);
    expect(catalog.coverage.totalTests).toBe(1);
    expect(catalog.testSuites[0].name).toBe('Custom Dir Test');
  }, 30000);

  it('should handle glob patterns correctly', async () => {
    // Arrange: Create multiple test fixtures
    const subDir = path.join(tempDir, 'glob-tests');
    await fs.mkdir(subDir, { recursive: true });

    const test1 = path.join(subDir, 'test1.test.ts');
    const test2 = path.join(subDir, 'test2.test.ts');

    await fs.writeFile(
      test1,
      `
describe('Test Suite 1', () => {
  it('should pass test 1', () => {
    expect(1).toBe(1);
  });
});
`,
      'utf-8'
    );

    await fs.writeFile(
      test2,
      `
describe('Test Suite 2', () => {
  it('should pass test 2', () => {
    expect(2).toBe(2);
  });
});
`,
      'utf-8'
    );

    const outputDir = path.join(tempDir, 'glob-pattern-output');
    const pattern = path.join(subDir, '**/*.test.ts');

    // Act: Execute CLI with glob pattern
    const result = execSync(
      `node "${cliPath}" analyze "${pattern}" --output "${outputDir}" --format json`,
      {
        encoding: 'utf-8',
      }
    );

    // Assert: Verify both test files were analyzed
    expect(result).toContain('Analysis complete');
    expect(result).toContain('Total tests: 2');

    const jsonPath = path.join(outputDir, 'catalog.json');
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    expect(catalog.coverage.totalTests).toBe(2);
    expect(catalog.testSuites).toHaveLength(2);

    const suiteNames = catalog.testSuites.map((s: any) => s.name);
    expect(suiteNames).toContain('Test Suite 1');
    expect(suiteNames).toContain('Test Suite 2');
  }, 30000);

  it('should generate guide file on first run', async () => {
    // Arrange: Create test fixture in a unique subdirectory
    const uniqueDir = path.join(tempDir, 'guide-test-unique');
    await fs.mkdir(uniqueDir, { recursive: true });

    const testFile = path.join(uniqueDir, 'guide-test.test.ts');
    const testContent = `
describe('Guide Test', () => {
  it('should generate guide', () => {
    expect(true).toBe(true);
  });
});
`;
    await fs.writeFile(testFile, testContent, 'utf-8');

    const outputDir = path.join(uniqueDir, 'guide-test-output');

    // Act: Execute CLI for the first time
    const result = execSync(
      `node "${cliPath}" analyze "${testFile}" --output "${outputDir}" --format json,markdown`,
      {
        encoding: 'utf-8',
      }
    );

    // Assert: Verify guide file was created in parent's aaa_spec directory
    expect(result).toContain('Analysis complete');
    expect(result).toContain('Generated LLM guide');

    // The guide is created in the parent directory's aaa_spec folder
    const parentDir = path.dirname(path.resolve(outputDir));
    const guidePath = path.join(parentDir, 'aaa_spec', 'TEST_KANTEEN_GUIDE.md');
    const guideExists = await fs.access(guidePath).then(() => true).catch(() => false);
    expect(guideExists).toBe(true);

    // Verify guide content
    const guideContent = await fs.readFile(guidePath, 'utf-8');
    expect(guideContent).toContain('Test Kanteen');
    expect(guideContent).toContain('catalog.json');
    expect(guideContent).toContain('LLM活用ガイド');
    expect(guideContent).toContain('テスト観点カタログ');

    // Verify the guide provides useful information
    expect(guideContent.length).toBeGreaterThan(500); // Guide should be substantial

    // Clean up the unique directory
    await fs.rm(uniqueDir, { recursive: true });
  }, 30000);

  it('should support framework flag', async () => {
    // Arrange: Create test fixture
    const testFile = path.join(tempDir, 'framework-test.test.ts');
    const testContent = `
describe('Framework Test', () => {
  it('should detect framework', () => {
    expect(1).toBe(1);
  });
});
`;
    await fs.writeFile(testFile, testContent, 'utf-8');

    const outputDir = path.join(tempDir, 'framework-output');

    // Act: Execute CLI with explicit framework flag
    const result = execSync(
      `node "${cliPath}" analyze "${testFile}" --output "${outputDir}" --framework jest --format json`,
      {
        encoding: 'utf-8',
      }
    );

    // Assert: Verify framework was set correctly
    expect(result).toContain('Analysis complete');

    const jsonPath = path.join(outputDir, 'catalog.json');
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const catalog = JSON.parse(jsonContent);

    expect(catalog.metadata.framework).toBe('jest');
  }, 30000);

  it('should handle verbose flag', async () => {
    // Arrange: Create test fixture
    const testFile = path.join(tempDir, 'verbose-test.test.ts');
    const testContent = `
describe('Verbose Test', () => {
  it('should show verbose output', () => {
    expect(true).toBe(true);
  });
});
`;
    await fs.writeFile(testFile, testContent, 'utf-8');

    const outputDir = path.join(tempDir, 'verbose-output');

    // Act: Execute CLI with verbose flag
    const result = execSync(
      `node "${cliPath}" analyze "${testFile}" --output "${outputDir}" --format json --verbose`,
      {
        encoding: 'utf-8',
      }
    );

    // Assert: Verify verbose output is present
    expect(result).toContain('Analyzing test files');
    expect(result).toContain('Analysis complete');

    // Verify output was still generated correctly
    const jsonPath = path.join(outputDir, 'catalog.json');
    const jsonExists = await fs.access(jsonPath).then(() => true).catch(() => false);
    expect(jsonExists).toBe(true);
  }, 30000);
});
