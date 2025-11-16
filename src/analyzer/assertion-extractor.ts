import type { ASTNode, AssertionNode } from '../types';

/**
 * アサーションを抽出するクラス
 */
export class AssertionExtractor {
  /**
   * ASTノードからアサーションを抽出
   */
  extract(node: ASTNode): AssertionNode[] {
    const assertions: AssertionNode[] = [];

    this.traverse(node, (current) => {
      const assertion = this.detectAssertion(current);
      if (assertion) {
        assertions.push(assertion);
      }
    });

    return assertions;
  }

  /**
   * ノードがアサーションかどうかをチェック
   */
  private detectAssertion(node: ASTNode): AssertionNode | null {
    // expect(...).toBe(...) パターン
    if (node.type === 'CallExpression') {
      const callee = node.callee;

      // expect() の検出
      if (callee.type === 'Identifier' && callee.name === 'expect') {
        return {
          type: 'expect',
          matcher: 'expect',
          node,
          location: {
            line: node.loc?.start.line || 0,
            column: node.loc?.start.column || 0,
          },
        };
      }

      // .toBe(), .toEqual() などのマッチャーの検出
      if (callee.type === 'MemberExpression') {
        const object = callee.object;
        const property = callee.property;

        // expect().toBe() のような構造
        if (
          object.type === 'CallExpression' &&
          object.callee.type === 'Identifier' &&
          object.callee.name === 'expect' &&
          property.type === 'Identifier'
        ) {
          return {
            type: 'expect-matcher',
            matcher: property.name,
            node,
            location: {
              line: node.loc?.start.line || 0,
              column: node.loc?.start.column || 0,
            },
          };
        }

        // expect().not.toBe() のようなチェーン
        if (object.type === 'MemberExpression' && property.type === 'Identifier') {
          return {
            type: 'expect-matcher-chain',
            matcher: property.name,
            node,
            location: {
              line: node.loc?.start.line || 0,
              column: node.loc?.start.column || 0,
            },
          };
        }
      }
    }

    // assert.equal(...) パターン
    if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
      const object = node.callee.object;
      const property = node.callee.property;

      if (
        object.type === 'Identifier' &&
        object.name === 'assert' &&
        property.type === 'Identifier'
      ) {
        return {
          type: 'assert',
          matcher: property.name,
          node,
          location: {
            line: node.loc?.start.line || 0,
            column: node.loc?.start.column || 0,
          },
        };
      }
    }

    return null;
  }

  /**
   * ASTを再帰的に走査
   */
  private traverse(node: ASTNode, callback: (node: ASTNode) => void) {
    callback(node);

    // 子ノードを走査
    for (const key in node) {
      if (key === 'loc' || key === 'range' || key === 'parent') {
        continue;
      }

      const value = (node as any)[key];

      if (Array.isArray(value)) {
        value.forEach((child) => {
          if (child && typeof child === 'object' && 'type' in child) {
            this.traverse(child as ASTNode, callback);
          }
        });
      } else if (value && typeof value === 'object' && 'type' in value) {
        this.traverse(value as ASTNode, callback);
      }
    }
  }

  /**
   * アサーションの種類を分類
   */
  classifyAssertion(matcher: string): string {
    const categories: Record<string, string[]> = {
      equality: ['toBe', 'toEqual', 'toStrictEqual', 'equal', 'strictEqual'],
      truthiness: ['toBeTruthy', 'toBeFalsy', 'toBeDefined', 'toBeUndefined', 'toBeNull'],
      comparison: [
        'toBeGreaterThan',
        'toBeGreaterThanOrEqual',
        'toBeLessThan',
        'toBeLessThanOrEqual',
      ],
      string: ['toMatch', 'toContain', 'toHaveLength'],
      array: ['toContain', 'toHaveLength', 'toContainEqual'],
      error: ['toThrow', 'toThrowError', 'throws'],
      mock: ['toHaveBeenCalled', 'toHaveBeenCalledWith', 'toHaveBeenCalledTimes'],
    };

    for (const [category, matchers] of Object.entries(categories)) {
      if (matchers.includes(matcher)) {
        return category;
      }
    }

    return 'other';
  }
}
