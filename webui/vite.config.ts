import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check for SSL certificates
const certPath = join(__dirname, "..", "..", "certs", "localhost.pem");
const keyPath = join(__dirname, "..", "..", "certs", "localhost-key.pem");
const hasCertificates = existsSync(certPath) && existsSync(keyPath);

const backendTarget = hasCertificates
  ? "https://localhost:3000"
  : "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    ...(hasCertificates && {
      https: {
        key: readFileSync(keyPath),
        cert: readFileSync(certPath),
      },
    }),
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
      },
    },
  },
});
