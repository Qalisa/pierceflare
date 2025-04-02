import vikeReact from "vike-react/config";
import type { Config } from "vike/types";

import vikeServer from "vike-server/config";

import pierceflareLogo from "@/assets/images/logo.webp";

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // https://vike.dev/head-tags
  title: "PierceFlare",
  description: "Dashboard, API and CLI for secure Cloudflare DDNS",
  image: pierceflareLogo,

  hydrationCanBeAborted: true,
  clientRouting: true,

  passToClient: ["k8sApp", "storeInitialState", "authFailureMessages"],

  extends: [vikeReact, vikeServer],
  // Points to your server entry
  server: "server/index.ts",
} satisfies Config;
