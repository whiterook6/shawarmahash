import * as esbuild from "esbuild";
import { getGitHash, ensureOutputDir, cleanOutputDir, getOutputDir } from "./build-utils.mjs";

const run = async () => {
  const gitHash = getGitHash() || "not set";
  const outputDir = getOutputDir();

  // ensure output directory exists
  ensureOutputDir(outputDir);

  // clean output directory
  await cleanOutputDir(outputDir);

  return esbuild.build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node24",
    outdir: "output",
    sourcemap: true,
    packages: "external",
    define: {
      "process.env.GIT_HASH": JSON.stringify(gitHash)
    }
  });
};

run().catch((error) => { console.error(error); process.exit(1) });
