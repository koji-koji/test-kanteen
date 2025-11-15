# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2025-11-15

### Added

#### カスタムレポーター
- **Jest Reporter** (`@koji-koji/test-kanteen/jest`): Jestテスト実行時のRuntime catalogを生成
- **Vitest Reporter** (`@koji-koji/test-kanteen/vitest`): Vitestテスト実行時のRuntime catalogを生成
- **Playwright Reporter** (`@koji-koji/test-kanteen/playwright`): Playwrightテスト実行時のRuntime catalogを生成
- Runtime catalog: テスト実行情報（status, duration, errors）を含む実行時カタログ
- 各レポーターはJSON/Markdown形式での出力をサポート

#### Compare機能
- **Compare CLI Command** (`kanteen compare <ast-catalog> <runtime-catalog>`): ASTカタログとRuntimeカタログを比較
- **Gap分析**:
  - 未実行テスト検出（スキップされたテスト等）
  - 動的生成テスト検出（`test.each`等で生成されたテスト）
  - テスト実行カバレッジ算出
- **比較レポート**: JSON/Markdown形式で詳細な比較結果を出力
- **TestMatcher**: テストの自動マッチング（Perfect/High/Medium confidence levels）

#### 新しい型定義
- `RuntimeCatalog`: 実行時カタログの型定義
- `RuntimeTest`: 実行時テスト情報の型定義（status, duration, error含む）
- `ExecutionSummary`: 実行サマリーの型定義（passed, failed, skipped等）
- `TestError`: テストエラー詳細の型定義（matcher名, expected/actual値）
- `ComparisonResult`: カタログ比較結果の型定義

#### ドキュメント
- [Jest Reporter Guide](./docs/JEST_REPORTER.md): Jestカスタムレポーターの完全ガイド
- [Vitest Reporter Guide](./docs/VITEST_REPORTER.md): Vitestカスタムレポーターの完全ガイド
- [Playwright Reporter Guide](./docs/PLAYWRIGHT_REPORTER.md): Playwrightカスタムレポーターの完全ガイド
- [Compare Command Guide](./docs/COMPARE_COMMAND.md): Compare機能の詳細ガイド

### Changed
- **テスト数**: 161 → 192 (+31テスト)
  - カスタムレポーター統合テスト: 14 tests
  - Compare機能統合テスト: 3 tests
  - TestMatcher単体テスト: 9 tests
  - E2Eテスト: 5 tests
- **README**: カスタムレポーター機能とcompareコマンドの使用方法を追加

### Fixed
- Reporter integration testsのrace condition修正（Jest/Vitest/Playwright）
- 非同期ファイル操作前のディレクトリ存在確認を追加

### Usage Example

```bash
# 1. ASTカタログ生成
npx kanteen analyze "tests/**/*.test.ts" --output ./ast-catalog

# 2. Jest/Vitest/Playwrightの設定にカスタムレポーターを追加
# (詳細はドキュメント参照)

# 3. テスト実行（Runtimeカタログが自動生成される）
npm test

# 4. 比較分析
npx kanteen compare \
  ./ast-catalog/catalog.json \
  ./test-kanteen-runtime/runtime-catalog.json \
  --format json,markdown
```

## [0.4.0] - 2025-11-15

### Changed

- **デフォルトフォーマットを`json,markdown`に変更**: `analyze`コマンドと`extract`コマンドのデフォルト出力フォーマットを`json`から`json,markdown`に変更
- **デフォルトコマンドを`analyze`に設定**: 引数なしで`npx kanteen`を実行すると、自動的に`analyze`コマンドが実行されるように変更
- **extractコマンドのデフォルトパターンを`**/*.{ts,tsx}`に変更**: ライブラリプロジェクトやReactプロジェクトにも対応。引数なしで`npx kanteen extract`が実行可能に
- **Markdown出力からFramework情報を削除**: Markdown/CLI出力から`- **Framework**: jest`の行を削除。JSON/YAML出力には引き続き`framework`フィールドを保持（プログラマティックな利用のため）

### Added

- **シンプルなCLI使用**:
  - `npx kanteen` だけでテスト観点カタログ生成が可能に
  - `npx kanteen extract` だけで関数・クラス抽出が可能に（.ts/.tsx対応）

### Fixed

- フレームワークを正確に検出できない場合に誤った情報（例: PlaywrightテストをJestと誤検出）が出力される問題を修正

### Migration Guide

**Before**:
```bash
pnpm dlx @koji-koji/test-kanteen analyze --format json,markdown
```

**After**:
```bash
# より簡潔に
pnpm dlx @koji-koji/test-kanteen
# または
npx @koji-koji/test-kanteen
```

## [0.3.0] - 2025-11-15

### Changed - BREAKING CHANGES

coverage-gapコマンドを削除し、LLM活用による高精度な分析へ移行しました。

#### 削除された機能

- **coverage-gapコマンド**: CLIからcoverage-gapコマンドを削除
- `CoverageGapAnalyzer`クラス（504行）
- `TestTargetExtractor`クラス（304行）
- 関連する型定義（`CoverageGap`, `TestTarget`, `CoverageStatus`, `Impact`）
- 40個のテスト（coverage-gap関連）

#### 理由

- マッチング精度が低い（完全一致のみ）
- 誤検知が多い（テストされているのに"untested"と判定）
- LLMの方が文脈を理解して圧倒的に高精度

### Added

- **extractコマンド**: ソースコードから関数・クラス一覧を抽出
- **docs/LLM_GUIDE.md**: LLMを活用した高度なテスト分析ガイド（319行）
- **local_plan/**: プランニングドキュメントディレクトリ
- extractは関数・クラス・メソッドのみ抽出（interface/type/variableは除外）

### Improved

- パッケージサイズ削減: 249.8 kB → 186.8 kB
- コードベース簡素化: -1,349行
- テスト数: 201 → 161（全て合格）

### Migration Guide

**Before (削除):**
```bash
npx kanteen coverage-gap "src/**/*.ts" "tests/**/*.test.ts"
```

**After (推奨):**
```bash
npx kanteen extract "src/**/*.ts"
npx kanteen analyze "tests/**/*.test.ts"
# 両方の出力をLLMに渡して分析
```

詳細: [docs/LLM_GUIDE.md](./docs/LLM_GUIDE.md)

## [0.2.0] - 2025-11-10

### Changed - BREAKING CHANGES

test-kanteenの原初的な価値である「観点カタログの作成」と「関数の抽出」に集中するため、aspects自動分類機能を削除しました。

#### 削除された機能

- **Aspects自動分類**: テストから自動的にaspect（functionality, edge-case等）を分類する機能を削除
- `TestCase.aspects` フィールド
- `TestCatalog.aspects` 配列
- `CoverageInfo.totalAspects` および `aspectCategories` フィールド
- `AspectCategory` enum
- `TestAspect` interface
- `AspectClassifier` クラス

#### 新しいCatalog構造

```typescript
// Before (v0.1.0)
{
  metadata: {...},
  testSuites: [...],
  aspects: [...],  // 削除
  coverage: {
    totalTests: 206,
    totalAspects: 8,  // 削除
    aspectCategories: {...}  // 削除
  }
}

// After (v0.2.0)
{
  metadata: {...},
  testSuites: [...],
  coverage: {
    totalTests: 206,
    totalSuites: 13
  }
}
```

#### 移行ガイド

v0.1.0からv0.2.0への移行時の注意点:

1. `catalog.aspects` は存在しなくなりました
2. `testCase.aspects` は存在しなくなりました
3. `catalog.coverage.totalAspects` および `aspectCategories` は存在しなくなりました
4. Markdown出力から「Aspects Distribution」セクションが削除されました

#### 理由

test-kanteenの本来の価値は以下の2点です:

1. **観点カタログの作成** (Primary Value): テスト構造の可視化
2. **関数の抽出** (Secondary Value): テストされていない関数の検出

aspects自動分類は副次的な機能であり、コアバリューではないと判断しました。
シンプルで明確な「テスト構造の可視化ツール」として発展させるための決断です。

### Added

- シンプルモード (`--mode simple`) のサポート継続

### Fixed

- Jest設定のtypo修正: `coverageThresholds` → `coverageThreshold`

## [0.1.0] - 2025-11-08

### Added

- 初回リリース
- テスト観点カタログ自動生成
- カバレッジギャップ検出
- Jest, Vitest, Mocha対応
- JSON, Markdown, YAML出力
- Aspects自動分類（v0.2.0で削除）
