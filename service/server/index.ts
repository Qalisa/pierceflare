import {
  CANONICAL_URL,
  CLOUDFLARE_API_TOKEN,
  PORT,
  SERVICE_AUTH_PASSWORD,
  SERVICE_AUTH_USERNAME,
  imageRevision,
  imageVersion,
  version,
} from "./env";
import { bearerAuth } from "hono/bearer-auth";

import { trpcServer } from "@hono/trpc-server";
import { routes } from "../helpers/routes";
import { apply } from "vike-server/hono";
import { serve } from "vike-server/hono/serve";
import db, { prewarmDb } from "@/db";
import { flareKeys, flares } from "@/db/schema";

import { Hono } from "hono";
import { compress } from "hono/compress";
import type { Session } from "hono-sessions";
import { MemoryStore, sessionMiddleware } from "hono-sessions";
import { title } from "../helpers/static";
import type { PageContextInjection, SessionDataTypes } from "@/helpers/types";
import { eq } from "drizzle-orm";
import { getConnInfo } from "@hono/node-server/conninfo";
import { rateLimiter } from "hono-rate-limiter";
import { lastValueFrom } from "rxjs";
import Cloudflare from "cloudflare";
import { CloudflareDNSWorker } from "./cloudflare/cloudflareWorker";
import { getZones } from "./cloudflare/zones";
import { cfEmitter } from "./cloudflare/cfOrders";
import type { HonoContext } from "./trpc/_base";
import { appRouter } from "./trpc/router";
import startTRPCWsServer from "./trpc/wsServer";

//
//
//

//
const startServer = async () => {
  //
  // DB SETUP (AUTO CREATION, MIGRATIONS...)
  //

  prewarmDb();

  //
  // Cloudflare WORKER
  //

  const orderer = cfEmitter;

  //
  const cloudflareCli = new Cloudflare({
    apiToken: CLOUDFLARE_API_TOKEN,
  });

  //
  const zones = await getZones(cloudflareCli);
  const availableCloudflareDomains = zones.map(([_id, name]) => name);

  //
  const cfWorker = new CloudflareDNSWorker(orderer, {
    zones,
    cloudflareCli,
    rateLimit: 1200, // Cloudflare's rate limit is 1200 requests per 5 minutes
    maxConcurrent: 1,
    timeout: 10000,
    retryDelay: 2000,
    maxRetries: 0,
  });

  const cfWorkerFlow = cfWorker.flow;
  lastValueFrom(cfWorkerFlow);

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
    cfEmitter.next({
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
  // tRPC middleware (API + Websockets)
  //

  await startTRPCWsServer();

  app.use(
    `${routes.trpc.root}/*`,
    trpcServer({
      router: appRouter,
      createContext: (_opts, c) =>
        ({
          ...(c.get("session").get("user") != null ? { userLogged: true } : {}),
          availableCloudflareDomains,
        }) satisfies HonoContext,
    }),
  );

  //
  // VIKE-SERVER
  //

  //
  apply(app, {
    pageContext: ({ hono: { get } }) => {
      const session = get("session") as Session<SessionDataTypes>;
      const user = session.get("user");
      const authFailure = session.get("authFailure");
      const tRPCUrl = `${CANONICAL_URL.origin}${routes.trpc.root}`;

      //
      const injecting: PageContextInjection = {
        injected: {
          ...(authFailure ? { authFailure } : {}),
          ...(user ? { user } : {}),
          availableCloudflareDomains,
          tRPCUrl,
          k8sApp: {
            imageRevision,
            imageVersion,
            version,
          },
        },
      };
      return injecting;
    },
  });

  //
  return serve(app, {
    port: PORT,
    onReady() {
      console.log(`[${title}]`, `Server is ready.`);
    },
  });
};

export default startServer();
