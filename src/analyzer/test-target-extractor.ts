/**
 * Test Target Extractor
 * テストファイルから「何をテストしているか」を推測する
 */

import type {
  ParseResult,
  TestSuite,
  TestCase,
  TestTarget,
  ImportInfo,
} from '../types';

/**
 * テスト対象抽出器
 */
export class TestTargetExtractor {
  /**
   * テストスイートからテスト対象を抽出
   */
  extract(parseResult: ParseResult, suites: TestSuite[]): TestTarget[] {
    const targets: TestTarget[] = [];

    // インポート情報を抽出
    const imports = this.extractImports(parseResult);

    // 各テストスイートを解析
    for (const suite of suites) {
      // スイート名からテスト対象を推測
      const suiteTarget = this.inferFromSuiteName(suite, imports);
      if (suiteTarget) {
        targets.push(suiteTarget);
      }

      // 各テストケースを解析
      for (const testCase of suite.tests) {
        const caseTargets = this.inferFromTestCase(testCase, suite, imports, parseResult);
        targets.push(...caseTargets);
      }

      // ネストしたスイートも再帰的に処理
      if (suite.nestedSuites) {
        const nestedTargets = this.extract(parseResult, suite.nestedSuites);
        targets.push(...nestedTargets);
      }
    }

    return targets;
  }

  /**
   * インポート文を抽出
   */
  private extractImports(parseResult: ParseResult): ImportInfo[] {
    const imports: ImportInfo[] = [];
    const { ast, filePath } = parseResult;

    for (const node of ast.body) {
      if (node.type === 'ImportDeclaration') {
        const source = (node as any).source.value;

        // import specifiers を解析
        for (const specifier of (node as any).specifiers) {
          if (specifier.type === 'ImportSpecifier') {
            // import { foo } from './bar'
            imports.push({
              name: specifier.imported.name,
              source,
              isDefault: false,
              isNamespace: false,
              location: {
                file: filePath,
                line: specifier.loc?.start.line || 0,
                column: specifier.loc?.start.column || 0,
              },
            });
          } else if (specifier.type === 'ImportDefaultSpecifier') {
            // import foo from './bar'
            imports.push({
              name: specifier.local.name,
              source,
              isDefault: true,
              isNamespace: false,
              location: {
                file: filePath,
                line: specifier.loc?.start.line || 0,
                column: specifier.loc?.start.column || 0,
              },
            });
          } else if (specifier.type === 'ImportNamespaceSpecifier') {
            // import * as foo from './bar'
            imports.push({
              name: specifier.local.name,
              source,
              isDefault: false,
              isNamespace: true,
              location: {
                file: filePath,
                line: specifier.loc?.start.line || 0,
                column: specifier.loc?.start.column || 0,
              },
            });
          }
        }
      }
    }

    return imports;
  }

  /**
   * スイート名からテスト対象を推測
   * describe('ASTParser', ...) → ASTParser をテスト
   */
  private inferFromSuiteName(suite: TestSuite, imports: ImportInfo[]): TestTarget | null {
    const suiteName = suite.name;

    // インポートされているクラス/関数と一致するか
    const matchingImport = imports.find(imp => imp.name === suiteName);

    if (matchingImport) {
      return {
        testName: suite.name,
        testFile: suite.filePath,
        targetName: suiteName,
        confidence: 'high',
        matchMethod: 'suite-name',
        location: {
          file: suite.filePath,
          line: 0,
          column: 0,
        },
        suiteName: suite.name,
      };
    }

    // インポートされていなくてもクラス名っぽければ推測
    if (this.looksLikeClassName(suiteName)) {
      return {
        testName: suite.name,
        testFile: suite.filePath,
        targetName: suiteName,
        confidence: 'medium',
        matchMethod: 'suite-name',
        location: {
          file: suite.filePath,
          line: 0,
          column: 0,
        },
        suiteName: suite.name,
      };
    }

    return null;
  }

  /**
   * テストケースからテスト対象を推測
   */
  private inferFromTestCase(
    testCase: TestCase,
    suite: TestSuite,
    imports: ImportInfo[],
    parseResult: ParseResult
  ): TestTarget[] {
    const targets: TestTarget[] = [];

    // パターン1: テストケース名から関数名を推測
    // "should call parseTests()" → parseTests
    const functionNames = this.extractFunctionNamesFromTestName(testCase.name);

    for (const funcName of functionNames) {
      const matchingImport = imports.find(imp => imp.name === funcName);

      if (matchingImport) {
        targets.push({
          testName: testCase.name,
          testFile: suite.filePath,
          targetName: funcName,
          confidence: 'medium',
          matchMethod: 'import',
          location: testCase.location,
          suiteName: suite.name,
        });
      }
    }

    // パターン2: 関数呼び出しを検出
    // コード内で使われている関数を検出
    const calledFunctions = this.extractFunctionCalls(testCase, parseResult);

    for (const funcName of calledFunctions) {
      const matchingImport = imports.find(imp => imp.name === funcName);

      if (matchingImport) {
        // すでに追加済みでないか確認
        const alreadyAdded = targets.some(t => t.targetName === funcName);
        if (!alreadyAdded) {
          targets.push({
            testName: testCase.name,
            testFile: suite.filePath,
            targetName: funcName,
            confidence: 'low',
            matchMethod: 'function-call',
            location: testCase.location,
            suiteName: suite.name,
          });
        }
      }
    }

    return targets;
  }

  /**
   * テスト名から関数名を抽出
   * "should call parseTests with config" → ["parseTests"]
   */
  private extractFunctionNamesFromTestName(testName: string): string[] {
    const names: string[] = [];

    // キャメルケースの識別子を検出
    // parseTests, getUserById など
    const camelCaseRegex = /\b([a-z][a-zA-Z0-9]*)\b/g;
    let match;

    while ((match = camelCaseRegex.exec(testName)) !== null) {
      const name = match[1];

      // 一般的な動詞は除外
      const commonVerbs = [
        'should',
        'test',
        'it',
        'be',
        'have',
        'return',
        'call',
        'get',
        'set',
        'is',
        'can',
        'will',
        'when',
        'with',
        'for',
        'if',
        'the',
        'a',
        'an',
        'to',
        'of',
        'and',
        'or',
      ];

      if (!commonVerbs.includes(name.toLowerCase())) {
        names.push(name);
      }
    }

    return names;
  }

  /**
   * テストケース内の関数呼び出しを検出
   * 簡易版: testCaseのアサーション内で呼ばれている関数を検出
   */
  private extractFunctionCalls(testCase: TestCase, _parseResult: ParseResult): string[] {
    // 実装の簡略化のため、アサーションから推測
    // より高度な実装では、testCaseのASTノードを解析
    const functionNames: string[] = [];

    // アサーションの actual から関数名を抽出
    for (const assertion of testCase.assertions) {
      if (assertion.actual) {
        // "parseTests(...)" のような形式から parseTests を抽出
        const funcCallRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
        let match;

        while ((match = funcCallRegex.exec(assertion.actual)) !== null) {
          const funcName = match[1];

          // expectやtestなどの一般的な関数は除外
          const excludedNames = ['expect', 'test', 'it', 'describe', 'beforeEach', 'afterEach'];
          if (!excludedNames.includes(funcName)) {
            functionNames.push(funcName);
          }
        }
      }
    }

    return [...new Set(functionNames)]; // 重複除去
  }

  /**
   * クラス名っぽいか判定
   * ASTParser, Calculator など大文字始まり
   */
  private looksLikeClassName(name: string): boolean {
    // パスカルケース（大文字始まり）
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
  }
}
