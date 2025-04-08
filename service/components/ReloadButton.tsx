import { ArrowPathIcon } from "@heroicons/react/24/solid";

const ReloadButton = ({
  action,
  className,
}: {
  action: () => void;
  className?: string;
}) => {
  return (
    <button onClick={action} className={["btn btn-sm", className].join(" ")}>
      <ArrowPathIcon className="size-4" />
      Reload
    </button>
  );
};

export default ReloadButton;
