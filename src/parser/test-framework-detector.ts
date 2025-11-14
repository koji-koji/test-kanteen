import type { ASTProgram, FrameworkMetadata } from '../types';

/**
 * テストフレームワークを検出するクラス
 */
export class TestFrameworkDetector {
  private frameworks: Map<string, FrameworkMetadata> = new Map();

  constructor() {
    this.initializeFrameworks();
  }

  /**
   * フレームワークのメタデータを初期化
   */
  private initializeFrameworks() {
    // Jest
    this.frameworks.set('jest', {
      name: 'jest',
      detectPatterns: ['@jest/globals', 'jest.config', 'jest.mock'],
      suiteIdentifiers: ['describe', 'fdescribe', 'xdescribe'],
      testIdentifiers: ['it', 'test', 'fit', 'xit', 'test.each', 'it.each'],
      hookIdentifiers: {
        beforeAll: ['beforeAll'],
        beforeEach: ['beforeEach'],
        afterAll: ['afterAll'],
        afterEach: ['afterEach'],
      },
      assertionLibraries: ['expect'],
    });

    // Vitest
    this.frameworks.set('vitest', {
      name: 'vitest',
      detectPatterns: ['vitest', 'vitest/config'],
      suiteIdentifiers: ['describe', 'suite'],
      testIdentifiers: ['it', 'test', 'bench'],
      hookIdentifiers: {
        beforeAll: ['beforeAll'],
        beforeEach: ['beforeEach'],
        afterAll: ['afterAll'],
        afterEach: ['afterEach'],
      },
      assertionLibraries: ['expect', 'assert'],
    });

    // Mocha
    this.frameworks.set('mocha', {
      name: 'mocha',
      detectPatterns: ['mocha', '.mocharc'],
      suiteIdentifiers: ['describe', 'context', 'suite'],
      testIdentifiers: ['it', 'test', 'specify'],
      hookIdentifiers: {
        beforeAll: ['before'],
        beforeEach: ['beforeEach'],
        afterAll: ['after'],
        afterEach: ['afterEach'],
      },
      assertionLibraries: ['expect', 'assert', 'should'],
    });
  }

  /**
   * ソースコードからフレームワークを検出
   */
  detectFromSource(source: string): FrameworkMetadata | null {
    for (const [_name, metadata] of this.frameworks) {
      // インポート文やパターンで検出
      for (const pattern of metadata.detectPatterns) {
        if (source.includes(pattern)) {
          return metadata;
        }
      }

      // テスト識別子の存在で検出（より汎用的）
      const hasTestIdentifiers = metadata.testIdentifiers.some((id) =>
        new RegExp(`\\b${id}\\s*\\(`).test(source)
      );
      const hasSuiteIdentifiers = metadata.suiteIdentifiers.some((id) =>
        new RegExp(`\\b${id}\\s*\\(`).test(source)
      );

      if (hasTestIdentifiers && hasSuiteIdentifiers) {
        return metadata;
      }
    }

    return null;
  }

  /**
   * ASTからフレームワークを検出
   */
  detectFromAST(ast: ASTProgram): FrameworkMetadata | null {
    // インポート文をチェック
    for (const node of ast.body) {
      if (node.type === 'ImportDeclaration') {
        const source = node.source.value as string;

        for (const [_name, metadata] of this.frameworks) {
          if (metadata.detectPatterns.some((pattern) => source.includes(pattern))) {
            return metadata;
          }
        }
      }
    }

    return null;
  }

  /**
   * package.jsonからフレームワークを検出
   */
  async detectFromPackageJson(packageJsonPath?: string): Promise<FrameworkMetadata | null> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      const pkgPath = packageJsonPath || path.resolve(process.cwd(), 'package.json');
      const content = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);

      const dependencies = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      // 依存関係からフレームワークを検出
      for (const [name, metadata] of this.frameworks) {
        if (dependencies[name]) {
          return metadata;
        }
      }
    } catch {
      // package.jsonが見つからない場合は無視
    }

    return null;
  }

  /**
   * 自動検出（複数の方法を試行）
   */
  async autoDetect(source?: string, ast?: ASTProgram): Promise<FrameworkMetadata> {
    // 1. ソースコードから検出
    if (source) {
      const fromSource = this.detectFromSource(source);
      if (fromSource) return fromSource;
    }

    // 2. ASTから検出
    if (ast) {
      const fromAST = this.detectFromAST(ast);
      if (fromAST) return fromAST;
    }

    // 3. package.jsonから検出
    const fromPackage = await this.detectFromPackageJson();
    if (fromPackage) return fromPackage;

    // デフォルトはJest（最も一般的）
    return this.frameworks.get('jest')!;
  }

  /**
   * 特定のフレームワークのメタデータを取得
   */
  getFramework(name: string): FrameworkMetadata | undefined {
    return this.frameworks.get(name);
  }

  /**
   * サポートされているすべてのフレームワークを取得
   */
  getSupportedFrameworks(): string[] {
    return Array.from(this.frameworks.keys());
  }
}
