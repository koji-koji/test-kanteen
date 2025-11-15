# テストケース改善計画

> test-kanteenのテスト観点カタログに基づく継続的改善プラン

生成日時: 2025-11-15
カタログ分析元: `./aaa_test_kanteen/catalog.json`

---

## 📊 現状分析（カタログベース）

### 統計情報

| 項目 | 値 |
|-----|-----|
| 総テスト数 | 213 |
| 総テストスイート | 68 |
| テストファイル数 | 20 |
| テスト成功率 | 195/196 (99.5%) |

### テスト分布（トップ10）

| テストスイート | テスト数 | ファイル | 観点 |
|-------------|---------|---------|------|
| Formatters | 23 | formatters.test.ts | 単体 |
| AssertionExtractor | 22 | assertion-extractor.test.ts | 単体 |
| TestFrameworkDetector | 21 | test-framework-detector.test.ts | 単体 |
| SourceLoader | 20 | source-loader.test.ts | 単体 |
| ExportExtractor | 16 | export-extractor.test.ts | 単体 |
| Main API Integration Tests | 15 | main-api.test.ts | 統合 |
| MarkdownReporter | 13 | markdown-reporter.test.ts | 単体 |
| TestAnalyzer | 11 | test-analyzer.test.ts | 単体 |
| JSONReporter | 10 | json-reporter.test.ts | 単体 |
| TestMatcher | 9 | test-matcher.test.ts | 単体 |

### テスト構造の特徴

1. **深いネスト構造**: 多くのテストが3階層のdescribeでネストされている
   ```
   Formatters
   └── JSONFormatter
       └── format
           ✓ should format catalog as JSON string
   ```

2. **AAA pattern**: ほとんどのテストでArrange-Act-Assert パターンが採用されている

3. **命名規則**: 約95%のテストが`should [期待される動作]`形式

---

## 🔍 発見された問題点

### 1. カタログの可視性の問題（優先度：高）

**問題**:
カタログのJSON出力で、トップレベルのテストスイートが`tests: 0`と表示され、実際のテスト数が見えにくい。

**例**:
```json
{
  "name": "Formatters",
  "tests": 0,  // ← 実際は23テストが存在
  "nestedSuites": 3
}
```

**影響**:
- カタログの第一印象で「テストがない」と誤解される
- LLMが正確なテスト数を把握しづらい
- 人間がカタログを見たときにテストカバレッジを判断しづらい

**解決策**:
トップレベルスイートに`totalTests`フィールドを追加し、ネスト内のテスト数を集計して表示

```json
{
  "name": "Formatters",
  "tests": 0,
  "totalTests": 23,  // ← 追加
  "nestedSuites": 3
}
```

### 2. テスト命名の一貫性（優先度：中）

**問題**:
一部のテストで命名規則が統一されていない

**例**:
```javascript
// 統一されている（95%）
it('should format catalog as JSON string', ...)
it('should detect Jest from import', ...)

// 統一されていない（5%）
it('Scenario 1: Analyze edge case tests', ...)  // E2Eテスト
```

**影響**:
- カタログの可読性が若干低下
- LLMがパターンを学習する際に混乱する可能性

**解決策**:
すべてのテストを`should [期待される動作]`形式に統一
- E2Eテストも同様: `should analyze edge case tests and generate correct catalog`

### 3. エラーハンドリングのテストカバレッジ（優先度：中）

**カタログ分析結果**:
各コンポーネントのテストを確認したところ、正常系に偏っている傾向

**不足しているテストケース例**:

#### parseTests関数
- ✅ 正常系: パターンマッチング、フレームワーク検出
- ❌ 異常系:
  - 存在しないファイルパス（一部あり）
  - 不正なTypeScript構文
  - メモリ不足時の挙動
  - タイムアウト処理

#### Reporter系
- ✅ 正常系: JSON/YAML/Markdown生成
- ❌ 異常系:
  - ディスク容量不足時
  - 書き込み権限がない場合
  - 不正なパス

**解決策**:
各コンポーネントに以下のテストパターンを追加
1. 境界値テスト
2. null/undefined処理
3. エラー条件のテスト
4. リソース制約下での挙動

### 4. 統合テストのカバレッジ（優先度：低）

**現状**:
- Reporter統合テスト: 充実（Jest/Vitest/Playwright各5テスト）
- Main API統合テスト: 15テスト
- E2Eテスト: 5テスト

**不足領域**:
- CLIからの完全なワークフロー（analyzeコマンド、extractコマンド、compareコマンドの連携）
- 複数フォーマット同時出力の動作確認
- 大規模プロジェクトでのパフォーマンステスト

---

## 🎯 改善計画（優先度順）

### フェーズ1: カタログ可視性の改善 🔴 緊急

**目的**: カタログでテスト数を正確に把握できるようにする

**タスク**:
1. `CatalogGenerator`に`totalTests`計算ロジックを追加
2. JSON/Markdown/YAML出力に`totalTests`を含める
3. テスト追加: ネストされたテストの集計を検証

**実装箇所**:
- `src/generator/catalog-generator.ts`
- `src/generator/formatters.ts`
- `tests/unit/generator/catalog-generator.test.ts`

**成功基準**:
- カタログのJSON出力で各スイートの実際のテスト数が見える
- Markdown出力で「Total: X tests」と表示される
- 既存のテストが壊れない

**期待される効果**:
- カタログの可読性向上
- LLMがテストカバレッジを正確に把握
- テスト数の把握が容易

**工数見積もり**: 2-3時間

---

### フェーズ2: テスト命名の統一 🟡 推奨

**目的**: すべてのテストを`should`形式に統一し、カタログの一貫性を向上

**タスク**:
1. E2Eテストの命名を変更
   - Before: `Scenario 1: Analyze edge case tests`
   - After: `should analyze edge case tests and generate correct catalog`
2. 命名規則をCLAUDE.mdに明記
3. 命名規則チェックのlintルールを追加（optional）

**実装箇所**:
- `tests/integration/main-api.test.ts`
- `tests/e2e/full-workflow.test.ts`
- `CLAUDE.md`

**成功基準**:
- 全213テストが`should`形式
- カタログMarkdownで統一された命名
- CLAUDE.mdに命名規則の記載

**期待される効果**:
- カタログの可読性向上
- LLMによるパターン学習の精度向上
- 新規テスト作成時の迷いがなくなる

**工数見積もり**: 1-2時間

---

### フェーズ3: エラーハンドリングテストの追加 🟢 継続的

**目的**: 各コンポーネントの異常系テストを充実させる

**優先順位付き実装**:

#### 3-1. parseTests関数のエラーハンドリング（優先度：高）

**追加するテストケース**:
```javascript
describe('parseTests - error handling', () => {
  it('should throw error for invalid TypeScript syntax', async () => {
    // 不正な構文のファイルを渡す
  });

  it('should handle circular dependencies gracefully', async () => {
    // 循環参照があるファイル
  });

  it('should provide clear error message for unsupported framework', async () => {
    // 未対応のテストフレームワーク
  });
});
```

**実装箇所**: `tests/integration/main-api.test.ts`

#### 3-2. Reporter系のエラーハンドリング（優先度：中）

**追加するテストケース**:
```javascript
describe('JSONReporter - error handling', () => {
  it('should handle write permission errors', async () => {
    // 書き込み権限のないディレクトリ
  });

  it('should handle disk full errors gracefully', async () => {
    // ディスク容量不足のシミュレーション
  });

  it('should validate output path before writing', async () => {
    // 不正なパス
  });
});
```

**実装箇所**: `tests/unit/reporter/json-reporter.test.ts`

#### 3-3. Parser系の境界値テスト（優先度：中）

**追加するテストケース**:
```javascript
describe('ASTParser - edge cases', () => {
  it('should handle empty file', async () => {
    // 空ファイル
  });

  it('should handle very large files efficiently', async () => {
    // 10MB+のファイル
  });

  it('should handle deep nesting (100+ levels)', async () => {
    // 深いネスト構造
  });
});
```

**実装箇所**: `tests/unit/parser/ast-parser.test.ts`

**成功基準**:
- 各コンポーネントに最低3つのエラーケーステストが追加される
- すべてのpublic APIがエラーハンドリングをテストされる
- カタログに異常系テストが明確に表示される

**期待される効果**:
- プロダクション環境での安定性向上
- エラーメッセージの改善
- ユーザーが問題を理解しやすくなる

**工数見積もり**: 4-6時間（分割実施可能）

---

### フェーズ4: 統合テストの拡充 🟢 継続的

**目的**: エンドツーエンドのワークフローを包括的にテスト

**追加するテストケース**:

#### 4-1. CLI完全ワークフロー

```javascript
describe('CLI E2E Workflow', () => {
  it('should execute full analyze workflow from CLI', async () => {
    // npx kanteen analyze -> catalog生成 -> 検証
  });

  it('should handle multiple commands in sequence', async () => {
    // analyze -> compare -> 結果確認
  });

  it('should respect CLI flags correctly', async () => {
    // --output, --format, --exclude など
  });
});
```

#### 4-2. 大規模プロジェクトシミュレーション

```javascript
describe('Performance with large projects', () => {
  it('should handle 1000+ test files efficiently', async () => {
    // 大量のテストファイル
  });

  it('should complete analysis within reasonable time', async () => {
    // パフォーマンス基準
  });
});
```

**実装箇所**: `tests/e2e/`

**成功基準**:
- E2Eテストが10+になる
- 実際のユースケースをカバー
- パフォーマンス基準を満たす

**期待される効果**:
- リリース前の信頼性向上
- リグレッション防止
- ユーザー体験の品質保証

**工数見積もり**: 3-4時間

---

## 🔄 改善ループの実施方法

### ループサイクル

```
1. カタログ生成
   npx kanteen analyze "tests/**/*.test.ts" --output ./aaa_test_kanteen
   ↓
2. カタログ分析（このドキュメント参照）
   - JSON/Markdownを確認
   - 不足領域を特定
   ↓
3. イシュー作成
   gh issue create --title "改善内容"
   ↓
4. ブランチ作成 & 実装
   git checkout -b test/add-error-handling
   ↓
5. PR作成 & レビュー
   gh pr create
   ↓
6. マージ
   gh pr merge --merge
   ↓
7. カタログ再生成（ステップ1へ戻る）
   改善を確認して次のイテレーションへ
```

### 推奨される実施頻度

- **フェーズ1**: 即座に実施（次のリリース前）
- **フェーズ2**: 次のリリースサイクル
- **フェーズ3**: 継続的に実施（毎週1-2テストケース追加）
- **フェーズ4**: 月次で実施

---

## 📋 次のアクション

### 今すぐ実施（推奨）

**フェーズ1: カタログ可視性の改善**

1. イシュー作成
   ```bash
   gh issue create \
     --title "Add totalTests field to test suites in catalog" \
     --body "カタログでネストされたテスト数を可視化"
   ```

2. ブランチ作成
   ```bash
   git checkout -b feat/add-total-tests-to-catalog
   ```

3. 実装
   - `src/generator/catalog-generator.ts`: 再帰的にテスト数を集計
   - `src/types/catalog.ts`: TestSuite型に`totalTests?: number`追加
   - `src/generator/formatters.ts`: 出力フォーマットに反映

4. テスト追加
   - ネストされたテストの集計を検証
   - 既存テストが壊れないことを確認

5. PR作成 & マージ

6. カタログ再生成して改善を確認

### 継続的に実施

- 毎週: フェーズ3のテストケース1-2個追加
- 毎月: カタログを再分析して新しい改善ポイントを特定
- リリース前: フェーズ2の命名統一を実施

---

## 📊 成功指標

### 定量的指標

| 指標 | 現状 | 目標（3ヶ月後） |
|-----|------|----------------|
| 総テスト数 | 213 | 250+ |
| テスト成功率 | 99.5% | 100% |
| エラーハンドリングテスト | ~10% | 30%+ |
| E2Eテスト | 5 | 15+ |
| カタログの可読性 | 中 | 高 |

### 定性的指標

- [ ] カタログを見て、すぐにテストカバレッジが把握できる
- [ ] LLMが既存パターンを正確に理解できる
- [ ] 新規開発者がテスト規約を迷わず理解できる
- [ ] リリース前に自信を持てる品質レベル

---

## 🎓 学んだパターン（カタログから）

### 良いパターン

1. **AAA pattern の徹底**
   ```javascript
   it('should format catalog as JSON string', () => {
     // Arrange
     const formatter = new JSONFormatter();
     const mockCatalog = { ... };

     // Act
     const result = formatter.format(mockCatalog);

     // Assert
     expect(result).toContain('...');
   });
   ```

2. **beforeEach での初期化**
   - テストの独立性を保つ
   - 共通セットアップを再利用

3. **describe のネスト**
   - 論理的なグループ化
   - カタログでの可読性向上

### 改善すべきパターン

1. **エラーケースの不足**
   - 正常系に偏っている
   - try-catchのテストが少ない

2. **パフォーマンステストの欠如**
   - 大規模データでのテストがない
   - タイムアウト処理のテストがない

---

**次のステップ**: フェーズ1の実装に進む
