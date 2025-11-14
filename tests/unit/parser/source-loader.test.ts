import { SourceLoader } from '../../../src/parser/source-loader';
import * as path from 'path';

describe('SourceLoader', () => {
  let loader: SourceLoader;
  const testDir = path.join(__dirname, '../../fixtures');

  beforeEach(() => {
    loader = new SourceLoader();
  });

  describe('loadFile', () => {
    it('should load existing file', async () => {
      const filePath = path.join(testDir, 'sample.test.ts');
      const content = await loader.loadFile(filePath);

      expect(content).toBeDefined();
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent file', async () => {
      const filePath = path.join(testDir, 'non-existent-file.ts');

      await expect(loader.loadFile(filePath)).rejects.toThrow();
    });

    it('should handle absolute paths', async () => {
      const filePath = path.resolve(testDir, 'sample.test.ts');
      const content = await loader.loadFile(filePath);

      expect(content).toBeDefined();
    });

    it('should handle relative paths', async () => {
      const filePath = './tests/fixtures/sample.test.ts';
      const content = await loader.loadFile(filePath);

      expect(content).toBeDefined();
    });
  });

  describe('loadFiles', () => {
    it('should load multiple files', async () => {
      const files = [
        path.join(testDir, 'sample.test.ts'),
        path.join(testDir, 'edge-cases.test.ts'),
      ];

      const results = await loader.loadFiles(files);

      expect(results.size).toBe(2);
      expect(results.get(files[0])).toBeDefined();
      expect(results.get(files[1])).toBeDefined();
    });

    it('should handle empty array', async () => {
      const results = await loader.loadFiles([]);

      expect(results.size).toBe(0);
    });

    it('should skip files that fail to load', async () => {
      const files = [
        path.join(testDir, 'sample.test.ts'),
        path.join(testDir, 'non-existent.ts'),
      ];

      const results = await loader.loadFiles(files);

      // Should only load the valid file
      expect(results.size).toBe(1);
    });
  });

  describe('loadByPattern', () => {
    it('should load files matching pattern', async () => {
      const results = await loader.loadByPattern('tests/fixtures/*.test.ts');

      expect(results.size).toBeGreaterThan(0);
    });

    it('should handle multiple patterns', async () => {
      const patterns = ['tests/fixtures/sample.test.ts', 'tests/fixtures/edge-cases.test.ts'];
      const results = await loader.loadByPattern(patterns);

      expect(results.size).toBeGreaterThanOrEqual(2);
    });

    it('should respect ignore patterns', async () => {
      const results = await loader.loadByPattern('tests/**/*.ts', {
        ignore: ['**/sample.test.ts'],
      });

      const filePaths = Array.from(results.keys());
      const hasSample = filePaths.some((p) => p.includes('sample.test.ts'));

      expect(hasSample).toBe(false);
    });

    it('should use custom cwd', async () => {
      const results = await loader.loadByPattern('*.test.ts', {
        cwd: testDir,
      });

      expect(results.size).toBeGreaterThan(0);
    });

    it('should return empty map for no matches', async () => {
      const results = await loader.loadByPattern('non-existent-pattern-*.xyz');

      expect(results.size).toBe(0);
    });

    it('should ignore node_modules by default', async () => {
      const results = await loader.loadByPattern('**/*.ts');

      const filePaths = Array.from(results.keys());
      const hasNodeModules = filePaths.some((p) => p.includes('node_modules'));

      expect(hasNodeModules).toBe(false);
    });

    it('should ignore dist by default', async () => {
      const results = await loader.loadByPattern('**/*.ts');

      const filePaths = Array.from(results.keys());
      const hasDist = filePaths.some((p) => p.includes('/dist/'));

      expect(hasDist).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const filePath = path.join(testDir, 'sample.test.ts');
      const exists = await loader.exists(filePath);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const filePath = path.join(testDir, 'non-existent.ts');
      const exists = await loader.exists(filePath);

      expect(exists).toBe(false);
    });

    it('should handle absolute paths', async () => {
      const filePath = path.resolve(testDir, 'sample.test.ts');
      const exists = await loader.exists(filePath);

      expect(exists).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return file stats', async () => {
      const filePath = path.join(testDir, 'sample.test.ts');
      const stats = await loader.getStats(filePath);

      expect(stats).toBeDefined();
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should throw error for non-existent file', async () => {
      const filePath = path.join(testDir, 'non-existent.ts');

      await expect(loader.getStats(filePath)).rejects.toThrow();
    });

    it('should work with directories', async () => {
      const stats = await loader.getStats(testDir);

      expect(stats.isDirectory()).toBe(true);
    });
  });
});
