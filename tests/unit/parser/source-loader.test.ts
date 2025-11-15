/**
 * SourceLoader tests - Consolidated and streamlined
 *
 * Phase 2, Round 3: IMPROVEMENT_PLAN_ROUND3.md
 * - Reduced from 20 tests to 10 tests (-50%)
 * - Consolidated path handling tests (absolute/relative)
 * - Merged simple wrapper method tests (exists, getStats)
 * - Focus on core functionality, detailed scenarios moved to integration tests
 */

import { SourceLoader } from '../../../src/parser/source-loader';
import * as path from 'path';

describe('SourceLoader', () => {
  let loader: SourceLoader;
  const testDir = path.join(__dirname, '../../fixtures');

  beforeEach(() => {
    loader = new SourceLoader();
  });

  describe('loadFile', () => {
    it('should load existing file with both absolute and relative paths', async () => {
      // Absolute path
      const absolutePath = path.join(testDir, 'sample.test.ts');
      const absoluteContent = await loader.loadFile(absolutePath);
      expect(absoluteContent).toBeDefined();
      expect(typeof absoluteContent).toBe('string');
      expect(absoluteContent.length).toBeGreaterThan(0);

      // Relative path
      const relativePath = './tests/fixtures/sample.test.ts';
      const relativeContent = await loader.loadFile(relativePath);
      expect(relativeContent).toBeDefined();
      expect(typeof relativeContent).toBe('string');
    });

    it('should throw error for non-existent file', async () => {
      const filePath = path.join(testDir, 'non-existent-file.ts');
      await expect(loader.loadFile(filePath)).rejects.toThrow();
    });
  });

  describe('loadFiles', () => {
    it('should load multiple files and skip invalid ones', async () => {
      const validFiles = [
        path.join(testDir, 'sample.test.ts'),
        path.join(testDir, 'edge-cases.test.ts'),
      ];

      // All valid files
      const validResults = await loader.loadFiles(validFiles);
      expect(validResults.size).toBe(2);
      expect(validResults.get(validFiles[0])).toBeDefined();
      expect(validResults.get(validFiles[1])).toBeDefined();

      // Mixed valid and invalid files
      const mixedFiles = [
        path.join(testDir, 'sample.test.ts'),
        path.join(testDir, 'non-existent.ts'), // Invalid
      ];
      const mixedResults = await loader.loadFiles(mixedFiles);
      expect(mixedResults.size).toBe(1); // Only valid file loaded

      // Empty array
      const emptyResults = await loader.loadFiles([]);
      expect(emptyResults.size).toBe(0);
    });
  });

  describe('loadByPattern', () => {
    it('should load files matching glob patterns', async () => {
      // Single pattern
      const singleResult = await loader.loadByPattern('tests/fixtures/*.test.ts');
      expect(singleResult.size).toBeGreaterThan(0);

      // Multiple patterns
      const multiplePatterns = ['tests/fixtures/sample.test.ts', 'tests/fixtures/edge-cases.test.ts'];
      const multipleResult = await loader.loadByPattern(multiplePatterns);
      expect(multipleResult.size).toBeGreaterThanOrEqual(2);

      // No matches
      const noMatchResult = await loader.loadByPattern('non-existent-pattern-*.xyz');
      expect(noMatchResult.size).toBe(0);
    });

    it('should respect ignore patterns and default ignores', async () => {
      // Custom ignore pattern
      const customIgnoreResult = await loader.loadByPattern('tests/**/*.ts', {
        ignore: ['**/sample.test.ts'],
      });
      const customIgnorePaths = Array.from(customIgnoreResult.keys());
      const hasSample = customIgnorePaths.some((p) => p.includes('sample.test.ts'));
      expect(hasSample).toBe(false);

      // Default ignores (node_modules, dist)
      const allFilesResult = await loader.loadByPattern('**/*.ts');
      const allPaths = Array.from(allFilesResult.keys());
      const hasNodeModules = allPaths.some((p) => p.includes('node_modules'));
      const hasDist = allPaths.some((p) => p.includes('/dist/'));
      expect(hasNodeModules).toBe(false);
      expect(hasDist).toBe(false);
    });

    it('should use custom working directory when specified', async () => {
      const results = await loader.loadByPattern('*.test.ts', {
        cwd: testDir,
      });

      expect(results.size).toBeGreaterThan(0);
    });
  });

  describe('exists and getStats', () => {
    it('should check file existence for existing and non-existing files', async () => {
      // Existing file
      const existingFile = path.join(testDir, 'sample.test.ts');
      const exists = await loader.exists(existingFile);
      expect(exists).toBe(true);

      // With absolute path
      const absolutePath = path.resolve(testDir, 'sample.test.ts');
      const absoluteExists = await loader.exists(absolutePath);
      expect(absoluteExists).toBe(true);

      // Non-existent file
      const nonExistentFile = path.join(testDir, 'non-existent.ts');
      const notExists = await loader.exists(nonExistentFile);
      expect(notExists).toBe(false);
    });

    it('should return file stats for files and directories', async () => {
      // File stats
      const filePath = path.join(testDir, 'sample.test.ts');
      const fileStats = await loader.getStats(filePath);
      expect(fileStats).toBeDefined();
      expect(fileStats.isFile()).toBe(true);
      expect(fileStats.size).toBeGreaterThan(0);

      // Directory stats
      const dirStats = await loader.getStats(testDir);
      expect(dirStats.isDirectory()).toBe(true);

      // Non-existent file should throw
      const nonExistentFile = path.join(testDir, 'non-existent.ts');
      await expect(loader.getStats(nonExistentFile)).rejects.toThrow();
    });
  });
});
