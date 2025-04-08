import { ArrowPathIcon } from "@heroicons/react/24/solid";

const ReloadButton = ({
  action,
  className,
  disabled,
}: {
  action: () => void;
  className?: string;
  disabled?: boolean;
}) => {
  return (
    <button
      disabled={disabled}
      onClick={action}
      className={["btn btn-sm", className].join(" ")}
    >
      <ArrowPathIcon className="size-4" />
      Reload
    </button>
  );
};

export default ReloadButton;
