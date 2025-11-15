/**
 * E2E tests for complete workflow:
 * 1. Analyze test files (AST catalog)
 * 2. Run tests with custom reporter (Runtime catalog)
 * 3. Compare catalogs (Gap analysis)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { parseTests } from '../../src/index';

describe('E2E: Full Workflow', () => {
  const tempDir = path.join(__dirname, '../tmp/e2e');

  beforeAll(async () => {
    // Clean and create temp directories
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch {
      // Directory doesn't exist
    }
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up temp directories
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should analyze test files and generate AST catalog', async () => {
    // Create test fixture
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

  describe('Subtraction', () => {
    it('should subtract numbers', () => {
      expect(10 - 3).toBe(7);
    });
  });
});
`;
    await fs.writeFile(testFixturePath, testFixtureContent, 'utf-8');

    // Generate AST Catalog
    const astOutputDir = path.join(tempDir, 'ast-catalog');
    const astCatalog = await parseTests(testFixturePath, {
      output: astOutputDir,
      reporters: ['json', 'markdown'],
      framework: 'jest',
    });

    // Verify AST catalog was generated
    expect(astCatalog).toBeDefined();
    expect(astCatalog.testSuites.length).toBeGreaterThan(0);
    expect(astCatalog.coverage.totalTests).toBe(3);
    expect(astCatalog.metadata.framework).toBe('jest');

    // Verify JSON file was created
    const jsonPath = path.join(astOutputDir, 'catalog.json');
    const jsonExists = await fs.access(jsonPath).then(() => true).catch(() => false);
    expect(jsonExists).toBe(true);

    // Verify Markdown file was created
    const mdPath = path.join(astOutputDir, 'catalog.md');
    const mdExists = await fs.access(mdPath).then(() => true).catch(() => false);
    expect(mdExists).toBe(true);

    // Verify JSON content
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const parsedCatalog = JSON.parse(jsonContent);
    expect(parsedCatalog.metadata.framework).toBe('jest');
    expect(parsedCatalog.coverage.totalTests).toBe(3);

    // Verify test structure - nested suites are stored in nestedSuites
    expect(parsedCatalog.testSuites).toHaveLength(1); // Math Operations (top level)
    const mathSuite = parsedCatalog.testSuites[0];
    expect(mathSuite.name).toBe('Math Operations');
    expect(mathSuite.nestedSuites).toHaveLength(2); // Addition and Subtraction

    const additionSuite = mathSuite.nestedSuites.find((s: any) => s.name === 'Addition');
    expect(additionSuite).toBeDefined();
    expect(additionSuite.tests).toHaveLength(2);
  }, 30000);

  it('should support multiple output formats', async () => {
    const testFile = path.join(tempDir, 'multi-format.test.ts');
    await fs.writeFile(
      testFile,
      `
describe('Test Suite', () => {
  it('test case', () => {
    expect(true).toBe(true);
  });
});
`,
      'utf-8'
    );

    const outputDir = path.join(tempDir, 'multi-output');
    await parseTests(testFile, {
      output: outputDir,
      reporters: ['json', 'markdown'],
      framework: 'jest',
    });

    // Verify both formats were created
    const jsonPath = path.join(outputDir, 'catalog.json');
    const mdPath = path.join(outputDir, 'catalog.md');

    const jsonExists = await fs.access(jsonPath).then(() => true).catch(() => false);
    const mdExists = await fs.access(mdPath).then(() => true).catch(() => false);

    expect(jsonExists).toBe(true);
    expect(mdExists).toBe(true);

    // Verify markdown content
    const mdContent = await fs.readFile(mdPath, 'utf-8');
    expect(mdContent).toContain('# Test Catalog');
    expect(mdContent).toContain('Test Suite');
    expect(mdContent).toContain('test case');
  }, 30000);

  it('should handle nested test suites correctly', async () => {
    const testFile = path.join(tempDir, 'nested.test.ts');
    await fs.writeFile(
      testFile,
      `
describe('Level 1', () => {
  describe('Level 2', () => {
    describe('Level 3', () => {
      it('deeply nested test', () => {
        expect(1).toBe(1);
      });
    });
  });
});
`,
      'utf-8'
    );

    const outputDir = path.join(tempDir, 'nested-output');
    const catalog = await parseTests(testFile, {
      output: outputDir,
      reporters: ['json'],
      framework: 'jest',
    });

    expect(catalog.coverage.totalTests).toBe(1);
    expect(catalog.testSuites.length).toBeGreaterThan(0);

    // Navigate nested structure: Level 1 -> Level 2 -> Level 3
    const level1 = catalog.testSuites[0];
    expect(level1.name).toBe('Level 1');
    expect(level1.nestedSuites).toBeDefined();

    const level2 = level1.nestedSuites![0];
    expect(level2).toBeDefined();
    expect(level2.name).toBe('Level 2');
    expect(level2.nestedSuites).toBeDefined();

    const level3 = level2.nestedSuites![0];
    expect(level3).toBeDefined();
    expect(level3.name).toBe('Level 3');
    expect(level3.tests).toHaveLength(1);
    expect(level3.tests[0].name).toBe('deeply nested test');
  }, 30000);

  it('should detect framework automatically', async () => {
    const testFile = path.join(tempDir, 'auto-detect.test.ts');
    await fs.writeFile(
      testFile,
      `
import { describe, it, expect } from '@jest/globals';

describe('Auto Detection', () => {
  it('should detect Jest', () => {
    expect(true).toBe(true);
  });
});
`,
      'utf-8'
    );

    const catalog = await parseTests(testFile, {
      framework: 'auto', // Auto detection
    });

    expect(catalog.metadata.framework).toBe('jest');
    expect(catalog.coverage.totalTests).toBe(1);
  }, 30000);

  it('should extract test assertions', async () => {
    const testFile = path.join(tempDir, 'assertions.test.ts');
    await fs.writeFile(
      testFile,
      `
describe('Assertions', () => {
  it('should have multiple assertions', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toEqual('hello');
    expect([1, 2, 3]).toHaveLength(3);
  });
});
`,
      'utf-8'
    );

    const catalog = await parseTests(testFile, {
      framework: 'jest',
    });

    const suite = catalog.testSuites[0];
    const test = suite.tests[0];

    expect(test.assertions.length).toBeGreaterThan(0);
    expect(test.assertions.some((a) => a.matcher === 'toBe')).toBe(true);
    expect(test.assertions.some((a) => a.matcher === 'toEqual')).toBe(true);
    expect(test.assertions.some((a) => a.matcher === 'toHaveLength')).toBe(true);
  }, 30000);
});
