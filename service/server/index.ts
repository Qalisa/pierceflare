import Cloudflare from "cloudflare";
import type { Session } from "hono-sessions";
import { MemoryStore, sessionMiddleware } from "hono-sessions";
import { compress } from "hono/compress";
import { lastValueFrom } from "rxjs";
import { apply } from "vike-server/hono";
import { serve } from "vike-server/hono/serve";

import { type HttpBindings } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getEnvZ } from "@qalisa/vike-envz";

import { defineDbCharacteristics, getDb } from "#/db";
import { dbRequestsEE } from "#/db/requests";
import { CloudflareDNSWorker } from "#/server/cloudflare/worker";
import { getZones } from "#/server/cloudflare/zones";
import logr from "#/server/helpers/loggers";
import { routes } from "#/server/helpers/routes";
import type {
  PageContextInjection,
  SessionDataTypes,
} from "#/server/helpers/types";
import type { HonoContext } from "#/server/trpc/_base";
import { appRouter } from "#/server/trpc/router";

import setupAPI from "./api";
import { addApiRoutes } from "./api/routes";
import { envSchema } from "./envZ";
import addLogin from "./features/login";

//
//
//

//
const createServer = () => {
  return new OpenAPIHono<{
    Variables: {
      session: Session<SessionDataTypes>;
      session_key_rotation: boolean;
      apiContext: {
        ddnsForDomain: string;
      };
      Bindings: HttpBindings;
    };
  }>();
};

export type AppServer = ReturnType<typeof createServer>;

//
//
//

//
const startServer = async () => {
  //
  //
  //

  //
  const env = getEnvZ(import.meta.env, envSchema);

  //
  defineDbCharacteristics({
    dbFilePath: env.SERVICE_DATABASE_FILES_PATH,
  });

  //
  //
  //

  /** we do not need available domains right await for UI, just pass them empty until filled */
  const cloudflareState: PageContextInjection["injected"]["cloudflare"] = {
    availableDomains: [],
    workerState: "running",
  };

  //
  const cfWorkerPromise = (async () => {
    //
    if (
      env.CLOUDFLARE_API_TOKEN == undefined ||
      env.CLOUDFLARE_API_TOKEN == ""
    ) {
      const message =
        "CLOUDFLARE_API_TOKEN is not set, disabling Cloudflare DNS Worker.";
      logr.error(message);
      cloudflareState.workerState = "disabled";
      throw message;
    }

    //
    const cloudflareCli = new Cloudflare({
      apiToken: env.CLOUDFLARE_API_TOKEN,
    });

    //
    const zones = await getZones(cloudflareCli);
    cloudflareState.availableDomains = zones.map(([_id, name]) => name);

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
  const app = createServer();

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

  addLogin(app, {
    expectedCredentials: {
      password: env.SERVICE_AUTH_PASSWORD,
      username: env.SERVICE_AUTH_USERNAME,
    },
  });

  //
  // API
  //

  setupAPI(app, { apiVersion: env.K8S_APP__VERSION });
  addApiRoutes(app);

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
          cloudflare: cloudflareState,
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
      const trpcUrl = `${new URL(env.CANONICAL_URL).origin}${routes.trpc.root}`;

      //
      const injecting: PageContextInjection = {
        injected: {
          ...(authFailure ? { authFailure } : {}),
          ...(user ? { user } : {}),
          cloudflare: cloudflareState,
          trpcUrl,
          k8sApp: {
            imageRevision: env.K8S_APP__IMAGE_REVISION,
            imageVersion: env.K8S_APP__IMAGE_VERSION,
            version: env.K8S_APP__VERSION,
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
    logr.log("Starting Cloudflare DNS Worker.");
    const run = lastValueFrom(e.cfWorker.flow);
    cloudflareState.workerState = "running";
    return run;
  });

  //
  // Serve Server !
  //

  //
  return serve(app, {
    port: env.PORT,
    onReady() {
      logr.log(
        `(${import.meta.env.MODE}) Server is ready on 0.0.0.0:${env.PORT}.`,
      );
    },
  });
};

export default startServer();
