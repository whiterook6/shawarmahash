export const Story = {
  /**
   * @param likelihood - A number between 0 and 1.
   * @param blockHash - The hash of the block to check.
   * @returns True if the event should happen, false otherwise.
   */
  shouldEventHappen: (likelihood: number, blockHash: string): boolean => {
    // Edge cases: likelihood = 0 never succeeds, likelihood = 1 always succeeds
    if (likelihood <= 0) return false;
    if (likelihood >= 1) return true;

    // Extract last 8 hex characters (32 bits) from the hash
    const hashSegment = blockHash.substring(blockHash.length - 8);

    // Convert hex segment to integer
    const hashValue = parseInt(hashSegment, 16);

    // Normalize to 0-1 range (divide by max 32-bit unsigned int)
    const normalizedValue = hashValue / 0xffffffff;

    // Return true if normalized value is less than the likelihood threshold
    // This ensures likelihood = 0.25 succeeds for approximately 25% of blocks
    return normalizedValue < likelihood;
  },
};
