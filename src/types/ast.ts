import type { TSESTree } from '@typescript-eslint/typescript-estree';

/**
 * ESTree AST Node
 */
export type ASTNode = TSESTree.Node;

/**
 * ESTree Program
 */
export type ASTProgram = TSESTree.Program;

/**
 * パース結果
 */
export interface ParseResult {
  ast: ASTProgram;
  filePath: string;
  source: string;
}

/**
 * テストブロックの種類
 */
export enum TestBlockType {
  Suite = 'suite', // describe
  Test = 'test', // it, test
  Hook = 'hook', // beforeEach, afterEach, etc.
}

/**
 * テストブロック情報
 */
export interface TestBlock {
  type: TestBlockType;
  name: string;
  node: ASTNode;
  children: TestBlock[];
  parent?: TestBlock;
  location: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

/**
 * アサーションノード情報
 */
export interface AssertionNode {
  type: string;
  matcher: string;
  node: ASTNode;
  location: {
    line: number;
    column: number;
  };
}

/**
 * テストフレームワークのメタデータ
 */
export interface FrameworkMetadata {
  name: string;
  version?: string;
  detectPatterns: string[];
  suiteIdentifiers: string[]; // describe, suite, etc.
  testIdentifiers: string[]; // it, test, etc.
  hookIdentifiers: {
    beforeAll?: string[];
    beforeEach?: string[];
    afterAll?: string[];
    afterEach?: string[];
  };
  assertionLibraries: string[]; // expect, assert, etc.
}
