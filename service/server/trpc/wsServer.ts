import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";
import { appRouter } from "./router";
import { title, wsPort, wsUrl } from "@/helpers/static";
import { decrypt } from "hono-sessions";

/** */
const startTRPCWsServer = (
  cookiesEncryptionKey: string,
  availableCloudflareDomains: () => string[],
) =>
  new Promise<void>((resolve) => {
    const wss = new WebSocketServer({
      port: wsPort,
    });

    //
    const handler = applyWSSHandler({
      wss,
      router: appRouter,
      createContext: async (opts) => {
        //
        const userLogged = await (async () => {
          const sessionData = opts.info.connectionParams?.encryptedSessionData;
          if (!sessionData) return false;

          //
          const { _expire } = JSON.parse(
            (await decrypt(cookiesEncryptionKey, sessionData)) as string,
          );

          const expiryDate = new Date(_expire);
          return expiryDate.getTime() > Date.now();
        })();

        //
        return {
          availableCloudflareDomains: availableCloudflareDomains(),
          userLogged,
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
    if (import.meta.hot) {
      import.meta.hot.on("vite:beforeFullReload", () => {
        wss.close();
      });
    }

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
