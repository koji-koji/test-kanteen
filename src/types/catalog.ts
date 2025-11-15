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
  totalSuites: number;
}

/**
 * テストカタログ全体の構造
 */
export interface TestCatalog {
  metadata: CatalogMetadata;
  testSuites: TestSuite[];
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
  totalTests?: number;
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
  assertions: Assertion[];
  dependencies: string[];
  tags: string[];
  location: SourceLocation;
  skip?: boolean;
  only?: boolean;
}

