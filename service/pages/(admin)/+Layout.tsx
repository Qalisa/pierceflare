import ThemeToggler from "@/components/ThemeToggle";
import appLogo from "@/assets/images/logo.webp";
import { routes } from "@/helpers/routes";
import { navigate } from "vike/client/router";

import {
  ArrowsUpDownIcon,
  ClipboardDocumentListIcon,
  PowerIcon,
} from "@heroicons/react/24/solid";
import { title } from "@/helpers/static";
import { usePageContext } from "vike-react/usePageContext";
import { useEffect, useRef, useState } from "react";
import FlashMessages from "@/components/FlashMessages";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/reducers";
import { incrementUnseenCount } from "@/store/reducers/unseenUpdates";
import { useSubscription } from "@trpc/tanstack-react-query";
import { useTRPC } from "@/helpers/trpc";
import FlareGeneratorCommandBelt from "@/components/FlareGeneratorCommandBelt";

//
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <FlashMessages />
      <div className="navbar bg-base-100 gap-8 shadow-sm">
        <LeftPart />
        <CenterPart />
        <RightPart />
      </div>
      <div
        id="page-content"
        className="flex w-full flex-auto flex-col items-center pt-8"
      >
        {children}
      </div>
      {import.meta.env.DEV && (
        <div className="absolute right-2/100 bottom-2/100">
          <FlareGeneratorCommandBelt />
        </div>
      )}
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
  const dispatch = useDispatch();
  const { flares: flaresUpdates, domains: domainsUpdates } = useSelector(
    (state: RootState) => state.unseenUpdates.unseenUpdates,
  );

  //
  const trpc = useTRPC();
  const { data: flareUpdated } = useSubscription(
    trpc.onFlaresUpdates.subscriptionOptions(),
  );
  const { data: domainUpdated } = useSubscription(
    trpc.onDomainUpdates.subscriptionOptions(),
  );

  //
  const feedActive = urlPathname === routes.pages.flaresFeed;
  useEffect(() => {
    if (flareUpdated && !feedActive) dispatch(incrementUnseenCount("flares"));
  }, [flareUpdated]);

  //
  const dashboardActive = urlPathname === routes.pages.dashboard;
  useEffect(() => {
    if (domainUpdated && !dashboardActive)
      dispatch(incrementUnseenCount("domains"));
  }, [domainUpdated]);

  //
  return (
    <div className="flex flex-1 items-center justify-around gap-4">
      <div className="indicator join join-vertical sm:join-horizontal justify-center">
        {/** buttons */}
        <GoToDashboardButton className="join-item" active={dashboardActive} />
        <GoToFeedButton className="join-item" active={feedActive} />
        {/** indicators */}
        {domainsUpdates > 0 && (
          <span className="indicator-item indicator-bottom indicator-start badge badge-xs badge-error pointer-events-none">
            {domainsUpdates}
          </span>
        )}
        {flaresUpdates > 0 && (
          <span className="indicator-item indicator-bottom indicator-end badge badge-xs badge-error pointer-events-none">
            {flaresUpdates}
          </span>
        )}
      </div>
    </div>
  );
};

//
//
//

//
const GoToDashboardButton = ({
  className,
  active,
}: {
  className: string;
  active: boolean;
}) => {
  return (
    <button
      className={[`btn ${active ? "btn-active" : ""}`, className].join(" ")}
      onClick={() => navigate(routes.pages.dashboard)}
    >
      <ClipboardDocumentListIcon className="size-4" />
      Dashboard
    </button>
  );
};

//
const GoToFeedButton = ({
  className,
  active,
}: {
  className: string;
  active: boolean;
}) => {
  return (
    <button
      className={[`btn ${active ? "btn-active" : ""}`, className].join(" ")}
      onClick={() => navigate(routes.pages.flaresFeed)}
    >
      Feed
      <ArrowsUpDownIcon className="size-4" />
    </button>
  );
};

//
//
//

//
const RightPart = () => {
  return (
    <div className="join join-vertical sm:join-horizontal mr-0 items-center gap-2 sm:mr-4">
      <ThemeToggler />
      <LogoutButton />
    </div>
  );
};

//
const LogoutButton = () => {
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={routes.appApi.logout} method="post" ref={formRef}>
      <button
        type="submit"
        className="btn btn-xs btn-primary"
        disabled={sent}
        onClick={(e) => {
          e.preventDefault();
          setSent(true);
          formRef.current?.submit();
        }}
      >
        Logout
        {sent ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <PowerIcon className="size-3" />
        )}
      </button>
    </form>
  );
};

export default Layout;
