# Test Kanteen

> AST×Reporterでテストから"観点カタログ"を自動生成し、LLMと人間の共通Specにするライブラリ

[JSConf JP2025 登壇資料](https://speakerdeck.com/kojikojikoji37/astxreporterdetesutokara-guan-dian-katarogu-wozi-dong-sheng-cheng-si-llmtoren-jian-nogong-tong-specnisuru)


## 概要

Test Kanteenは、テストコードを解析して自動的に「テスト観点カタログ」を生成するTypeScriptライブラリです。ESTree準拠のASTパーサーとReporterパターンを組み合わせることで、テストから意図を抽出し、LLMと人間の両方が理解できる共通仕様書を作成します。

## 特徴

- **テスト構造の可視化**: テストコードの構造を自動的に抽出
- **ランタイムカタログ生成** 🆕: Jest/Vitest/Playwrightのカスタムレポーターでテスト実行情報を収集
- **AST×Runtime比較** 🆕: 静的解析と実行時情報を比較してGap分析
- **関数・クラス抽出**: export/export defaultに完全対応した関数・クラス一覧の抽出
- **ESTree準拠**: 標準的なJavaScript ASTフォーマットを使用
- **柔軟なReporter**: カスタマイズ可能なReporターパターン
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
# 最もシンプルな使い方（デフォルト: **/*.{test,spec}.{js,jsx,ts,tsx}, json+markdown出力）
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
# 最もシンプルな使い方（デフォルト: **/*.{js,jsx,ts,tsx}, json+markdown出力）
npx kanteen extract

# 特定のパターンを指定
npx kanteen extract "src/**/*.ts"

# オプション
npx kanteen extract "lib/**/*.{js,jsx,ts,tsx}" --output ./exports --format json
```

**抽出対象**: 関数、クラス、メソッド（export/export default対応、.js/.jsx/.ts/.tsx対応）
詳細: [Extract機能ガイド](./docs/EXTRACT_GUIDE.md)

#### ランタイムカタログ生成 🆕

テスト実行時の情報（status, duration, errors）を収集してRuntimeカタログを生成します。

**Jest**:
```javascript
// jest.config.js
module.exports = {
  reporters: [
    'default',
    ['@koji-koji/test-kanteen/jest', {
      output: './test-kanteen-runtime',
      format: ['json', 'markdown']
    }]
  ]
};
```

**Vitest**:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    reporters: [
      'default',
      ['@koji-koji/test-kanteen/vitest', {
        output: './test-kanteen-runtime',
        format: ['json', 'markdown']
      }]
    ]
  }
});
```

**Playwright**:
```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['list'],
    ['@koji-koji/test-kanteen/playwright', {
      output: './test-kanteen-runtime',
      format: ['json', 'markdown']
    }]
  ]
});
```

詳細: [Jest Reporter](./docs/JEST_REPORTER.md) | [Vitest Reporter](./docs/VITEST_REPORTER.md) | [Playwright Reporter](./docs/PLAYWRIGHT_REPORTER.md)

#### AST×Runtime比較 🆕

ASTカタログとRuntimeカタログを比較してGap分析を実行します。

```bash
# 1. ASTカタログ生成
npx kanteen analyze "tests/**/*.test.ts" --output ./ast-catalog

# 2. テスト実行（Runtimeカタログが自動生成される）
npm test

# 3. 比較分析
npx kanteen compare \
  ./ast-catalog/catalog.json \
  ./test-kanteen-runtime/runtime-catalog.json \
  --format json,markdown
```

**発見できること**:
- 未実行テスト（スキップされたテスト等）
- 動的生成テスト（`test.each`等で生成されたテスト）
- テスト実行カバレッジ
- 失敗したテストの詳細情報

詳細: [Compare Command](./docs/COMPARE_COMMAND.md)

#### カスタムレポート生成 🆕

Runtime情報やCompare結果をマークダウンレポートとして一発出力できます。

**Runtimeレポート**（テスト実行結果の可視化）:
```bash
# デフォルトパスを使用（最短）
npx kanteen report runtime

# カスタムパスを指定
npx kanteen report runtime --input ./custom-path/runtime-catalog.json
```

**Compare+Runtimeレポート**（AST×Runtime比較 + 実行結果詳細）:
```bash
# デフォルトパスを使用（最短）
npx kanteen report compare

# カスタムパスを指定
npx kanteen report compare --ast ./custom/catalog.json --runtime ./custom/runtime-catalog.json
```

**デフォルトパス**:
- AST: `./aaa_test_kanteen/catalog.json`
- Runtime: `./test-kanteen-runtime/runtime-catalog.json`
- 出力先: `./test-reports/`

**レポートに含まれる情報**:
- ✅ テスト実行サマリー（passed/failed/skipped/duration）
- ❌ 失敗したテストの詳細（エラーメッセージ、スタックトレース）
- ⚠️  未実行テスト（ASTに存在するが実行されなかったテスト）
- ✨ 動的生成テスト（test.each等で実行時生成されたテスト）
- 📊 AST×Runtime比較統計（compareレポートのみ）

詳細: [カスタムレポーターガイド](./docs/CUSTOM_REPORTER.md)

#### CI/CD統合 🆕

GitHub ActionsでAST生成とカスタムレポート出力を自動化できます。

**GitHub Actionsワークフローサンプル**: [examples/workflows/](./examples/workflows/)

すぐに使えるワークフローテンプレートを3種類用意しています（基本/PRコメント/フル機能）。

**基本的な使い方**:
```yaml
- name: Generate AST catalog
  run: npx kanteen analyze

- name: Run tests
  run: npm test

- name: Generate comparison report
  run: npx kanteen report compare

- name: Upload reports
  uses: actions/upload-artifact@v4
  with:
    name: test-reports
    path: test-reports/
```

詳細: [CI/CD統合ガイド](./examples/workflows/README.md)

#### LLM統合ガイドの自動生成 🆕

test-kanteenは、初回のanalyze実行時にLLM統合ガイドを自動生成します：

```bash
npx kanteen analyze "tests/**/*.test.ts"
# → aaa_test_kanteen/TEST_KANTEEN_GUIDE.md が自動生成
```

**クイックスタート**:
1. 生成されたガイド `aaa_test_kanteen/TEST_KANTEEN_GUIDE.md` を開く
2. 🤖マークのコピペ用メッセージをLLMに貼り付け
3. LLMがtest-kanteenを理解し、テスト設計を支援開始

ガイドはユーザーがカスタマイズ可能で、一度作成されると上書きされません。

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

### カスタムレポーターの作成

Test Kanteenは独自のレポート形式を作成できます。HTMLレポート、Slack通知、CSV出力など、用途に応じたカスタムレポーターを実装可能です。

```typescript
import { BaseReporter } from 'test-kanteen';
import type { TestCatalog } from 'test-kanteen';

export class GitHubMarkdownReporter extends BaseReporter {
  generate(): string {
    const catalog = this.catalog as TestCatalog;
    return `# 📊 Test Report\n...`;
  }
}

// 使用例
const catalog = await parseTests('tests/**/*.test.ts');
const reporter = new GitHubMarkdownReporter();
reporter.onComplete(catalog);
await reporter.writeToFile('./test-reports/github.md');
```

**⚠️ 重要**: カスタムレポートは公式カタログ（`catalog.md`, `catalog.json`）を上書きしないよう、別のディレクトリ（`test-reports/`等）に保存してください。

詳細: [カスタムレポーターガイド](./docs/CUSTOM_REPORTER.md)

### 設定ファイル

`kanteen.config.js`:

```javascript
export default {
  include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
  exclude: ['**/node_modules/**'],
  framework: 'auto',
  reporters: ['json', 'markdown'],
  output: './aaa_test_kanteen', // デフォルト: GitHubで最初に表示される
};
```

**出力ディレクトリ名について**: デフォルトの`aaa_test_kanteen`は、GitHubのリポジトリブラウザでアルファベット順に最初に表示されるように設計されています。これにより、リポジトリを訪れた人がすぐにテストカタログを発見できます。

### .gitignoreの設定

生成されたカタログファイルの扱いは、プロジェクトの方針によって異なります：

#### 🔍 レビューで活用する場合（推奨）

**Gitにコミット**することで、PRレビュー時にテストカタログの変更を確認できます：

```gitignore
# .gitignore には追加しない
# aaa_test_kanteen/ をコミットすることで、
# PRレビュー時にテスト観点の変更を可視化
```

**メリット**:
- PRでテスト追加・変更を `catalog.md` の差分で確認できる
- レビュアーがテスト構造を把握しやすい
- LLMによるテスト品質レビューが可能

#### 🚫 コミットしない場合

ローカル環境でのみ使用する場合は `.gitignore` に追加：

```gitignore
# Test Kanteen
aaa_test_kanteen/
test-kanteen-runtime/
test-reports/
```

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

## ステータス

- 192個のテスト（全て合格）✅
- JSON/YAML/Markdown出力対応
- Jest/Vitest/Mocha対応
- カスタムレポーター（Jest/Vitest/Playwright）🆕
- AST×Runtime比較機能 🆕

詳細は[PLAN.md](./PLAN.md)を参照してください。

## ライセンス

MIT

## 貢献

Issue報告やPull Requestを歓迎します。

## ドキュメント

### 機能ガイド
- [LLMを活用したテスト分析ガイド](./docs/LLM_GUIDE.md) 🆕
- [Jest Reporter](./docs/JEST_REPORTER.md) 🆕
- [Vitest Reporter](./docs/VITEST_REPORTER.md) 🆕
- [Playwright Reporter](./docs/PLAYWRIGHT_REPORTER.md) 🆕
- [Compare Command](./docs/COMPARE_COMMAND.md) 🆕
- [Extract機能ガイド](./docs/EXTRACT_GUIDE.md)
- [カスタムレポーターガイド](./docs/CUSTOM_REPORTER.md) 🆕

### プロジェクト情報
- [プロジェクトプラン](./PLAN.md)
- [テスト計画書](./docs/TEST_PLAN.md)
- [テスト実装サマリー](./docs/TEST_SUMMARY.md)
- [自己分析レポート](./docs/SELF_ANALYSIS.md)
