# Test Kanteen

> AST×Reporterでテストから"観点カタログ"を自動生成し、LLMと人間の共通Specにするライブラリ

## 概要

Test Kanteenは、テストコードを解析して自動的に「テスト観点カタログ」を生成するTypeScriptライブラリです。ESTree準拠のASTパーサーとReporterパターンを組み合わせることで、テストから意図を抽出し、LLMと人間の両方が理解できる共通仕様書を作成します。

## 特徴

- **自動観点抽出**: テストコードから自動的にテスト観点を抽出
- **ESTree準拠**: 標準的なJavaScript ASTフォーマットを使用
- **柔軟なReporter**: カスタマイズ可能なReporterパターン
- **マルチフレームワーク対応**: Jest、Vitest、Mochaなどに対応
- **LLM統合**: LLMが理解しやすいフォーマットで出力
- **複数出力形式**: JSON、YAML、Markdown形式に対応

## インストール

```bash
npm install test-kanteen
```

## 基本的な使い方

### CLI

```bash
# テストファイルを解析してカタログを生成
npx kanteen analyze "tests/**/*.test.ts"

# 出力形式を指定
npx kanteen analyze "tests/**/*.test.ts" --format json,markdown

# 設定ファイルを使用
npx kanteen analyze --config kanteen.config.js
```

### プログラマティックに使用

```typescript
import { parseTests, generateCatalog } from 'test-kanteen';

// 基本的な使用
const catalog = await parseTests('./tests/**/*.test.ts');
console.log(catalog);

// カスタム設定
const catalog = await parseTests('./tests/**/*.test.ts', {
  framework: 'jest',
  reporters: ['json', 'markdown'],
  output: './catalog'
});
```

### 設定ファイル

`kanteen.config.js`:

```javascript
export default {
  include: ['**/*.test.ts', '**/*.spec.ts'],
  exclude: ['**/node_modules/**'],
  framework: 'auto',
  reporters: ['json', 'markdown'],
  output: './test-catalog',
  aspectCategories: {
    custom: ['my-custom-aspect']
  },
  llm: {
    enabled: true,
    provider: 'anthropic'
  }
};
```

## アーキテクチャ

```
テストファイル → AST Parser → Test Analyzer → Reporter → Catalog
```

### 主要コンポーネント

1. **AST Parser**: テストファイルをESTree準拠のASTに変換
2. **Test Analyzer**: ASTからテスト構造と観点を抽出
3. **Reporter**: 観点情報を収集・整形（Visitorパターン）
4. **Catalog Generator**: 最終的なカタログを生成

## カスタムReporterの作成

```typescript
import { BaseReporter, TestCase, TestSuite } from 'test-kanteen';

export class MyCustomReporter extends BaseReporter {
  onTestSuite(suite: TestSuite) {
    // スイートごとの処理
  }

  onTestCase(testCase: TestCase) {
    // テストケースごとの処理
  }

  generate() {
    // 最終的な出力を生成
    return this.formatOutput();
  }
}
```

## 観点カテゴリ

Test Kanteenは以下のような観点カテゴリを自動的に識別します:

- **Functionality**: 機能の動作確認
- **EdgeCase**: エッジケース・境界値テスト
- **ErrorHandling**: エラーハンドリング
- **Performance**: パフォーマンステスト
- **Security**: セキュリティテスト
- **Integration**: 統合テスト
- **UnitBehavior**: ユニット単位の振る舞い
- **DataValidation**: データバリデーション
- **StateManagement**: 状態管理
- **Custom**: カスタムカテゴリ

## 出力例

### JSON形式

```json
{
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00Z",
    "version": "1.0.0",
    "framework": "jest"
  },
  "testSuites": [
    {
      "name": "User Authentication",
      "tests": [
        {
          "name": "should login with valid credentials",
          "aspects": ["functionality", "integration"],
          "assertions": [...]
        }
      ]
    }
  ],
  "aspects": [...]
}
```

### Markdown形式

カタログはMarkdown形式でも出力でき、ドキュメントとしてそのまま使用できます。Jest `--verbose`風のシンプルな階層構造で表示されます。

```
ASTParser
  parse
    ✓ should parse simple JavaScript code
    ✓ should parse TypeScript code
  parseMultiple
    ✓ should parse multiple sources
```

## 自己分析 - Test Kanteen自身のテストカタログ

Test Kanteenは自分自身のテストコードを解析できます：

```bash
# Test Kanteen自身のテストを解析
npx kanteen analyze "tests/unit/**/*.test.ts" --output ./self-catalog --format json,markdown
```

**結果**:
- **158個のテスト**から**8つの観点**を自動抽出
- **機能テスト70.9%**、**エッジケース20.3%**、**データ検証15.2%**
- セキュリティやパフォーマンスの改善余地を特定

詳細は[自己分析レポート](./docs/SELF_ANALYSIS.md)を参照してください。

## 開発

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# テスト
npm test

# 監視モード
npm run dev
```

## ロードマップ

- [x] Phase 1: 基盤構築 ✅
- [x] Phase 2: コア機能実装 ✅
- [x] Phase 3: Reporter拡張 ✅
- [x] Phase 4: Catalog生成 ✅
- [ ] Phase 5: 統合・最適化

**現在の状況**:
- ✅ 26個のソースファイル
- ✅ 191個のテスト（96.4%カバレッジ）
- ✅ JSON/YAML/Markdown出力対応
- ✅ Jest/Vitest/Mocha対応
- ✅ CLIツール完備

詳細は[PLAN.md](./PLAN.md)を参照してください。

## ライセンス

MIT

## 貢献

Issue報告やPull Requestを歓迎します。

## ドキュメント

- [プロジェクトプラン](./PLAN.md)
- [テスト計画書](./docs/TEST_PLAN.md)
- [テスト実装サマリー](./docs/TEST_SUMMARY.md)
- [自己分析レポート](./docs/SELF_ANALYSIS.md)
