import { type AppUser } from "@/server/app";

declare global {
  // Overriding Express.User with our own baked User type (required by Express API https://stackoverflow.com/a/40762463/3021058)
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AppUser {}
    namespace session {
      interface SessionData {
        messages?: string[];
      }
    }
  }
}

export {};
