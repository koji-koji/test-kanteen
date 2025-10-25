import { TestFrameworkDetector } from '../../../src/parser/test-framework-detector';
import { ASTParser } from '../../../src/parser/ast-parser';

describe('TestFrameworkDetector', () => {
  let detector: TestFrameworkDetector;
  let parser: ASTParser;

  beforeEach(() => {
    detector = new TestFrameworkDetector();
    parser = new ASTParser();
  });

  describe('detectFromSource', () => {
    it('should detect Jest from import', () => {
      const source = `import { expect } from '@jest/globals';`;
      const framework = detector.detectFromSource(source);

      expect(framework).toBeDefined();
      expect(framework?.name).toBe('jest');
    });

    it('should detect Jest from test identifiers', () => {
      const source = `
        describe('test', () => {
          it('should work', () => {
            expect(1).toBe(1);
          });
        });
      `;
      const framework = detector.detectFromSource(source);

      expect(framework).toBeDefined();
      expect(framework?.name).toBe('jest');
    });

    it('should detect Vitest from import', () => {
      const source = `import { describe, it, expect } from 'vitest';`;
      const framework = detector.detectFromSource(source);

      expect(framework).toBeDefined();
      expect(framework?.name).toBe('vitest');
    });

    it('should detect Mocha from patterns', () => {
      const source = `const mocha = require('mocha');`;
      const framework = detector.detectFromSource(source);

      expect(framework).toBeDefined();
      expect(framework?.name).toBe('mocha');
    });

    it('should return null for unrecognized source', () => {
      const source = `const x = 1;`;
      const framework = detector.detectFromSource(source);

      expect(framework).toBeNull();
    });
  });

  describe('detectFromAST', () => {
    it('should detect Jest from AST with import', () => {
      const source = `import { expect, describe, it } from '@jest/globals';`;
      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.detectFromAST(parseResult.ast);

      expect(framework).toBeDefined();
      expect(framework?.name).toBe('jest');
    });

    it('should detect Vitest from AST with import', () => {
      const source = `import { describe, it } from 'vitest';`;
      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.detectFromAST(parseResult.ast);

      expect(framework).toBeDefined();
      expect(framework?.name).toBe('vitest');
    });

    it('should return null for AST without framework imports', () => {
      const source = `const x = 1;`;
      const parseResult = parser.parse(source, 'test.ts');
      const framework = detector.detectFromAST(parseResult.ast);

      expect(framework).toBeNull();
    });
  });

  describe('autoDetect', () => {
    it('should detect from source first', async () => {
      const source = `import { expect } from '@jest/globals';`;
      const framework = await detector.autoDetect(source);

      expect(framework.name).toBe('jest');
    });

    it('should detect from AST if source detection fails', async () => {
      const source = `import { describe, it } from 'vitest';`;
      const parseResult = parser.parse(source, 'test.ts');
      const framework = await detector.autoDetect(undefined, parseResult.ast);

      expect(framework.name).toBe('vitest');
    });

    it('should return default Jest if all detection fails', async () => {
      const framework = await detector.autoDetect();

      expect(framework.name).toBe('jest');
    });
  });

  describe('getFramework', () => {
    it('should return Jest framework', () => {
      const framework = detector.getFramework('jest');

      expect(framework).toBeDefined();
      expect(framework?.name).toBe('jest');
      expect(framework?.suiteIdentifiers).toContain('describe');
      expect(framework?.testIdentifiers).toContain('it');
      expect(framework?.testIdentifiers).toContain('test');
    });

    it('should return Vitest framework', () => {
      const framework = detector.getFramework('vitest');

      expect(framework).toBeDefined();
      expect(framework?.name).toBe('vitest');
      expect(framework?.suiteIdentifiers).toContain('describe');
      expect(framework?.suiteIdentifiers).toContain('suite');
    });

    it('should return Mocha framework', () => {
      const framework = detector.getFramework('mocha');

      expect(framework).toBeDefined();
      expect(framework?.name).toBe('mocha');
      expect(framework?.suiteIdentifiers).toContain('describe');
      expect(framework?.suiteIdentifiers).toContain('context');
    });

    it('should return undefined for unknown framework', () => {
      const framework = detector.getFramework('unknown');

      expect(framework).toBeUndefined();
    });
  });

  describe('getSupportedFrameworks', () => {
    it('should return list of supported frameworks', () => {
      const frameworks = detector.getSupportedFrameworks();

      expect(frameworks).toContain('jest');
      expect(frameworks).toContain('vitest');
      expect(frameworks).toContain('mocha');
      expect(frameworks.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('framework metadata', () => {
    it('should have correct Jest identifiers', () => {
      const jest = detector.getFramework('jest')!;

      expect(jest.suiteIdentifiers).toContain('describe');
      expect(jest.suiteIdentifiers).toContain('fdescribe');
      expect(jest.suiteIdentifiers).toContain('xdescribe');
      expect(jest.testIdentifiers).toContain('it');
      expect(jest.testIdentifiers).toContain('test');
      expect(jest.testIdentifiers).toContain('fit');
      expect(jest.testIdentifiers).toContain('xit');
    });

    it('should have correct hook identifiers for Jest', () => {
      const jest = detector.getFramework('jest')!;

      expect(jest.hookIdentifiers.beforeAll).toContain('beforeAll');
      expect(jest.hookIdentifiers.beforeEach).toContain('beforeEach');
      expect(jest.hookIdentifiers.afterAll).toContain('afterAll');
      expect(jest.hookIdentifiers.afterEach).toContain('afterEach');
    });

    it('should have correct Vitest identifiers', () => {
      const vitest = detector.getFramework('vitest')!;

      expect(vitest.suiteIdentifiers).toContain('describe');
      expect(vitest.suiteIdentifiers).toContain('suite');
      expect(vitest.testIdentifiers).toContain('it');
      expect(vitest.testIdentifiers).toContain('test');
      expect(vitest.testIdentifiers).toContain('bench');
    });

    it('should have correct Mocha identifiers', () => {
      const mocha = detector.getFramework('mocha')!;

      expect(mocha.suiteIdentifiers).toContain('describe');
      expect(mocha.suiteIdentifiers).toContain('context');
      expect(mocha.suiteIdentifiers).toContain('suite');
      expect(mocha.testIdentifiers).toContain('it');
      expect(mocha.testIdentifiers).toContain('test');
      expect(mocha.testIdentifiers).toContain('specify');
    });

    it('should have correct Mocha hook identifiers', () => {
      const mocha = detector.getFramework('mocha')!;

      expect(mocha.hookIdentifiers.beforeAll).toContain('before');
      expect(mocha.hookIdentifiers.beforeEach).toContain('beforeEach');
      expect(mocha.hookIdentifiers.afterAll).toContain('after');
      expect(mocha.hookIdentifiers.afterEach).toContain('afterEach');
    });
  });
});
