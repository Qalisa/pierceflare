import ThemeToggler from "@/components/ThemeToggle";
import appLogo from "@/assets/images/logo.webp";
import { routes } from "@/server/app";
import { navigate } from "vike/client/router";

import {
  PowerIcon,
  ClipboardDocumentListIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/solid";
import { title } from "@/server/static";
import { usePageContext } from "vike-react/usePageContext";

//
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="navbar bg-base-100 gap-8 shadow-sm">
        <LeftPart />
        <CenterPart />
        <RightPart />
      </div>
      <div className="flex flex-auto flex-col content-center justify-center">
        {children}
      </div>
    </>
  );
};

//
//
//

const LeftPart = () => {
  return (
    <div className="flex gap-2">
      <img src={appLogo} width="32px" />
      <span className="text-base-content text-xl">{title}</span>
    </div>
  );
};

//
const CenterPart = () => {
  //
  const { urlPathname } = usePageContext();

  //
  return (
    <div className="join join-vertical sm:join-horizontal flex-1 justify-center">
      <button
        className={`join-item btn ${urlPathname === routes.pages.dashboard ? "btn-active" : ""}`}
        name="options"
        onClick={() => navigate(routes.pages.dashboard)}
      >
        <ClipboardDocumentListIcon className="size-4" />
        Dashboard
      </button>
      <button
        className={`join-item btn ${urlPathname === routes.pages.createDDNS ? "btn-active" : ""}`}
        onClick={() => navigate(routes.pages.createDDNS)}
      >
        Create DDNS
        <PlusCircleIcon className="size-4" />
      </button>
    </div>
  );
};

//
const RightPart = () => {
  return (
    <div className="join join-vertical sm:join-horizontal items-center gap-2">
      <ThemeToggler />
      <form action={routes.api.logout} method="post">
        <button type="submit" className="btn btn-xs btn-primary" title="">
          Logout
          <PowerIcon className="size-3" />
        </button>
      </form>
    </div>
  );
};

export default Layout;
