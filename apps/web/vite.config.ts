import path from "node:path";
import { fileURLToPath } from "node:url";

import { DevTools } from "@vitejs/devtools";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, repoRoot, "VITE_");
  const enableDevTools = command === "serve" && env.VITE_ENABLE_DEVTOOLS === "1";

  return {
    appType: "spa",
    envDir: repoRoot,
    publicDir: "../../public",
    define: {
      __VUE_OPTIONS_API__: false,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
    },
    plugins: [
      react(),
      enableDevTools ? DevTools() : null
    ].filter(Boolean),
    resolve: {
      tsconfigPaths: true
    },
    server: {
      proxy: {
        "/api": "http://localhost:3001"
      },
      forwardConsole: true,
      port: 5173
    },
    preview: {
      port: 4173
    },
    devtools: enableDevTools,
    build: {
      target: "baseline-widely-available"
    }
  };
});
