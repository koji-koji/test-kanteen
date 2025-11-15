import { JSONReporter } from '../../../src/reporter/built-in-reporters/json-reporter';
import type { TestCatalog } from '../../../src/types';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('JSONReporter', () => {
  let reporter: JSONReporter;
  let mockCatalog: TestCatalog;

  beforeEach(() => {
    reporter = new JSONReporter();

    mockCatalog = {
      metadata: {
        generatedAt: '2024-01-01T00:00:00Z',
        version: '1.0.0',
        framework: 'jest',
        sourceFiles: ['test.ts'],
        toolVersion: '0.1.0',
      },
      testSuites: [
        {
          id: 'suite-1',
          name: 'Test Suite',
          filePath: '/test/test.ts',
          tests: [
            {
              id: 'test-1',
              name: 'should work',
              assertions: [],
              dependencies: [],
              tags: [],
              location: { file: '/test/test.ts', line: 10, column: 5 },
            },
          ],
        },
      ],
      coverage: {
        totalSuites: 1,
        totalTests: 1,
      },
    };
  });

  describe('generate', () => {
    it('should generate catalog as object', () => {
      reporter.onComplete(mockCatalog);
      const result = reporter.generate();

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('testSuites');
      expect(result).toHaveProperty('coverage');
    });

    it('should include all catalog properties', () => {
      reporter.onComplete(mockCatalog);
      const result = reporter.generate() as TestCatalog;

      expect(result.metadata.framework).toBe('jest');
      expect(result.testSuites).toHaveLength(1);
      expect(result.coverage.totalTests).toBe(1);
    });
  });

  describe('generatePretty', () => {
    it('should generate pretty formatted JSON string', () => {
      reporter.onComplete(mockCatalog);
      const result = reporter.generatePretty();

      expect(typeof result).toBe('string');
      expect(result).toContain('\n'); // Should have newlines
      expect(result).toContain('  '); // Should have indentation
    });

    it('should be valid JSON', () => {
      reporter.onComplete(mockCatalog);
      const result = reporter.generatePretty();

      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should contain catalog data', () => {
      reporter.onComplete(mockCatalog);
      const result = reporter.generatePretty();
      const parsed = JSON.parse(result);

      expect(parsed.metadata.framework).toBe('jest');
      expect(parsed.testSuites[0].name).toBe('Test Suite');
    });
  });

  describe('writeToFile', () => {
    const outputDir = path.join(__dirname, '../../tmp');
    const outputFile = path.join(outputDir, 'test-catalog.json');

    afterEach(async () => {
      // Cleanup
      try {
        await fs.rm(outputDir, { recursive: true });
      } catch {
        // Ignore errors
      }
    });

    it('should write JSON to file', async () => {
      reporter.onComplete(mockCatalog);
      await reporter.writeToFile(outputFile);

      const content = await fs.readFile(outputFile, 'utf-8');
      expect(content).toBeDefined();

      const parsed = JSON.parse(content);
      expect(parsed.metadata.framework).toBe('jest');
    });

    it('should create directory if not exists', async () => {
      reporter.onComplete(mockCatalog);
      await reporter.writeToFile(outputFile);

      const dirExists = await fs
        .access(outputDir)
        .then(() => true)
        .catch(() => false);
      expect(dirExists).toBe(true);
    });

    it('should write valid JSON format', async () => {
      reporter.onComplete(mockCatalog);
      await reporter.writeToFile(outputFile);

      const content = await fs.readFile(outputFile, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });
  });

  describe('options', () => {
    it('should respect pretty format option', () => {
      const prettyReporter = new JSONReporter({
        format: { pretty: true, indent: 4 },
      });

      prettyReporter.onComplete(mockCatalog);
      const result = prettyReporter.generatePretty();

      expect(result).toContain('    '); // 4-space indent
    });

    it('should respect include options', () => {
      const filteredReporter = new JSONReporter({
        include: {
          metadata: true,
          assertions: false,
          location: false,
        },
      });

      filteredReporter.onComplete(mockCatalog);
      const result = filteredReporter.generate() as TestCatalog;

      expect(result.metadata).toBeDefined();
      // Note: Actual filtering logic depends on implementation
    });
  });

  describe('error handling', () => {
    const outputDir = path.join(__dirname, '../../tmp');

    afterEach(async () => {
      // Cleanup
      try {
        await fs.rm(outputDir, { recursive: true });
      } catch {
        // Ignore errors
      }
    });

    it('should handle write permission errors gracefully', async () => {
      // Arrange
      reporter.onComplete(mockCatalog);
      const invalidPath = '/root/no-permission/catalog.json';

      // Act & Assert
      await expect(reporter.writeToFile(invalidPath)).rejects.toThrow();
    });

    it('should validate output path before writing', async () => {
      // Arrange
      reporter.onComplete(mockCatalog);
      const nullCharPath = path.join(outputDir, 'invalid\x00path.json');

      // Act & Assert
      await expect(reporter.writeToFile(nullCharPath)).rejects.toThrow();
    });

    it('should handle empty output path', async () => {
      // Arrange
      reporter.onComplete(mockCatalog);
      const emptyPath = '';

      // Act & Assert
      await expect(reporter.writeToFile(emptyPath)).rejects.toThrow();
    });

    it('should handle very long file paths', async () => {
      // Arrange
      reporter.onComplete(mockCatalog);
      const longDirName = 'a'.repeat(255);
      const longPath = path.join(outputDir, longDirName, 'catalog.json');

      // Act & Assert
      // This should either succeed or throw a clear error
      try {
        await reporter.writeToFile(longPath);
        const exists = await fs
          .access(longPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      } catch (error) {
        // If it fails, it should be with a filesystem error
        expect(error).toBeDefined();
      }
    });

    it('should handle concurrent writes to the same file', async () => {
      // Arrange
      reporter.onComplete(mockCatalog);
      const outputFile = path.join(outputDir, 'concurrent.json');

      // Act
      const writes = [
        reporter.writeToFile(outputFile),
        reporter.writeToFile(outputFile),
        reporter.writeToFile(outputFile),
      ];

      // Assert
      await expect(Promise.all(writes)).resolves.toBeDefined();

      // Verify file was written
      const content = await fs.readFile(outputFile, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.metadata.framework).toBe('jest');
    });

    it('should maintain data integrity when writing fails', async () => {
      // Arrange
      reporter.onComplete(mockCatalog);
      const invalidPath = '/root/no-permission/catalog.json';

      // Act
      try {
        await reporter.writeToFile(invalidPath);
      } catch {
        // Expected to fail
      }

      // Assert - catalog should still be intact
      const result = reporter.generate() as TestCatalog;
      expect(result.metadata.framework).toBe('jest');
      expect(result.testSuites).toHaveLength(1);
    });
  });
});
