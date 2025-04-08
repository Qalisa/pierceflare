import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";
import { appRouter } from "./router";
import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";
import { title, wsPort, wsUrl } from "@/helpers/static";

/** */
const startTRPCWsServer = () =>
  new Promise<void>((resolve) => {
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

    //
    wss.once("listening", () => {
      //
      console.log(`[${title}]`, `✅ WebSocket Server listening on ${wsUrl}`);

      //
      process.on("SIGTERM", () => {
        console.log("SIGTERM");
        handler.broadcastReconnectNotification();
        wss.close();
      });

      //
      wss.on("connection", (ws) => {
        console.log(`➕➕ Connection (${wss.clients.size})`);
        ws.once("close", () => {
          console.log(`➖➖ Connection (${wss.clients.size})`);
        });
      });

      //
      resolve();
    });
  });

export default startTRPCWsServer;
