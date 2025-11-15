# Functions and Classes

> Generated at 2025-11-14T22:21:33.140Z

## Summary

- **Total Files**: 44
- **Total Functions**: 3
- **Total Classes**: 14
- **Total Methods**: 35

## Functions and Classes by File

### src/reporter/base-reporter.ts

**Classes:**

- 🏛️ **BaseReporter** (line 9)
  - Methods:
    - onTestSuite() `(_suite)`
    - onTestCase() `(_testCase)`
    - onComplete() `(catalog)`
    - writeToFile() `(outputPath)`

### src/index.ts

**Functions:**

- 📦 **parseTests**`(pattern, config)` (line 23)
- 📦 **parseTestsWithConfig**`(configPath)` (line 78)
- 📦 **parseTestFile**`(filePath)` (line 135)

### src/parser/test-framework-detector.ts

**Classes:**

- 🏛️ **TestFrameworkDetector** (line 6)
  - Methods:
    - detectFromSource() `(source)`
    - detectFromAST() `(ast)`
    - detectFromPackageJson() `(packageJsonPath)`
    - autoDetect() `(source, ast)`
    - getFramework() `(name)`
    - getSupportedFrameworks() `()`

### src/parser/source-loader.ts

**Classes:**

- 🏛️ **SourceLoader** (line 8)
  - Methods:
    - loadFile() `(filePath)`
    - loadFiles() `(filePaths)`
    - loadByPattern() `(pattern, options)`
    - exists() `(filePath)`
    - getStats() `(filePath)`

### src/parser/ast-parser.ts

**Classes:**

- 🏛️ **ASTParser** (line 37)
  - Methods:
    - parse() `(source, filePath, options)`
    - parseMultiple() `(sources, options)`
    - isValidAST() `(ast)`

### src/generator/catalog-generator.ts

**Classes:**

- 🏛️ **CatalogGenerator** (line 11)
  - Methods:
    - generate() `(testSuites, options)`

### src/analyzer/test-analyzer.ts

**Classes:**

- 🏛️ **TestAnalyzer** (line 20)
  - Methods:
    - analyze() `(parseResult, framework)`

### src/analyzer/export-extractor.ts

**Classes:**

- 🏛️ **ExportExtractor** (line 17)
  - Methods:
    - extract() `(parseResult)`

### src/analyzer/assertion-extractor.ts

**Classes:**

- 🏛️ **AssertionExtractor** (line 6)
  - Methods:
    - extract() `(node)`
    - classifyAssertion() `(matcher)`

### examples/custom-reporter/custom-reporter.ts

**Classes:**

- 🏛️ **HTMLReporter** (line 11)
  - Methods:
    - onTestSuite() `(suite)`
    - onTestCase() `(testCase)`
    - onComplete() `(catalog)`
    - generate() `()`

### src/reporter/built-in-reporters/markdown-reporter.ts

**Classes:**

- 🏛️ **MarkdownReporter** (line 9)
  - Methods:
    - generate() `()`

### src/reporter/built-in-reporters/json-reporter.ts

**Classes:**

- 🏛️ **JSONReporter** (line 7)
  - Methods:
    - generate() `()`
    - generatePretty() `()`

### src/generator/formatters/yaml-formatter.ts

**Classes:**

- 🏛️ **YAMLFormatter** (line 7)
  - Methods:
    - format() `(catalog, options)`
    - toDocument() `(catalog)`

### src/generator/formatters/markdown-formatter.ts

**Classes:**

- 🏛️ **MarkdownFormatter** (line 6)
  - Methods:
    - format() `(catalog)`

### src/generator/formatters/json-formatter.ts

**Classes:**

- 🏛️ **JSONFormatter** (line 6)
  - Methods:
    - format() `(catalog, options)`
    - toObject() `(catalog)`

