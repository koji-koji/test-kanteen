import { TestAnalyzer } from '../../../src/analyzer/test-analyzer';
import { ASTParser } from '../../../src/parser/ast-parser';
import { TestFrameworkDetector } from '../../../src/parser/test-framework-detector';

describe('TestAnalyzer', () => {
  let analyzer: TestAnalyzer;
  let parser: ASTParser;
  let detector: TestFrameworkDetector;

  beforeEach(() => {
    analyzer = new TestAnalyzer();
    parser = new ASTParser();
    detector = new TestFrameworkDetector();
  });

  describe('analyze', () => {
    it('should analyze simple test suite', () => {
      const source = `
        describe('Math operations', () => {
          it('should add numbers', () => {
            expect(1 + 1).toBe(2);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = analyzer.analyze(parseResult, framework);

      expect(suites).toHaveLength(1);
      expect(suites[0].name).toBe('Math operations');
      expect(suites[0].tests).toHaveLength(1);
      expect(suites[0].tests[0].name).toBe('should add numbers');
    });

    it('should handle nested describe blocks', () => {
      const source = `
        describe('Parent Suite', () => {
          describe('Child Suite', () => {
            it('should work', () => {
              expect(true).toBe(true);
            });
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = analyzer.analyze(parseResult, framework);

      expect(suites).toHaveLength(1);
      expect(suites[0].name).toBe('Parent Suite');
      expect(suites[0].nestedSuites).toBeDefined();
      expect(suites[0].nestedSuites).toHaveLength(1);
      expect(suites[0].nestedSuites![0].name).toBe('Child Suite');
    });

    it('should extract beforeEach hooks', () => {
      const source = `
        describe('Test Suite', () => {
          beforeEach(() => {
            // setup code
          });

          it('should test something', () => {
            expect(true).toBe(true);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = analyzer.analyze(parseResult, framework);

      expect(suites[0].setup).toBeDefined();
      expect(suites[0].setup).toHaveLength(1);
      expect(suites[0].setup![0].type).toBe('beforeEach');
    });

    it('should extract afterEach hooks', () => {
      const source = `
        describe('Test Suite', () => {
          afterEach(() => {
            // cleanup code
          });

          it('should test something', () => {
            expect(true).toBe(true);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = analyzer.analyze(parseResult, framework);

      expect(suites[0].teardown).toBeDefined();
      expect(suites[0].teardown).toHaveLength(1);
      expect(suites[0].teardown![0].type).toBe('afterEach');
    });

    it('should handle multiple test cases in one suite', () => {
      const source = `
        describe('Multiple Tests', () => {
          it('test 1', () => {
            expect(1).toBe(1);
          });

          it('test 2', () => {
            expect(2).toBe(2);
          });

          it('test 3', () => {
            expect(3).toBe(3);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = analyzer.analyze(parseResult, framework);

      expect(suites).toHaveLength(1);
      expect(suites[0].tests).toHaveLength(3);
      expect(suites[0].tests[0].name).toBe('test 1');
      expect(suites[0].tests[1].name).toBe('test 2');
      expect(suites[0].tests[2].name).toBe('test 3');
    });

    it('should extract assertions from test cases', () => {
      const source = `
        describe('Assertions', () => {
          it('should have multiple assertions', () => {
            expect(1).toBe(1);
            expect(2).toEqual(2);
            expect(true).toBeTruthy();
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = analyzer.analyze(parseResult, framework);

      expect(suites[0].tests[0].assertions.length).toBeGreaterThan(0);
    });

    it('should handle test with template literal name', () => {
      const source = `
        describe('Dynamic Names', () => {
          const value = 'test';
          it(\`should work with \${value}\`, () => {
            expect(true).toBe(true);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = analyzer.analyze(parseResult, framework);

      expect(suites[0].tests[0].name).toContain('should work with');
    });

    it('should classify test aspects', () => {
      const source = `
        describe('Error Handling', () => {
          it('should throw error when invalid', () => {
            expect(() => throwError()).toThrow();
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = analyzer.analyze(parseResult, framework);

      expect(suites[0].tests[0].aspects).toBeDefined();
      expect(suites[0].tests[0].aspects.length).toBeGreaterThan(0);
    });

    it('should handle empty test suite', () => {
      const source = `
        describe('Empty Suite', () => {
          // no tests
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = analyzer.analyze(parseResult, framework);

      expect(suites).toHaveLength(1);
      expect(suites[0].tests).toHaveLength(0);
    });

    it('should handle deeply nested suites', () => {
      const source = `
        describe('Level 1', () => {
          describe('Level 2', () => {
            describe('Level 3', () => {
              it('deep test', () => {
                expect(true).toBe(true);
              });
            });
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = analyzer.analyze(parseResult, framework);

      expect(suites).toHaveLength(1);
      expect(suites[0].nestedSuites).toHaveLength(1);
      expect(suites[0].nestedSuites![0].nestedSuites).toHaveLength(1);
    });

    it('should work with test() instead of it()', () => {
      const source = `
        describe('Using test()', () => {
          test('should work', () => {
            expect(1).toBe(1);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = analyzer.analyze(parseResult, framework);

      expect(suites[0].tests).toHaveLength(1);
      expect(suites[0].tests[0].name).toBe('should work');
    });

    it('should include location information', () => {
      const source = `
        describe('Location Test', () => {
          it('should have location', () => {
            expect(true).toBe(true);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = analyzer.analyze(parseResult, framework);

      expect(suites[0].tests[0].location).toBeDefined();
      expect(suites[0].tests[0].location.line).toBeGreaterThan(0);
    });
  });
});
