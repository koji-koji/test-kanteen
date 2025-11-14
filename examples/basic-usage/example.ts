/**
 * 基本的な使用例
 */

import { parseTests } from 'test-kanteen';

async function main() {
  try {
    // テストファイルを解析
    const catalog = await parseTests('../../tests/fixtures/**/*.test.ts', {
      framework: 'jest',
      reporters: ['json', 'markdown'],
      output: './output',
      verbose: true,
    });

    console.log('Test Catalog Generated!');
    console.log('Total Tests:', catalog.coverage.totalTests);
    console.log('Total Aspects:', catalog.coverage.totalAspects);
    console.log('\nAspects:');

    catalog.aspects.forEach((aspect) => {
      console.log(`- ${aspect.category} (${aspect.testCases.length} tests)`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
