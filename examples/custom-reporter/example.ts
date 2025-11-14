/**
 * カスタムReporterの使用例
 */

import { parseTests } from 'test-kanteen';
import { HTMLReporter } from './custom-reporter';

async function main() {
  try {
    // まずカタログを生成
    const catalog = await parseTests('../../tests/fixtures/**/*.test.ts', {
      framework: 'jest',
      verbose: true,
    });

    // カスタムReporterを使用
    const htmlReporter = new HTMLReporter({
      outputPath: './output/catalog.html',
    });

    htmlReporter.onComplete(catalog);
    await htmlReporter.writeToFile('./output/catalog.html');

    console.log('✅ HTML report generated: ./output/catalog.html');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
