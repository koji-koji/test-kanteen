import { AssertionExtractor } from '../../../src/analyzer/assertion-extractor';
import { ASTParser } from '../../../src/parser/ast-parser';

describe('AssertionExtractor', () => {
  let extractor: AssertionExtractor;
  let parser: ASTParser;

  beforeEach(() => {
    extractor = new AssertionExtractor();
    parser = new ASTParser();
  });

  describe('extract', () => {
    it('should extract expect().toBe() assertion', () => {
      const source = `expect(1).toBe(1);`;
      const parseResult = parser.parse(source, 'test.ts');
      const assertions = extractor.extract(parseResult.ast);

      expect(assertions.length).toBeGreaterThan(0);
      const toBeMatcher = assertions.find((a) => a.matcher === 'toBe');
      expect(toBeMatcher).toBeDefined();
    });

    it('should extract expect().toEqual() assertion', () => {
      const source = `expect({ a: 1 }).toEqual({ a: 1 });`;
      const parseResult = parser.parse(source, 'test.ts');
      const assertions = extractor.extract(parseResult.ast);

      const toEqualMatcher = assertions.find((a) => a.matcher === 'toEqual');
      expect(toEqualMatcher).toBeDefined();
    });

    it('should extract expect().toThrow() assertion', () => {
      const source = `expect(() => throwError()).toThrow();`;
      const parseResult = parser.parse(source, 'test.ts');
      const assertions = extractor.extract(parseResult.ast);

      const toThrowMatcher = assertions.find((a) => a.matcher === 'toThrow');
      expect(toThrowMatcher).toBeDefined();
    });

    it('should extract expect().not.toBe() assertion', () => {
      const source = `expect(1).not.toBe(2);`;
      const parseResult = parser.parse(source, 'test.ts');
      const assertions = extractor.extract(parseResult.ast);

      expect(assertions.length).toBeGreaterThan(0);
    });

    it('should extract multiple assertions', () => {
      const source = `
        expect(1).toBe(1);
        expect(2).toEqual(2);
        expect(true).toBeTruthy();
      `;
      const parseResult = parser.parse(source, 'test.ts');
      const assertions = extractor.extract(parseResult.ast);

      expect(assertions.length).toBeGreaterThanOrEqual(3);
    });

    it('should extract nested assertions in test function', () => {
      const source = `
        function testFunction() {
          expect(1).toBe(1);
          if (true) {
            expect(2).toBe(2);
          }
        }
      `;
      const parseResult = parser.parse(source, 'test.ts');
      const assertions = extractor.extract(parseResult.ast);

      expect(assertions.length).toBeGreaterThanOrEqual(2);
    });

    it('should extract toBeGreaterThan assertion', () => {
      const source = `expect(5).toBeGreaterThan(3);`;
      const parseResult = parser.parse(source, 'test.ts');
      const assertions = extractor.extract(parseResult.ast);

      const matcher = assertions.find((a) => a.matcher === 'toBeGreaterThan');
      expect(matcher).toBeDefined();
    });

    it('should extract toBeLessThan assertion', () => {
      const source = `expect(3).toBeLessThan(5);`;
      const parseResult = parser.parse(source, 'test.ts');
      const assertions = extractor.extract(parseResult.ast);

      const matcher = assertions.find((a) => a.matcher === 'toBeLessThan');
      expect(matcher).toBeDefined();
    });

    it('should extract toBeTruthy/toBeFalsy assertions', () => {
      const source = `
        expect(true).toBeTruthy();
        expect(false).toBeFalsy();
      `;
      const parseResult = parser.parse(source, 'test.ts');
      const assertions = extractor.extract(parseResult.ast);

      const truthyMatcher = assertions.find((a) => a.matcher === 'toBeTruthy');
      const falsyMatcher = assertions.find((a) => a.matcher === 'toBeFalsy');
      expect(truthyMatcher).toBeDefined();
      expect(falsyMatcher).toBeDefined();
    });

    it('should extract toBeDefined/toBeUndefined assertions', () => {
      const source = `
        expect(value).toBeDefined();
        expect(other).toBeUndefined();
      `;
      const parseResult = parser.parse(source, 'test.ts');
      const assertions = extractor.extract(parseResult.ast);

      const definedMatcher = assertions.find((a) => a.matcher === 'toBeDefined');
      const undefinedMatcher = assertions.find((a) => a.matcher === 'toBeUndefined');
      expect(definedMatcher).toBeDefined();
      expect(undefinedMatcher).toBeDefined();
    });

    it('should extract toContain assertion', () => {
      const source = `expect([1, 2, 3]).toContain(2);`;
      const parseResult = parser.parse(source, 'test.ts');
      const assertions = extractor.extract(parseResult.ast);

      const matcher = assertions.find((a) => a.matcher === 'toContain');
      expect(matcher).toBeDefined();
    });

    it('should extract toHaveLength assertion', () => {
      const source = `expect([1, 2, 3]).toHaveLength(3);`;
      const parseResult = parser.parse(source, 'test.ts');
      const assertions = extractor.extract(parseResult.ast);

      const matcher = assertions.find((a) => a.matcher === 'toHaveLength');
      expect(matcher).toBeDefined();
    });

    it('should extract toMatch assertion', () => {
      const source = `expect('hello world').toMatch(/hello/);`;
      const parseResult = parser.parse(source, 'test.ts');
      const assertions = extractor.extract(parseResult.ast);

      const matcher = assertions.find((a) => a.matcher === 'toMatch');
      expect(matcher).toBeDefined();
    });

    it('should include location information', () => {
      const source = `expect(1).toBe(1);`;
      const parseResult = parser.parse(source, 'test.ts');
      const assertions = extractor.extract(parseResult.ast);

      expect(assertions[0].location).toBeDefined();
      expect(assertions[0].location.line).toBeGreaterThan(0);
    });
  });

  describe('classifyAssertion', () => {
    it('should classify equality matchers', () => {
      expect(extractor.classifyAssertion('toBe')).toBe('equality');
      expect(extractor.classifyAssertion('toEqual')).toBe('equality');
      expect(extractor.classifyAssertion('toStrictEqual')).toBe('equality');
    });

    it('should classify truthiness matchers', () => {
      expect(extractor.classifyAssertion('toBeTruthy')).toBe('truthiness');
      expect(extractor.classifyAssertion('toBeFalsy')).toBe('truthiness');
      expect(extractor.classifyAssertion('toBeDefined')).toBe('truthiness');
      expect(extractor.classifyAssertion('toBeUndefined')).toBe('truthiness');
    });

    it('should classify comparison matchers', () => {
      expect(extractor.classifyAssertion('toBeGreaterThan')).toBe('comparison');
      expect(extractor.classifyAssertion('toBeLessThan')).toBe('comparison');
      expect(extractor.classifyAssertion('toBeGreaterThanOrEqual')).toBe('comparison');
      expect(extractor.classifyAssertion('toBeLessThanOrEqual')).toBe('comparison');
    });

    it('should classify string matchers', () => {
      expect(extractor.classifyAssertion('toMatch')).toBe('string');
      expect(extractor.classifyAssertion('toContain')).toBe('string');
      expect(extractor.classifyAssertion('toHaveLength')).toBe('string');
    });

    it('should classify array matchers', () => {
      expect(extractor.classifyAssertion('toContain')).toBe('string'); // can be both
      expect(extractor.classifyAssertion('toContainEqual')).toBe('array');
    });

    it('should classify error matchers', () => {
      expect(extractor.classifyAssertion('toThrow')).toBe('error');
      expect(extractor.classifyAssertion('toThrowError')).toBe('error');
    });

    it('should classify mock matchers', () => {
      expect(extractor.classifyAssertion('toHaveBeenCalled')).toBe('mock');
      expect(extractor.classifyAssertion('toHaveBeenCalledWith')).toBe('mock');
      expect(extractor.classifyAssertion('toHaveBeenCalledTimes')).toBe('mock');
    });

    it('should return "other" for unknown matchers', () => {
      expect(extractor.classifyAssertion('unknownMatcher')).toBe('other');
    });
  });
});
