import db from "@/db";
import { flareKeys, flares } from "@/db/schema";
import { produceRandomKey } from "@/helpers/random";
import { count, eq, inArray } from "drizzle-orm";
import { flareDomains } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { addLinger, protectedProcedure } from "./_base";
import { z } from "zod";

//
export const produceUnusedAPIKey = async () => {
  while (true) {
    //
    const key = produceRandomKey();
    //
    const [{ count: alreadyExist }] = await db
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
      await db.insert(flareKeys).values({
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
        await db.insert(flareDomains).values({
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
      //
      await db
        .delete(flareDomains)
        .where(inArray(flareDomains.ddnsForDomain, subdomains));

      // TODO: make cascading delete work and remove below
      await db
        .delete(flareKeys)
        .where(inArray(flareKeys.ddnsForDomain, subdomains));
    }),
  //
  sendTestFlare: protectedProcedure
    .input(z.object({ ofDomain: z.string().nonempty() }))
    .query(async ({ input: { ofDomain } }) => {
      await db.insert(flares).values({ receivedAt: new Date(), ofDomain });
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
  deleteAllFlares: protectedProcedure.query(() => db.delete(flares)),
  //
  getFlareDomains: protectedProcedure.query(() =>
    db.select().from(flareDomains),
  ),
  //
  getApiKeys: protectedProcedure.query(() => db.select().from(flareKeys)),
  //
  getFlares: protectedProcedure.query(() => db.select().from(flares)),
};

export default apiProtected;
