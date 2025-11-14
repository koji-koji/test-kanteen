# feat: test-kanteen v0.4.0 - Simplified CLI & Better Defaults

## 🎯 概要

test-kanteenの初期実装からv0.4.0への進化。CLI使用を大幅に簡素化し、より直感的で使いやすいツールになりました。

**Published to npm**: [@koji-koji/test-kanteen@0.4.0](https://www.npmjs.com/package/@koji-koji/test-kanteen)

## 📊 変更サマリー

- **バージョン**: v0.1.0 → v0.4.0
- **テスト**: 161個（全て合格）
- **パッケージサイズ**: 39.9 kB（圧縮後）、183.8 kB（展開後）

## ✨ 主な機能

### 1. 最もシンプルな使い方 🆕

```bash
# 引数なしで実行可能
npx kanteen

# extractも引数なしでOK
npx kanteen extract
```

**以前**:
```bash
pnpm dlx @koji-koji/test-kanteen analyze --format json,markdown
npx kanteen extract "src/**/*.ts"
```

**現在**:
```bash
# シンプルに
pnpm dlx @koji-koji/test-kanteen
npx kanteen extract
```

### 2. テスト観点カタログの自動生成

```bash
# デフォルト: **/*.test.ts, json+markdown出力
npx kanteen

# または明示的に
npx kanteen analyze "tests/**/*.test.ts"
```

**出力例**:
```
ASTParser
  parse
    ✓ should parse simple JavaScript code
    ✓ should parse TypeScript code
  parseMultiple
    ✓ should parse multiple sources
```

### 3. 関数・クラスの抽出

```bash
# デフォルト: **/*.{ts,tsx}, json+markdown出力
npx kanteen extract

# 特定のパターン
npx kanteen extract "lib/**/*.ts"
```

**出力**:
- 関数一覧（シグネチャ付き）
- クラスとメソッド
- .ts/.tsx両対応
- JSON/Markdown形式

### 4. LLMを活用した高度な分析

```bash
# 1. データ生成
npx kanteen extract
npx kanteen analyze

# 2. LLMで分析（aaa_test_kanteen/ の出力を使用）
```

**できること**:
- テストギャップ検出（高精度）
- テスト品質評価
- テストケース提案

詳細: [docs/LLM_GUIDE.md](./docs/LLM_GUIDE.md)

## 🔄 v0.4.0の変更内容

### Changed

- **デフォルトフォーマットを`json,markdown`に変更**: analyzeとextractコマンドのデフォルト出力を変更
- **デフォルトコマンドを`analyze`に設定**: 引数なしで`npx kanteen`を実行すると自動的にanalyzeを実行
- **extractコマンドのデフォルトパターンを`**/*.{ts,tsx}`に変更**: ライブラリプロジェクトやReactプロジェクトに対応
- **Markdown出力からFramework情報を削除**: 誤検出を防ぐため（JSON/YAMLには保持）

### Added

- **シンプルなCLI使用**:
  - `npx kanteen` だけで実行可能
  - `npx kanteen extract` だけで実行可能

### Fixed

- フレームワークを正確に検出できない場合に誤った情報が出力される問題を修正（例: PlaywrightテストをJestと誤検出）

### Migration Guide

**Before (v0.3.0)**:
```bash
pnpm dlx @koji-koji/test-kanteen analyze --format json,markdown
npx kanteen extract "src/**/*.ts"
```

**After (v0.4.0)**:
```bash
# より簡潔に
pnpm dlx @koji-koji/test-kanteen
npx kanteen extract
```

## 📁 コマンド構成

| コマンド | 説明 | デフォルトパターン | デフォルトフォーマット |
|---------|------|------------------|---------------------|
| `analyze` | テスト観点カタログ生成 | `**/*.test.ts` | `json,markdown` |
| `extract` | 関数・クラス抽出 | `**/*.{ts,tsx}` | `json,markdown` |
| `init` | 設定ファイル生成 | - | - |

## 🏗️ アーキテクチャ

```
テストファイル → AST Parser → Test Analyzer → Reporter → Catalog
ソースファイル → AST Parser → Export Extractor → JSON/Markdown
```

### 主要コンポーネント

1. **AST Parser**: ESTree準拠のJavaScript/TypeScript ASTパーサー
2. **Test Analyzer**: テスト構造と観点を抽出
3. **Export Extractor**: 関数・クラス情報を抽出（.ts/.tsx対応）
4. **Reporter**: カスタマイズ可能なReporterパターン
5. **Catalog Generator**: 最終的なカタログを生成

## 📝 バージョン履歴

### [v0.4.0] - 2025-11-15

#### Changed
- デフォルトフォーマットを`json,markdown`に変更
- デフォルトコマンドを`analyze`に設定
- extractコマンドのデフォルトパターンを`**/*.{ts,tsx}`に変更
- Markdown出力からFramework情報を削除

#### Added
- シンプルなCLI使用（引数なしで実行可能）

#### Fixed
- フレームワーク誤検出の問題を修正

### [v0.3.0] - 2025-11-15

#### Added
- `extract`コマンド: 関数・クラスの一覧抽出
- `docs/LLM_GUIDE.md`: LLM活用ガイド

#### Removed (Breaking)
- `coverage-gap`コマンド（LLM活用に移行）

#### Changed
- パッケージサイズ削減: 249.8 kB → 186.8 kB
- テスト数: 201 → 161

### [v0.2.0] - 2025-11-12

#### Added
- Jest風の階層表示
- Simple mode
- 161個のテスト

### [v0.1.0] - 2025-11-10

#### Initial Release
- AST Parser（ESTree準拠）
- Test Analyzer
- JSON/YAML/Markdown Reporter
- Jest/Vitest/Mocha対応

## 🧪 テスト

```bash
npm test
```

**結果**:
- Test Suites: 11 passed
- Tests: 161 passed
- Time: ~3s

## 📚 ドキュメント

- [README.md](./README.md) - 基本的な使い方
- [LLM活用ガイド](./docs/LLM_GUIDE.md) - LLMを使った高度な分析
- [CHANGELOG.md](./CHANGELOG.md) - 変更履歴
- [プロジェクトプラン](./PLAN.md) - 開発計画

## 🚀 インストール

```bash
npm install @koji-koji/test-kanteen
```

## 📦 使用例

### CLI

```bash
# 最もシンプル
npx kanteen

# 明示的な指定
npx kanteen analyze "tests/**/*.test.ts"
npx kanteen extract "src/**/*.{ts,tsx}"

# 出力先やフォーマットを変更
npx kanteen analyze --output ./custom --format yaml
npx kanteen extract --output ./exports --format json
```

### プログラマティック

```typescript
import { parseTests } from 'test-kanteen';

const catalog = await parseTests('./tests/**/*.test.ts', {
  framework: 'jest',
  reporters: ['json', 'markdown'],
  output: './catalog'
});
```

## 🎯 ユースケース

1. **テスト文書化**: テストコードから自動的にドキュメント生成
2. **LLM統合**: テスト観点カタログをLLMの入力として活用
3. **テストレビュー**: テスト構造の可視化
4. **CI/CD統合**: 自動テスト分析とレポート生成
5. **テストギャップ検出**: LLMを使った高精度な未テスト関数の検出

## 🔗 リンク

- **npm**: https://www.npmjs.com/package/@koji-koji/test-kanteen
- **GitHub**: https://github.com/koji-koji/test-kanteen
- **Issues**: https://github.com/koji-koji/test-kanteen/issues

## 👥 Contributors

- [@koji-koji](https://github.com/koji-koji)
- Claude (AI pair programming)

## 📄 ライセンス

MIT

---

**Ready for review** ✅

🤖 Generated with [Claude Code](https://claude.com/claude-code)
