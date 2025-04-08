import { withLinger } from "@/helpers/withLinger";
import { initTRPC, TRPCError } from "@trpc/server";

export type HonoContext = {
  userLogged?: boolean;
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
