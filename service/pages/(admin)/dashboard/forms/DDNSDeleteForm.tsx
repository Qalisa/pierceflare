import { useForm } from "react-hook-form";

import { TrashIcon } from "@heroicons/react/24/solid";

import { useDispatch, useSelector } from "react-redux";
import {
  addErrorMessage,
  addSuccessMessage,
} from "@/store/reducers/flashMessages";
import { clearSelected } from "@/store/reducers/ddnsEntries";
import { getModal, modalIds } from "@/helpers/modals";
import type { RootState } from "@/store/reducers";
import { onSubmitDeleteDDNSEntries } from "./DDNSDeleteForm.telefunc";

import { Bars3BottomRightIcon } from "@heroicons/react/24/solid";
import { reload } from "vike/client/router";

const formId = "ddns-delete";

//
const DDNSDeleteForm = ({
  submitButtonOutside,
}: {
  submitButtonOutside: boolean;
}) => {
  //
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    shouldFocusError: true,
    shouldUseNativeValidation: true,
    reValidateMode: "onChange",
  });

  //
  const dispatch = useDispatch();
  const { selectedForDeletion } = useSelector(
    (state: RootState) => state.ddnsEntries,
  );

  const modal = getModal(modalIds.deleteDDNS);

  const buttons = (
    <>
      <button
        className="btn"
        disabled={isSubmitting}
        onClick={() => modal.closeModal()}
      >
        Cancel
      </button>
      <button
        form={formId}
        type="submit"
        className="btn btn-error"
        disabled={isSubmitting}
      >
        Delete
        {isSubmitting ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <TrashIcon className="size-4" />
        )}
      </button>
    </>
  );

  //
  return {
    ...(submitButtonOutside ? { buttons } : {}),
    form: (
      <form
        id={formId}
        className="card"
        onSubmit={handleSubmit(async () =>
          onSubmitDeleteDDNSEntries(selectedForDeletion)
            .then(async () => {
              dispatch(clearSelected());
              dispatch(
                addSuccessMessage(
                  `${selectedForDeletion.length} DDNS Entries deleted`,
                ),
              );
              await reload();
            })
            .catch((e: Error) => {
              dispatch(
                addErrorMessage(
                  "abortValue" in e ? (e.abortValue as string) : e.message,
                ),
              );
            })
            .finally(() => modal.closeModal()),
        )}
      >
        <div className="card-body">
          <h2 className="card-title">Delete DDNS Entries</h2>
          <p>Do you really want to delete these entries ?</p>
          <br />
          <ul className="list bg-neutral text-neutral-content">
            {selectedForDeletion.map((entry) => (
              <li key={entry} className="list-row">
                <Bars3BottomRightIcon className="size-6" /> {entry}
              </li>
            ))}
          </ul>
          {!submitButtonOutside && buttons}
        </div>
      </form>
    ),
  };
};

export default DDNSDeleteForm;
