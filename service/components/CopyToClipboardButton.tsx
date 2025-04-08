import { wait } from "@/helpers/withLinger";
import { addSuccessMessage } from "@/store/reducers/flashMessages";
import { ClipboardIcon, CheckIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { useDispatch } from "react-redux";

//
const CopyToClipboardButton = ({
  tobeCopied,
  flashForSuccess,
  btnText,
  lingerWaitMs,
}: {
  tobeCopied: string;
  flashForSuccess: boolean;
  btnText?: string;
  lingerWaitMs?: number;
}) => {
  //
  const dispatch = useDispatch();
  const [copied, setCopied] = useState<"no" | "yes" | "ongoing">("no");

  //
  return (
    <button
      onClick={async () => {
        //
        if (lingerWaitMs && lingerWaitMs > 0) {
          setCopied("ongoing");
          await wait(lingerWaitMs); // add UX linger
        }

        //
        navigator.clipboard.writeText(tobeCopied);
        setCopied("yes");

        //
        if (flashForSuccess)
          dispatch(addSuccessMessage("API key copied to clipboard !"));
      }}
      disabled={copied != "no"}
      className={`btn ${copied ? "btn-neutral" : "btn-success"}`}
    >
      {(() => {
        switch (copied) {
          case "no":
            return <ClipboardIcon className="size-4" />;
          case "ongoing":
            return <span className="loading loading-spinner loading-xs"></span>;
          case "yes":
            return <CheckIcon className="size-4" />;
        }
      })()}
      {copied == "yes" ? "Copied !" : (btnText ?? "Copy")}
    </button>
  );
};

export default CopyToClipboardButton;
