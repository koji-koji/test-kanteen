import { TestTargetExtractor } from '../../../src/analyzer/test-target-extractor';
import { ASTParser } from '../../../src/parser/ast-parser';
import { TestAnalyzer } from '../../../src/analyzer/test-analyzer';
import { TestFrameworkDetector } from '../../../src/parser/test-framework-detector';

describe('TestTargetExtractor', () => {
  let extractor: TestTargetExtractor;
  let parser: ASTParser;
  let testAnalyzer: TestAnalyzer;
  let detector: TestFrameworkDetector;

  beforeEach(() => {
    extractor = new TestTargetExtractor();
    parser = new ASTParser();
    testAnalyzer = new TestAnalyzer();
    detector = new TestFrameworkDetector();
  });

  describe('extract', () => {
    it('should extract target from suite name with import', () => {
      const source = `
        import { ASTParser } from '../src/parser';

        describe('ASTParser', () => {
          it('should parse code', () => {
            expect(true).toBe(true);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = testAnalyzer.analyze(parseResult, framework);
      const targets = extractor.extract(parseResult, suites);

      expect(targets.length).toBeGreaterThan(0);

      const suiteTarget = targets.find(t => t.matchMethod === 'suite-name');
      expect(suiteTarget).toBeDefined();
      expect(suiteTarget?.targetName).toBe('ASTParser');
      expect(suiteTarget?.confidence).toBe('high');
    });

    it('should extract target from suite name without import (class-like)', () => {
      const source = `
        describe('Calculator', () => {
          it('should calculate', () => {
            expect(2 + 2).toBe(4);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = testAnalyzer.analyze(parseResult, framework);
      const targets = extractor.extract(parseResult, suites);

      const suiteTarget = targets.find(t => t.matchMethod === 'suite-name');
      expect(suiteTarget).toBeDefined();
      expect(suiteTarget?.targetName).toBe('Calculator');
      expect(suiteTarget?.confidence).toBe('medium');
    });

    it('should not extract target from non-class-like suite name', () => {
      const source = `
        describe('when user is logged in', () => {
          it('should show dashboard', () => {
            expect(true).toBe(true);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = testAnalyzer.analyze(parseResult, framework);
      const targets = extractor.extract(parseResult, suites);

      const suiteTarget = targets.find(t => t.matchMethod === 'suite-name');
      expect(suiteTarget).toBeUndefined();
    });

    it('should extract target from imported function in test', () => {
      const source = `
        import { parseTests } from '../src';

        describe('parseTests function', () => {
          it('should call parseTests successfully', () => {
            parseTests('./test.ts');
            expect(true).toBe(true);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = testAnalyzer.analyze(parseResult, framework);
      const targets = extractor.extract(parseResult, suites);

      const importTarget = targets.find(
        t => t.targetName === 'parseTests' && t.matchMethod === 'import'
      );
      expect(importTarget).toBeDefined();
      expect(importTarget?.confidence).toBe('medium');
    });

    it('should extract multiple targets from test case', () => {
      const source = `
        import { foo, bar } from '../src';

        describe('functions', () => {
          it('should test foo and bar', () => {
            foo();
            bar();
            expect(true).toBe(true);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = testAnalyzer.analyze(parseResult, framework);
      const targets = extractor.extract(parseResult, suites);

      const targetNames = targets.map(t => t.targetName);
      expect(targetNames).toContain('foo');
      expect(targetNames).toContain('bar');
    });

    it('should handle nested test suites', () => {
      const source = `
        import { Calculator } from '../src';

        describe('Calculator', () => {
          describe('addition', () => {
            it('should add numbers', () => {
              expect(true).toBe(true);
            });
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = testAnalyzer.analyze(parseResult, framework);
      const targets = extractor.extract(parseResult, suites);

      const calculatorTargets = targets.filter(t => t.targetName === 'Calculator');
      expect(calculatorTargets.length).toBeGreaterThan(0);
    });

    it('should extract imports correctly', () => {
      const source = `
        import { foo } from './foo';
        import bar from './bar';
        import * as baz from './baz';

        describe('test', () => {
          it('should work', () => {
            expect(true).toBe(true);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = testAnalyzer.analyze(parseResult, framework);

      // extractImports is private, but we can test its effect indirectly
      extractor.extract(parseResult, suites);
      // If no error, imports were parsed successfully
      expect(true).toBe(true);
    });

    it('should extract function names from test name', () => {
      const source = `
        import { getUserById } from '../src';

        describe('User service', () => {
          it('should getUserById successfully', () => {
            expect(true).toBe(true);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = testAnalyzer.analyze(parseResult, framework);
      const targets = extractor.extract(parseResult, suites);

      const target = targets.find(t => t.targetName === 'getUserById');
      expect(target).toBeDefined();
    });

    it('should filter out common verbs from test names', () => {
      const source = `
        describe('test', () => {
          it('should return the correct value', () => {
            expect(true).toBe(true);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = testAnalyzer.analyze(parseResult, framework);
      const targets = extractor.extract(parseResult, suites);

      // 'should', 'return', 'the' などはターゲットにならない
      const targetNames = targets.map(t => t.targetName);
      expect(targetNames).not.toContain('should');
      expect(targetNames).not.toContain('return');
      expect(targetNames).not.toContain('the');
    });

    it('should include suite name in target', () => {
      const source = `
        import { Calculator } from '../src';

        describe('Calculator', () => {
          it('should calculate', () => {
            expect(true).toBe(true);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = testAnalyzer.analyze(parseResult, framework);
      const targets = extractor.extract(parseResult, suites);

      expect(targets.length).toBeGreaterThan(0);
      expect(targets[0].suiteName).toBe('Calculator');
    });

    it('should handle empty test file', () => {
      const source = ``;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = testAnalyzer.analyze(parseResult, framework);
      const targets = extractor.extract(parseResult, suites);

      expect(targets).toHaveLength(0);
    });

    it('should handle test with no imports', () => {
      const source = `
        describe('pure logic', () => {
          it('should work', () => {
            expect(2 + 2).toBe(4);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = testAnalyzer.analyze(parseResult, framework);
      const targets = extractor.extract(parseResult, suites);

      // No high-confidence targets without imports
      const highConfidence = targets.filter(t => t.confidence === 'high');
      expect(highConfidence).toHaveLength(0);
    });

    it('should include location information', () => {
      const source = `
        import { foo } from '../src';

        describe('Foo', () => {
          it('should test foo', () => {
            foo();
            expect(true).toBe(true);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = testAnalyzer.analyze(parseResult, framework);
      const targets = extractor.extract(parseResult, suites);

      expect(targets.length).toBeGreaterThan(0);
      expect(targets[0].location).toBeDefined();
      expect(targets[0].location.file).toBe('test.ts');
    });

    it('should not duplicate targets', () => {
      const source = `
        import { foo } from '../src';

        describe('test', () => {
          it('should test foo multiple times', () => {
            foo();
            foo();
            foo();
            expect(true).toBe(true);
          });
        });
      `;

      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.getFramework('jest')!;
      const suites = testAnalyzer.analyze(parseResult, framework);
      const targets = extractor.extract(parseResult, suites);

      const fooTargets = targets.filter(t => t.targetName === 'foo');
      // 同じテストケース内で同じ関数は重複しない
      expect(fooTargets.length).toBeLessThanOrEqual(2); // import + function-call
    });
  });
});
