import { DevTools } from "@vitejs/devtools";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  appType: "spa",
  plugins: [react(), command === "serve" ? DevTools() : null].filter(Boolean),
  resolve: {
    tsconfigPaths: true
  },
  server: {
    forwardConsole: true,
    port: 5173
  },
  preview: {
    port: 4173
  },
  devtools: command === "serve",
  build: {
    target: "baseline-widely-available"
  }
}));
