import {
  imageVersion,
  imageRevision,
  version,
  SERVICE_AUTH_PASSWORD,
  SERVICE_AUTH_USERNAME,
  SERVICE_DATABASE_FILES_PATH,
  SERVICE_CLOUDFLARE_AVAILABLE_DOMAINS,
} from "./env";

import type { Telefunc } from "telefunc";
import { telefunc } from "telefunc";
import { routes } from "../helpers/routes";
import { apply } from "vike-server/hono";
import { serve } from "vike-server/hono/serve";
import { awaitMigration } from "@/db";

import type { Context } from "hono";
import { Hono } from "hono";
// import { compress } from "hono/compress";
import type { Session } from "hono-sessions";
import { sessionMiddleware } from "hono-sessions";
import { BunSqliteStore } from "hono-sessions/bun-sqlite-store";
import { Database } from "bun:sqlite";
import { title } from "../helpers/static";
import type { PageContextInjection, SessionDataTypes } from "@/helpers/types";

//
//
//

const startServer = () => {
  //
  awaitMigration();
  console.log("DB Schema Migration Done.");

  //
  const app = new Hono<{
    Variables: {
      session: Session<SessionDataTypes>;
      session_key_rotation: boolean;
    };
  }>();

  //
  //
  //

  // app.use(compress()); // NO AVAILABLE FOR BUN (https://hono.dev/docs/middleware/builtin/compress)

  //
  //
  //

  const sessionDb = new Database(SERVICE_DATABASE_FILES_PATH + "/sessions.db");
  const store = new BunSqliteStore(sessionDb);
  app.use(
    sessionMiddleware({
      store,
    }),
  );

  //
  // AUTH
  //

  // Login
  app.post(routes.pages.login, async ({ req, get, redirect }) => {
    //
    const session = get("session");
    const loginFailed = async (message: string, username?: string) => {
      session.flash("authFailure", { message, username });
      return redirect(routes.pages.login);
    };

    //
    //
    //

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

  // Logout
  app.post(routes.api.logout, async ({ get, redirect }) => {
    const session = get("session");
    session.deleteSession();
    return redirect(routes.default);
  });

  //
  //
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
        availableCloudflareDomains: SERVICE_CLOUDFLARE_AVAILABLE_DOMAINS,
        k8sApp: {
          imageRevision,
          imageVersion,
          version,
        },
      },
    };

    return injecting;
  };

  // Telefunc middleware
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
      } satisfies Telefunc.Context,
    });

    //
    const { body: bodystr, statusCode, contentType } = httpResponse;
    status(statusCode);
    header("Content-Type", contentType);
    return body(bodystr);
  });

  //
  //
  //

  //
  apply(app, {
    pageContext: ({ hono: context }) => injectedFromHono(context),
  });

  //
  return serve(app, {
    port: parseInt(process.env.PORT ?? "3000"),
    onReady() {
      console.log(`Hono ${title} Server is ready.`);
    },
  });
};

export default startServer();
