// Test file with invalid TypeScript syntax for error handling tests

describe('Invalid Syntax Test', () => {
  it('should fail to parse', () => {
    const result = add(1, 2);
    // Missing closing brace and invalid syntax below
    expect(result).toBe(3
  });

  // Unclosed describe block
  describe('Nested test', () => {
    it('should have syntax error', () => {
      const x = {
        // Missing closing brace
        foo: 'bar'
    });
