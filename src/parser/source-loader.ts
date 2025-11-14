import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

/**
 * ソースファイルを読み込むためのクラス
 */
export class SourceLoader {
  /**
   * 単一のファイルを読み込む
   */
  async loadFile(filePath: string): Promise<string> {
    try {
      const absolutePath = path.resolve(filePath);
      const content = await fs.readFile(absolutePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to load file: ${filePath}. Error: ${error}`);
    }
  }

  /**
   * 複数のファイルを読み込む
   */
  async loadFiles(filePaths: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          const content = await this.loadFile(filePath);
          results.set(filePath, content);
        } catch (error) {
          console.error(`Failed to load ${filePath}:`, error);
        }
      })
    );

    return results;
  }

  /**
   * Globパターンでファイルを検索して読み込む
   */
  async loadByPattern(
    pattern: string | string[],
    options?: {
      cwd?: string;
      ignore?: string[];
    }
  ): Promise<Map<string, string>> {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    const cwd = options?.cwd || process.cwd();
    const ignore = options?.ignore || ['**/node_modules/**', '**/dist/**'];

    const files = await glob(patterns, {
      cwd,
      ignore,
      absolute: true,
    });

    return this.loadFiles(files);
  }

  /**
   * ファイルが存在するかチェック
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(path.resolve(filePath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * ファイルの統計情報を取得
   */
  async getStats(filePath: string) {
    const absolutePath = path.resolve(filePath);
    return fs.stat(absolutePath);
  }
}
