import { parse } from '@typescript-eslint/typescript-estree';
import type { ParseResult, ASTProgram } from '../types';

/**
 * ASTパーサーのオプション
 */
export interface ASTParserOptions {
  /**
   * JSXをサポートするか
   */
  jsx?: boolean;

  /**
   * ソースマップを含めるか
   */
  loc?: boolean;

  /**
   * 範囲情報を含めるか
   */
  range?: boolean;

  /**
   * コメントを含めるか
   */
  comment?: boolean;

  /**
   * トークン情報を含めるか
   */
  tokens?: boolean;
}

/**
 * TypeScript/JavaScriptコードをESTree準拠のASTにパースするクラス
 */
export class ASTParser {
  private defaultOptions: ASTParserOptions = {
    jsx: true,
    loc: true,
    range: true,
    comment: false,
    tokens: false,
  };

  /**
   * ソースコードをパースしてASTを生成
   */
  parse(source: string, filePath: string, options?: ASTParserOptions): ParseResult {
    const parseOptions = { ...this.defaultOptions, ...options };

    try {
      const ast = parse(source, {
        jsx: parseOptions.jsx,
        loc: parseOptions.loc,
        range: parseOptions.range,
        comment: parseOptions.comment,
        tokens: parseOptions.tokens,
        filePath,
        // TypeScriptとJavaScriptの両方をサポート
        sourceType: 'module',
      }) as ASTProgram;

      return {
        ast,
        filePath,
        source,
      };
    } catch (error) {
      throw new Error(`Failed to parse ${filePath}: ${error}`);
    }
  }

  /**
   * 複数のソースコードをパース
   */
  parseMultiple(
    sources: Map<string, string>,
    options?: ASTParserOptions
  ): Map<string, ParseResult> {
    const results = new Map<string, ParseResult>();

    for (const [filePath, source] of sources.entries()) {
      try {
        const result = this.parse(source, filePath, options);
        results.set(filePath, result);
      } catch (error) {
        console.error(`Failed to parse ${filePath}:`, error);
      }
    }

    return results;
  }

  /**
   * ASTが有効かチェック
   */
  isValidAST(ast: unknown): ast is ASTProgram {
    return (
      typeof ast === 'object' &&
      ast !== null &&
      'type' in ast &&
      ast.type === 'Program' &&
      'body' in ast &&
      Array.isArray((ast as ASTProgram).body)
    );
  }
}
