import * as esbuild from "esbuild";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const run = async () => {

  // ensure output directory exists
  const outputDir = path.join(__dirname, "/../output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const files = fs.readdirSync(outputDir);
  await Promise.all(files.map(file => {
    return fs.promises.unlink(path.join(outputDir, file));
  }));

  return esbuild.build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node24",
    outdir: "output",
    minify: true,
    sourcemap: false,
    packages: "external"
  });
};

run().catch((error) => { console.error(error); process.exit(1) });
