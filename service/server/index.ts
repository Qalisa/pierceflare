import {
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
import { getDb } from "@/db";
import { flareKeys, flares } from "@/db/schema";

import { Hono } from "hono";
import { compress } from "hono/compress";
import type { Session } from "hono-sessions";
import { CookieStore, sessionMiddleware } from "hono-sessions";
import { title, wsUrl } from "../helpers/static";
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
import { type HttpBindings } from "@hono/node-server";
import { getCookie } from "hono/cookie";

//
//
//

//
const startServer = async () => {
  /** we do not need available domains right await for UI, just pass them empty until filled */
  let availableCloudflareDomains: string[] = [];
  const cookiesEncryptionKey = "password_at_least_32_characters_long";

  const wsServerIsReady = startTRPCWsServer(
    cookiesEncryptionKey,
    () => availableCloudflareDomains,
  );

  const cfWorkerPromise = (async () => {
    //
    const cloudflareCli = new Cloudflare({
      apiToken: CLOUDFLARE_API_TOKEN,
    });

    //
    const zones = await getZones(cloudflareCli);
    availableCloudflareDomains = zones.map(([_id, name]) => name);

    //
    const cfWorker = new CloudflareDNSWorker(cfEmitter, {
      zones,
      cloudflareCli,
      rateLimit: 1200, // Cloudflare's rate limit is 1200 requests per 5 minutes
      maxConcurrent: 1,
      timeout: 10000,
      retryDelay: 2000,
      maxRetries: 0,
    });

    return {
      cfWorker,
    };
  })();

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
      Bindings: HttpBindings;
    };
  }>();

  //
  // COMPRESSION
  //

  app.use(compress());

  //
  // SESSION
  //

  //
  const sessionCookieName = "sessionId";
  app.use(
    sessionMiddleware({
      store: new CookieStore(),
      encryptionKey: cookiesEncryptionKey, // Required for CookieStore, recommended for others
      expireAfterSeconds: 900, // Expire session after 15 minutes of inactivity
      sessionCookieName,
      cookieOptions: {
        sameSite: "Lax", // Recommended for basic CSRF protection in modern browsers
        path: "/", // Required for this library to work properly
        httpOnly: true, // Recommended to avoid XSS attacks
      },
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
      SERVICE_AUTH_USERNAME == username.trim() &&
      SERVICE_AUTH_PASSWORD == password;
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
        const [{ ddnsForDomain }] = await getDb()
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
    await getDb()
      .insert(flares)
      .values({
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

  //
  app.use(
    `${routes.trpc.root}/*`,
    trpcServer({
      router: appRouter,
      createContext: (_opts, c) => {
        //
        return {
          ...(c.get("session").get("user") != null ? { userLogged: true } : {}),
          availableCloudflareDomains,
        } satisfies HonoContext;
      },
    }),
  );

  //
  // VIKE-SERVER
  //

  //
  apply(app, {
    pageContext: ({ hono: c }) => {
      const session = c.get("session") as Session<SessionDataTypes>;
      const user = session.get("user");
      const authFailure = session.get("authFailure");
      const tRPCWsUrl = wsUrl;

      //
      const injecting: PageContextInjection = {
        injected: {
          ...(authFailure ? { authFailure } : {}),
          ...(user ? { user } : {}),
          ...(user
            ? { encryptedSessionData: getCookie(c, sessionCookieName) }
            : {}),
          availableCloudflareDomains,
          tRPCWsUrl,
          k8sApp: {
            imageRevision,
            imageVersion,
            version,
          },
        },
      };

      //
      return injecting;
    },
  });

  //
  // workers
  //

  //
  if (import.meta.env.PROD) {
    await Promise.all([wsServerIsReady, async () => getDb()]);
  }

  //
  cfWorkerPromise.then((e) => lastValueFrom(e.cfWorker.flow));

  //
  // Serve Server !
  //

  //
  return serve(app, {
    port: PORT,
    onReady() {
      console.log(`[${title}]`, `Server is ready.`);
    },
  });
};

export default startServer();
