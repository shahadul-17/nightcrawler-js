export interface IDeriveBytes {

  /**
   * Generate pseudo-random key bytes.
   * @param length The number of pseudo-random key bytes to generate.
   * @returns An array filled with pseudo-random key bytes.
   */
  getBytesAsync(byteCount: number): Promise<Array<number>>;
}
