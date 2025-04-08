import { router } from "./_base";
import apiProtected from "./api.protected";

export const appRouter = router({
  ...apiProtected,
});

export type AppRouter = typeof appRouter;
