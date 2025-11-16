# 🧪 Test Execution Report

> Generated at 2025/11/16 8:08:02

## 📊 Execution Summary

- **Total Tests**: 191
- **✅ Passed**: 187
- **❌ Failed**: 4
- **⏭️  Skipped**: 0
- **⏱️  Total Duration**: 4104ms
- **Execution Time**: 2025/11/16 8:07:49

## ❌ Failed Tests

### should handle multiple output formats and glob patterns

**Suite**: CLI E2E Workflow

**File**: `/Users/koyama.koji/git/self/test-kanteen/tests/e2e/cli-workflow.test.ts:0`

**Duration**: 1ms

**Error**:
```
Error: ENOENT: no such file or directory, mkdir '/Users/koyama.koji/git/self/test-kanteen/tests/tmp/cli-e2e-80653-1763248072507'
    at Object.mkdir (node:internal/fs/promises:857:10)
    at Object.<anonymous> (/Users/koyama.koji/git/self/test-kanteen/tests/e2e/cli-workflow.test.ts:115:5)
```

### should handle concurrent writes to the same file

**Suite**: error handling

**File**: `/Users/koyama.koji/git/self/test-kanteen/tests/unit/reporter/json-reporter.test.ts:0`

**Duration**: 1ms

**Error**:
```
Error: ENOENT: no such file or directory, open '/Users/koyama.koji/git/self/test-kanteen/tests/tmp/concurrent.json'
    at open (node:internal/fs/promises:638:25)
    at Object.readFile (node:internal/fs/promises:1238:14)
    at Object.<anonymous> (/Users/koyama.koji/git/self/test-kanteen/tests/unit/reporter/json-reporter.test.ts:243:23)
```

### should handle large codebase with multiple directories efficiently

**Suite**: Performance with large projects

**File**: `/Users/koyama.koji/git/self/test-kanteen/tests/e2e/performance.test.ts:0`

**Duration**: 987ms

**Error**:
```
Error: Command failed: node "/Users/koyama.koji/git/self/test-kanteen/dist/cli/index.js" analyze "/Users/koyama.koji/git/self/test-kanteen/tests/tmp/large-project-80668-1763248072439/large-codebase/**/*.test.ts" --output "/Users/koyama.koji/git/self/test-kanteen/tests/tmp/large-project-80668-1763248072439/large-codebase/output" --format json,markdown
❌ Error: No test files found matching pattern: /Users/koyama.koji/git/self/test-kanteen/tests/tmp/large-project-80668-1763248072439/large-codebase/**/*.test.ts

    at genericNodeError (node:internal/errors:983:15)
    at wrappedFn (node:internal/errors:537:14)
    at checkExecSyncError (node:child_process:882:11)
    at execSync (node:child_process:954:15)
    at Object.<anonymous> (/Users/koyama.koji/git/self/test-kanteen/tests/e2e/performance.test.ts:94:28)
```

### should capture test results and generate catalog

**Suite**: KanteenJestReporter Integration

**File**: `/Users/koyama.koji/git/self/test-kanteen/tests/integration/reporters/jest-reporter.test.ts:0`

**Duration**: 91ms

**Error**:
```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
    at Object.<anonymous> (/Users/koyama.koji/git/self/test-kanteen/tests/integration/reporters/jest-reporter.test.ts:94:24)
```

## 📝 Test Suites

### KanteenVitestReporter Integration

**Duration**: 100ms

- ✅ **should capture test results and generate catalog** (58ms)
- ✅ **should handle multiple test files** (23ms)
- ✅ **should capture error details** (13ms)
- ✅ **should handle tests without nested suite** (3ms)
- ✅ **should handle different test statuses** (3ms)

### KanteenPlaywrightReporter Integration

**Duration**: 118ms

- ✅ **should capture test results and generate catalog** (72ms)
- ✅ **should handle multiple test files** (9ms)
- ✅ **should capture error details** (4ms)
- ✅ **should handle tests without suite** (22ms)
- ✅ **should handle different test statuses** (11ms)

### analyze

**Duration**: 47ms

- ✅ **should analyze simple test suite** (29ms)
- ✅ **should handle nested describe blocks** (2ms)
- ✅ **should extract beforeEach hooks** (2ms)
- ✅ **should extract afterEach hooks** (2ms)
- ✅ **should handle multiple test cases in one suite** (1ms)
- ✅ **should extract assertions from test cases** (3ms)
- ✅ **should handle test with template literal name** (2ms)
- ✅ **should handle empty test suite** (0ms)
- ✅ **should handle deeply nested suites** (2ms)
- ✅ **should work with test() instead of it()** (1ms)
- ✅ **should include location information** (3ms)

### E2E: Full Workflow

**Duration**: 190ms

- ✅ **should analyze test files and generate AST catalog** (107ms)
- ✅ **should support multiple output formats** (60ms)
- ✅ **should handle nested test suites correctly** (9ms)
- ✅ **should detect framework automatically** (7ms)
- ✅ **should extract test assertions** (7ms)

### extract

**Duration**: 45ms

- ✅ **should extract named function export** (17ms)
- ✅ **should extract default function export** (3ms)
- ✅ **should extract async function export** (2ms)
- ✅ **should extract class export** (4ms)
- ✅ **should extract class with public methods** (3ms)
- ✅ **should not extract private methods** (1ms)
- ✅ **should extract variable export** (4ms)
- ✅ **should extract TypeScript interface export** (2ms)
- ✅ **should extract TypeScript type alias export** (1ms)
- ✅ **should extract multiple exports** (1ms)
- ✅ **should extract export specifiers** (1ms)
- ✅ **should include location information** (1ms)
- ✅ **should include function signature** (2ms)
- ✅ **should handle rest parameters** (1ms)
- ✅ **should handle empty file** (1ms)
- ✅ **should handle file with no exports** (1ms)

### aaa_spec Guide Generation

**Duration**: 285ms

- ✅ **should generate TEST_KANTEEN_GUIDE.md when analyzing tests** (113ms)
- ✅ **should not overwrite existing guide** (67ms)
- ✅ **should place guide in aaa_spec directory alongside output directory** (51ms)
- ✅ **should include all essential sections in guide** (54ms)

### extract

**Duration**: 86ms

- ✅ **should extract expect().toBe() assertion** (15ms)
- ✅ **should extract expect().toEqual() assertion** (58ms)
- ✅ **should extract expect().toThrow() assertion** (2ms)
- ✅ **should extract expect().not.toBe() assertion** (1ms)
- ✅ **should extract multiple assertions** (1ms)
- ✅ **should extract nested assertions in test function** (3ms)
- ✅ **should extract toBeGreaterThan assertion** (1ms)
- ✅ **should extract toBeLessThan assertion** (0ms)
- ✅ **should extract toBeTruthy/toBeFalsy assertions** (1ms)
- ✅ **should extract toBeDefined/toBeUndefined assertions** (1ms)
- ✅ **should extract toContain assertion** (1ms)
- ✅ **should extract toHaveLength assertion** (0ms)
- ✅ **should extract toMatch assertion** (1ms)
- ✅ **should include location information** (1ms)

### classifyAssertion

**Duration**: 19ms

- ✅ **should classify equality matchers** (1ms)
- ✅ **should classify truthiness matchers** (0ms)
- ✅ **should classify comparison matchers** (2ms)
- ✅ **should classify string matchers** (8ms)
- ✅ **should classify array matchers** (7ms)
- ✅ **should classify error matchers** (0ms)
- ✅ **should classify mock matchers** (1ms)
- ✅ **should return "other" for unknown matchers** (0ms)

### common functionality

**Duration**: 6ms

- ✅ **should include all catalog properties in all formats** (4ms)
- ✅ **should handle nested test suites correctly in all formats** (2ms)

### JSONFormatter

**Duration**: 1ms

- ✅ **should format catalog as valid JSON with configurable options** (0ms)
- ✅ **should return catalog as object through toObject method** (1ms)

### YAMLFormatter

**Duration**: 5ms

- ✅ **should format catalog as valid YAML with configurable options** (4ms)
- ✅ **should return YAML Document through toDocument method** (1ms)

### MarkdownFormatter

**Duration**: 1ms

- ✅ **should format catalog as valid Markdown with proper structure** (1ms)
- ✅ **should use correct indentation levels for nested suites** (0ms)

### compare

**Duration**: 5ms

- ✅ **should match identical tests perfectly** (1ms)
- ✅ **should detect runtime-only tests (dynamically generated)** (1ms)
- ✅ **should detect AST-only tests (not executed)** (0ms)
- ✅ **should handle file path normalization** (2ms)
- ✅ **should calculate statistics correctly** (1ms)

### configuration

**Duration**: 0ms

- ✅ **should respect custom confidence thresholds** (0ms)
- ✅ **should support case-sensitive matching** (0ms)

### edge cases

**Duration**: 1ms

- ✅ **should handle empty catalogs** (1ms)
- ✅ **should handle nested test suites** (0ms)

### detectFromSource

**Duration**: 1ms

- ✅ **should detect Jest from import** (1ms)
- ✅ **should detect Jest from test identifiers** (0ms)
- ✅ **should detect Vitest from import** (0ms)
- ✅ **should detect Mocha from patterns** (0ms)
- ✅ **should return null for unrecognized source** (0ms)

### detectFromAST

**Duration**: 3ms

- ✅ **should detect Jest from AST with import** (1ms)
- ✅ **should detect Vitest from AST with import** (1ms)
- ✅ **should return null for AST without framework imports** (1ms)

### autoDetect

**Duration**: 17ms

- ✅ **should detect from source first** (0ms)
- ✅ **should detect from AST if source detection fails** (0ms)
- ✅ **should return default Jest if all detection fails** (17ms)

### getFramework

**Duration**: 2ms

- ✅ **should return Jest framework** (1ms)
- ✅ **should return Vitest framework** (0ms)
- ✅ **should return Mocha framework** (1ms)
- ✅ **should return undefined for unknown framework** (0ms)

### getSupportedFrameworks

**Duration**: 0ms

- ✅ **should return list of supported frameworks** (0ms)

### framework metadata

**Duration**: 1ms

- ✅ **should have correct Jest identifiers** (0ms)
- ✅ **should have correct hook identifiers for Jest** (0ms)
- ✅ **should have correct Vitest identifiers** (1ms)
- ✅ **should have correct Mocha identifiers** (0ms)
- ✅ **should have correct Mocha hook identifiers** (0ms)

### loadFile

**Duration**: 24ms

- ✅ **should load existing file with both absolute and relative paths** (3ms)
- ✅ **should throw error for non-existent file** (21ms)

### loadFiles

**Duration**: 15ms

- ✅ **should load multiple files and skip invalid ones** (15ms)

### loadByPattern

**Duration**: 200ms

- ✅ **should load files matching glob patterns** (20ms)
- ✅ **should respect ignore patterns and default ignores** (143ms)
- ✅ **should use custom working directory when specified** (37ms)

### exists and getStats

**Duration**: 9ms

- ✅ **should check file existence for existing and non-existing files** (1ms)
- ✅ **should return file stats for files and directories** (8ms)

### generate

**Duration**: 4ms

- ✅ **should generate Markdown string** (0ms)
- ✅ **should include header** (0ms)
- ✅ **should include metadata section** (0ms)
- ✅ **should include coverage section** (0ms)
- ✅ **should include test suites section** (3ms)
- ✅ **should include test structure** (0ms)
- ✅ **should use Jest-style hierarchical format** (1ms)

### nested test suites

**Duration**: 0ms

- ✅ **should include nested suites** (0ms)
- ✅ **should use correct indentation levels** (0ms)

### writeToFile

**Duration**: 4ms

- ✅ **should write Markdown to file** (3ms)
- ✅ **should create directory if not exists** (1ms)

### options

**Duration**: 1ms

- ✅ **should respect include metadata option** (1ms)
- ✅ **should respect include aspects option** (0ms)

### CLI E2E Workflow

**Duration**: 872ms

- ✅ **should execute full analyze workflow from CLI with nested test suites** (871ms)
- ❌ **should handle multiple output formats and glob patterns** (1ms)

### Compare Functionality Integration

**Duration**: 3ms

- ✅ **should compare AST and Runtime catalogs successfully** (2ms)
- ✅ **should handle empty catalogs** (1ms)
- ✅ **should handle all tests executed scenario** (0ms)

### generate

**Duration**: 38ms

- ✅ **should generate catalog as object** (37ms)
- ✅ **should include all catalog properties** (1ms)

### generatePretty

**Duration**: 2ms

- ✅ **should generate pretty formatted JSON string** (2ms)
- ✅ **should be valid JSON** (0ms)
- ✅ **should contain catalog data** (0ms)

### writeToFile

**Duration**: 41ms

- ✅ **should write JSON to file** (19ms)
- ✅ **should create directory if not exists** (17ms)
- ✅ **should write valid JSON format** (5ms)

### options

**Duration**: 1ms

- ✅ **should respect pretty format option** (1ms)
- ✅ **should respect include options** (0ms)

### error handling

**Duration**: 19ms

- ✅ **should handle write permission errors gracefully** (10ms)
- ✅ **should validate output path before writing** (2ms)
- ✅ **should handle empty output path** (1ms)
- ✅ **should handle very long file paths** (3ms)
- ❌ **should handle concurrent writes to the same file** (1ms)
- ✅ **should maintain data integrity when writing fails** (2ms)

### parse

**Duration**: 32ms

- ✅ **should parse simple JavaScript code** (14ms)
- ✅ **should parse TypeScript code** (1ms)
- ✅ **should parse test file with describe and it** (5ms)
- ✅ **should throw error for invalid syntax** (12ms)

### parseMultiple

**Duration**: 2ms

- ✅ **should parse multiple sources** (2ms)

### isValidAST

**Duration**: 1ms

- ✅ **should return true for valid AST** (0ms)
- ✅ **should return false for invalid AST** (1ms)

### ASTParser - edge cases

**Duration**: 384ms

- ✅ **should handle empty file** (0ms)
- ✅ **should handle very large files efficiently** (312ms)
- ✅ **should handle deep nesting (100+ levels)** (72ms)

### generate

**Duration**: 1ms

- ✅ **should generate catalog with metadata** (1ms)
- ✅ **should calculate coverage information** (0ms)
- ✅ **should handle nested test suites** (0ms)
- ✅ **should add totalTests field to each test suite** (0ms)
- ✅ **should calculate totalTests correctly for nested suites** (0ms)
- ✅ **should calculate totalTests for deeply nested suites** (0ms)
- ✅ **should handle suite with no tests but nested suites** (0ms)

### Performance with large projects

**Duration**: 987ms

- ❌ **should handle large codebase with multiple directories efficiently** (987ms)

### KanteenJestReporter Integration

**Duration**: 96ms

- ❌ **should capture test results and generate catalog** (91ms)
- ✅ **should handle multiple test files** (2ms)
- ✅ **should capture error details** (2ms)
- ✅ **should handle tests without suite** (1ms)

### parseTests

**Duration**: 413ms

- ✅ **should parse test files and generate catalog** (83ms)
- ✅ **should detect framework automatically** (160ms)
- ✅ **should calculate coverage** (7ms)
- ✅ **should include source file paths** (7ms)
- ✅ **should output JSON format when configured** (17ms)
- ✅ **should output Markdown format when configured** (13ms)
- ✅ **should output multiple formats when configured** (54ms)
- ✅ **should handle glob patterns** (61ms)
- ✅ **should throw error for non-existent files** (4ms)
- ✅ **should respect exclude patterns** (7ms)

### parseTestFile

**Duration**: 5ms

- ✅ **should parse single test file** (3ms)
- ✅ **should extract all test information** (2ms)

### end-to-end scenarios

**Duration**: 9ms

- ✅ **should analyze edge case tests and generate correct catalog** (4ms)
- ✅ **should generate multiple reporters with verbose output** (3ms)
- ✅ **should verify test catalog structure** (2ms)

### parseTests - error handling

**Duration**: 8ms

- ✅ **should handle invalid TypeScript syntax gracefully** (2ms)
- ✅ **should provide clear error message for unsupported framework** (2ms)
- ✅ **should handle circular dependencies gracefully** (1ms)
- ✅ **should handle empty test files gracefully** (2ms)
- ✅ **should provide meaningful error message when no tests found** (0ms)
- ✅ **should handle malformed test structure** (1ms)
