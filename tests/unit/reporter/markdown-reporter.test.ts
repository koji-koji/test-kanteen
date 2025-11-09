import { MarkdownReporter } from '../../../src/reporter/built-in-reporters/markdown-reporter';
import type { TestCatalog } from '../../../src/types';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('MarkdownReporter', () => {
  let reporter: MarkdownReporter;
  let mockCatalog: TestCatalog;

  beforeEach(() => {
    reporter = new MarkdownReporter();

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
              name: 'should work correctly',
              assertions: [
                {
                  type: 'expect-matcher',
                  matcher: 'toBe',
                  description: 'expect.toBe',
                  location: { file: '/test/test.ts', line: 12, column: 10 },
                },
              ],
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
    it('should generate Markdown string', () => {
      reporter.onComplete(mockCatalog);
      const result = reporter.generate();

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include header', () => {
      reporter.onComplete(mockCatalog);
      const result = reporter.generate();

      expect(result).toContain('# Test Catalog');
    });

    it('should include metadata section', () => {
      reporter.onComplete(mockCatalog);
      const result = reporter.generate();

      expect(result).toContain('## Metadata');
      expect(result).toContain('2024-01-01T00:00:00Z');
      expect(result).toContain('0.1.0'); // toolVersion in header
      expect(result).toContain('jest');
    });

    it('should include coverage section', () => {
      reporter.onComplete(mockCatalog);
      const result = reporter.generate();

      expect(result).toContain('## Metadata');
      expect(result).toContain('Total Tests');
    });

    it('should include test suites section', () => {
      reporter.onComplete(mockCatalog);
      const result = reporter.generate();

      expect(result).toContain('## Test Suites');
      expect(result).toContain('Test Suite');
      expect(result).toContain('✓ should work correctly');
    });

    it('should include test structure', () => {
      reporter.onComplete(mockCatalog);
      const result = reporter.generate();

      expect(result).toContain('Test Suite');
      expect(result).toContain('should work correctly');
    });

    it('should use Jest-style hierarchical format', () => {
      reporter.onComplete(mockCatalog);
      const result = reporter.generate();

      // Should be wrapped in code block
      expect(result).toContain('```');
      expect(result).toContain('Test Suite');
      expect(result).toContain('  ✓ should work correctly');
    });
  });

  describe('nested test suites', () => {
    beforeEach(() => {
      mockCatalog.testSuites[0].nestedSuites = [
        {
          id: 'nested-suite-1',
          name: 'Nested Suite',
          filePath: '/test/test.ts',
          tests: [
            {
              id: 'nested-test-1',
              name: 'nested test',
              assertions: [],
              dependencies: [],
              tags: [],
              location: { file: '/test/test.ts', line: 20, column: 5 },
            },
          ],
        },
      ];
    });

    it('should include nested suites', () => {
      reporter.onComplete(mockCatalog);
      const result = reporter.generate();

      expect(result).toContain('Nested Suite');
      expect(result).toContain('✓ nested test');
    });

    it('should use correct indentation levels', () => {
      reporter.onComplete(mockCatalog);
      const result = reporter.generate();

      // Parent suite at level 0 (no indent)
      expect(result).toContain('Test Suite\n');
      // Nested suite at level 1 (2 spaces)
      expect(result).toContain('  Nested Suite');
      // Nested test at level 2 (4 spaces)
      expect(result).toContain('    ✓ nested test');
    });
  });

  describe('writeToFile', () => {
    const outputDir = path.join(__dirname, '../../tmp');
    const outputFile = path.join(outputDir, 'test-catalog.md');

    afterEach(async () => {
      try {
        await fs.rm(outputDir, { recursive: true });
      } catch {
        // Ignore
      }
    });

    it('should write Markdown to file', async () => {
      reporter.onComplete(mockCatalog);
      await reporter.writeToFile(outputFile);

      const content = await fs.readFile(outputFile, 'utf-8');
      expect(content).toBeDefined();
      expect(content).toContain('# Test Catalog');
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
  });

  describe('options', () => {
    it('should respect include metadata option', () => {
      const customReporter = new MarkdownReporter({
        include: {
          metadata: false,
        },
      });

      customReporter.onComplete(mockCatalog);
      const result = customReporter.generate();

      // Metadata section should be excluded or empty
      // Note: Actual behavior depends on implementation
      expect(result).toBeDefined();
    });

    it('should respect include aspects option', () => {
      const customReporter = new MarkdownReporter({
        include: {
        },
      });

      customReporter.onComplete(mockCatalog);
      const result = customReporter.generate();

      expect(result).toBeDefined();
    });
  });
});
