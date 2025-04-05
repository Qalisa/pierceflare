import {
  CLOUDFLARE_API_TOKEN,
  SERVICE_AUTH_PASSWORD,
  SERVICE_AUTH_USERNAME,
  imageRevision,
  imageVersion,
  version,
} from "./env";
import { bearerAuth } from "hono/bearer-auth";

import type { Telefunc } from "telefunc";
import { telefunc } from "telefunc";
import { routes } from "../helpers/routes";
import { apply } from "vike-server/hono";
import { serve } from "vike-server/hono/serve";
import db, { prewarmDb } from "@/db";
import { flareKeys, flares } from "@/db/schema";

import type { Context } from "hono";
import { Hono } from "hono";
import { compress } from "hono/compress";
import type { Session } from "hono-sessions";
import { MemoryStore, sessionMiddleware } from "hono-sessions";
import { title } from "../helpers/static";
import type { PageContextInjection, SessionDataTypes } from "@/helpers/types";
import { eq } from "drizzle-orm";
import { getConnInfo } from "@hono/node-server/conninfo";
import { rateLimiter } from "hono-rate-limiter";
import { CloudflareDNSWorker, getZones } from "./cloudflareWorker";

import { createNodeWebSocket } from "@hono/node-ws";
import EventEmitter from "events";

//
//
//

const wsBroadcaster = new EventEmitter();

export const broadcastToWSClients = (message: string) => {
  wsBroadcaster.emit("all", message);
};

//
//
//

export const PORT = process.env.PORT ?? "3000";

const startServer = async () => {
  //
  // DB SETUP (AUTO CREATION, MIGRATIONS...)
  //

  prewarmDb();

  //
  // Cloudflare WORKER
  //

  //
  const cfWorker = new CloudflareDNSWorker({
    apiToken: CLOUDFLARE_API_TOKEN,
    rateLimit: 1200, // Cloudflare's rate limit is 1200 requests per 5 minutes
    maxConcurrent: 1,
    timeout: 10000,
    retryDelay: 2000,
    maxRetries: 3,
  });

  const zones = await getZones(cfWorker);
  const availableCloudflareDomains = zones.map(([_id, name]) => name);
  cfWorker.initializeWorker(zones);

  //
  // WEB SERVER
  //

  //
  const app = new Hono<{
    Variables: {
      session: Session<SessionDataTypes>;
      session_key_rotation: boolean;
      apiContext: {
        ddnsForDomain: string;
      };
    };
  }>();

  //
  // COMPRESSION
  //

  app.use(compress());

  //
  // SESSION
  //

  app.use(
    sessionMiddleware({
      store: new MemoryStore(),
    }),
  );

  //
  // AUTH
  //

  // Login //
  app.post(routes.pages.login, async ({ req, get, redirect }) => {
    //
    const session = get("session");
    const loginFailed = async (message: string, username?: string) => {
      session.flash("authFailure", { message, username });
      return redirect(routes.pages.login);
    };

    const body = await req.parseBody();
    const { password, username } = body;

    //
    if (typeof password !== "string" || typeof username !== "string") {
      return loginFailed("Unexpected values for credentials");
    }
    if (!password || !username) {
      return loginFailed("Missing username or password");
    }

    const authOK =
      SERVICE_AUTH_USERNAME == username && SERVICE_AUTH_PASSWORD == password;
    if (!authOK) {
      return loginFailed("Invalid credentials", username);
    }

    //
    session.set("user", { username: username });
    return redirect(routes.pages.dashboard);
  });

  // Logout //
  app.post(routes.appApi.logout, async ({ get, redirect }) => {
    const session = get("session");
    session.deleteSession();
    return redirect(routes.default);
  });

  //
  // WEBSOCKETS (RPC)
  //
  //

  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

  //
  app.get(
    "/ws",
    upgradeWebSocket(({ get, status, body }) => {
      //
      const session = get("session") as Session<SessionDataTypes>;
      const user = session.get("user");
      if (!user) {
        status(403);
        body("Unauthorized");
        return {};
      }

      let onBroadcast: (message: string) => void;

      //
      return {
        onOpen(_evt, ws) {
          onBroadcast = (message: string) => {
            ws.send(message);
          };
          wsBroadcaster.on("all", onBroadcast);
        },
        onClose() {
          wsBroadcaster.removeListener("all", onBroadcast);
        },
      };
    }),
  );

  // injectWebSocket(app);

  //
  // API
  //

  app.use(
    `${routes.api.root}/*`,
    rateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
      standardHeaders: "draft-6", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
      keyGenerator: (c) => {
        const {
          remote: { address },
        } = getConnInfo(c);

        // Default: use IP address from request
        // const ip =
        //   c.req.header("cf-connecting-ip") ||
        //   c.req.header("x-forwarded-for") ||
        //   c.req.raw.headers.get("x-real-ip");
        return address || "unknown";
      },
      // store: ... , // Redis, MemoryStore, etc. See below.
    }),
    bearerAuth({
      verifyToken: async (token, { status, set }) => {
        //
        const [{ ddnsForDomain }] = await db
          .select({ ddnsForDomain: flareKeys.ddnsForDomain })
          .from(flareKeys)
          .where(eq(flareKeys.apiKey, token))
          .limit(1);

        //
        if (ddnsForDomain == null) {
          status(403);
          return false;
        }

        //
        set("apiContext", { ddnsForDomain });

        //
        return true;
      },
    }),
  );

  //
  app.put(routes.api.flare, async (c) => {
    //
    const { ddnsForDomain } = c.get("apiContext");
    const {
      remote: { addressType, address },
    } = getConnInfo(c);

    //
    if (!address) {
      c.status(500);
      return c.text("No address found");
    }

    //
    await db.insert(flares).values({
      flaredIPv6: addressType === "IPv6" ? address : null,
      flaredIPv4: addressType === "IPv4" ? address : null,
      ofDomain: ddnsForDomain,
      receivedAt: new Date(),
    });

    //
    cfWorker.queueDNSUpdate({
      operation: "update",
      record: {
        type: addressType === "IPv6" ? "AAAA" : "A",
        proxied: true,
        fullName: ddnsForDomain,
        content: address,
      },
    });

    //
    c.status(200);
    return c.text("OK");
  });

  //
  // VIKE
  //

  //
  const injectedFromHono = ({ get }: Context) => {
    const session = get("session") as Session<SessionDataTypes>;
    const user = session.get("user");
    const authFailure = session.get("authFailure");

    const injecting: PageContextInjection = {
      injected: {
        ...(authFailure ? { authFailure } : {}),
        ...(user ? { user } : {}),
        availableCloudflareDomains,
        k8sApp: {
          imageRevision,
          imageVersion,
          version,
        },
      },
    };

    return injecting;
  };

  //
  // Telefunc middleware
  //

  app.all("/_telefunc", async (c) => {
    const { req, status, header, body } = c;
    const httpResponse = await telefunc({
      // HTTP Request URL, which is '/_telefunc' if we didn't modify config.telefuncUrl
      url: req.url,
      // HTTP Request Method (GET, POST, ...)
      method: req.method,
      // HTTP Request Body, which can be a string, buffer, or stream
      body: await req.text(),
      // Optional
      context: {
        ...(c.get("session").get("user") != null ? { userLogged: true } : {}),
        availableCloudflareDomains,
      } satisfies Telefunc.Context,
    });

    //
    const { body: bodystr, statusCode, contentType } = httpResponse;
    status(statusCode);
    header("Content-Type", contentType);
    return body(bodystr);
  });

  //
  // VIKE-SERVER
  //

  //
  apply(app, {
    pageContext: ({ hono: context }) => injectedFromHono(context),
  });

  //
  return serve(app, {
    port: parseInt(PORT),
    onCreate(server) {
      injectWebSocket(server!);
    },
    onReady() {
      console.log(`[${title}]`, `Server is ready.`);
    },
  });
};

export default startServer();
