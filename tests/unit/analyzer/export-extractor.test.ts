import { ExportExtractor } from '../../../src/analyzer/export-extractor';
import { ASTParser } from '../../../src/parser/ast-parser';

describe('ExportExtractor', () => {
  let extractor: ExportExtractor;
  let parser: ASTParser;

  beforeEach(() => {
    extractor = new ExportExtractor();
    parser = new ASTParser();
  });

  describe('extract', () => {
    it('should extract named function export', () => {
      const source = `
        export function add(a, b) {
          return a + b;
        }
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      expect(exports).toHaveLength(1);
      expect(exports[0]).toMatchObject({
        name: 'add',
        type: 'function',
        kind: 'named',
        isExported: true,
        isPublic: true,
      });
    });

    it('should extract default function export', () => {
      const source = `
        export default function add(a, b) {
          return a + b;
        }
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      expect(exports).toHaveLength(1);
      expect(exports[0]).toMatchObject({
        name: 'add',
        type: 'function',
        kind: 'default',
        isExported: true,
      });
    });

    it('should extract async function export', () => {
      const source = `
        export async function fetchData() {
          return fetch('/api/data');
        }
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      expect(exports).toHaveLength(1);
      expect(exports[0]).toMatchObject({
        name: 'fetchData',
        type: 'function',
        kind: 'named',
        isAsync: true,
      });
    });

    it('should extract class export', () => {
      const source = `
        export class Calculator {
          add(a, b) {
            return a + b;
          }
        }
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      expect(exports.length).toBeGreaterThanOrEqual(1);

      const classExport = exports.find(e => e.type === 'class');
      expect(classExport).toMatchObject({
        name: 'Calculator',
        type: 'class',
        kind: 'named',
        isExported: true,
      });
    });

    it('should extract class with public methods', () => {
      const source = `
        export class Calculator {
          add(a, b) {
            return a + b;
          }

          subtract(a, b) {
            return a - b;
          }
        }
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      // クラス + 2つのメソッド = 3つ
      expect(exports.length).toBeGreaterThanOrEqual(3);

      const methods = exports.filter(e => e.type === 'method');
      expect(methods).toHaveLength(2);
      expect(methods[0]).toMatchObject({
        name: 'add',
        type: 'method',
        parent: 'Calculator',
        isPublic: true,
      });
    });

    it('should not extract private methods', () => {
      const source = `
        export class Calculator {
          public add(a, b) {
            return a + b;
          }

          private subtract(a, b) {
            return a - b;
          }
        }
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      const methods = exports.filter(e => e.type === 'method');
      expect(methods).toHaveLength(1);
      expect(methods[0].name).toBe('add');
    });

    it('should extract variable export', () => {
      const source = `
        export const PI = 3.14159;
        export let counter = 0;
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      expect(exports).toHaveLength(2);
      expect(exports[0]).toMatchObject({
        name: 'PI',
        type: 'variable',
        kind: 'named',
      });
      expect(exports[1]).toMatchObject({
        name: 'counter',
        type: 'variable',
        kind: 'named',
      });
    });

    it('should extract TypeScript interface export', () => {
      const source = `
        export interface User {
          id: number;
          name: string;
        }
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      expect(exports).toHaveLength(1);
      expect(exports[0]).toMatchObject({
        name: 'User',
        type: 'interface',
        kind: 'named',
      });
    });

    it('should extract TypeScript type alias export', () => {
      const source = `
        export type ID = string | number;
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      expect(exports).toHaveLength(1);
      expect(exports[0]).toMatchObject({
        name: 'ID',
        type: 'type',
        kind: 'named',
      });
    });

    it('should extract multiple exports', () => {
      const source = `
        export function foo() {}
        export class Bar {}
        export const baz = 42;
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      // foo, Bar, baz = 最低3つ（Barのメソッドがあれば more）
      expect(exports.length).toBeGreaterThanOrEqual(3);

      const names = exports.map(e => e.name);
      expect(names).toContain('foo');
      expect(names).toContain('Bar');
      expect(names).toContain('baz');
    });

    it('should extract export specifiers', () => {
      const source = `
        function foo() {}
        class Bar {}
        export { foo, Bar };
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      expect(exports).toHaveLength(2);
      expect(exports.map(e => e.name)).toContain('foo');
      expect(exports.map(e => e.name)).toContain('Bar');
    });

    it('should include location information', () => {
      const source = `
        export function test() {}
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      expect(exports[0].location).toBeDefined();
      expect(exports[0].location.file).toBe('test.ts');
      expect(exports[0].location.line).toBeGreaterThan(0);
    });

    it('should include function signature', () => {
      const source = `
        export function greet(name, age) {
          return \`Hello \${name}\`;
        }
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      expect(exports[0].signature).toBeDefined();
      expect(exports[0].signature).toContain('name');
      expect(exports[0].signature).toContain('age');
    });

    it('should handle rest parameters', () => {
      const source = `
        export function sum(...numbers) {
          return numbers.reduce((a, b) => a + b, 0);
        }
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      expect(exports[0].signature).toBeDefined();
      expect(exports[0].signature).toContain('...');
    });

    it('should handle empty file', () => {
      const source = ``;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      expect(exports).toHaveLength(0);
    });

    it('should handle file with no exports', () => {
      const source = `
        function internalFunction() {}
        const internalVar = 42;
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      expect(exports).toHaveLength(0);
    });

    it('should extract arrow function export', () => {
      const source = `
        export const arrowFunc = (a, b) => a + b;
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      expect(exports).toHaveLength(1);
      expect(exports[0]).toMatchObject({
        name: 'arrowFunc',
        type: 'function',
        kind: 'named',
        isExported: true,
        isPublic: true,
        isAsync: false,
      });
      expect(exports[0].signature).toBe('(a, b)');
    });

    it('should extract async arrow function export', () => {
      const source = `
        export const asyncArrow = async (x) => {
          return x * 2;
        };
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      expect(exports).toHaveLength(1);
      expect(exports[0]).toMatchObject({
        name: 'asyncArrow',
        type: 'function',
        kind: 'named',
        isExported: true,
        isPublic: true,
        isAsync: true,
      });
      expect(exports[0].signature).toBe('(x)');
    });

    it('should distinguish arrow functions from variables', () => {
      const source = `
        export const func = () => 42;
        export const notFunc = 42;
        export const alsoNotFunc = { value: 100 };
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const exports = extractor.extract(parseResult);

      expect(exports).toHaveLength(3);

      const func = exports.find(e => e.name === 'func');
      const notFunc = exports.find(e => e.name === 'notFunc');
      const alsoNotFunc = exports.find(e => e.name === 'alsoNotFunc');

      expect(func?.type).toBe('function');
      expect(notFunc?.type).toBe('variable');
      expect(alsoNotFunc?.type).toBe('variable');
    });

    it('should extract arrow functions in JSX files', () => {
      const source = `
        export const Button = () => <button>Click</button>;
        export const Greeting = ({ name }) => <h1>Hello {name}</h1>;
      `;

      const parseResult = parser.parse(source, 'test.jsx');
      const exports = extractor.extract(parseResult);

      expect(exports).toHaveLength(2);
      expect(exports[0]).toMatchObject({
        name: 'Button',
        type: 'function',
        kind: 'named',
      });
      expect(exports[1]).toMatchObject({
        name: 'Greeting',
        type: 'function',
        kind: 'named',
      });
    });
  });
});
