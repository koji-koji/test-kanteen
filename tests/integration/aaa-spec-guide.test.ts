/**
 * Integration tests for aaa_spec guide generation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { parseTests } from '../../src/index';

describe('aaa_spec Guide Generation', () => {
  const tempDir = path.join(__dirname, '../tmp/aaa-spec');
  const outputDir = path.join(tempDir, 'aaa_test_kanteen');
  const specDir = path.join(tempDir, 'aaa_spec');
  const guidePath = path.join(specDir, 'TEST_KANTEEN_GUIDE.md');

  beforeEach(async () => {
    // Clean temp directory
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch {
      // Directory doesn't exist
    }
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should generate TEST_KANTEEN_GUIDE.md when analyzing tests', async () => {
    // Create test file
    const testFile = path.join(tempDir, 'example.test.ts');
    await fs.writeFile(
      testFile,
      `
describe('Example', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
`,
      'utf-8'
    );

    // Run analysis
    await parseTests(testFile, {
      output: outputDir,
      reporters: ['json'],
      framework: 'jest',
    });

    // Verify guide was generated
    const guideExists = await fs
      .access(guidePath)
      .then(() => true)
      .catch(() => false);
    expect(guideExists).toBe(true);

    // Verify guide content
    const guideContent = await fs.readFile(guidePath, 'utf-8');
    expect(guideContent).toContain('# Test Kanteen - LLM活用ガイド');
    expect(guideContent).toContain('🤖 LLMへのコピペ用メッセージ');
    expect(guideContent).toContain('このプロジェクトではtest-kanteenを使用しています');
    expect(guideContent).toContain('ASTカタログ: ./aaa_test_kanteen/catalog.json');
    expect(guideContent).toContain('【あなたの主な役割】');
    expect(guideContent).toContain('## test-kanteenとは');
    expect(guideContent).toContain('### 3つの中心価値');
    expect(guideContent).toContain('プランニング・開発のコンテキスト');
    expect(guideContent).toContain('テストケースのリファインループ');
    expect(guideContent).toContain('## 使用例');
    expect(guideContent).toContain('## プロジェクト固有の情報');
  });

  it('should not overwrite existing guide', async () => {
    // Create test file
    const testFile = path.join(tempDir, 'example.test.ts');
    await fs.writeFile(
      testFile,
      `
describe('Example', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
`,
      'utf-8'
    );

    // First analysis
    await parseTests(testFile, {
      output: outputDir,
      reporters: ['json'],
      framework: 'jest',
    });

    // Modify guide content
    const customContent = '# Custom Guide Content\nThis is a user-customized guide.';
    await fs.writeFile(guidePath, customContent, 'utf-8');

    // Second analysis
    await parseTests(testFile, {
      output: outputDir,
      reporters: ['json'],
      framework: 'jest',
    });

    // Verify guide was not overwritten
    const guideContent = await fs.readFile(guidePath, 'utf-8');
    expect(guideContent).toBe(customContent);
    expect(guideContent).not.toContain('🤖 LLMへのコピペ用メッセージ');
  });

  it('should place guide in aaa_spec directory alongside output directory', async () => {
    // Create test file
    const testFile = path.join(tempDir, 'example.test.ts');
    await fs.writeFile(
      testFile,
      `
describe('Example', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
`,
      'utf-8'
    );

    // Run analysis
    await parseTests(testFile, {
      output: outputDir,
      reporters: ['json'],
      framework: 'jest',
    });

    // Verify directory structure
    const outputDirExists = await fs
      .access(outputDir)
      .then(() => true)
      .catch(() => false);
    const specDirExists = await fs
      .access(specDir)
      .then(() => true)
      .catch(() => false);
    const guideExists = await fs
      .access(guidePath)
      .then(() => true)
      .catch(() => false);

    expect(outputDirExists).toBe(true);
    expect(specDirExists).toBe(true);
    expect(guideExists).toBe(true);

    // Verify they are siblings
    expect(path.dirname(outputDir)).toBe(path.dirname(specDir));
  });

  it('should include all essential sections in guide', async () => {
    // Create test file
    const testFile = path.join(tempDir, 'example.test.ts');
    await fs.writeFile(
      testFile,
      `
describe('Example', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
`,
      'utf-8'
    );

    // Run analysis
    await parseTests(testFile, {
      output: outputDir,
      reporters: ['json'],
      framework: 'jest',
    });

    const guideContent = await fs.readFile(guidePath, 'utf-8');

    // Essential sections
    const essentialSections = [
      '🤖 LLMへのコピペ用メッセージ',
      'test-kanteenとは',
      '3つの中心価値',
      'LLMとしてのあなたの役割',
      '主な支援内容',
      'カタログの場所',
      '使用例',
      '新機能開発時',
      'コードレビュー時',
      'リファクタリング時',
      '定期改善時',
      'プロジェクト固有の情報',
      'テスト戦略',
      '重要な観点',
      'テスト規約',
    ];

    for (const section of essentialSections) {
      expect(guideContent).toContain(section);
    }
  });
});
