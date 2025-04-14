import { usePageContext } from "vike-react/usePageContext";

import cloudflareLogo from "#/assets/images/cloudflare.svg";
import appLogo from "#/assets/images/logo.webp";
import swaggerLogo from "#/assets/images/swagger.svg";

import FlashMessages from "#/components/FlashMessages";
import FlashMessagesBelt from "#/components/FlashMessagesBelt";
import { githubRepoUrl, title } from "#/helpers/static";
import { routes } from "#/server/helpers/routes";

import "#/style/global.css";
import "#/style/tailwind.css";

//
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <FlashMessages />
      <div id="app">{children}</div>
      <Footer />
      {import.meta.env.DEV && <FlashMessagesBelt />}
    </>
  );
};

//
//
//

//
const Footer = () => {
  const { injected } = usePageContext();
  const { version, imageRevision, imageVersion } = injected.k8sApp;

  //
  return (
    <footer className="z-10 footer sm:footer-horizontal bg-neutral text-neutral-content items-center p-4">
      <aside className="grid-flow-col items-center">
        <img src={appLogo} width="40px" />
        <p>
          {title} - Copyright © {new Date().getFullYear()} - All right reserved
        </p>
        <p className="text-secondary text-center text-xs">
          <span>{version}</span>
          <span>
            ({imageVersion}/{imageRevision})
          </span>
        </p>
      </aside>
      <div className="grid-flow-col gap-4 items-center md:place-self-center md:justify-self-end">
        <nav className="flex gap-2">
          <SwaggerIconBtn />
          <GithubIconBtn />
        </nav>
        <span>-</span>
        <CloudflareWorkerState />
      </div>
    </footer>
  );
};

//
//
//

//
const CloudflareWorkerState = () => {
  //
  const {
    injected: {
      cloudflare: { workerState },
    },
  } = usePageContext();

  //
  const { className, text } = (() => {
    switch (workerState) {
      case "disabled":
        return { text: "Disabled", className: "status-neutral" };
      case "starting":
        return { text: "Starting...", className: "status-warning" };
      case "running":
        return { text: "Running", className: "status-success" };
    }
  })();

  return (
    <div className="flex items-center justify-center gap-2">
      <img src={cloudflareLogo} width={16} />
      <span>{text}</span>
      <div aria-label="status" className={`status ${className}`}></div>
    </div>
  );
};

//
const SwaggerIconBtn = () => {
  return (
    <label title={`${title}'s API specs`}>
      <a href={routes.swagger.ui} target="_blank" rel="noreferrer">
        <img src={swaggerLogo} width={32} />
      </a>
    </label>
  );
};

//
const GithubIconBtn = () => {
  return (
    <a
      href={githubRepoUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`${title}'s Github`}
    >
      <svg
        aria-label="GitHub logo"
        width="32"
        height="32"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          fill="white"
          d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"
        ></path>
      </svg>
    </a>
  );
};

export default Layout;
