import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";
import { appRouter } from "./router";
import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";
import { title } from "@/helpers/static";

const wsPort = 3001;
export const wsUrl = `ws://localhost:${wsPort}`;

const startTRPCWsServer = () => {
  const wss = new WebSocketServer({
    port: wsPort,
  });

  //
  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: (_opts: CreateWSSContextFnOptions) => {
      return {
        availableCloudflareDomains: [],
        userLogged: true,
      };
    },
    // Enable heartbeat messages to keep connection open (disabled by default)
    keepAlive: {
      enabled: true,
      // server ping message interval in milliseconds
      pingMs: 30000,
      // connection is terminated if pong message is not received in this many milliseconds
      pongWaitMs: 5000,
    },
  });
  wss.on("connection", (ws) => {
    console.log(`➕➕ Connection (${wss.clients.size})`);
    ws.once("close", () => {
      console.log(`➖➖ Connection (${wss.clients.size})`);
    });
  });

  //
  console.log(`[${title}]`, `✅ WebSocket Server listening on ${wsUrl}`);
  process.on("SIGTERM", () => {
    console.log("SIGTERM");
    handler.broadcastReconnectNotification();
    wss.close();
  });
};

export default startTRPCWsServer;
