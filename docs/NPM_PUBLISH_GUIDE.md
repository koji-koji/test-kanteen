# npm公開ガイド

Test Kanteenをnpmに公開する手順

## 事前準備

### 1. npmアカウントの作成・ログイン

```bash
# npmアカウントを持っていない場合
# https://www.npmjs.com/signup でアカウント作成

# ローカルでnpmにログイン
npm login
# または
npm adduser

# ログイン確認
npm whoami
```

### 2. package.jsonの更新

必須項目を追加してください：

```bash
# package.jsonを編集
```

**追加・更新が必要な項目:**

```json
{
  "name": "test-kanteen",
  "version": "0.1.0",
  "description": "AST×Reporterでテストから観点カタログを自動生成し、LLMと人間の共通Specにするライブラリ",

  // 作者情報（必須）
  "author": "Koji Koyama <your-email@example.com>",

  // リポジトリ情報（推奨）
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/test-kanteen.git"
  },

  // バグ報告先（推奨）
  "bugs": {
    "url": "https://github.com/your-username/test-kanteen/issues"
  },

  // ホームページ（推奨）
  "homepage": "https://github.com/your-username/test-kanteen#readme",

  // 公開設定
  "private": false, // または削除（デフォルトはfalse）

  // ファイル制限（推奨）
  "files": ["dist", "README.md", "LICENSE"]
}
```

### 3. .npmignoreの作成（オプション）

公開に不要なファイルを除外：

```bash
cat > .npmignore << 'EOF'
# ソースファイル（distだけ公開）
src/
tests/
*.test.ts
*.spec.ts

# 設定ファイル
tsconfig.json
jest.config.js
.eslintrc.js
.prettierrc

# 開発用
.git/
.github/
node_modules/
coverage/
.DS_Store

# ドキュメント（README以外）
docs/
examples/
demo/

# Python関連
python/
*.pyc
__pycache__/
venv/

# 出力ディレクトリ
aaa_test_kanteen/
test-kanteen/
*_output*/
EOF
```

### 4. ライセンスの確認

```bash
# LICENSEファイルが存在するか確認
ls -la LICENSE
```

## 公開前のチェックリスト

### 1. ビルドとテスト

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# ビルド成果物の確認
ls -la dist/

# テスト実行
npm test

# リントチェック
npm run lint
```

### 2. 動作確認

```bash
# CLIコマンドの動作確認
node dist/cli/index.js --help

# ローカルインストールテスト
npm pack
# -> test-kanteen-0.1.0.tgz が生成される

# 別ディレクトリでテスト
cd /tmp
npm install /path/to/test-kanteen/test-kanteen-0.1.0.tgz
kanteen --help
```

### 3. パッケージ内容の確認

```bash
# パッケージに含まれるファイルを確認
npm pack --dry-run

# または
tar -tzf test-kanteen-0.1.0.tgz
```

## 公開手順

### 方法1: 通常の公開

```bash
# 1. 最新のビルド
npm run build

# 2. バージョンチェック
npm version

# 3. 公開（初回）
npm publish

# または、scoped packageの場合
npm publish --access public
```

### 方法2: バージョンアップして公開

```bash
# パッチバージョン（0.1.0 -> 0.1.1）
npm version patch
npm publish

# マイナーバージョン（0.1.0 -> 0.2.0）
npm version minor
npm publish

# メジャーバージョン（0.1.0 -> 1.0.0）
npm version major
npm publish
```

### 方法3: タグ付きで公開（ベータ版など）

```bash
# ベータ版として公開
npm version 0.2.0-beta.0
npm publish --tag beta

# アルファ版
npm version 0.2.0-alpha.0
npm publish --tag alpha

# ユーザーはこのようにインストール
npm install test-kanteen@beta
```

## 公開後の確認

```bash
# npmでパッケージを確認
npm view test-kanteen

# npmウェブサイトで確認
open https://www.npmjs.com/package/test-kanteen

# 実際にインストールしてテスト
cd /tmp/test-install
npm init -y
npm install test-kanteen
kanteen --help
```

## トラブルシューティング

### パッケージ名が既に使用されている

```bash
npm ERR! code E403
npm ERR! 403 403 Forbidden - PUT https://registry.npmjs.org/test-kanteen
npm ERR! 403 You do not have permission to publish "test-kanteen"
```

**解決策:**

- パッケージ名を変更: `@your-username/test-kanteen`
- または別の名前を使用

### ログインエラー

```bash
npm ERR! code ENEEDAUTH
```

**解決策:**

```bash
npm logout
npm login
```

### 2FAが有効な場合

npmで2要素認証を有効にしている場合：

```bash
npm publish --otp=123456
# 123456 は認証アプリから取得したコード
```

### 公開前のバリデーション

```bash
# package.jsonの検証
npm pkg fix

# 公開可能かチェック
npm publish --dry-run
```

## 継続的な公開フロー

### GitHub Actionsでの自動公開

`.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### セマンティックバージョニング

- **0.1.0 -> 0.1.1**: バグフィックス（patch）
- **0.1.0 -> 0.2.0**: 新機能追加（minor）
- **0.1.0 -> 1.0.0**: 破壊的変更（major）

```bash
# changelogの生成
npm install -g conventional-changelog-cli
conventional-changelog -p angular -i CHANGELOG.md -s
```

## 公開後の運用

### パッケージの更新

```bash
# 1. 変更を加える
git add .
git commit -m "feat: add new feature"

# 2. バージョンアップ
npm version patch -m "chore: bump version to %s"

# 3. 公開
npm publish

# 4. GitHubにプッシュ
git push origin main --tags
```

### パッケージの非公開化（緊急時のみ）

```bash
# 公開から72時間以内のみ可能
npm unpublish test-kanteen@0.1.0

# パッケージ全体を削除（非推奨）
npm unpublish test-kanteen --force
```

### 非推奨マーク

```bash
# 特定バージョンを非推奨に
npm deprecate test-kanteen@0.1.0 "This version has critical bugs. Please upgrade to 0.2.0"

# すべてのバージョンを非推奨に
npm deprecate test-kanteen "This package is no longer maintained"
```

## チェックリスト

公開前に以下を確認してください：

- [ ] `npm login` でログイン済み
- [ ] package.json の author, repository が正しい
- [ ] README.md が整備されている
- [ ] LICENSE ファイルが存在する
- [ ] `npm run build` が成功する
- [ ] `npm test` が全てパスする
- [ ] `npm pack --dry-run` で内容を確認
- [ ] バージョン番号が正しい
- [ ] .npmignore または package.json の files が設定済み
- [ ] CLIコマンドが動作する（`node dist/cli/index.js --help`）

## 推奨される初回公開手順

```bash
# 1. ログイン
npm login

# 2. パッケージの最終確認
npm pack --dry-run

# 3. ビルドとテスト
npm run build
npm test

# 4. 公開（dry-runで確認）
npm publish --dry-run

# 5. 実際に公開
npm publish

# 6. 確認
npm view test-kanteen
```

## 参考リンク

- [npm Documentation - Publishing packages](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [npm - About semantic versioning](https://docs.npmjs.com/about-semantic-versioning)
- [npm - Creating and publishing scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages)
