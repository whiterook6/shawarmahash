import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get git hash with fallback options
 * @param {string|undefined} fallback - Fallback value if git is not available
 * @returns {string|undefined} Git hash or fallback value
 */
export const getGitHash = () => {
  // Check environment variable first (useful for Docker builds)
  if (process.env.GIT_HASH) {
    return process.env.GIT_HASH;
  }
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch (error) {
    return undefined;
  }
};

/**
 * Get the output directory path
 * @returns {string} Path to the output directory
 */
export const getOutputDir = () => {
  return path.join(__dirname, "/../output");
};

/**
 * Ensure the output directory exists
 */
export const ensureOutputDir = (outputDir) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
};

/**
 * Clean all files from the output directory
 */
export const cleanOutputDir = async (outputDir) => {
  if (!fs.existsSync(outputDir)) {
    return;
  }
  const files = fs.readdirSync(outputDir);
  await Promise.all(
    files.map((file) => fs.promises.unlink(path.join(outputDir, file)))
  );
};

