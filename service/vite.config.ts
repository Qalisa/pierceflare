import { cpSync, existsSync } from "fs";
import { resolve } from "path";
import { URL, fileURLToPath } from "url";
import vike from "vike/plugin";
import type { Plugin } from "vite";
import { defineConfig } from "vite";

import envZ from "@qalisa/vike-envz/plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

import { envSchema } from "./server/envZ";

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

// //
export default defineConfig({
  plugins: [
    copyDrizzlePlugin,
    envZ({ envSchema }),
    vike(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "#": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
