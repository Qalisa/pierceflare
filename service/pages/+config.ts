import vikeServer from "vike-server/config";

export const config = {
  extends: [vikeServer],
  // Points to your server entry
  server: "server/index.ts",
};
