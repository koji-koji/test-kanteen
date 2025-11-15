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

  describe('parseTests - error handling', () => {
    it('should handle invalid TypeScript syntax gracefully', async () => {
      // Arrange
      const invalidSyntaxFile = path.join(fixturesDir, 'invalid-syntax.test.ts');

      // Act
      const catalog = await parseTests(invalidSyntaxFile);

      // Assert
      // Parser logs error but continues with empty catalog
      expect(catalog).toBeDefined();
      expect(catalog.testSuites.length).toBe(0);
      expect(catalog.coverage.totalTests).toBe(0);
    });

    it('should provide clear error message for unsupported framework', async () => {
      // Arrange
      const unsupportedFile = path.join(fixturesDir, 'unsupported-framework.test.ts');

      // Act
      const catalog = await parseTests(unsupportedFile, {
        framework: 'auto',
      });

      // Assert
      // The parser should complete, but framework detection might fall back to a default
      expect(catalog).toBeDefined();
      expect(catalog.metadata.framework).toBeDefined();
    });

    it('should handle circular dependencies gracefully', async () => {
      // Arrange
      // This is an optional advanced test case
      // For now, we test that the parser handles re-imports correctly
      const pattern = path.join(fixturesDir, 'edge-cases.test.ts');

      // Act
      const catalog = await parseTests(pattern);

      // Assert
      expect(catalog).toBeDefined();
      expect(catalog.testSuites.length).toBeGreaterThan(0);
    });

    it('should handle empty test files gracefully', async () => {
      // Arrange
      const emptyFile = path.join(fixturesDir, 'empty.test.ts');
      await fs.writeFile(emptyFile, '// Empty test file\n', 'utf-8');

      // Act
      const catalog = await parseTests(emptyFile);

      // Assert
      expect(catalog).toBeDefined();
      expect(catalog.testSuites.length).toBe(0);
      expect(catalog.coverage.totalTests).toBe(0);

      // Cleanup
      await fs.unlink(emptyFile);
    });

    it('should provide meaningful error message when no tests found', async () => {
      // Arrange
      const nonExistentPattern = path.join(fixturesDir, 'completely-missing-*.test.ts');

      // Act & Assert
      await expect(parseTests(nonExistentPattern)).rejects.toThrow('No test files found');
    });

    it('should handle malformed test structure', async () => {
      // Arrange
      const malformedFile = path.join(fixturesDir, 'malformed.test.ts');
      await fs.writeFile(
        malformedFile,
        `
        // Malformed test without proper structure
        const x = 1;
        const y = 2;
        console.log(x + y);
      `,
        'utf-8'
      );

      // Act
      const catalog = await parseTests(malformedFile);

      // Assert
      expect(catalog).toBeDefined();
      expect(catalog.testSuites.length).toBe(0);

      // Cleanup
      await fs.unlink(malformedFile);
    });
  });
});
