import { useDispatch } from "react-redux";

import { BoltIcon } from "@heroicons/react/24/solid";

import { addErrorMessage } from "#/store/reducers/flashMessages";

const FlashMessagesBelt = () => {
  const dispatch = useDispatch();

  return (
    <div className="absolute bottom-2/100 left-2/100">
      <button
        className="btn btn-secondary btn-sm"
        onClick={() =>
          dispatch(
            addErrorMessage(
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
            ),
          )
        }
      >
        <BoltIcon className="size-3" />
        Pop Message
      </button>
    </div>
  );
};

export default FlashMessagesBelt;
