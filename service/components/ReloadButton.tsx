import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { reload } from "vike/client/router";

const ReloadButton = () => {
  return (
    <button onClick={reload} className="btn btn-sm ml-auto">
      <ArrowPathIcon className="size-4" />
      Reload
    </button>
  );
};

export default ReloadButton;
