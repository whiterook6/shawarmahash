export const estimateRealProgress = (
  /** The number of hashes checked so far */
  hashesChecked: number,
  /** The probability of finding a hash, from 0 to 1 */
  probability: number,
) => {
  return 1 - Math.exp(-probability * hashesChecked);
};

export const estimateProbability = (difficultyTarget: string) => {
  // calculate the probability of finding a hash
  // starts with N fs, and each f is 1/16 of the target
  const numFs = difficultyTarget.split("f").length - 1;
  const probability = 1 / Math.pow(16, numFs);
  return probability;
};
