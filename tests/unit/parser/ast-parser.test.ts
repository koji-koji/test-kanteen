import { ASTParser } from '../../../src/parser/ast-parser';

describe('ASTParser', () => {
  let parser: ASTParser;

  beforeEach(() => {
    parser = new ASTParser();
  });

  describe('parse', () => {
    it('should parse simple JavaScript code', () => {
      const source = 'const x = 1;';
      const result = parser.parse(source, 'test.js');

      expect(result.ast).toBeDefined();
      expect(result.ast.type).toBe('Program');
      expect(result.filePath).toBe('test.js');
      expect(result.source).toBe(source);
    });

    it('should parse TypeScript code', () => {
      const source = 'const x: number = 1;';
      const result = parser.parse(source, 'test.ts');

      expect(result.ast).toBeDefined();
      expect(result.ast.type).toBe('Program');
    });

    it('should parse test file with describe and it', () => {
      const source = `
        describe('Test Suite', () => {
          it('should work', () => {
            expect(true).toBe(true);
          });
        });
      `;
      const result = parser.parse(source, 'test.test.ts');

      expect(result.ast).toBeDefined();
      expect(result.ast.body.length).toBeGreaterThan(0);
    });

    it('should throw error for invalid syntax', () => {
      const source = 'const x = ';

      expect(() => parser.parse(source, 'invalid.js')).toThrow();
    });
  });

  describe('parseMultiple', () => {
    it('should parse multiple sources', () => {
      const sources = new Map([
        ['file1.ts', 'const x = 1;'],
        ['file2.ts', 'const y = 2;'],
      ]);

      const results = parser.parseMultiple(sources);

      expect(results.size).toBe(2);
      expect(results.get('file1.ts')).toBeDefined();
      expect(results.get('file2.ts')).toBeDefined();
    });
  });

  describe('isValidAST', () => {
    it('should return true for valid AST', () => {
      const source = 'const x = 1;';
      const result = parser.parse(source, 'test.js');

      expect(parser.isValidAST(result.ast)).toBe(true);
    });

    it('should return false for invalid AST', () => {
      expect(parser.isValidAST(null)).toBe(false);
      expect(parser.isValidAST({})).toBe(false);
      expect(parser.isValidAST({ type: 'Invalid' })).toBe(false);
    });
  });
});
