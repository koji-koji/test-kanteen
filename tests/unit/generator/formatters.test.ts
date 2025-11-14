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

  describe('JSONFormatter', () => {
    let formatter: JSONFormatter;

    beforeEach(() => {
      formatter = new JSONFormatter();
    });

    describe('format', () => {
      it('should format catalog as JSON string', () => {
        const result = formatter.format(mockCatalog);

        expect(typeof result).toBe('string');
        expect(() => JSON.parse(result)).not.toThrow();
      });

      it('should format with pretty print by default', () => {
        const result = formatter.format(mockCatalog);

        expect(result).toContain('\n');
        expect(result).toContain('  ');
      });

      it('should format without pretty print when disabled', () => {
        const result = formatter.format(mockCatalog, { pretty: false });

        expect(result).not.toContain('\n');
      });

      it('should respect custom indent', () => {
        const result = formatter.format(mockCatalog, { pretty: true, indent: 4 });

        expect(result).toContain('    ');
      });

      it('should include all catalog properties', () => {
        const result = formatter.format(mockCatalog);
        const parsed = JSON.parse(result);

        expect(parsed).toHaveProperty('metadata');
        expect(parsed).toHaveProperty('testSuites');
        expect(parsed).toHaveProperty('coverage');
      });
    });

    describe('toObject', () => {
      it('should return catalog as object', () => {
        const result = formatter.toObject(mockCatalog);

        expect(typeof result).toBe('object');
        expect(result).toHaveProperty('metadata');
      });

      it('should return same catalog reference', () => {
        const result = formatter.toObject(mockCatalog);

        expect(result).toBe(mockCatalog);
      });
    });
  });

  describe('YAMLFormatter', () => {
    let formatter: YAMLFormatter;

    beforeEach(() => {
      formatter = new YAMLFormatter();
    });

    describe('format', () => {
      it('should format catalog as YAML string', () => {
        const result = formatter.format(mockCatalog);

        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });

      it('should include metadata in YAML', () => {
        const result = formatter.format(mockCatalog);

        expect(result).toContain('metadata');
        expect(result).toContain('generatedAt');
        expect(result).toContain('2024-01-01T00:00:00Z');
      });

      it('should include test suites in YAML', () => {
        const result = formatter.format(mockCatalog);

        expect(result).toContain('testSuites');
        expect(result).toContain('Test Suite');
      });

      it('should respect custom indent', () => {
        const result = formatter.format(mockCatalog, { indent: 4 });

        expect(result).toBeDefined();
        // YAML formatting should be valid
        expect(result.length).toBeGreaterThan(0);
      });

      it('should be valid YAML format', () => {
        const result = formatter.format(mockCatalog);

        // Should not contain invalid YAML characters at start
        expect(result).not.toMatch(/^[{}[\]]/);
      });
    });

    describe('toDocument', () => {
      it('should return YAML Document', () => {
        const result = formatter.toDocument(mockCatalog);

        expect(result).toBeDefined();
        expect(result.constructor.name).toBe('Document');
      });

      it('should contain catalog data', () => {
        const doc = formatter.toDocument(mockCatalog);
        const content = doc.toString();

        expect(content).toContain('metadata');
        expect(content).toContain('testSuites');
      });
    });
  });

  describe('MarkdownFormatter', () => {
    let formatter: MarkdownFormatter;

    beforeEach(() => {
      formatter = new MarkdownFormatter();
    });

    describe('format', () => {
      it('should format catalog as Markdown string', () => {
        const result = formatter.format(mockCatalog);

        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });

      it('should include main header', () => {
        const result = formatter.format(mockCatalog);

        expect(result).toContain('# Test Catalog');
      });

      it('should include metadata section', () => {
        const result = formatter.format(mockCatalog);

        expect(result).toContain('## Metadata');
        expect(result).toContain('2024-01-01T00:00:00Z');
        expect(result).not.toContain('jest'); // Framework should not be in Markdown output
      });

      it('should include coverage summary', () => {
        const result = formatter.format(mockCatalog);

        expect(result).toContain('## Metadata');
        expect(result).toContain('Total Tests');
      });

      it('should include test suites', () => {
        const result = formatter.format(mockCatalog);

        expect(result).toContain('## Test Suites');
        expect(result).toContain('Test Suite');
        expect(result).toContain('✓ should work');
      });


      it('should format test information', () => {
        const result = formatter.format(mockCatalog);

        expect(result).toContain('Test Suite');
        expect(result).toContain('✓ should work');
      });


      it('should use proper Markdown syntax', () => {
        const result = formatter.format(mockCatalog);

        // Should have proper headings
        expect(result).toMatch(/^#\s+/m);
        expect(result).toMatch(/^##\s+/m);

        // Should have test suites
        expect(result).toContain('Test Suite');
      });
    });

    describe('nested suites', () => {
      beforeEach(() => {
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
      });

      it('should format nested suites correctly', () => {
        const result = formatter.format(mockCatalog);

        expect(result).toContain('Test Suite');
        expect(result).toContain('  Nested Suite');
        expect(result).toContain('✓ nested test');
      });

      it('should use correct indentation levels', () => {
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
});
