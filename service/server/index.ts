import express from "express";
import {
  imageVersion,
  imageRevision,
  version,
  SERVICE_AUTH_PASSWORD,
  SERVICE_AUTH_USERNAME,
} from "./env";
import compression from "compression";
import passport from "passport";
import PassportLocal from "passport-local";
import bodyParser from "body-parser";
import session from "express-session";

import { telefunc } from "telefunc";
import { AppUser, routes } from "./app";
import { randomBytes } from "crypto";
import { apply } from "vike-server/express";
import { serve } from "vike-server/express/serve";
import { awaitMigration } from "@/db";

//
//
//

const startServer = () => {
  //
  awaitMigration();

  //
  const app = express();

  ///
  //
  ///
  const limit = "10mb";
  app.use(compression()); // adds compression support
  app.use(
    session({
      secret: randomBytes(20).toString(),
      resave: false,
      saveUninitialized: false,
    }),
  ); // adds session support
  app.use(bodyParser.json({ limit })); // REQUIRED BY PASSEPORT.JS
  app.use(
    bodyParser.urlencoded({
      limit,
      extended: true,
      parameterLimit: 50000,
    }),
  ); // REQUIRED BY PASSEPORT.JS

  ///
  // Passport.js - Session handling
  ///
  passport.serializeUser((user, done) => {
    done(null, user.username);
  });
  passport.deserializeUser<string>(async (id, done) => {
    done(null, { username: id } satisfies AppUser);
  });

  // hooks with express's session middleware
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(passport.authenticate("session"));

  ///
  //
  ///
  passport.use(
    new PassportLocal.Strategy(
      { usernameField: "username", passwordField: "password" },
      (username, password, done) => {
        //
        const authOK =
          SERVICE_AUTH_USERNAME == username &&
          SERVICE_AUTH_PASSWORD == password;

        //
        return done(
          null,
          authOK ? { username } : false,
          authOK ? undefined : { message: "Invalid credentials" },
        );
      },
    ),
  );
  app.post(
    routes.pages.login,
    passport.authenticate("local", {
      failureRedirect: routes.pages.login,
      successRedirect: routes.pages.dashboard,
      failureMessage: true,
    }),
  );

  app.post(routes.api.logout, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);

      // Optional: Destroy session completely
      req.session.destroy(() => {
        res.redirect(routes.default); // Redirect user after logout
      });
    });
  });

  // Telefunc middleware
  app.all("/_telefunc", async (req, res) => {
    const httpResponse = await telefunc({
      // HTTP Request URL, which is '/_telefunc' if we didn't modify config.telefuncUrl
      url: req.url,
      // HTTP Request Method (GET, POST, ...)
      method: req.method,
      // HTTP Request Body, which can be a string, buffer, or stream
      body: req.body,
      // Optional
      context: {},
    });
    const { body, statusCode, contentType } = httpResponse;
    res.status(statusCode).type(contentType).send(body);
  });

  //
  //
  //

  //
  apply(app, {
    pageContext: (runtime) => {
      const req = runtime.req as express.Request;

      //
      const authFailureMessages = req.session.messages;
      delete req.session.messages;

      //
      const user = req.user;

      return {
        authFailureMessages,
        user,
        k8sApp: {
          imageRevision,
          imageVersion,
          version,
        },
      };
    },
  });

  //
  return serve(app, {
    port: parseInt(process.env.PORT ?? "3000"),
    onReady() {
      console.log("Server is ready.");
    },
  });
};

export default startServer();
