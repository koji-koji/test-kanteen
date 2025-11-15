# Claude Code 開発ガイド

このドキュメントは、Claude CodeでTest Kanteenを開発する際のガイドラインです。

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

- 新機能には必ずテストを追加
- PRには関連するテストの追加が必須
- テストカバレッジを維持・向上

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
