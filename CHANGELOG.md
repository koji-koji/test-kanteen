# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
