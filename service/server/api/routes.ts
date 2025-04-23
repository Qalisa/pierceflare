import ip from "ip";
import { z } from "zod";

import { getConnInfo } from "@hono/node-server/conninfo";
import { createRoute } from "@hono/zod-openapi";

import { eeRequests, RemoteOperation$ } from "#/db/requests";
import type { AppServer } from "#/server/helpers/definition";
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
            "application/json": {
              schema: z.object({
                op: RemoteOperation$.openapi("RemoteOperation"),
                resolvedIp: z.string(),
              }),
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
      // first, check validity
      const { dummy, ip: clientResolvedIp } = c.req.valid("json");

      //
      const {
        remote: { address: detectedAddress },
      } = getConnInfo(c);

      //
      if (!detectedAddress) {
        return c.json(
          {
            errCode: "UNRESOLVABLE" as const,
            message: "Remote IP of flare emitter is unresolvable.",
          },
          500,
        );
      }

      //
      const isPrivate = ip.isPrivate(detectedAddress);
      const addressToUse =
        isPrivate && clientResolvedIp ? clientResolvedIp : detectedAddress;
      const addressToUseType = ip.isV4Format(addressToUse) ? "IPv4" : "IPv6";

      //
      const remoteOp = dummy ? ("dummy" as const) : ("batch" as const);

      //
      const { ddnsForDomain } = c.get("apiContext");
      eeRequests.queueFlareForProcessing(remoteOp, {
        flaredIPv6: addressToUseType === "IPv6" ? addressToUse : undefined,
        flaredIPv4: addressToUseType === "IPv4" ? addressToUse : undefined,
        ofDomain: ddnsForDomain,
        receivedAt: new Date(),
      });

      //
      return c.json({ op: remoteOp, resolvedIp: addressToUse }, 200);
    },
  );
};
