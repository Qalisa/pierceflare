import { TRPCError, initTRPC } from "@trpc/server";

import { withLinger } from "#/helpers/withLinger";

export type HonoContext = {
  userLogged?: boolean;
  availableCloudflareDomains: string[];
};

const t = initTRPC.context<HonoContext>().create();

//
export const protectedProcedure = t.procedure.use(
  async function isAuthed(opts) {
    const {
      ctx: { userLogged },
    } = opts;

    //
    if (userLogged == true) {
      return opts.next();
    }

    //
    throw new TRPCError({ code: "UNAUTHORIZED" });
  },
);

type LingerRestParams =
  Parameters<typeof withLinger> extends [unknown, ...infer Rest] ? Rest : never;

//
export const addLinger = (...args: LingerRestParams) => {
  return t.middleware(async (opts) => {
    return withLinger(opts.next(), ...args);
  });
};

export const publicProcedure = t.procedure;
export const router = t.router;
