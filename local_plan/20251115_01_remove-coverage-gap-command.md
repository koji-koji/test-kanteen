# coverage-gapコマンドの削除とLLM活用への移行

## 背景・課題

現在、test-kanteenには以下の3つのコマンドがあります：

1. `extract` - ソースコードから関数・クラスを抽出
2. `analyze` - テストファイルからテスト観点カタログを生成
3. `coverage-gap` - 両者を比較してuntested関数を検出

しかし、`coverage-gap`コマンドには以下の問題があります：

- **名前が分かりにくい**: "coverage"という言葉がコードカバレッジを連想させる
- **マッチング精度が低い**: 完全一致のみで、実際にテストされているのに"untested"と判定される
- **誤信頼のリスク**: "tested"と判定されても実際には不十分な可能性
- **保守コストが高い**: マッチングロジックの改善・保守が必要

## 現状分析

### マッチングロジックの問題点

**src/analyzer/coverage-gap-analyzer.ts:265-286**

```typescript
private isMatch(exp: ExportInfo, target: TestTarget): boolean {
  // 名前が完全一致
  if (exp.name === target.targetName) {
    return true;
  }

  // クラスのメソッドチェック
  if (exp.type === 'method' && exp.parent) {
    if (exp.parent === target.targetName) {
      return true;
    }
    const fullName = `${exp.parent}.${exp.name}`;
    if (fullName === target.targetName) {
      return true;
    }
  }

  return false;
}
```

### 検出できないケース

```typescript
// ケース1: describeとテスト対象が一致しない
describe('Main API', () => {
  test('parseTests should work', () => {
    // parseTestsをテストしているが、
    // target.targetName = "Main API" なので一致しない
  })
})

// ケース2: 抽象クラスのメソッド
class BaseReporter {
  onTestSuite() {} // 抽象メソッド
}
// サブクラスでテストされているが "untested" と判定される
```

### 実際の検出結果（test-kanteen自身）

```
Total Exports: 51
✅ Tested: 45 (88.2%)
❌ Untested: 6

⚠️ Untested Exports:
- parseTestsWithConfig (function)
- BaseReporter (class)
- onTestSuite (method)
- onTestCase (method)
- onComplete (method)
- writeToFile (method)
```

しかし、`BaseReporter`のメソッドは抽象メソッドで、実際には`JSONReporter`や`MarkdownReporter`でテストされています。

## 提案

**coverage-gapコマンドを削除し、LLM活用を推奨する方針に変更**

### 理由

1. **LLMの方が精度が高い**
   - 文脈を理解してマッチングできる
   - テストの内容を読んで実際にテストされているか判断できる
   - 柔軟な分析が可能

2. **test-kanteenはシンプルに**
   - コアな機能（extract, analyze）に集中
   - 複雑なマッチングロジックを保守しない

3. **ユーザーの使い方に合致**
   - test-kanteenの出力をLLMに渡す使い方が自然
   - より高度な分析が可能

## 実装計画

### Phase 1: coverage-gap関連コードの削除

1. **CLIコマンドの削除**
   - `src/cli/index.ts` から coverage-gap コマンドを削除

2. **アナライザーの削除**
   - `src/analyzer/coverage-gap-analyzer.ts` を削除
   - `src/analyzer/test-target-extractor.ts` を削除（coverage-gapのみで使用）

3. **型定義の整理**
   - `src/types/index.ts` から以下を削除:
     - `CoverageGapReport`
     - `CoverageGap`
     - `CoverageGapSummary`
     - `TestTarget`
     - `CoverageStatus`
     - `Impact`

4. **テストの削除**
   - `tests/unit/analyzer/coverage-gap-analyzer.test.ts` を削除
   - `tests/unit/analyzer/test-target-extractor.test.ts` を削除
   - `tests/integration/coverage-gap.test.ts` を削除

### Phase 2: ドキュメントの更新

1. **README.mdの更新**
   - coverage-gapコマンドのセクションを削除
   - 新しいセクション「LLMを活用した分析」を追加

2. **LLM活用ガイドの作成**
   - `docs/LLM_GUIDE.md` を作成
   - extractとanalyzeの出力をLLMに渡す方法
   - プロンプト例の提供

### Phase 3: テストの確認

1. 全テストが通ることを確認
2. テスト数の更新（201 → 削減後の数）

## 影響範囲

### 削除するファイル

```
src/analyzer/coverage-gap-analyzer.ts
src/analyzer/test-target-extractor.ts
tests/unit/analyzer/coverage-gap-analyzer.test.ts
tests/unit/analyzer/test-target-extractor.test.ts
tests/integration/coverage-gap.test.ts
```

### 変更するファイル

```
src/cli/index.ts                  - coverage-gapコマンド削除
src/types/index.ts                - 型定義削除
README.md                         - ドキュメント更新
```

### 追加するファイル

```
docs/LLM_GUIDE.md                 - LLM活用ガイド
```

### テストへの影響

- 削除: 約40テスト（coverage-gap-analyzer, test-target-extractor, integration）
- 残り: 約160テスト
- すべてのテストが通ることを確認

## 判断基準

### この変更を採用する理由

1. **精度**: LLMの方が圧倒的に正確
2. **保守性**: シンプルなコードベース
3. **柔軟性**: ユーザーが自由に分析できる
4. **実用性**: test-kanteenの実際の使い方に合致

### 代替案との比較

#### 案A: マッチングロジックを改善
- ❌ 完璧なマッチングは困難
- ❌ 保守コストが高い
- ❌ 複雑化する

#### 案B: coverage-gapコマンドを削除（採用）
- ✅ シンプル
- ✅ LLMで高精度な分析が可能
- ✅ 保守コストが低い

#### 案C: gapコマンドとして簡略化
- △ 精度が低いまま
- ❌ 誤検知による混乱
- ❌ 中途半端

## 次のステップ

### 実装後

1. **バージョンアップ**: v0.2.0 → v0.3.0（機能削除のため）
2. **CHANGELOG更新**: 破壊的変更として記載
3. **npm publish**: 新バージョンの公開
4. **ドキュメント**: LLM_GUIDE.mdの充実

### 将来的な検討事項

- LLM統合機能の追加（オプション）
- プロンプトテンプレートの提供
- CI/CD統合の例

## LLM活用ガイド（プレビュー）

### 基本的な使い方

```bash
# 1. 関数一覧を抽出
npx kanteen extract "src/**/*.ts"

# 2. テスト観点カタログを生成
npx kanteen analyze "tests/**/*.test.ts"

# 3. 両方のファイルをLLMに渡す
# aaa_test_kanteen/exports/exports.md
# aaa_test_kanteen/catalog.md
```

### プロンプト例

```
以下の2つのファイルを比較して、テストされていない関数を教えてください：

1. 関数一覧（exports.md）
[ファイル内容]

2. テスト観点カタログ（catalog.md）
[ファイル内容]

テストされていない関数をリストアップし、優先度（public API > private関数）を付けてください。
```

## 決定事項

- [ ] このプランを承認
- [ ] Phase 1の実装を開始
- [ ] Phase 2のドキュメント作成
- [ ] Phase 3のテスト確認

---

作成日: 2025-11-15
最終更新: 2025-11-15
