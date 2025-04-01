import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import vike from "vike/plugin";
import { fileURLToPath, URL } from "url";
import vikeNode from "vike-node/plugin";
import { telefunc } from "telefunc/vite";

export default defineConfig({
  plugins: [
    vike(),
    react(),
    telefunc(),
    vikeNode({
      entry: "server/index.ts",
      standalone: {
        esbuild: {
          minify: true,
        },
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  css: {
    postcss: "./postcss.config.js",
  },
  build: {
    target: "es2022",
  },
  esbuild: {
    target: "es2022",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    },
  },
});
