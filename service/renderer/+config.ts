import vikeReact from "vike-react/config";
import type { Config } from "vike/types";

import vikeServer from "vike-server/config";

import appLogo from "@/assets/images/logo.webp";
import { title } from "@/server/static";

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // https://vike.dev/head-tags
  title,
  description: "Dashboard, API and CLI for secure Cloudflare DDNS",
  image: appLogo,

  hydrationCanBeAborted: true,
  clientRouting: true,

  passToClient: ["storeInitialState", "injected"],

  extends: [vikeReact, vikeServer],
  // Points to your server entry
  server: "server/index.ts",
} satisfies Config;
