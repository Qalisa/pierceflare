import type { Session } from "hono-sessions";

import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import type { SessionDataTypes } from "./types";

//
export const createServer = () => {
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
