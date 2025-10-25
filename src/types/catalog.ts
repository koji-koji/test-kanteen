/**
 * テストカタログのメタデータ
 */
export interface CatalogMetadata {
  generatedAt: string;
  version: string;
  sourceFiles: string[];
  framework: string;
  toolVersion: string;
}

/**
 * カバレッジ情報
 */
export interface CoverageInfo {
  totalTests: number;
  totalAspects: number;
  aspectCategories: Record<string, number>;
}

/**
 * テストカタログ全体の構造
 */
export interface TestCatalog {
  metadata: CatalogMetadata;
  testSuites: TestSuite[];
  aspects: TestAspect[];
  coverage: CoverageInfo;
}

/**
 * ソースコード上の位置情報
 */
export interface SourceLocation {
  file: string;
  line: number;
  column: number;
}

/**
 * セットアップ情報
 */
export interface SetupInfo {
  type: 'beforeAll' | 'beforeEach';
  description: string;
  location: SourceLocation;
}

/**
 * ティアダウン情報
 */
export interface TeardownInfo {
  type: 'afterAll' | 'afterEach';
  description: string;
  location: SourceLocation;
}

/**
 * テストスイート
 */
export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  filePath: string;
  tests: TestCase[];
  setup?: SetupInfo[];
  teardown?: TeardownInfo[];
  nestedSuites?: TestSuite[];
}

/**
 * アサーション情報
 */
export interface Assertion {
  type: string;
  expected?: unknown;
  actual?: string;
  matcher: string;
  description: string;
  location: SourceLocation;
}

/**
 * テストケース
 */
export interface TestCase {
  id: string;
  name: string;
  aspects: string[];
  assertions: Assertion[];
  dependencies: string[];
  tags: string[];
  location: SourceLocation;
  skip?: boolean;
  only?: boolean;
}

/**
 * テスト観点のカテゴリ
 */
export enum AspectCategory {
  Functionality = 'functionality',
  EdgeCase = 'edge-case',
  ErrorHandling = 'error-handling',
  Performance = 'performance',
  Security = 'security',
  Integration = 'integration',
  UnitBehavior = 'unit-behavior',
  DataValidation = 'data-validation',
  StateManagement = 'state-management',
  Accessibility = 'accessibility',
  Custom = 'custom',
}

/**
 * テスト観点
 */
export interface TestAspect {
  id: string;
  category: AspectCategory;
  description: string;
  examples: string[];
  testCases: string[];
  priority?: 'high' | 'medium' | 'low';
  metadata?: Record<string, unknown>;
}
