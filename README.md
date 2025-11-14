# Test Kanteen

> AST×Reporterでテストから"観点カタログ"を自動生成し、LLMと人間の共通Specにするライブラリ

## 概要

Test Kanteenは、テストコードを解析して自動的に「テスト観点カタログ」を生成するTypeScriptライブラリです。ESTree準拠のASTパーサーとReporterパターンを組み合わせることで、テストから意図を抽出し、LLMと人間の両方が理解できる共通仕様書を作成します。

## 特徴

- **テスト構造の可視化**: テストコードの構造を自動的に抽出
- **関数・クラス抽出**: ソースコードから関数・クラス一覧を抽出 🆕
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

#### テスト観点カタログ生成

```bash
# テストファイルを解析してカタログを生成（デフォルト出力先: ./aaa_test_kanteen）
npx kanteen analyze "tests/**/*.test.ts"

# 出力形式を指定
npx kanteen analyze "tests/**/*.test.ts" --format json,markdown

# 出力先を変更
npx kanteen analyze "tests/**/*.test.ts" --output ./custom-output

# 設定ファイルを使用
npx kanteen analyze --config kanteen.config.js
```

#### 関数・クラスの抽出 🆕

```bash
# ソースコードから関数・クラス一覧を抽出（デフォルト出力先: ./aaa_test_kanteen/exports）
npx kanteen extract "src/**/*.ts"

# 出力先を指定
npx kanteen extract "src/**/*.ts" --output ./exports

# JSON形式のみで出力
npx kanteen extract "src/**/*.ts" --format json

# 詳細出力モード
npx kanteen extract "src/**/*.ts" --verbose
```

#### LLMを活用した高度な分析 🆕

extractとanalyzeの出力をLLMに渡すことで、より高度な分析が可能です：

```bash
# 1. 関数一覧とテストカタログを生成
npx kanteen extract "src/**/*.ts"
npx kanteen analyze "tests/**/*.test.ts"

# 2. aaa_test_kanteen/exports/exports.md と
#    aaa_test_kanteen/catalog.md をLLMに渡して分析
```

**できること**:
- テストされていない関数の自動検出（高精度）
- テストの質の評価（正常系/異常系のバランス）
- 不足しているテストケースの提案
- テスト実装コードの生成

詳細は [LLM活用ガイド](./docs/LLM_GUIDE.md) を参照してください。

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
  output: './aaa_test_kanteen'  // デフォルト: GitHubで最初に表示される
};
```

**出力ディレクトリ名について**: デフォルトの`aaa_test_kanteen`は、GitHubのリポジトリブラウザでアルファベット順に最初に表示されるように設計されています。これにより、リポジトリを訪れた人がすぐにテストカタログを発見できます。

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
          "assertions": [...]
        }
      ]
    }
  ],
  "coverage": {
    "totalTests": 10,
    "totalSuites": 3
  }
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

## 多言語対応

### TypeScript/JavaScript版（本リポジトリ）

✅ **完全実装済み**
- カバレッジギャップ検出
- Jest風階層表示
- 231テスト合格

### Python版（開発予定）

🚧 **設計完了、実装待機中**

Python版は`python/`ディレクトリに設計・骨組みがあります。JSConf JP 2025後に本格実装を開始し、別リポジトリ（`test-kanteen-py`）に移行予定です。

詳細: [python/README.md](./python/README.md)

---

## ロードマップ

### TypeScript版

- [x] Phase 1: 基盤構築 ✅
- [x] Phase 2: コア機能実装 ✅
- [x] Phase 3: Reporter拡張 ✅
- [x] Phase 4: Catalog生成 ✅
- [x] Phase 5: Extract機能追加 ✅

### Python版

- [x] 設計・骨組み作成 ✅
- [ ] Phase 1: 基本実装（JSConf後）
- [ ] Phase 2: pytest/unittest対応
- [ ] Phase 3: PyPI公開

**現在の状況**:
- ✅ 24個のソースファイル
- ✅ 161個のテスト（全テスト合格）
- ✅ JSON/YAML/Markdown出力対応
- ✅ Jest/Vitest/Mocha対応
- ✅ CLIツール完備（analyze, extract, init）

詳細は[PLAN.md](./PLAN.md)を参照してください。

## ライセンス

MIT

## 貢献

Issue報告やPull Requestを歓迎します。

## ドキュメント

- [LLMを活用したテスト分析ガイド](./docs/LLM_GUIDE.md) 🆕
- [プロジェクトプラン](./PLAN.md)
- [テスト計画書](./docs/TEST_PLAN.md)
- [テスト実装サマリー](./docs/TEST_SUMMARY.md)
- [自己分析レポート](./docs/SELF_ANALYSIS.md)
