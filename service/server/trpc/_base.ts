import { initTRPC, TRPCError } from "@trpc/server";

export type HonoContext = {
  userLogged?: true;
  availableCloudflareDomains: string[];
};

const t = initTRPC.context<HonoContext>().create();

//
export const protectedProcedure = t.procedure.use(
  async function isAuthed(opts) {
    const { ctx } = opts;
    if (!("userLogged" in ctx)) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return opts.next();
  },
);

export const publicProcedure = t.procedure;
export const router = t.router;
