import { useRef, useState } from "react";
import { usePageContext } from "vike-react/usePageContext";

import appLogo from "#/assets/images/logo.webp";

import { routes } from "#/server/helpers/routes";

const IndexPage = () => {
  const { injected } = usePageContext();
  const { authFailure } = injected;
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  //
  return (
    <>
      <div className="card">
        <figure>
          <img alt="" src={appLogo} width="100px" />
        </figure>
        <form
          className="card-body"
          method="POST"
          action={routes.pages.login}
          ref={formRef}
        >
          <fieldset className="fieldset">
            <input
              name="username"
              type="text"
              className="input"
              placeholder="Username"
              autoComplete="username"
              defaultValue={authFailure?.username}
              required
              disabled={sent}
            />
          </fieldset>
          <fieldset className="fieldset">
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              className="input"
              placeholder="Password"
              required
              disabled={sent}
            />
          </fieldset>
          <button
            type="submit"
            className="btn btn-block btn-primary mt-1"
            disabled={sent}
            onClick={(e) => {
              e.preventDefault();
              setSent(true);
              formRef.current?.submit();
            }}
          >
            Login
            {sent && (
              <span className="loading loading-spinner loading-xs"></span>
            )}
          </button>
        </form>
      </div>
    </>
  );
};

export default IndexPage;
