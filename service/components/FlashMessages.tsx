import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { RootState } from "@/store/reducers";
import { useDispatch, useSelector } from "react-redux";
import type { FlashMessageType } from "@/store/reducers/flashMessages";
import { clearFlashMessages } from "@/store/reducers/flashMessages";
import { onlyUniqueStr } from "@/helpers/onlyUnique";

const lingerDurationMs = 20_000; // 2 secs
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

  const [schedueledForDeletion, setScheduledForDeletion] = useState<string[]>(
    [],
  );

  useEffect(() => {
    //
    const idsToDeleteLater = flashMessages
      .filter(({ id }) => !schedueledForDeletion.includes(id))
      .map(({ id }) => id);

    if (idsToDeleteLater.length === 0) return;

    //
    const _cleanupFunctions = idsToDeleteLater.map((id) => {
      //
      const timer = setTimeout(() => {
        dispatch(clearFlashMessages({ idsToDelete: [id] }));
      }, lingerDurationMs);

      //
      return () => {
        clearTimeout(timer);
      };
    });

    //
    setScheduledForDeletion(
      [...schedueledForDeletion, ...idsToDeleteLater].filter(onlyUniqueStr),
    );

    return () => {
      // cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [flashMessages]);

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
