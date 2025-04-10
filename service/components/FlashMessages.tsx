import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePageContext } from "vike-react/usePageContext";

import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

import { onlyUniqueStr } from "#/helpers/onlyUnique";
import type { RootState } from "#/store/reducers";
import type { FlashMessageType } from "#/store/reducers/flashMessages";
import {
  addErrorMessage,
  clearFlashMessages,
} from "#/store/reducers/flashMessages";

import CopyToClipboardButton from "./CopyToClipboardButton";

const lingerDurationMs = 2_000; // 2 secs
const iconSize = "size-6"; // 1.5rem

//
const FlashMessages = () => {
  // https://tailwindcss.com/docs/detecting-classes-in-source-files
  const availableAlertTypes: Record<FlashMessageType, string> = {
    error: "alert-error",
    success: "alert-success",
  };

  const dispatch = useDispatch();
  const { flashMessages } = useSelector(
    (state: RootState) => state.flashMessages,
  );

  const {
    injected: { authFailure },
  } = usePageContext();

  const [schedueledForDeletion, setScheduledForDeletion] = useState<string[]>(
    [],
  );

  useEffect(() => {
    if (authFailure) {
      dispatch(addErrorMessage(authFailure.message));
    }
  }, [authFailure]);

  //
  useEffect(() => {
    //
    const idsToDeleteLater = flashMessages
      .filter(({ id }) => !schedueledForDeletion.includes(id))
      .map(({ id }) => id);

    if (idsToDeleteLater.length === 0) return;

    //
    idsToDeleteLater.forEach((id) => {
      const timer = setTimeout(() => {
        dispatch(clearFlashMessages({ idsToDelete: [id] }));
        clearTimeout(timer);
      }, lingerDurationMs);
    });

    //
    setScheduledForDeletion(
      [...schedueledForDeletion, ...idsToDeleteLater].filter(onlyUniqueStr),
    );
  }, [flashMessages]);

  //
  return (
    <>
      {flashMessages && (
        <div className="absolute top-2 z-10 flex w-full flex-col gap-1">
          <AnimatePresence>
            {flashMessages.map(({ message, id, msgType }) => {
              //
              const icon = (() => {
                switch (msgType) {
                  case "error":
                    return <ExclamationTriangleIcon className={iconSize} />;
                  case "success":
                    return <CheckCircleIcon className={iconSize} />;
                }
              })();

              //
              return (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  role="alert"
                  className={`alert ${availableAlertTypes[msgType]} mx-4`}
                >
                  {icon}
                  <span>{message}</span>
                  <CopyToClipboardButton
                    tobeCopied={message}
                    flashForSuccess={false}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </>
  );
};

export default FlashMessages;
