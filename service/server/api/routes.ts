import { z } from "zod";

import { getConnInfo } from "@hono/node-server/conninfo";
import { createRoute } from "@hono/zod-openapi";

import { RemoteOperation$, eeRequests } from "#/db/requests";
import type { AppServer } from "#/server";
import { routes } from "#/server/helpers/routes";

//
export const addApiRoutes = (server: AppServer) => {
  //
  server.openapi(
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

  //
  server.openapi(
    createRoute({
      method: "put",
      path: routes.api.flare,
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                ip: z.string().ip().optional(),
                dummy: z.boolean().optional(),
              }),
            },
          },
        },
      },
      description:
        "Allows to notify the server that your IP address changed, so that Cloudflare's DDNS entry definition can change accordingly.",
      responses: {
        200: {
          description: "When flare request has been successfully acknoledged",
          content: {
            "text/plain": {
              schema: RemoteOperation$.openapi("RemoteOperation"),
            },
          },
        },
        500: {
          description: "Remote IP of flare emitter is unresolvable.",
          content: {
            "application/json": {
              schema: z.object({
                errCode: z.enum(["UNRESOLVABLE"]).openapi("ErrCode"),
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

      const { dummy, ip } = c.req.valid("json");

      //
      if (!address) {
        return c.json(
          {
            errCode: "UNRESOLVABLE" as const,
            message: "Remote IP of flare emitter is unresolvable.",
          },
          500,
        );
      }

      //
      const remoteOperation = dummy ? "dummy" : "batch";

      //
      const { ddnsForDomain } = c.get("apiContext");
      eeRequests.queueFlareForProcessing(remoteOperation, {
        flaredIPv6: addressType === "IPv6" ? address : undefined,
        flaredIPv4: addressType === "IPv4" ? address : undefined,
        ofDomain: ddnsForDomain,
        receivedAt: new Date(),
      });

      //
      return c.text(remoteOperation, 200);
    },
  );
};
