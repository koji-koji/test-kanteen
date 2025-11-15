import { parseTests, parseTestFile } from '../../src/index';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('Main API Integration Tests', () => {
  const fixturesDir = path.join(__dirname, '../fixtures');
  const outputDir = path.join(__dirname, '../tmp/integration');

  afterEach(async () => {
    // Cleanup output directory
    try {
      await fs.rm(outputDir, { recursive: true });
    } catch {
      // Ignore errors
    }
  });

  describe('parseTests', () => {
    it('should parse test files and generate catalog', async () => {
      const pattern = path.join(fixturesDir, 'edge-cases.test.ts');
      const catalog = await parseTests(pattern);

      expect(catalog).toBeDefined();
      expect(catalog.metadata).toBeDefined();
      expect(catalog.testSuites).toBeDefined();
      expect(catalog.testSuites.length).toBeGreaterThan(0);
    });

    it('should detect framework automatically', async () => {
      const pattern = path.join(fixturesDir, '*.test.ts');
      const catalog = await parseTests(pattern, {
        framework: 'auto',
      });

      expect(catalog.metadata.framework).toBeDefined();
      expect(['jest', 'vitest', 'mocha']).toContain(catalog.metadata.framework);
    });


    it('should calculate coverage', async () => {
      const pattern = path.join(fixturesDir, 'edge-cases.test.ts');
      const catalog = await parseTests(pattern);

      expect(catalog.coverage).toBeDefined();
      expect(catalog.coverage.totalTests).toBeGreaterThan(0);
    });

    it('should include source file paths', async () => {
      const pattern = path.join(fixturesDir, 'edge-cases.test.ts');
      const catalog = await parseTests(pattern);

      expect(catalog.metadata.sourceFiles).toBeDefined();
      expect(catalog.metadata.sourceFiles.length).toBeGreaterThan(0);
    });

    it('should output JSON format when configured', async () => {
      const pattern = path.join(fixturesDir, 'edge-cases.test.ts');
      const catalog = await parseTests(pattern, {
        reporters: ['json'],
        output: outputDir,
      });

      expect(catalog).toBeDefined();

      // Check if JSON file was created
      const jsonPath = path.join(outputDir, 'catalog.json');
      const exists = await fs
        .access(jsonPath)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);
    });

    it('should output Markdown format when configured', async () => {
      const pattern = path.join(fixturesDir, 'edge-cases.test.ts');
      const catalog = await parseTests(pattern, {
        reporters: ['markdown'],
        output: outputDir,
      });

      expect(catalog).toBeDefined();

      // Check if Markdown file was created
      const mdPath = path.join(outputDir, 'catalog.md');
      const exists = await fs
        .access(mdPath)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);
    });

    it('should output multiple formats when configured', async () => {
      const pattern = path.join(fixturesDir, 'edge-cases.test.ts');
      await parseTests(pattern, {
        reporters: ['json', 'markdown'],
        output: outputDir,
      });

      // Check both files
      const jsonPath = path.join(outputDir, 'catalog.json');
      const mdPath = path.join(outputDir, 'catalog.md');

      const jsonExists = await fs
        .access(jsonPath)
        .then(() => true)
        .catch(() => false);
      const mdExists = await fs
        .access(mdPath)
        .then(() => true)
        .catch(() => false);

      expect(jsonExists).toBe(true);
      expect(mdExists).toBe(true);
    });

    it('should handle glob patterns', async () => {
      const pattern = path.join(fixturesDir, '*.test.ts');
      const catalog = await parseTests(pattern);

      expect(catalog.testSuites.length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent files', async () => {
      const pattern = path.join(fixturesDir, 'non-existent-*.test.ts');

      await expect(parseTests(pattern)).rejects.toThrow('No test files found');
    });

    it('should respect exclude patterns', async () => {
      const pattern = path.join(fixturesDir, '**/*.test.ts');
      const catalog = await parseTests(pattern, {
        exclude: ['**/sample.test.ts'],
      });

      // Should not include sample.test.ts
      const hasSample = catalog.metadata.sourceFiles.some((f) =>
        f.includes('sample.test.ts')
      );
      expect(hasSample).toBe(false);
    });
  });

  describe('parseTestFile', () => {
    it('should parse single test file', async () => {
      const filePath = path.join(fixturesDir, 'edge-cases.test.ts');
      const catalog = await parseTestFile(filePath);

      expect(catalog).toBeDefined();
      expect(catalog.testSuites.length).toBeGreaterThan(0);
    });

    it('should extract all test information', async () => {
      const filePath = path.join(fixturesDir, 'edge-cases.test.ts');
      const catalog = await parseTestFile(filePath);

      expect(catalog.metadata).toBeDefined();
      expect(catalog.testSuites).toBeDefined();
      expect(catalog.coverage).toBeDefined();
    });
  });

  describe('end-to-end scenarios', () => {
    it('should analyze edge case tests and generate correct catalog', async () => {
      const pattern = path.join(fixturesDir, 'edge-cases.test.ts');
      const catalog = await parseTests(pattern, {
        framework: 'jest',
        reporters: ['json'],
        output: outputDir,
      });

      // Verify catalog structure
      expect(catalog.testSuites.length).toBeGreaterThan(0);
      expect(catalog.coverage.totalTests).toBeGreaterThan(0);

      // Verify file output
      const jsonPath = path.join(outputDir, 'catalog.json');
      const content = await fs.readFile(jsonPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.metadata.framework).toBe('jest');
      expect(parsed.testSuites.length).toBeGreaterThan(0);
    });

    it('should generate multiple reporters with verbose output', async () => {
      const pattern = path.join(fixturesDir, 'edge-cases.test.ts');
      const catalog = await parseTests(pattern, {
        reporters: ['json', 'markdown'],
        output: outputDir,
        verbose: true,
      });

      expect(catalog).toBeDefined();

      // Both files should exist
      const files = await fs.readdir(outputDir);
      expect(files).toContain('catalog.json');
      expect(files).toContain('catalog.md');
    });

    it('should verify test catalog structure', async () => {
      const pattern = path.join(fixturesDir, 'edge-cases.test.ts');
      const catalog = await parseTests(pattern);

      // Check catalog has required structure
      expect(catalog.metadata).toBeDefined();
      expect(catalog.testSuites).toBeDefined();
      expect(catalog.coverage).toBeDefined();
      expect(catalog.testSuites.length).toBeGreaterThan(0);
    });
  });
});
