# Test Kanteen

> AST×Reporterでテストから"観点カタログ"を自動生成し、LLMと人間の共通Specにするライブラリ

## 概要

Test Kanteenは、テストコードを解析して自動的に「テスト観点カタログ」を生成するTypeScriptライブラリです。ESTree準拠のASTパーサーとReporterパターンを組み合わせることで、テストから意図を抽出し、LLMと人間の両方が理解できる共通仕様書を作成します。

## 特徴

- **テスト構造の可視化**: テストコードの構造を自動的に抽出
- **関数・クラス抽出**: export/export defaultに完全対応した関数・クラス一覧の抽出
- **ESTree準拠**: 標準的なJavaScript ASTフォーマットを使用
- **柔軟なReporter**: カスタマイズ可能なReporterパターン
- **マルチフレームワーク対応**: Jest、Vitest、Mochaなどに対応
- **LLM統合**: LLMが理解しやすいフォーマットで出力
- **複数出力形式**: JSON、Markdown形式に対応（analyzeコマンドはYAMLにも対応）

## インストール

```bash
npm install test-kanteen
```

## 基本的な使い方

### CLI

#### テスト観点カタログ生成

```bash
# 最もシンプルな使い方（デフォルト: **/*.test.ts, json+markdown出力）
npx kanteen

# または明示的にanalyzeを指定
npx kanteen analyze "tests/**/*.test.ts"

# 出力形式を指定（デフォルト: json,markdown）
npx kanteen analyze "tests/**/*.test.ts" --format yaml

# 出力先を変更（デフォルト: ./aaa_test_kanteen）
npx kanteen analyze "tests/**/*.test.ts" --output ./custom-output

# 設定ファイルを使用
npx kanteen analyze --config kanteen.config.js
```

#### 関数・クラスの抽出 🆕

```bash
# ソースコードから関数・クラス一覧を抽出
npx kanteen extract "src/**/*.ts"

# オプション
npx kanteen extract "src/**/*.ts" --output ./exports --format json,markdown
```

**抽出対象**: 関数、クラス、メソッド（export/export default対応）
詳細: [Extract機能ガイド](./docs/EXTRACT_GUIDE.md)

#### LLM活用 🆕

出力をLLMに渡すことで高度な分析が可能です：

```bash
npx kanteen extract "src/**/*.ts"
npx kanteen analyze "tests/**/*.test.ts"
# aaa_test_kanteen/ の出力をLLMに渡して分析
```

**LLMでできること**: テストギャップ検出、テスト品質評価、テストケース提案など
詳細: [LLM活用ガイド](./docs/LLM_GUIDE.md)

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
  output: './catalog',
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
  output: './aaa_test_kanteen', // デフォルト: GitHubで最初に表示される
};
```

**出力ディレクトリ名について**: デフォルトの`aaa_test_kanteen`は、GitHubのリポジトリブラウザでアルファベット順に最初に表示されるように設計されています。これにより、リポジトリを訪れた人がすぐにテストカタログを発見できます。

## アーキテクチャ

```
テストファイル → AST Parser → Test Analyzer → Reporter → Catalog
```

カスタムReporterの作成方法など、詳細は[PLAN.md](./PLAN.md)を参照してください。

## 出力例

**Markdown形式（Jest風階層表示）:**
```
ASTParser
  parse
    ✓ should parse simple JavaScript code
    ✓ should parse TypeScript code
  parseMultiple
    ✓ should parse multiple sources
```

**JSON/YAML形式**: 構造化データとして出力
詳細な出力例は各ドキュメントを参照してください。

## 自己分析

Test Kanteen自身のテストカタログを生成することで、ツールの品質を検証しています。
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

- **TypeScript/JavaScript版**: 本リポジトリ（完全実装済み）
- **Python版**: `python/`ディレクトリに設計・骨組みあり（詳細: [python/README.md](./python/README.md)）

## ステータス

- 161個のテスト（全て合格）
- JSON/YAML/Markdown出力対応
- Jest/Vitest/Mocha対応

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
