import { getDb } from "@/db";
import { flareKeys, flares } from "@/db/schema";
import { produceRandomKey } from "@/helpers/random";
import { count, eq, inArray } from "drizzle-orm";
import { flareDomains } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { addLinger, protectedProcedure } from "./_base";
import { z } from "zod";
import EventEmitter, { on } from "events";
import type { InferSelectModel } from "drizzle-orm";

const ee = new EventEmitter();

//
export const produceUnusedAPIKey = async () => {
  while (true) {
    //
    const key = produceRandomKey();
    //
    const [{ count: alreadyExist }] = await getDb()
      .select({ count: count() })
      .from(flareKeys)
      .where(eq(flareKeys.apiKey, key));

    if (alreadyExist) continue;

    //
    return key;
  }
};

//
//
//

const apiProtected = {
  //
  createAPIKeyFor: protectedProcedure
    .use(addLinger())
    .input(z.object({ ddnsForDomain: z.string().nonempty() }))
    .query(async ({ input: { ddnsForDomain } }) => {
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
    .query(
      async ({ ctx, input: { cloudFlareDomain, description, subdomain } }) => {
        //
        if (!ctx.availableCloudflareDomains.includes(cloudFlareDomain)) {
          throw new TRPCError({
            code: "UNPROCESSABLE_CONTENT",
            message: `Chosen "${cloudFlareDomain}" domain is not allowed`,
          });
        }

        //
        if (subdomain.includes(".")) {
          throw new TRPCError({
            code: "UNPROCESSABLE_CONTENT",
            message: `Subdomain "${subdomain}" should not contain "."`,
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
  deleteDDNSEntries: protectedProcedure
    .use(addLinger())
    .input(z.object({ subdomains: z.string().array() }))
    .query(async ({ input: { subdomains } }) => {
      // // TODO: make cascading delete work and remove below
      // await getDb().delete(flares).where(inArray(flares.ofDomain, subdomains));
      // await getDb()
      //   .delete(flareKeys)
      //   .where(inArray(flareKeys.ddnsForDomain, subdomains));

      //
      await getDb()
        .delete(flareDomains)
        .where(inArray(flareDomains.ddnsForDomain, subdomains));
    }),
  //
  sendTestFlare: protectedProcedure
    .input(z.object({ ofDomain: z.string().nonempty() }))
    .query(async ({ input: { ofDomain } }) => {
      const testFlare = await getDb()
        .insert(flares)
        .values({ receivedAt: new Date(), ofDomain })
        .returning();
      ee.emit("add", testFlare);
      // cfEmitter.next({
      //   operation: "update",
      //   record: {
      //     fullName: "test.ivy.community",
      //     type: "A",
      //     proxied: true,
      //     content: "1.1.1.1",
      //   },
      // });
    }),
  //
  deleteAllFlares: protectedProcedure.query(() => getDb().delete(flares)),
  //
  getFlareDomains: protectedProcedure.query(() =>
    getDb().select().from(flareDomains),
  ),
  //
  getApiKeys: protectedProcedure.query(() => getDb().select().from(flareKeys)),
  //
  getFlares: protectedProcedure.query(() => getDb().select().from(flares)),
  //
  //
  //
  onFlaresUpdates: protectedProcedure.subscription(async function* (opts) {
    for await (const [data] of on(ee, "add", {
      signal: opts.signal,
    })) {
      const flare = data as InferSelectModel<typeof flares>;
      yield flare;
    }
  }),
};

export default apiProtected;
