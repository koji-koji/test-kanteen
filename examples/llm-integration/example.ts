/**
 * LLM統合の例
 * カタログをLLMに渡して分析や質問に答える
 */

import { parseTests } from 'test-kanteen';
import type { TestCatalog } from 'test-kanteen';

async function main() {
  try {
    // テストカタログを生成
    const catalog = await parseTests('../../tests/fixtures/**/*.test.ts', {
      framework: 'jest',
      verbose: true,
    });

    // LLM用のプロンプトを生成
    const prompt = generateLLMPrompt(catalog);

    console.log('=== LLM Prompt ===\n');
    console.log(prompt);
    console.log('\n=== End of Prompt ===\n');

    // ここでLLM APIを呼び出すことができます
    // 例: Claude, GPT-4, など
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * テストカタログからLLM用プロンプトを生成
 */
function generateLLMPrompt(catalog: TestCatalog): string {
  let prompt = `# Test Specification

以下は自動生成されたテスト仕様です。このテストスイートについて分析してください。

## メタデータ
- フレームワーク: ${catalog.metadata.framework}
- 生成日時: ${catalog.metadata.generatedAt}
- テスト総数: ${catalog.coverage.totalTests}

## テストスイート

`;

  catalog.testSuites.forEach((suite) => {
    prompt += `### ${suite.name}\n\n`;
    prompt += `このスイートには ${suite.tests.length} 個のテストがあります。\n\n`;

    suite.tests.forEach((test) => {
      prompt += `- **${test.name}**\n`;
      prompt += `  - 観点: ${test.aspects.join(', ')}\n`;
      prompt += `  - アサーション数: ${test.assertions.length}\n\n`;
    });
  });

  prompt += `## 観点分析

`;

  catalog.aspects.forEach((aspect) => {
    prompt += `### ${aspect.category} (優先度: ${aspect.priority})\n`;
    prompt += `${aspect.description}\n`;
    prompt += `テスト数: ${aspect.testCases.length}\n\n`;
  });

  prompt += `## 質問

1. このテストスイートのカバレッジで不足している観点はありますか？
2. 追加すべきエッジケースのテストはありますか？
3. セキュリティ面で追加すべきテストはありますか？

上記の観点から分析し、改善提案をしてください。
`;

  return prompt;
}

/**
 * カタログを構造化されたJSON形式でLLMに渡す
 */
function generateStructuredPrompt(catalog: TestCatalog): object {
  return {
    role: 'user',
    content: [
      {
        type: 'text',
        text: 'テストカタログを分析して、カバレッジの問題点と改善提案を提供してください。',
      },
      {
        type: 'test_catalog',
        catalog: {
          metadata: catalog.metadata,
          coverage: catalog.coverage,
          suites: catalog.testSuites.map((suite) => ({
            name: suite.name,
            testCount: suite.tests.length,
            aspects: suite.tests.flatMap((t) => t.aspects),
          })),
          aspects: catalog.aspects.map((aspect) => ({
            category: aspect.category,
            priority: aspect.priority,
            testCount: aspect.testCases.length,
          })),
        },
      },
    ],
  };
}

main();
