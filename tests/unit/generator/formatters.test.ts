/**
 * Formatters tests - Consolidated and streamlined
 *
 * Phase 2, Round 3: IMPROVEMENT_PLAN_ROUND3.md
 * - Reduced from 23 tests to 15 tests (-35%)
 * - Consolidated common functionality testing across formatters
 * - Focus on essential format-specific features
 * - Detailed option testing moved to integration tests
 */

import { JSONFormatter, YAMLFormatter, MarkdownFormatter } from '../../../src/generator/formatters';
import type { TestCatalog } from '../../../src/types';

describe('Formatters', () => {
  let mockCatalog: TestCatalog;

  beforeEach(() => {
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
        totalTests: 1,
        totalSuites: 1,
      },
    };
  });

  describe('common functionality', () => {
    it('should include all catalog properties in all formats', () => {
      // Test that all formatters include essential catalog data
      const jsonFormatter = new JSONFormatter();
      const yamlFormatter = new YAMLFormatter();
      const markdownFormatter = new MarkdownFormatter();

      // JSON
      const jsonResult = jsonFormatter.format(mockCatalog);
      const parsed = JSON.parse(jsonResult);
      expect(parsed).toHaveProperty('metadata');
      expect(parsed).toHaveProperty('testSuites');
      expect(parsed).toHaveProperty('coverage');

      // YAML
      const yamlResult = yamlFormatter.format(mockCatalog);
      expect(yamlResult).toContain('metadata');
      expect(yamlResult).toContain('testSuites');
      expect(yamlResult).toContain('coverage');

      // Markdown
      const mdResult = markdownFormatter.format(mockCatalog);
      expect(mdResult).toContain('Test Catalog');
      expect(mdResult).toContain('Metadata');
      expect(mdResult).toContain('Test Suite');
    });

    it('should handle nested test suites correctly in all formats', () => {
      // Add nested suite to mock catalog
      mockCatalog.testSuites[0].nestedSuites = [
        {
          id: 'nested-suite',
          name: 'Nested Suite',
          filePath: '/test/test.ts',
          tests: [
            {
              id: 'nested-test',
              name: 'nested test',
              assertions: [],
              dependencies: [],
              tags: [],
              location: { file: '/test/test.ts', line: 20, column: 5 },
            },
          ],
        },
      ];

      const jsonFormatter = new JSONFormatter();
      const yamlFormatter = new YAMLFormatter();
      const markdownFormatter = new MarkdownFormatter();

      // JSON should preserve nested structure
      const jsonResult = jsonFormatter.format(mockCatalog);
      const parsed = JSON.parse(jsonResult);
      expect(parsed.testSuites[0].nestedSuites).toBeDefined();
      expect(parsed.testSuites[0].nestedSuites).toHaveLength(1);

      // YAML should include nested suites
      const yamlResult = yamlFormatter.format(mockCatalog);
      expect(yamlResult).toContain('nestedSuites');
      expect(yamlResult).toContain('Nested Suite');

      // Markdown should format with proper indentation
      const mdResult = markdownFormatter.format(mockCatalog);
      expect(mdResult).toContain('Test Suite');
      expect(mdResult).toContain('  Nested Suite'); // Indented
      expect(mdResult).toContain('✓ nested test');
    });
  });

  describe('JSONFormatter', () => {
    let formatter: JSONFormatter;

    beforeEach(() => {
      formatter = new JSONFormatter();
    });

    it('should format catalog as valid JSON with configurable options', () => {
      // Default: pretty print
      const prettyResult = formatter.format(mockCatalog);
      expect(typeof prettyResult).toBe('string');
      expect(() => JSON.parse(prettyResult)).not.toThrow();
      expect(prettyResult).toContain('\n');
      expect(prettyResult).toContain('  '); // Default 2-space indent

      // Compact: no pretty print
      const compactResult = formatter.format(mockCatalog, { pretty: false });
      expect(compactResult).not.toContain('\n');

      // Custom indent
      const customIndentResult = formatter.format(mockCatalog, { pretty: true, indent: 4 });
      expect(customIndentResult).toContain('    '); // 4-space indent
    });

    it('should return catalog as object through toObject method', () => {
      const result = formatter.toObject(mockCatalog);

      expect(typeof result).toBe('object');
      expect(result).toBe(mockCatalog); // Same reference
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('testSuites');
    });
  });

  describe('YAMLFormatter', () => {
    let formatter: YAMLFormatter;

    beforeEach(() => {
      formatter = new YAMLFormatter();
    });

    it('should format catalog as valid YAML with configurable options', () => {
      // Default formatting
      const result = formatter.format(mockCatalog);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('metadata');
      expect(result).toContain('generatedAt');
      expect(result).toContain('2024-01-01T00:00:00Z');
      expect(result).toContain('testSuites');
      expect(result).toContain('Test Suite');

      // Should not contain invalid YAML characters at start
      expect(result).not.toMatch(/^[{}[\]]/);

      // Custom indent
      const customIndentResult = formatter.format(mockCatalog, { indent: 4 });
      expect(customIndentResult).toBeDefined();
      expect(customIndentResult.length).toBeGreaterThan(0);
    });

    it('should return YAML Document through toDocument method', () => {
      const doc = formatter.toDocument(mockCatalog);

      expect(doc).toBeDefined();
      expect(doc.constructor.name).toBe('Document');

      const content = doc.toString();
      expect(content).toContain('metadata');
      expect(content).toContain('testSuites');
    });
  });

  describe('MarkdownFormatter', () => {
    let formatter: MarkdownFormatter;

    beforeEach(() => {
      formatter = new MarkdownFormatter();
    });

    it('should format catalog as valid Markdown with proper structure', () => {
      const result = formatter.format(mockCatalog);

      // Basic structure
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      // Main header
      expect(result).toContain('# Test Catalog');

      // Metadata section
      expect(result).toContain('## Metadata');
      expect(result).toContain('2024-01-01T00:00:00Z');

      // Coverage information
      expect(result).toContain('Total Tests');

      // Test suites section
      expect(result).toContain('## Test Suites');
      expect(result).toContain('Test Suite');
      expect(result).toContain('✓ should work');

      // Proper Markdown syntax (headings)
      expect(result).toMatch(/^#\s+/m);
      expect(result).toMatch(/^##\s+/m);
    });

    it('should use correct indentation levels for nested suites', () => {
      // Add nested suite
      mockCatalog.testSuites[0].nestedSuites = [
        {
          id: 'nested-suite',
          name: 'Nested Suite',
          filePath: '/test/test.ts',
          tests: [
            {
              id: 'nested-test',
              name: 'nested test',
              assertions: [],
              dependencies: [],
              tags: [],
              location: { file: '/test/test.ts', line: 20, column: 5 },
            },
          ],
        },
      ];

      const result = formatter.format(mockCatalog);

      // Parent suite at level 0 (no indent)
      expect(result).toContain('Test Suite\n');
      // Nested suite at level 1 (2 spaces)
      expect(result).toContain('  Nested Suite');
      // Nested test at level 2 (4 spaces)
      expect(result).toContain('    ✓ nested test');
    });
  });
});
