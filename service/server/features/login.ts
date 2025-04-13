import { withLinger } from "#/helpers/withLinger";
import type { AppServer } from "#/server";
import { SERVICE_AUTH_PASSWORD, SERVICE_AUTH_USERNAME } from "#/server/helpers/env";
import { routes } from "#/server/helpers/routes";

//
const addLogin = (server: AppServer) => {
  // Login //
  server.post(routes.pages.login, async ({ req, get, redirect }) => {
    //
    const login = async () => {
      //
      const session = get("session");
      const loginFailed = async (message: string, username?: string) => {
        session.flash("authFailure", { message, username });
        return redirect(routes.pages.login);
      };

      const body = await req.parseBody();
      const { password, username } = body;

      //
      if (typeof password !== "string" || typeof username !== "string") {
        return loginFailed("Unexpected values for credentials");
      }
      if (!password || !username) {
        return loginFailed("Missing username or password");
      }

      const authOK =
        SERVICE_AUTH_USERNAME == username.trim() &&
        SERVICE_AUTH_PASSWORD == password;
      if (!authOK) {
        return loginFailed("Invalid credentials", username);
      }

      //
      session.set("user", { username });
      return redirect(routes.pages.dashboard);
    };

    //
    return await withLinger(login(), 300);
  });

  // Logout //
  server.post(routes.appApi.logout, async ({ get, redirect }) => {
    const session = get("session");
    session.deleteSession();
    return redirect(routes.default);
  });
};

export default addLogin;
