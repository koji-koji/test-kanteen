# npm公開チェックリスト

Test Kanteen v0.1.0 をnpmに公開する前の最終確認

## ✅ 完了済み

- [x] package.json の author を更新 (`Koji Koyama`)
- [x] package.json に repository, bugs, homepage を追加
- [x] package.json に files フィールドを追加
- [x] keywords を追加
- [x] .npmignore を作成
- [x] ビルド成功 (`npm run build`)
- [x] パッケージ作成成功 (`npm pack`)
- [x] CLIコマンド動作確認 (`node dist/cli/index.js --help`)
- [x] パッケージサイズ確認 (56.6 kB)

## 🔧 公開前に必要な作業

### 1. GitHubリポジトリURLの更新

**現在の設定:**
```json
"repository": {
  "type": "git",
  "url": "git+https://github.com/your-username/test-kanteen.git"
}
```

**TODO:** `your-username` を実際のGitHubユーザー名に変更してください

```bash
# package.jsonを編集
# "your-username" → "actual-username" に置換
```

### 2. npmログイン

```bash
# npmにログイン（初回のみ）
npm login

# ログイン確認
npm whoami
```

**出力例:**
```
your-npm-username
```

### 3. 最終ビルド

```bash
# 最新のコードをビルド
npm run build

# テスト実行（オプション - fixturesのテストは失敗してOK）
npm test
```

## 📦 公開コマンド

### 方法1: そのまま公開

```bash
npm publish
```

### 方法2: 公開アクセス指定（scoped packageの場合）

```bash
npm publish --access public
```

### 方法3: dry-runで確認してから公開

```bash
# まず確認
npm publish --dry-run

# 問題なければ実際に公開
npm publish
```

## ✨ 公開後の確認

```bash
# 1. npmでパッケージを確認
npm view test-kanteen

# 2. 実際にインストールしてテスト
cd /tmp
mkdir test-install && cd test-install
npm init -y
npm install test-kanteen

# 3. CLIコマンドを実行
npx kanteen --help

# 4. npmウェブサイトで確認
open https://www.npmjs.com/package/test-kanteen
```

## 📝 公開情報

- **パッケージ名:** test-kanteen
- **バージョン:** 0.1.0
- **サイズ:** 56.6 kB (圧縮), 261.9 kB (展開後)
- **ファイル数:** 131
- **CLIコマンド:** kanteen
- **Node要件:** >=18.0.0

## 🚀 公開後のタスク

1. GitHubでリリースを作成
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. README.mdに npmバッジを追加
   ```markdown
   [![npm version](https://badge.fury.io/js/test-kanteen.svg)](https://www.npmjs.com/package/test-kanteen)
   [![npm downloads](https://img.shields.io/npm/dm/test-kanteen.svg)](https://www.npmjs.com/package/test-kanteen)
   ```

3. SNSで告知（オプション）
   - Twitter/X
   - JSConf JP 2025での発表準備

## 🔄 次のバージョン

次回バージョンアップ時の手順：

```bash
# 1. 変更を加える
git add .
git commit -m "feat: add new feature"

# 2. バージョンアップ（自動でgit tagも作成される）
npm version patch  # 0.1.0 -> 0.1.1
# または
npm version minor  # 0.1.0 -> 0.2.0

# 3. 公開
npm publish

# 4. GitHubにプッシュ
git push origin main --tags
```

## 📚 参考ドキュメント

- [npm公開ガイド](./docs/NPM_PUBLISH_GUIDE.md) - 詳細な手順
- [npm Documentation](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [Semantic Versioning](https://semver.org/)

## 🆘 トラブルシューティング

### パッケージ名が既に使用されている

```bash
# エラーメッセージ
npm ERR! 403 403 Forbidden - PUT https://registry.npmjs.org/test-kanteen
npm ERR! 403 You do not have permission to publish "test-kanteen"
```

**解決策:**
1. npmで `test-kanteen` を検索して既存パッケージを確認
2. パッケージ名を変更するか、scoped packageとして公開
   ```json
   "name": "@your-username/test-kanteen"
   ```

### 2要素認証エラー

```bash
npm publish --otp=123456
```
（123456 は認証アプリのコード）

### ログインエラー

```bash
npm logout
npm login
```

---

**公開準備完了！** 🎉

上記のチェックリストを確認して、問題なければ `npm publish` を実行してください。
