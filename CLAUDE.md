# Claude Code 開発ガイド

このドキュメントは、Claude CodeでTest Kanteenを開発する際のガイドラインです。

---

## 🤖 Claude Codeへの指示

**このプロジェクトではtest-kanteen自身を使用しています。**

以下のカタログファイルを参照しながら、test-kanteenの開発・テスト設計を支援してください：

- **ASTカタログ**: `./aaa_test_kanteen/catalog.json` / `catalog.md`
  - test-kanteen自身の全テスト（213テスト）の構造
  - 各テストの目的、アサーション、階層構造
- **プロジェクト固有ガイド**: `./aaa_spec/TEST_KANTEEN_GUIDE.md`
  - test-kanteenのテスト戦略（3層構造: unit/integration/e2e）
  - 重要な観点5つ（AST解析の正確性、マルチフレームワーク対応など）
  - テスト規約（AAA pattern、命名規則など）

### あなた（Claude Code）の主な役割

**重要**: すべての作業で、まず`aaa_test_kanteen/catalog.json`を参照してください。

1. **プランニング時（設計フェーズ）**
   - カタログから類似機能を探す
   - そのテストパターンから**要件と制約を逆算**
   - 同じ構造で新機能を設計
   - 必要なテストケースも同時に提案

   例：「XMLReporterを追加したい」
   → JSONReporter/MarkdownReporterのテストを確認
   → それらがどうテストされているかから、Reporterに必要な機能を理解
   → 同じ構造でXMLReporterを設計

2. **実装時（コーディングフェーズ）**
   - **変更対象の関数がどうテストされているかを必ず確認**
   - どのようなケースがカバーされているかをチェック
   - それらのケースを壊さないように実装
   - 新しいケースが必要なら、既存パターンに従ってテストも追加

   例：`parseTests()`関数を変更する場合
   → カタログで「parseTests」を検索
   → 正常系、異常系、エッジケースのテストを確認
   → それらすべてを壊さない実装を心がける

3. **テスト作成時**
   - 既存のテストパターンを参照
   - 同じ構造、命名規則、アサーション方法を踏襲
   - エッジケース、エラーハンドリングも既存パターンに従う

4. **コードレビュー時**
   - カタログと比較してテストカバレッジをチェック
   - テスト命名規則の一貫性を確認（`should [期待される動作]`形式）
   - 既存パターンからの逸脱を指摘

5. **リファクタリング時**
   - カタログで該当機能を使用しているテストを検索
   - 影響範囲をすべてリスト化
   - リファクタリング後に確認すべきテストを提示

6. **テスト品質改善時**
   - カタログを分析してテストの偏りを検出
   - AAA patternに従っているか確認
   - テストの独立性をチェック

### カタログの再生成

開発中にテストを追加・変更した場合、カタログを更新してください：

```bash
# 全テストのカタログ生成
npx kanteen analyze "tests/**/*.test.ts" --output ./aaa_test_kanteen

# または、単体テストのみ
npm run kanteen:self-analyze
```

**重要**: カタログを更新してから、それを参照して次のテストを設計することで、一貫性のあるテストスイートを維持できます。

---

## 開発フロー

### 基本原則

**必ずPRベースで開発する**

- mainブランチへの直接pushは避ける
- 全ての変更はfeatureブランチ経由でPRを作成
- レビュープロセスを経てマージ

### ブランチ命名規則

```
feat/機能名          - 新機能開発
fix/バグ名           - バグ修正
docs/ドキュメント名   - ドキュメント更新
refactor/対象        - リファクタリング
test/テスト名        - テスト追加・修正
chore/作業内容       - その他の作業
```

例：
- `feat/runtime-catalog-auto-generation`
- `fix/vitest-reporter-race-condition`
- `docs/update-llm-guide`

### 開発手順

#### 1. イシューの確認・作成

新機能や修正を始める前に、関連するイシューを確認または作成：

```bash
# イシュー一覧を確認
gh issue list

# 新しいイシューを作成
gh issue create --title "機能名" --body "説明"
```

#### 2. ブランチ作成

```bash
# mainブランチを最新化
git checkout main
git pull origin main

# featureブランチを作成
git checkout -b feat/feature-name
```

#### 3. 開発・コミット

```bash
# 変更を加える
# ...

# ステージング
git add .

# コミット（Conventional Commits形式）
git commit -m "feat: 機能の説明

詳細な説明...

Closes #イシュー番号
"
```

#### 4. プッシュ

```bash
# featureブランチをpush
git push origin feat/feature-name
```

#### 5. PR作成

```bash
# PRを作成
gh pr create \
  --title "feat: 機能の説明" \
  --body "$(cat <<'EOF'
## 概要
この機能の説明

## 変更内容
- 変更1
- 変更2

## テスト
- [ ] 単体テスト追加
- [ ] 統合テスト追加
- [ ] 手動テスト完了

## 関連イシュー
Closes #イシュー番号
EOF
)"
```

#### 6. レビュー・マージ

```bash
# PR状態を確認
gh pr view

# マージ（レビュー後）
gh pr merge --merge
```

### コミットメッセージ規約

**Conventional Commits形式**を使用：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `test`: テスト
- `refactor`: リファクタリング
- `chore`: その他

**例:**

```
feat: add aaa_spec/TEST_KANTEEN_GUIDE.md auto-generation

Automatically generate LLM integration guide when analyzing tests.
The guide helps LLMs understand and actively utilize test-kanteen.

Features:
- Generated in aaa_spec/ directory
- Only created if file doesn't exist
- Includes copy-paste message for LLM

Tests: 196 passed (+4 integration tests)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## リリースフロー

### バージョニング

Semantic Versioningに従う：`MAJOR.MINOR.PATCH`

- **MAJOR**: 破壊的変更
- **MINOR**: 後方互換性のある機能追加
- **PATCH**: 後方互換性のあるバグ修正

### リリース手順

#### 1. バージョン更新

```bash
# ブランチ作成
git checkout -b release/v0.x.0

# package.jsonのバージョン更新
# CHANGELOG.mdの更新
# README.mdの更新（必要に応じて）

git commit -m "chore: release v0.x.0"
```

#### 2. PR作成・マージ

```bash
gh pr create --title "chore: release v0.x.0"
gh pr merge --merge
```

#### 3. タグ作成・GitHubリリース

```bash
# mainを最新化
git checkout main
git pull origin main

# タグ作成
git tag -a v0.x.0 -m "Release v0.x.0"
git push origin v0.x.0

# GitHubリリース作成
gh release create v0.x.0 \
  --title "v0.x.0: 機能名" \
  --notes-file CHANGELOG.md
```

#### 4. npm公開

```bash
# ビルド
npm run build

# テスト
npm test

# 公開
npm publish
```

## テスト方針

### テスト実行

```bash
# 全テスト
npm test

# 単体テストのみ
npm run test:unit

# 統合テストのみ
npm run test:integration

# watchモード
npm run test:watch

# カバレッジ
npm run test:coverage
```

### テスト追加のガイドライン

#### 基本原則

- 新機能には必ずテストを追加
- PRには関連するテストの追加が必須
- テストカバレッジを維持・向上

#### テスト命名規則

**すべてのテストは`should [期待される動作]`形式で統一してください。**

```javascript
// ✅ Good: 明確で一貫性のある命名
it('should format catalog as JSON string', () => { ... });
it('should detect Jest from import statement', () => { ... });
it('should throw error for invalid TypeScript syntax', () => { ... });
it('should analyze edge case tests and generate correct catalog', () => { ... });

// ❌ Bad: Scenario形式やその他の形式
it('Scenario 1: Analyze edge case tests', () => { ... });
it('Test catalog structure', () => { ... });
it('Parses test files correctly', () => { ... });
```

**理由:**
- カタログの可読性向上: 全テストが統一されたパターンで表示される
- LLMによるパターン学習の精度向上: 一貫した形式で理解しやすい
- 新規開発者の迷い解消: 明確な命名規則が存在する
- テストの意図が明確: 「何をテストしているか」が即座に理解できる

**適用範囲:**
- 単体テスト (Unit tests)
- 統合テスト (Integration tests)
- E2Eテスト (End-to-End tests)
- すべてのテストフレームワーク (Jest, Vitest, Mocha等)

#### test-kanteenを活用したテスト設計

**ステップ1: 既存テストパターンを確認**

```bash
# カタログを最新化
npx kanteen analyze "tests/**/*.test.ts" --output ./aaa_test_kanteen

# Markdownで確認（人間に読みやすい）
cat aaa_test_kanteen/catalog.md

# JSONで確認（LLMが参照）
cat aaa_test_kanteen/catalog.json
```

**ステップ2: Claude Codeに既存パターンを参照させる**

```
aaa_test_kanteen/catalog.jsonを参照して、
[類似機能名]のテストパターンを確認してください。

同じパターンで、[新機能名]のテストケースを提案してください。
以下の観点を含めてください：
- 正常系
- 異常系（エラーハンドリング）
- エッジケース
- 境界値テスト
```

**ステップ3: テスト実装**

提案されたテストケースを実装し、以下を確認：

- [ ] テスト名が `should [期待される動作]` 形式
- [ ] AAA pattern（Arrange-Act-Assert）に従っている
- [ ] テストが独立している（他のテストに依存しない）
- [ ] beforeEach/afterEachで適切にクリーンアップ

**ステップ4: カタログ更新と検証**

```bash
# テスト実行
npm test

# カタログ再生成
npx kanteen analyze "tests/**/*.test.ts" --output ./aaa_test_kanteen

# 新しいテストがカタログに含まれているか確認
cat aaa_test_kanteen/catalog.md | grep "新機能名"
```

#### 具体例：新しいReporter追加時

```
# Claude Codeへの指示例

aaa_test_kanteen/catalog.jsonを参照して、
JSONReporterやMarkdownReporterのテストパターンを確認してください。

同じパターンで、YAMLReporterのテストケースを提案してください：
1. 基本的な生成テスト
2. pretty formatオプションのテスト
3. ファイル書き込みテスト
4. ディレクトリ自動作成テスト
5. オプションの検証テスト

各テストケースについて：
- describe/itのネスト構造
- テストデータのセットアップ方法
- アサーションの書き方
を既存パターンに合わせてください。
```

## 自己分析

test-kanteen自身でtest-kanteenを使用：

```bash
# ASTカタログ生成（全テスト）
npx kanteen analyze "tests/**/*.test.ts" --output ./aaa_test_kanteen

# ASTカタログ生成（単体テストのみ）
npm run kanteen:self-analyze

# 関数・クラス抽出
npm run kanteen:self-extract
```

## CI/CD

### GitHub Actions

- PRごとにテスト自動実行
- mainへのマージ時にビルド確認
- リリースタグ作成時に自動公開（将来実装予定）

## トラブルシューティング

### flaky testの対処

一部の統合テストでrace conditionが発生する場合：

```bash
# 該当テストのみ実行
npm test -- tests/integration/reporters/vitest-reporter.test.ts

# 複数回実行して安定性確認
for i in {1..10}; do npm test -- tests/integration/reporters/vitest-reporter.test.ts; done
```

### ビルドエラー

```bash
# node_modulesをクリーン
rm -rf node_modules package-lock.json
npm install

# distをクリーン
rm -rf dist
npm run build
```

## 参考資料

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub CLI Manual](https://cli.github.com/manual/)
