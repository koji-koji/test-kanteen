/**
 * Export Extractor
 * ソースコードからエクスポートされた関数・クラスを抽出する
 */

import type {
  ASTNode,
  ParseResult,
  SourceLocation,
  ExportInfo,
  ExportKind,
} from '../types';

/**
 * エクスポート抽出器
 */
export class ExportExtractor {
  /**
   * パース結果からエクスポートを抽出
   */
  extract(parseResult: ParseResult): ExportInfo[] {
    const { ast, filePath } = parseResult;
    const exports: ExportInfo[] = [];

    // ASTのトップレベルを走査
    for (const node of ast.body) {
      const extractedExports = this.extractFromNode(node, filePath);
      exports.push(...extractedExports);
    }

    return exports;
  }

  /**
   * ノードからエクスポートを抽出
   */
  private extractFromNode(node: ASTNode, filePath: string): ExportInfo[] {
    const exports: ExportInfo[] = [];

    switch (node.type) {
      case 'ExportNamedDeclaration':
        exports.push(...this.extractNamedExport(node, filePath));
        break;

      case 'ExportDefaultDeclaration':
        exports.push(...this.extractDefaultExport(node, filePath));
        break;

      case 'ExportAllDeclaration':
        // export * from './foo' は今回のスコープ外
        break;

      default:
        // その他のノードは無視
        break;
    }

    return exports;
  }

  /**
   * Named Export を抽出
   * export function foo() {}
   * export class Bar {}
   * export const baz = ...
   */
  private extractNamedExport(node: any, filePath: string): ExportInfo[] {
    const exports: ExportInfo[] = [];

    // export { foo, bar } のような形式
    if (node.specifiers && node.specifiers.length > 0) {
      for (const specifier of node.specifiers) {
        if (specifier.type === 'ExportSpecifier') {
          exports.push({
            name: specifier.exported.name,
            type: 'variable', // 正確な型は不明なのでvariableとする
            kind: 'named',
            filePath,
            location: this.getLocation(specifier, filePath),
            isExported: true,
            isPublic: true,
          });
        }
      }
      return exports;
    }

    // export function foo() {} のような形式
    if (node.declaration) {
      const declaration = node.declaration;

      switch (declaration.type) {
        case 'FunctionDeclaration':
          exports.push(this.extractFunction(declaration, filePath, 'named'));
          break;

        case 'ClassDeclaration':
          exports.push(...this.extractClass(declaration, filePath, 'named'));
          break;

        case 'VariableDeclaration':
          exports.push(...this.extractVariables(declaration, filePath, 'named'));
          break;

        case 'TSInterfaceDeclaration':
          exports.push(this.extractInterface(declaration, filePath, 'named'));
          break;

        case 'TSTypeAliasDeclaration':
          exports.push(this.extractTypeAlias(declaration, filePath, 'named'));
          break;

        default:
          // その他は無視
          break;
      }
    }

    return exports;
  }

  /**
   * Default Export を抽出
   * export default function foo() {}
   * export default class Bar {}
   */
  private extractDefaultExport(node: any, filePath: string): ExportInfo[] {
    const exports: ExportInfo[] = [];
    const declaration = node.declaration;

    if (!declaration) {
      return exports;
    }

    switch (declaration.type) {
      case 'FunctionDeclaration':
        exports.push(this.extractFunction(declaration, filePath, 'default'));
        break;

      case 'ClassDeclaration':
        exports.push(...this.extractClass(declaration, filePath, 'default'));
        break;

      case 'Identifier':
        // export default foo; の形式
        exports.push({
          name: declaration.name,
          type: 'variable',
          kind: 'default',
          filePath,
          location: this.getLocation(declaration, filePath),
          isExported: true,
          isPublic: true,
        });
        break;

      default:
        // その他は無視
        break;
    }

    return exports;
  }

  /**
   * 関数を抽出
   */
  private extractFunction(node: any, filePath: string, kind: ExportKind): ExportInfo {
    const name = node.id?.name || 'default';
    const isAsync = node.async === true;

    return {
      name,
      type: 'function',
      kind,
      filePath,
      location: this.getLocation(node, filePath),
      isExported: true,
      isPublic: true,
      isAsync,
      signature: this.extractFunctionSignature(node),
    };
  }

  /**
   * クラスを抽出（メソッドも含む）
   */
  private extractClass(node: any, filePath: string, kind: ExportKind): ExportInfo[] {
    const className = node.id?.name || 'default';
    const exports: ExportInfo[] = [];

    // クラス自体
    exports.push({
      name: className,
      type: 'class',
      kind,
      filePath,
      location: this.getLocation(node, filePath),
      isExported: true,
      isPublic: true,
    });

    // クラスのメソッド
    if (node.body && node.body.body) {
      for (const member of node.body.body) {
        if (member.type === 'MethodDefinition' && member.kind === 'method') {
          const isPublic = !this.isPrivateOrProtected(member);

          if (isPublic) {
            const methodName = member.key.name;
            const isAsync = member.value.async === true;

            exports.push({
              name: methodName,
              type: 'method',
              kind: 'named',
              filePath,
              location: this.getLocation(member, filePath),
              isExported: true,
              isPublic: true,
              parent: className,
              isAsync,
              signature: this.extractFunctionSignature(member.value),
            });
          }
        }
      }
    }

    return exports;
  }

  /**
   * 変数を抽出
   */
  private extractVariables(node: any, filePath: string, kind: ExportKind): ExportInfo[] {
    const exports: ExportInfo[] = [];

    for (const declaration of node.declarations) {
      if (declaration.id && declaration.id.type === 'Identifier') {
        exports.push({
          name: declaration.id.name,
          type: 'variable',
          kind,
          filePath,
          location: this.getLocation(declaration, filePath),
          isExported: true,
          isPublic: true,
        });
      }
    }

    return exports;
  }

  /**
   * インターフェースを抽出
   */
  private extractInterface(node: any, filePath: string, kind: ExportKind): ExportInfo {
    return {
      name: node.id.name,
      type: 'interface',
      kind,
      filePath,
      location: this.getLocation(node, filePath),
      isExported: true,
      isPublic: true,
    };
  }

  /**
   * Type Aliasを抽出
   */
  private extractTypeAlias(node: any, filePath: string, kind: ExportKind): ExportInfo {
    return {
      name: node.id.name,
      type: 'type',
      kind,
      filePath,
      location: this.getLocation(node, filePath),
      isExported: true,
      isPublic: true,
    };
  }

  /**
   * 関数シグネチャを抽出（簡易版）
   */
  private extractFunctionSignature(node: any): string {
    const params = node.params || [];
    const paramNames = params.map((p: any) => {
      if (p.type === 'Identifier') {
        return p.name;
      }
      if (p.type === 'RestElement' && p.argument.type === 'Identifier') {
        return `...${p.argument.name}`;
      }
      return '_';
    });

    return `(${paramNames.join(', ')})`;
  }

  /**
   * private/protected判定
   */
  private isPrivateOrProtected(member: any): boolean {
    // TypeScriptのアクセス修飾子チェック
    if (member.accessibility) {
      return member.accessibility === 'private' || member.accessibility === 'protected';
    }

    // JavaScriptの private field (#field) チェック
    if (member.key && member.key.type === 'PrivateIdentifier') {
      return true;
    }

    return false;
  }

  /**
   * ソースコード上の位置を取得
   */
  private getLocation(node: any, filePath: string): SourceLocation {
    return {
      file: filePath,
      line: node.loc?.start.line || 0,
      column: node.loc?.start.column || 0,
    };
  }
}
