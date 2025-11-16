/**
 * Test Matcher - Matches tests between AST and Runtime catalogs
 */

import type { TestCatalog, TestCase, RuntimeCatalog, RuntimeTestCase } from '../types';

/**
 * Match confidence levels
 */
export type MatchType = 'perfect' | 'high-confidence' | 'medium-confidence' | 'unmatched';

/**
 * Result of matching a single test
 */
export interface MatchResult {
  /** AST test (if found) */
  astTest?: TestCase;
  /** Runtime test (if found) */
  runtimeTest?: RuntimeTestCase;
  /** Type of match */
  matchType: MatchType;
  /** Confidence score (0-100) */
  confidence: number;
  /** Reasons for the match or mismatch */
  reasons?: string[];
}

/**
 * Result of comparing AST and Runtime catalogs
 */
export interface ComparisonResult {
  /** All matched and unmatched tests */
  matches: MatchResult[];
  /** Tests only in runtime (dynamically generated) */
  runtimeOnly: RuntimeTestCase[];
  /** Tests only in AST (not executed) */
  astOnly: TestCase[];
  /** Statistics about the comparison */
  statistics: ComparisonStatistics;
}

/**
 * Statistics about test matching
 */
export interface ComparisonStatistics {
  /** Total tests in AST catalog */
  totalAstTests: number;
  /** Total tests in runtime catalog */
  totalRuntimeTests: number;
  /** Number of perfect matches */
  perfectMatches: number;
  /** Number of high confidence matches */
  highConfidenceMatches: number;
  /** Number of medium confidence matches */
  mediumConfidenceMatches: number;
  /** Number of unmatched AST tests */
  unmatchedAst: number;
  /** Number of unmatched runtime tests */
  unmatchedRuntime: number;
}

/**
 * Test matcher configuration
 */
export interface TestMatcherConfig {
  /** Perfect match threshold (default: 100) */
  perfectThreshold?: number;
  /** High confidence threshold (default: 90) */
  highConfidenceThreshold?: number;
  /** Medium confidence threshold (default: 70) */
  mediumConfidenceThreshold?: number;
  /** Case sensitive test name matching (default: false) */
  caseSensitive?: boolean;
}

/**
 * Test matcher for comparing AST and Runtime catalogs
 */
export class TestMatcher {
  private perfectThreshold: number;
  private highConfidenceThreshold: number;
  private mediumConfidenceThreshold: number;
  private caseSensitive: boolean;

  constructor(config: TestMatcherConfig = {}) {
    this.perfectThreshold = config.perfectThreshold ?? 100;
    this.highConfidenceThreshold = config.highConfidenceThreshold ?? 90;
    this.mediumConfidenceThreshold = config.mediumConfidenceThreshold ?? 70;
    this.caseSensitive = config.caseSensitive ?? false;
  }

  /**
   * Compare AST catalog with Runtime catalog
   */
  compare(astCatalog: TestCatalog, runtimeCatalog: RuntimeCatalog): ComparisonResult {
    const astTests = this.flattenTests(astCatalog);
    const runtimeTests = this.flattenRuntimeTests(runtimeCatalog);

    const matches: MatchResult[] = [];
    const matchedAstIds = new Set<string>();
    const matchedRuntimeIds = new Set<string>();

    // Find matches for each runtime test
    for (const runtimeTest of runtimeTests) {
      let bestMatch: { astTest: TestCase; score: number; reasons: string[] } | null = null;

      for (const astTest of astTests) {
        if (matchedAstIds.has(astTest.id)) continue;

        const { score, reasons } = this.matchTest(astTest, runtimeTest);

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { astTest, score, reasons };
        }
      }

      if (bestMatch && bestMatch.score >= this.mediumConfidenceThreshold) {
        matchedAstIds.add(bestMatch.astTest.id);
        matchedRuntimeIds.add(runtimeTest.id);

        matches.push({
          astTest: bestMatch.astTest,
          runtimeTest,
          matchType: this.getMatchType(bestMatch.score),
          confidence: bestMatch.score,
          reasons: bestMatch.reasons,
        });
      } else {
        // Unmatched runtime test (likely dynamically generated)
        matches.push({
          runtimeTest,
          matchType: 'unmatched',
          confidence: bestMatch?.score ?? 0,
          reasons: bestMatch?.reasons ?? ['No matching AST test found'],
        });
      }
    }

    // Find unmatched AST tests
    const astOnly = astTests.filter((test) => !matchedAstIds.has(test.id));
    const runtimeOnly = runtimeTests.filter((test) => !matchedRuntimeIds.has(test.id));

    // Add unmatched AST tests to matches
    for (const astTest of astOnly) {
      matches.push({
        astTest,
        matchType: 'unmatched',
        confidence: 0,
        reasons: ['Test exists in AST but was not executed'],
      });
    }

    return {
      matches,
      runtimeOnly,
      astOnly,
      statistics: this.calculateStatistics(matches, astTests.length, runtimeTests.length),
    };
  }

  /**
   * Match a single AST test with a runtime test
   */
  private matchTest(
    astTest: TestCase,
    runtimeTest: RuntimeTestCase
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // File path matching (40 points)
    const astPath = this.normalizeFilePath(astTest.location.file);
    const runtimePath = this.normalizeFilePath(runtimeTest.location.file);

    if (astPath === runtimePath) {
      score += 40;
      reasons.push('File path matches');
    } else {
      reasons.push(`File path mismatch: ${astPath} vs ${runtimePath}`);
    }

    // Suite hierarchy matching (30 points)
    const astSuitePath = this.getSuitePath(astTest);
    const runtimeSuitePath = this.getSuitePath(runtimeTest);

    if (astSuitePath === runtimeSuitePath) {
      score += 30;
      reasons.push('Suite path matches');
    } else {
      // Partial suite match
      const astParts = astSuitePath.split(' › ');
      const runtimeParts = runtimeSuitePath.split(' › ');
      const commonParts = this.countCommonParts(astParts, runtimeParts);

      if (commonParts > 0) {
        const partialScore = Math.floor(
          (commonParts / Math.max(astParts.length, runtimeParts.length)) * 30
        );
        score += partialScore;
        reasons.push(
          `Partial suite match: ${commonParts}/${Math.max(astParts.length, runtimeParts.length)} parts`
        );
      } else {
        reasons.push(`Suite path mismatch: ${astSuitePath} vs ${runtimeSuitePath}`);
      }
    }

    // Test name matching (30 points)
    const astName = this.normalizeTestName(astTest.name);
    const runtimeName = this.normalizeTestName(runtimeTest.name);

    if (astName === runtimeName) {
      score += 30;
      reasons.push('Test name matches');
    } else {
      // Check for partial match (test.each patterns)
      if (astName.includes('%') || runtimeName.includes('$')) {
        // Likely test.each pattern
        const similarity = this.calculateStringSimilarity(astName, runtimeName);
        if (similarity > 0.7) {
          const partialScore = Math.floor(similarity * 30);
          score += partialScore;
          reasons.push(
            `Partial test name match (likely test.each): ${Math.round(similarity * 100)}% similar`
          );
        } else {
          reasons.push(`Test name mismatch: ${astName} vs ${runtimeName}`);
        }
      } else {
        reasons.push(`Test name mismatch: ${astName} vs ${runtimeName}`);
      }
    }

    // Line number bonus (up to 10 points)
    if (astTest.location.line && runtimeTest.location.line) {
      const lineDiff = Math.abs(astTest.location.line - runtimeTest.location.line);

      if (lineDiff === 0) {
        score += 10;
        reasons.push('Line number matches exactly');
      } else if (lineDiff <= 5) {
        const lineScore = 10 - lineDiff;
        score += lineScore;
        reasons.push(`Line number close: ${lineDiff} lines apart`);
      } else {
        reasons.push(`Line number differs by ${lineDiff} lines`);
      }
    }

    return { score, reasons };
  }

  /**
   * Normalize file path for comparison
   */
  private normalizeFilePath(filePath: string): string {
    // Convert to forward slashes and resolve
    const normalized = filePath.replace(/\\/g, '/');
    // Get relative path from cwd if possible
    const cwd = process.cwd().replace(/\\/g, '/');
    if (normalized.startsWith(cwd)) {
      return normalized.substring(cwd.length + 1);
    }
    return normalized;
  }

  /**
   * Get suite path (hierarchy) for a test
   */
  private getSuitePath(_test: TestCase | RuntimeTestCase): string {
    // For now, we don't have suite path in TestCase
    // This would need to be added during AST analysis
    // Return empty string for now
    return '';
  }

  /**
   * Normalize test name for comparison
   */
  private normalizeTestName(name: string): string {
    if (this.caseSensitive) {
      return name.trim();
    }
    return name.trim().toLowerCase();
  }

  /**
   * Count common parts in two arrays
   */
  private countCommonParts(arr1: string[], arr2: string[]): number {
    let count = 0;
    const minLength = Math.min(arr1.length, arr2.length);

    for (let i = 0; i < minLength; i++) {
      if (arr1[i] === arr2[i]) {
        count++;
      } else {
        break; // Stop at first mismatch
      }
    }

    return count;
  }

  /**
   * Calculate string similarity (simple Levenshtein-based)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get match type based on confidence score
   */
  private getMatchType(score: number): MatchType {
    if (score >= this.perfectThreshold) {
      return 'perfect';
    } else if (score >= this.highConfidenceThreshold) {
      return 'high-confidence';
    } else if (score >= this.mediumConfidenceThreshold) {
      return 'medium-confidence';
    } else {
      return 'unmatched';
    }
  }

  /**
   * Flatten test catalog to list of tests
   */
  private flattenTests(catalog: TestCatalog): TestCase[] {
    const tests: TestCase[] = [];

    const processSuite = (suite: TestCatalog['testSuites'][0]) => {
      tests.push(...suite.tests);

      if (suite.nestedSuites) {
        for (const nested of suite.nestedSuites) {
          processSuite(nested);
        }
      }
    };

    for (const suite of catalog.testSuites) {
      processSuite(suite);
    }

    return tests;
  }

  /**
   * Flatten runtime catalog to list of tests
   */
  private flattenRuntimeTests(catalog: RuntimeCatalog): RuntimeTestCase[] {
    const tests: RuntimeTestCase[] = [];

    const processSuite = (suite: RuntimeCatalog['testSuites'][0]) => {
      tests.push(...suite.tests);

      if (suite.nestedSuites) {
        for (const nested of suite.nestedSuites) {
          processSuite(nested);
        }
      }
    };

    for (const suite of catalog.testSuites) {
      processSuite(suite);
    }

    return tests;
  }

  /**
   * Calculate comparison statistics
   */
  private calculateStatistics(
    matches: MatchResult[],
    totalAstTests: number,
    totalRuntimeTests: number
  ): ComparisonStatistics {
    const stats: ComparisonStatistics = {
      totalAstTests,
      totalRuntimeTests,
      perfectMatches: 0,
      highConfidenceMatches: 0,
      mediumConfidenceMatches: 0,
      unmatchedAst: 0,
      unmatchedRuntime: 0,
    };

    for (const match of matches) {
      switch (match.matchType) {
        case 'perfect':
          stats.perfectMatches++;
          break;
        case 'high-confidence':
          stats.highConfidenceMatches++;
          break;
        case 'medium-confidence':
          stats.mediumConfidenceMatches++;
          break;
        case 'unmatched':
          if (match.astTest && !match.runtimeTest) {
            stats.unmatchedAst++;
          } else if (match.runtimeTest && !match.astTest) {
            stats.unmatchedRuntime++;
          }
          break;
      }
    }

    return stats;
  }
}
