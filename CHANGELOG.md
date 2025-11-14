# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **デフォルトフォーマットを`json,markdown`に変更**: `analyze`コマンドのデフォルト出力フォーマットを`json`から`json,markdown`に変更
- **デフォルトコマンドを`analyze`に設定**: 引数なしで`npx kanteen`を実行すると、自動的に`analyze`コマンドが実行されるように変更
- **Markdown出力からFramework情報を削除**: Markdown/CLI出力から`- **Framework**: jest`の行を削除。JSON/YAML出力には引き続き`framework`フィールドを保持（プログラマティックな利用のため）

### Added

- **シンプルなCLI使用**: `npx kanteen`だけでテスト観点カタログ生成が可能に

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
