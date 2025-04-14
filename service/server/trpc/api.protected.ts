import { desc, inArray } from "drizzle-orm";
import { on } from "events";
import { z } from "zod";

import { TRPCError } from "@trpc/server";

import { getDb } from "#/db";
import type { DbRequestsEvents } from "#/db/requests";
import { dbRequestsEE, eeRequests, produceUnusedAPIKey } from "#/db/requests";
import { flareKeys, flares } from "#/db/schema";
import { flareDomains } from "#/db/schema";
import { isValidSubdomain } from "#/helpers/domains";

import { addLinger, protectedProcedure } from "./_base";

const apiProtected = {
  //
  createAPIKeyFor: protectedProcedure
    .use(addLinger())
    .input(z.object({ ddnsForDomain: z.string().nonempty() }))
    .mutation(async ({ input: { ddnsForDomain } }) => {
      //
      const apiKey = await produceUnusedAPIKey();

      //
      await getDb().insert(flareKeys).values({
        ddnsForDomain,
        apiKey,
        createdAt: new Date(),
      });

      //
      return apiKey;
    }),
  //
  submitDDNSEntry: protectedProcedure
    .use(addLinger())
    .input(
      z.object({
        subdomain: z.string().nonempty(),
        cloudFlareDomain: z.string().nonempty(),
        description: z.string().nonempty(),
      }),
    )
    .mutation(
      async ({ ctx, input: { cloudFlareDomain, description, subdomain } }) => {
        //
        if (!ctx.cloudflare.availableDomains.includes(cloudFlareDomain)) {
          throw new TRPCError({
            code: "UNPROCESSABLE_CONTENT",
            message: `Chosen "${cloudFlareDomain}" domain is not allowed`,
          });
        }

        //
        subdomain = subdomain.trim();
        if (!isValidSubdomain(subdomain)) {
          throw new TRPCError({
            code: "UNPROCESSABLE_CONTENT",
            message: `Subdomain "${subdomain}.${cloudFlareDomain}" is not valid`,
          });
        }

        //
        await getDb()
          .insert(flareDomains)
          .values({
            ddnsForDomain: `${subdomain}.${cloudFlareDomain}`,
            description,
            createdAt: new Date(),
          });
      },
    ),
  //
  clearCachedIPsFromDDNSEntries: protectedProcedure
    .use(addLinger())
    .input(z.object({ subdomains: z.string().array() }))
    .mutation(async ({ input: { subdomains } }) => {
      await getDb()
        .update(flareDomains)
        .set({ latestSyncedIPv4: null, latestSyncedIPv6: null })
        .where(inArray(flareDomains.ddnsForDomain, subdomains));
    }),
  //
  deleteDDNSEntries: protectedProcedure
    .use(addLinger())
    .input(z.object({ subdomains: z.string().array() }))
    .mutation(async ({ input: { subdomains } }) => {
      await getDb()
        .delete(flareDomains)
        .where(inArray(flareDomains.ddnsForDomain, subdomains));
    }),
  //
  sendTestFlare: protectedProcedure
    .input(z.object({ ofDomain: z.string().nonempty() }))
    .mutation(({ input: { ofDomain } }) => {
      eeRequests.queueFlareForProcessing("dummy", {
        ofDomain,
        receivedAt: new Date(),
        flaredIPv4: "1.1.1.1",
      });
    }),
  //
  deleteAllFlares: protectedProcedure.mutation(async () => {
    await getDb().delete(flares);
  }),
  //
  getFlareDomains: protectedProcedure.query(() =>
    getDb().select().from(flareDomains),
  ),
  //
  getApiKeys: protectedProcedure.query(() => getDb().select().from(flareKeys)),
  //
  getFlares: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      }),
    )
    .query(async ({ input: { limit } }) => {
      //
      return await getDb()
        .select()
        .from(flares)
        .orderBy(desc(flares.receivedAt))
        .limit(limit);
    }),
  //
  //
  //
  onFlaresUpdates: protectedProcedure.subscription(async function* (opts) {
    //
    for await (const [data] of on(
      dbRequestsEE,
      "flareChanged" satisfies keyof DbRequestsEvents,
      {
        signal: opts.signal,
      },
    )) {
      const event = data as DbRequestsEvents["flareChanged"][number];
      yield event;
    }
  }),
  onDomainUpdates: protectedProcedure.subscription(async function* (opts) {
    //
    for await (const [data] of on(
      dbRequestsEE,
      "domainChanged" satisfies keyof DbRequestsEvents,
      {
        signal: opts.signal,
      },
    )) {
      const event = data as DbRequestsEvents["domainChanged"][number];
      yield event;
    }
  }),
};

export default apiProtected;
