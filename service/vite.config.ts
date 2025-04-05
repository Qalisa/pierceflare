import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import vike from "vike/plugin";
import { URL, fileURLToPath } from "url";
import { telefunc } from "telefunc/vite";
import { cpSync, existsSync } from "fs";
import { resolve } from "path";

//
//
//

// Custom plugin to copy the drizzle folder
const copyDrizzlePlugin: Plugin = {
  name: "copy-drizzle",
  apply: "build",
  writeBundle() {
    //
    if (this.environment.config.consumer != "server") return;

    //
    const src = resolve(__dirname, "drizzle");
    if (!existsSync(src)) {
      console.warn("⚠️ Drizzle folder not found, skipping copy.");
      return;
    }

    //
    const dest = resolve(__dirname, "dist/server/drizzle");
    cpSync(src, dest, { recursive: true });
    console.log("✅ Drizzle folder copied to dist/");
  },
};

//
export default defineConfig({
  plugins: [copyDrizzlePlugin, vike(), react(), telefunc()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  css: {
    postcss: "./postcss.config.cjs",
  },
  server: {
    hmr: {
      port: 3001,
    },
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
