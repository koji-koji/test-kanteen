import {
  TestBlockType,
  type ASTNode,
  type ASTProgram,
  type ParseResult,
  type TestBlock,
  type FrameworkMetadata,
  type TestSuite,
  type TestCase,
  type Assertion,
  type SetupInfo,
  type TeardownInfo,
} from '../types';
import { AssertionExtractor } from './assertion-extractor';
import { AspectClassifier } from './aspect-classifier';
import { v4 as uuidv4 } from 'uuid';

/**
 * テストコードを解析するクラス
 */
export class TestAnalyzer {
  private assertionExtractor: AssertionExtractor;
  private aspectClassifier: AspectClassifier;

  constructor() {
    this.assertionExtractor = new AssertionExtractor();
    this.aspectClassifier = new AspectClassifier();
  }

  /**
   * パース結果を解析してテストスイートを抽出
   */
  analyze(parseResult: ParseResult, framework: FrameworkMetadata): TestSuite[] {
    const { ast, filePath, source } = parseResult;
    const testBlocks = this.extractTestBlocks(ast, framework);
    const suites = this.buildTestSuites(testBlocks, filePath, source);

    return suites;
  }

  /**
   * ASTからテストブロックを抽出
   */
  private extractTestBlocks(ast: ASTProgram, framework: FrameworkMetadata): TestBlock[] {
    const blocks: TestBlock[] = [];

    const traverse = (node: ASTNode, parent?: TestBlock): void => {
      const block = this.detectTestBlock(node, framework);

      if (block) {
        block.parent = parent;
        blocks.push(block);

        // 子要素を走査
        this.traverseChildren(node, (child) => traverse(child, block));
      } else {
        // テストブロックでない場合も子要素を走査
        this.traverseChildren(node, (child) => traverse(child, parent));
      }
    };

    ast.body.forEach((node) => traverse(node));

    return blocks;
  }

  /**
   * ノードがテストブロックかどうかを検出
   */
  private detectTestBlock(node: ASTNode, framework: FrameworkMetadata): TestBlock | null {
    if (node.type !== 'CallExpression') {
      return null;
    }

    const callee = node.callee;
    let name = '';

    // 関数名を取得
    if (callee.type === 'Identifier') {
      name = callee.name;
    } else if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
      name = callee.property.name;
    }

    // テストスイート（describe）の検出
    if (framework.suiteIdentifiers.includes(name)) {
      const testName = this.extractStringArgument(node);
      return {
        type: TestBlockType.Suite,
        name: testName || name,
        node,
        children: [],
        location: {
          start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
          end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
        },
      };
    }

    // テストケース（it, test）の検出
    if (framework.testIdentifiers.includes(name)) {
      const testName = this.extractStringArgument(node);
      return {
        type: TestBlockType.Test,
        name: testName || name,
        node,
        children: [],
        location: {
          start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
          end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
        },
      };
    }

    // フック（beforeEach, afterEach等）の検出
    const allHooks = [
      ...(framework.hookIdentifiers.beforeAll || []),
      ...(framework.hookIdentifiers.beforeEach || []),
      ...(framework.hookIdentifiers.afterAll || []),
      ...(framework.hookIdentifiers.afterEach || []),
    ];

    if (allHooks.includes(name)) {
      return {
        type: TestBlockType.Hook,
        name,
        node,
        children: [],
        location: {
          start: { line: node.loc?.start.line || 0, column: node.loc?.start.column || 0 },
          end: { line: node.loc?.end.line || 0, column: node.loc?.end.column || 0 },
        },
      };
    }

    return null;
  }

  /**
   * CallExpressionの第一引数（文字列）を抽出
   */
  private extractStringArgument(node: ASTNode): string | null {
    if (node.type === 'CallExpression' && node.arguments.length > 0) {
      const firstArg = node.arguments[0];
      if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
        return firstArg.value;
      }
      if (firstArg.type === 'TemplateLiteral' && firstArg.quasis.length > 0) {
        return firstArg.quasis[0].value.raw;
      }
    }
    return null;
  }

  /**
   * TestBlockからTestSuiteを構築
   */
  private buildTestSuites(blocks: TestBlock[], filePath: string, source: string): TestSuite[] {
    const suites: TestSuite[] = [];
    const rootBlocks = blocks.filter((block) => !block.parent);

    for (const block of rootBlocks) {
      if (block.type === TestBlockType.Suite) {
        const suite = this.buildTestSuite(block, blocks, filePath, source);
        suites.push(suite);
      }
    }

    return suites;
  }

  /**
   * 単一のTestSuiteを構築
   */
  private buildTestSuite(
    block: TestBlock,
    allBlocks: TestBlock[],
    filePath: string,
    source: string
  ): TestSuite {
    const children = allBlocks.filter((b) => b.parent === block);
    const tests: TestCase[] = [];
    const setup: SetupInfo[] = [];
    const teardown: TeardownInfo[] = [];
    const nestedSuites: TestSuite[] = [];

    for (const child of children) {
      if (child.type === TestBlockType.Test) {
        const testCase = this.buildTestCase(child, source);
        tests.push(testCase);
      } else if (child.type === TestBlockType.Hook) {
        // フックの処理
        const hookInfo = this.extractHookInfo(child);
        if (hookInfo.type.startsWith('before')) {
          setup.push(hookInfo as SetupInfo);
        } else {
          teardown.push(hookInfo as TeardownInfo);
        }
      } else if (child.type === TestBlockType.Suite) {
        const nestedSuite = this.buildTestSuite(child, allBlocks, filePath, source);
        nestedSuites.push(nestedSuite);
      }
    }

    return {
      id: uuidv4(),
      name: block.name,
      filePath,
      tests,
      setup: setup.length > 0 ? setup : undefined,
      teardown: teardown.length > 0 ? teardown : undefined,
      nestedSuites: nestedSuites.length > 0 ? nestedSuites : undefined,
    };
  }

  /**
   * TestCaseを構築
   */
  private buildTestCase(block: TestBlock, _source: string): TestCase {
    const assertions = this.assertionExtractor.extract(block.node);
    const assertionTypes = assertions.map((a) =>
      this.assertionExtractor.classifyAssertion(a.matcher)
    );

    const aspects = this.aspectClassifier.classifyFromContext({
      testName: block.name,
      assertions: assertionTypes,
    });

    return {
      id: uuidv4(),
      name: block.name,
      aspects: aspects,
      assertions: assertions.map((a) => this.convertToAssertion(a)),
      dependencies: [],
      tags: [],
      location: {
        file: '',
        line: block.location.start.line,
        column: block.location.start.column,
      },
    };
  }

  /**
   * AssertionNodeをAssertionに変換
   */
  private convertToAssertion(assertionNode: any): Assertion {
    return {
      type: assertionNode.type,
      matcher: assertionNode.matcher,
      description: `${assertionNode.type}.${assertionNode.matcher}`,
      location: {
        file: '',
        line: assertionNode.location.line,
        column: assertionNode.location.column,
      },
    };
  }

  /**
   * フック情報を抽出
   */
  private extractHookInfo(block: TestBlock): SetupInfo | TeardownInfo {
    const type = block.name as any;
    return {
      type,
      description: block.name,
      location: {
        file: '',
        line: block.location.start.line,
        column: block.location.start.column,
      },
    };
  }

  /**
   * ノードの子要素を走査
   */
  private traverseChildren(node: ASTNode, callback: (child: ASTNode) => void) {
    for (const key in node) {
      if (key === 'loc' || key === 'range' || key === 'parent') {
        continue;
      }

      const value = (node as any)[key];

      if (Array.isArray(value)) {
        value.forEach((child) => {
          if (child && typeof child === 'object' && 'type' in child) {
            callback(child as ASTNode);
          }
        });
      } else if (value && typeof value === 'object' && 'type' in value) {
        callback(value as ASTNode);
      }
    }
  }
}
