import Cloudflare from "cloudflare";
import { eq } from "drizzle-orm";
import { rateLimiter } from "hono-rate-limiter";
import type { Session } from "hono-sessions";
import { MemoryStore, sessionMiddleware } from "hono-sessions";
import { bearerAuth } from "hono/bearer-auth";
import { compress } from "hono/compress";
import { lastValueFrom } from "rxjs";
import { apply } from "vike-server/hono";
import { serve } from "vike-server/hono/serve";

import { type HttpBindings } from "@hono/node-server";
import { getConnInfo } from "@hono/node-server/conninfo";
import { swaggerUI } from "@hono/swagger-ui";
import { trpcServer } from "@hono/trpc-server";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

import { getDb } from "#/db";
import { dbRequestsEE, eeRequests } from "#/db/requests";
import { flareKeys } from "#/db/schema";
import { title } from "#/helpers/static";
import { withLinger } from "#/helpers/withLinger";
import { CloudflareDNSWorker } from "#/server/cloudflare/worker";
import { getZones } from "#/server/cloudflare/zones";
import {
  CANONICAL_URL,
  CLOUDFLARE_API_TOKEN,
  PORT,
  SERVICE_AUTH_PASSWORD,
  SERVICE_AUTH_USERNAME,
  imageRevision,
  imageVersion,
  version,
} from "#/server/env";
import logr from "#/server/loggers";
import { routes } from "#/server/routes";
import type { HonoContext } from "#/server/trpc/_base";
import { appRouter } from "#/server/trpc/router";
import type { PageContextInjection, SessionDataTypes } from "#/server/types";

//
//
//

//
const startServer = async () => {
  /** we do not need available domains right await for UI, just pass them empty until filled */
  let availableCloudflareDomains: string[] = [];

  const cfWorkerPromise = (async () => {
    //
    const cloudflareCli = new Cloudflare({
      apiToken: CLOUDFLARE_API_TOKEN,
    });

    //
    const zones = await getZones(cloudflareCli);
    availableCloudflareDomains = zones.map(([_id, name]) => name);

    //
    const cfWorker = new CloudflareDNSWorker(dbRequestsEE, {
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
  const app = new OpenAPIHono<{
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
    const login = async () => {
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
    };

    //
    return await withLinger(login(), 300);
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

  /// Middlewares ///

  app.use(
    `${routes.api.root}/*`,
    //
    // << ADD RATE LIMITER
    //
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
    //
    // CHECKS FOR TOKEN
    //
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

  /// Swagger UI ///

  app.get(
    routes.swagger.ui,
    swaggerUI({
      url: routes.swagger.doc,
    }),
  );

  app.doc(routes.swagger.doc, {
    info: {
      title,
      version,
      description:
        "All requests require an authentication token generated by the Pierceflare server, associated with a DDNS domain.",
    },
    openapi: "3.1.0",
  });

  /// API Routes ///

  app.openapi(
    createRoute({
      method: "get",
      path: routes.api.infos,
      description: "Gives back to requester its associated domain.",
      responses: {
        200: {
          description: "Domain associated with CLI Token",
          content: {
            "text/plain": {
              schema: z.string(),
              example: "whatever.pierceflare.com",
            },
          },
        },
      },
    }),
    (c) => {
      const { ddnsForDomain } = c.get("apiContext");
      return c.text(ddnsForDomain, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "put",
      path: routes.api.flare,
      description:
        "Allows to notify the server that your IP address changed, so that Cloudflare's DDNS entry definition can change accordingly.",
      responses: {
        200: {
          description: "When flare request has been successfully acknoledged",
          content: {
            "text/plain": {
              schema: z.literal("OK"),
            },
          },
        },
        500: {
          description: "Remote IP of flare emitter is unresolvable.",
          content: {
            "application/json": {
              schema: z.object({
                code: z.enum(["UNRESOLVABLE"] as const),
                message: z.string(),
              }),
            },
          },
        },
      },
    }),
    (c) => {
      //
      const {
        remote: { addressType, address },
      } = getConnInfo(c);

      //
      if (!address) {
        return c.json(
          {
            code: "UNRESOLVABLE" as const,
            message: "Remote IP of flare emitter is unresolvable.",
          },
          500,
        );
      }

      //
      const { ddnsForDomain } = c.get("apiContext");
      eeRequests.queueFlareForProcessing("batch", {
        flaredIPv6: addressType === "IPv6" ? address : undefined,
        flaredIPv4: addressType === "IPv4" ? address : undefined,
        ofDomain: ddnsForDomain,
        receivedAt: new Date(),
      });

      //
      return c.text("OK", 200);
    },
  );

  //
  // tRPC middleware (API + Websockets)
  //

  //
  app.use(
    `${routes.trpc.root}/*`,
    trpcServer({
      router: appRouter,
      endpoint: routes.trpc.root,
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
      const trpcUrl = `${CANONICAL_URL.origin}${routes.trpc.root}`;

      //
      const injecting: PageContextInjection = {
        injected: {
          ...(authFailure ? { authFailure } : {}),
          ...(user ? { user } : {}),
          availableCloudflareDomains,
          trpcUrl,
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
    //
    logr.log("Pre-warming...");

    //
    await Promise.all([
      // Database
      new Promise((resolve) => {
        resolve(getDb());
      }),
    ]);

    //
    logr.log("Pre-warm OK.");
  }

  //
  // Init CF Worker
  //

  cfWorkerPromise.then((e) => {
    //
    logr.log("Starting Cloudflare DNS Worker.");
    return lastValueFrom(e.cfWorker.flow);
  });

  //
  // Serve Server !
  //

  //
  return serve(app, {
    port: PORT,
    onReady() {
      logr.log(`(${import.meta.env.MODE}) Server is ready on 0.0.0.0:${PORT}.`);
    },
  });
};

export default startServer();
