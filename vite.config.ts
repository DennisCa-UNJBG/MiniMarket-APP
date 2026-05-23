import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error fs is a Node.js module
import { readFileSync } from "fs";
// @ts-expect-error path is a Node.js module
import { resolve } from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

const tauriConfig = JSON.parse(
  // @ts-expect-error __dirname is a Node.js global
  readFileSync(resolve(__dirname, "src-tauri/tauri.conf.json"), "utf-8")
);
const syncKey = tauriConfig.plugins?.sync?.key || "MiniMarket-Secure-Sync-Key-2026";

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_SYNC_KEY": JSON.stringify(syncKey)
  },

  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-tauri': ['@tauri-apps/api', '@tauri-apps/plugin-fs', '@tauri-apps/plugin-sql'],
          'vendor-utils': ['sweetalert2', 'jspdf', 'html2canvas']
        }
      }
    }
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
