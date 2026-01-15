import { defineConfig } from "vite";

const backendTarget = "http://localhost:3000";

export default defineConfig({
  server: {
    proxy: {
      "/health": { target: backendTarget, changeOrigin: true },
      "/players": { target: backendTarget, changeOrigin: true },
      "/teams": { target: backendTarget, changeOrigin: true },
      "/test": { target: backendTarget, changeOrigin: true },
      "/events": { target: backendTarget, changeOrigin: true },
    },
  },
});
