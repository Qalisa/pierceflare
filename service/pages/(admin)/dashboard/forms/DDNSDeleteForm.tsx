import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";

import { TrashIcon } from "@heroicons/react/24/solid";
import { Bars3BottomRightIcon } from "@heroicons/react/24/solid";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getModal, modalIds } from "#/helpers/modals";
import { useTRPC } from "#/helpers/trpc";
import type { RootState } from "#/store/reducers";
import { clearSelected } from "#/store/reducers/ddnsEntries";
import {
  addErrorMessage,
  addSuccessMessage,
} from "#/store/reducers/flashMessages";

const formId = "ddns-delete";

//
const DDNSDeleteForm = ({
  submitButtonOutside,
}: {
  submitButtonOutside: boolean;
}) => {
  //
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteDDNSEntries = useMutation(
    trpc.deleteDDNSEntries.mutationOptions(),
  );

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
          deleteDDNSEntries
            .mutateAsync({ subdomains: selectedForDeletion })
            .then(async () => {
              dispatch(clearSelected());
              dispatch(
                addSuccessMessage(
                  `${selectedForDeletion.length} DDNS Entr${selectedForDeletion.length > 1 ? "ies" : "y"} removed.`,
                ),
              );
              queryClient.invalidateQueries({
                queryKey: trpc.getFlareDomains.queryKey(),
              });
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
