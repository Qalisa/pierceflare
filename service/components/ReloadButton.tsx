import { ArrowPathIcon } from "@heroicons/react/24/solid";

const ReloadButton = ({ action }: { action: () => void }) => {
  return (
    <button onClick={action} className="btn btn-sm ml-auto">
      <ArrowPathIcon className="size-4" />
      Reload
    </button>
  );
};

export default ReloadButton;
