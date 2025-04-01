import vikeReact from "vike-react/config";
import type { Config } from "vike/types";

import pierceflareLogo from "@/assets/images/logo.png";

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // https://vike.dev/head-tags
  title: "PierceFlare",
  description: "Dashboard, API and CLI for secure Cloudflare DDNS",
  image: pierceflareLogo,

  hydrationCanBeAborted: true,
  clientRouting: true,

  passToClient: ["k8sApp", "storeInitialState"],

  extends: vikeReact,
} satisfies Config;
