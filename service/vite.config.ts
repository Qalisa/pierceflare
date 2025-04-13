import { cpSync, existsSync } from "fs";
import { resolve } from "path";
import { URL, fileURLToPath } from "url";
import vike from "vike/plugin";
import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";

// load env vars from .env

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

import { envSchema } from "./server/env";
import type { EnvEntries } from "./server/env/lib";

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

const serverEnvPlugin = ({
  envSchema,
  mode,
}: {
  envSchema: EnvEntries;
  mode: string;
}): Plugin => {
  return {
    name: "server-env-injector",
    config: () => {
      const envAll = loadEnv(mode, process.cwd(), "");
      const envFrom = Object.fromEntries(
        Object.keys(envSchema).map((e) => [e, envAll[e]]),
      );

      //
      return {
        define: {
          "import.meta.env.serverOnly": {
            ...envFrom,
          },
        },
      };
    },
  };
};

// //
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      copyDrizzlePlugin,
      serverEnvPlugin({ mode, envSchema }),
      vike(),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "#": fileURLToPath(new URL("./", import.meta.url)),
      },
    },
  };
});
