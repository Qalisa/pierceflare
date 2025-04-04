import ThemeToggler from "@/components/ThemeToggle";
import appLogo from "@/assets/images/logo.webp";
import { routes } from "@/server/app";
import { navigate } from "vike/client/router";

import {
  PowerIcon,
  ClipboardDocumentListIcon,
  ArrowsUpDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";
import { title } from "@/server/static";
import { usePageContext } from "vike-react/usePageContext";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { RootState } from "@/store/reducers";
import { useDispatch, useSelector } from "react-redux";
import {
  clearFlashMessages,
  resetSchedueler,
  schedueleForDeletion,
} from "@/store/reducers/flashMessages";

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
      <div className="flex w-full flex-auto flex-col items-center justify-center">
        {children}
      </div>
    </>
  );
};

//
//
//
const FlashMessages = () => {
  const flashMessages = useSelector((state: RootState) => state.flashMessages);
  const dispatch = useDispatch();

  // always reset the schedueler at first mount, so that they can re-scheduled for deletion
  useEffect(() => {
    dispatch(resetSchedueler());
  }, []);

  useEffect(() => {
    //
    const idsToDeleteLater = flashMessages
      .filter((fMsg) => fMsg.schedueledForDeletionAt != null)
      .map(({ id }) => id);

    //
    const cleanupFunctions = idsToDeleteLater.map((id) => {
      //
      const timer = setTimeout(() => {
        dispatch(clearFlashMessages({ idsToDelete: [id] }));
      }, 2000);

      //
      return () => clearTimeout(timer); // Cleanup on unmount
    });

    // may retrigger this effect, so do it the latest possible
    dispatch(schedueleForDeletion({ idsToDeleteLater }));

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [flashMessages]);

  return (
    <>
      {flashMessages && (
        <div className="absolute top-0 flex w-full flex-col gap-1">
          <AnimatePresence>
            {flashMessages.map(({ message, msgType: _ }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                role="alert"
                className="alert alert-error m-4"
              >
                <ExclamationTriangleIcon className="size-6" />
                <span>{message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
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
        className={`join-item btn ${urlPathname === routes.pages.flaresFeed ? "btn-active" : ""}`}
        onClick={() => navigate(routes.pages.flaresFeed)}
      >
        Feed
        <ArrowsUpDownIcon className="size-4" />
      </button>
    </div>
  );
};

//
const RightPart = () => {
  return (
    <div className="join join-vertical sm:join-horizontal items-center gap-2">
      <ThemeToggler />
      <LogoutButton />
    </div>
  );
};

const LogoutButton = () => {
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={routes.api.logout} method="post" ref={formRef}>
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
