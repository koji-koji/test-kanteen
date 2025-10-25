/**
 * エッジケースのテストファイル
 */

describe('Array Operations', () => {
  describe('Edge cases', () => {
    it('should handle empty array', () => {
      const arr: number[] = [];

      const result = sum(arr);

      expect(result).toBe(0);
    });

    it('should handle array with single element', () => {
      const arr = [42];

      const result = sum(arr);

      expect(result).toBe(42);
    });

    it('should handle array with negative numbers', () => {
      const arr = [-1, -2, -3];

      const result = sum(arr);

      expect(result).toBe(-6);
    });

    it('should handle very large numbers', () => {
      const arr = [Number.MAX_SAFE_INTEGER, 1];

      const result = sum(arr);

      expect(result).toBeGreaterThan(Number.MAX_SAFE_INTEGER);
    });

    it('should handle null and undefined gracefully', () => {
      expect(() => sum(null as any)).toThrow();
      expect(() => sum(undefined as any)).toThrow();
    });
  });

  describe('Performance', () => {
    it('should process large array efficiently', () => {
      const arr = Array.from({ length: 1000000 }, (_, i) => i);

      const start = performance.now();
      const result = sum(arr);
      const end = performance.now();

      expect(end - start).toBeLessThan(100); // 100ms以内
      expect(result).toBe(499999500000);
    });
  });
});

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}
