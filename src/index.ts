/**
 * Test Kanteen
 * AST×Reporterでテストから"観点カタログ"を自動生成
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { SourceLoader, ASTParser, TestFrameworkDetector } from './parser';
import { TestAnalyzer } from './analyzer';
import { CatalogGenerator } from './generator';
import { JSONReporter, MarkdownReporter } from './reporter';
import type { KanteenConfig, TestCatalog } from './types';
import { defaultConfig } from './types/config';

// すべてのエクスポート
export * from './types';
export * from './parser';
export * from './analyzer';
export * from './generator';
export * from './reporter';

/**
 * メインのAPI: テストファイルを解析してカタログを生成
 */
export async function parseTests(
  pattern: string | string[],
  config?: Partial<KanteenConfig>
): Promise<TestCatalog> {
  const finalConfig = { ...defaultConfig, ...config };

  // 1. ソースファイルの読み込み
  const loader = new SourceLoader();
  const sources = await loader.loadByPattern(pattern, {
    ignore: finalConfig.exclude,
  });

  if (sources.size === 0) {
    throw new Error(`No test files found matching pattern: ${pattern}`);
  }

  // 2. ASTパース
  const parser = new ASTParser();
  const parseResults = parser.parseMultiple(sources);

  // 3. フレームワーク検出
  const detector = new TestFrameworkDetector();
  const firstSource = sources.values().next().value;
  const framework =
    finalConfig.framework === 'auto'
      ? await detector.autoDetect(firstSource)
      : detector.getFramework(finalConfig.framework!)!;

  // 4. テスト解析
  const analyzer = new TestAnalyzer();
  const allSuites = [];

  for (const [_filePath, parseResult] of parseResults) {
    const suites = analyzer.analyze(parseResult, framework);
    allSuites.push(...suites);
  }

  // 5. カタログ生成
  const generator = new CatalogGenerator();
  const catalog = generator.generate(allSuites, {
    framework: framework.name,
    sourceFiles: Array.from(sources.keys()),
  });

  // 6. レポート出力（設定されている場合）
  if (finalConfig.output && finalConfig.reporters) {
    await outputReports(catalog, finalConfig);

    // 7. aaa_spec ガイド生成（初回のみ）
    await ensureAaaSpecGuide(finalConfig.output);
  }

  return catalog;
}

/**
 * 設定ファイルからテストを解析
 */
export async function parseTestsWithConfig(configPath: string): Promise<TestCatalog> {
  const config = await loadConfig(configPath);
  return parseTests(config.include, config);
}

/**
 * レポートを出力
 */
async function outputReports(catalog: TestCatalog, config: KanteenConfig) {
  const reporters = config.reporters || ['json'];

  for (const reporter of reporters) {
    const reporterName = typeof reporter === 'string' ? reporter : reporter.name;

    let reporterInstance;
    let extension = '';

    switch (reporterName) {
      case 'json':
        reporterInstance = new JSONReporter();
        extension = 'json';
        break;
      case 'markdown':
        reporterInstance = new MarkdownReporter();
        extension = 'md';
        break;
      default:
        console.warn(`Unknown reporter: ${reporterName}`);
        continue;
    }

    reporterInstance.onComplete(catalog);
    const outputPath = `${config.output}/catalog.${extension}`;
    await reporterInstance.writeToFile(outputPath);

    if (config.verbose) {
      console.log(`Report written to: ${outputPath}`);
    }
  }
}

/**
 * 設定ファイルを読み込む
 */
async function loadConfig(configPath: string): Promise<KanteenConfig> {
  try {
    // Dynamic importで設定ファイルを読み込む
    const config = await import(configPath);
    return { ...defaultConfig, ...(config.default || config) };
  } catch (error) {
    throw new Error(`Failed to load config from ${configPath}: ${error}`);
  }
}

/**
 * ヘルパー: 単一ファイルを解析
 */
export async function parseTestFile(filePath: string): Promise<TestCatalog> {
  return parseTests(filePath);
}

/**
 * aaa_spec/TEST_KANTEEN_GUIDE.md を生成（ファイルが存在しない場合のみ）
 */
async function ensureAaaSpecGuide(outputDir: string): Promise<void> {
  // aaa_spec ディレクトリのパス（outputDirと同階層）
  const parentDir = path.dirname(path.resolve(outputDir));
  const specDir = path.join(parentDir, 'aaa_spec');
  const guidePath = path.join(specDir, 'TEST_KANTEEN_GUIDE.md');

  // ファイルが既に存在する場合はスキップ
  const exists = await fs
    .access(guidePath)
    .then(() => true)
    .catch(() => false);

  if (exists) {
    return;
  }

  // ディレクトリ作成
  await fs.mkdir(specDir, { recursive: true });

  // ガイドコンテンツ生成
  const guideContent = generateGuideContent();
  await fs.writeFile(guidePath, guideContent, 'utf-8');

  console.log(`✨ Generated LLM guide: ${guidePath}`);
  console.log('💡 Share this file with your LLM to enable test-kanteen integration');
}

/**
 * ガイドコンテンツを生成
 */
function generateGuideContent(): string {
  return `# Test Kanteen - LLM活用ガイド

---

**🤖 LLMへのコピペ用メッセージ**

\`\`\`
このプロジェクトではtest-kanteenを使用しています。
以下のガイドを読んで、test-kanteenを理解し、積極的に活用してください。

test-kanteenは、テストコードを解析して「テスト観点カタログ」を自動生成するツールです。
あなた（LLM）は以下のカタログファイルを参照しながら、開発者のテスト設計・改善を支援してください：

- ASTカタログ: ./aaa_test_kanteen/catalog.json
- Runtimeカタログ: ./test-kanteen-runtime/runtime-catalog.json (設定されている場合)
- 比較レポート: ./test-kanteen-comparison/comparison.json (compare実行時)

【あなたの主な役割】
1. 新機能開発時: カタログを参照して必要なテストケースを提案
2. コードレビュー時: テストカバレッジの確認と改善提案
3. リファクタリング時: 既存テストへの影響を分析
4. 定期改善時: Gap分析結果からテスト品質の改善案を提示

以下に詳細なガイドがあります。必要に応じて参照してください。
\`\`\`

**👆 上記をLLMにコピー&ペーストすることで、test-kanteen活用の準備が完了します**

---

## test-kanteenとは

テストコードを解析して「テスト観点カタログ」を自動生成するツール。
AST（静的解析）とRuntime（実行結果）の比較で、テストの質を継続的に改善します。

### 3つの中心価値

1. **プランニング・開発のコンテキスト**
   - テストカタログを設計・実装の指針として活用
   - 機能追加時の影響範囲を可視化

2. **テストケースのリファインループ**
   - 未実行テスト、動的生成テストの検出
   - テスト品質の継続的改善

3. **LLM統合による高度な分析**
   - テストギャップの検出と改善提案
   - テスト設計のレビュー

## LLMとしてのあなたの役割

### 主な支援内容

1. **新機能開発時**: カタログを参照して必要なテストケースを提案
2. **コードレビュー**: テストカバレッジの確認と改善提案
3. **リファクタリング**: 既存テストへの影響を分析
4. **定期改善**: Gap分析結果からテスト品質の改善案を提示

### カタログの場所

- **ASTカタログ**: \`./aaa_test_kanteen/catalog.json\`
  - 静的解析によるテスト構造
  - テストケース、アサーション、テストスイート階層
- **Runtimeカタログ**: \`./test-kanteen-runtime/runtime-catalog.json\`
  - テスト実行結果（status, duration, errors）
  - 実際に実行されたテストの情報
- **比較レポート**: \`./test-kanteen-comparison/comparison.json\`
  - AST×Runtimeの比較結果
  - 未実行テスト、動的生成テストの検出

## 使用例

### 新機能開発時

**開発者からの依頼例**:
「新機能Xのテストケースを提案してください」

**あなたの対応**:
1. \`aaa_test_kanteen/catalog.json\` を参照
2. 既存の類似機能のテストパターンを確認
3. 同じパターンで必要なテストケースを提案
4. エッジケース、エラーハンドリングも考慮

### コードレビュー時

**開発者からの依頼例**:
「このPRのテストをレビューしてください」

**あなたの対応**:
1. PRのテストコードを確認
2. カタログと比較してカバレッジをチェック
3. 命名規則の一貫性を確認
4. 不足しているテストケースを指摘

### リファクタリング時

**開発者からの依頼例**:
「この関数をリファクタリングしたいが、どのテストに影響しますか？」

**あなたの対応**:
1. カタログで該当関数を使用しているテストを検索
2. 影響範囲をリスト化
3. リファクタリング後に確認すべきテストを提示

### 定期改善時

**開発者からの依頼例**:
「テスト品質を改善したい」

**あなたの対応**:
1. \`test-kanteen-comparison/comparison.json\` を分析
2. 未実行テストの理由を推測（スキップ、条件付き実行など）
3. 動的生成テストの妥当性を評価
4. 具体的な改善案を提示

## プロジェクト固有の情報

<!-- ユーザーがカスタマイズする領域 -->

### テスト戦略

[ここにプロジェクトのテスト戦略を記載してください]

例:
- 単体テスト: 各関数・クラスの動作を検証
- 統合テスト: コンポーネント間の連携を検証
- E2Eテスト: ユーザーシナリオ全体を検証

### 重要な観点

[ここに重視すべきテスト観点を記載してください]

例:
- エッジケース処理
- エラーハンドリング
- パフォーマンス
- セキュリティ

### テスト規約

[ここにテストの命名規則やベストプラクティスを記載してください]

例:
- テスト名: "should [期待される動作]" 形式
- 1テスト1アサーション原則
- テストデータのセットアップはbeforeEachで

---

**詳細**: https://github.com/koji-koji/test-kanteen
**LLM活用ガイド**: https://github.com/koji-koji/test-kanteen/blob/main/docs/LLM_GUIDE.md
`;
}
