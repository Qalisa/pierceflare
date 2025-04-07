import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expectedInput$ } from "./DDNSCreateForm.schemas";

import { PlusCircleIcon } from "@heroicons/react/24/solid";
import { usePageContext } from "vike-react/usePageContext";

import { useDispatch } from "react-redux";
import {
  addErrorMessage,
  addSuccessMessage,
} from "@/store/reducers/flashMessages";
import { getModal, modalIds } from "@/helpers/modals";
import { useTRPCClient } from "@/helpers/trpc";
import { notifyTableStaleness } from "@/store/reducers/staleness";

const formId = "ddns-create";

//
const DDNSCreateForm = ({
  submitButtonOutside,
}: {
  submitButtonOutside: boolean;
}) => {
  //
  const trpc = useTRPCClient();

  //
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    resetField,
  } = useForm({
    resolver: zodResolver(expectedInput$),
    shouldFocusError: true,
    shouldUseNativeValidation: true,
    reValidateMode: "onChange",
  });

  //
  const dispatch = useDispatch();

  //
  const {
    injected: { availableCloudflareDomains },
  } = usePageContext();

  const button = (
    <button
      form={formId}
      type="submit"
      className="btn btn-block btn-primary"
      disabled={isSubmitting}
    >
      Create
      {isSubmitting ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        <PlusCircleIcon className="size-4" />
      )}
    </button>
  );

  //
  return {
    ...(submitButtonOutside ? { button } : {}),
    form: (
      <form
        id={formId}
        className="card-body"
        onSubmit={handleSubmit(
          async ({ subdomain, cloudFlareDomain, description }) => {
            //
            const onSuccess = () => {
              getModal(modalIds.createDDNS).closeModal({
                onAnimationEnded() {
                  resetField("subdomain");
                  resetField("description");
                },
              });
              dispatch(
                addSuccessMessage(
                  `DDNS Entry "${subdomain}.${cloudFlareDomain}" created`,
                ),
              );
              dispatch(notifyTableStaleness("flareDomains"));
            };

            //
            await trpc.submitDDNSEntry
              .query({ subdomain, cloudFlareDomain, description })
              .then(onSuccess)
              .catch((e: Error) => {
                dispatch(
                  addErrorMessage(
                    "abortValue" in e ? (e.abortValue as string) : e.message,
                  ),
                );
              });
          },
        )}
      >
        <h2 className="card-title">Create DDNS Entry</h2>
        <fieldset className="fieldset w-full">
          <legend className="fieldset-legend">DDNS Subdomain</legend>
          <div className="join">
            <input
              {...register("subdomain")}
              type="text"
              className="input w-full"
              placeholder="mysubdomain.<CloudflareDN>..."
              disabled={isSubmitting}
              required
            />
            <select
              {...register("cloudFlareDomain")}
              className="select join-item"
              disabled={isSubmitting}
              required
            >
              {availableCloudflareDomains.map((cloudflareDomain) => (
                <option key={cloudflareDomain}>{cloudflareDomain}</option>
              ))}
            </select>
          </div>
        </fieldset>
        <fieldset className="fieldset w-full">
          <legend className="fieldset-legend">Description</legend>
          <textarea
            {...register("description")}
            className="textarea w-full"
            placeholder="Describe what this subdomain is used for"
            disabled={isSubmitting}
            required
          ></textarea>
        </fieldset>
        {!submitButtonOutside && button}
      </form>
    ),
  };
};

export default DDNSCreateForm;
