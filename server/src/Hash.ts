import { sha1 } from "sha.js";

export const hashSHA1 = (input: string): string => {
  return new sha1().update(input).digest("hex");
};
