import cloudflareLogo from "#/assets/images/cloudflare.svg";

import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { usePageContext } from "vike-react/usePageContext";

import { PlusCircleIcon } from "@heroicons/react/24/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { willDomainBeCFProxiedByDefault } from "#/db/schema";
import { getModal, modalIds } from "#/helpers/modals";
import { useTRPC } from "#/helpers/trpc";
import {
  addErrorMessage,
  addSuccessMessage,
} from "#/store/reducers/flashMessages";

import { expectedInput$ } from "./DDNSCreateForm.schemas";

const formId = "ddns-create";

//
const DDNSCreateForm = ({
  submitButtonOutside,
}: {
  submitButtonOutside: boolean;
}) => {
  //
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const submitDDNSEntry = useMutation(trpc.submitDDNSEntry.mutationOptions({}));

  //
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    resetField,
  } = useForm({
    resolver: zodResolver(expectedInput$),
    defaultValues: {
      proxied: willDomainBeCFProxiedByDefault,
    },
    shouldFocusError: true,
    shouldUseNativeValidation: true,
    reValidateMode: "onChange",
  });

  //
  const dispatch = useDispatch();

  //
  const {
    injected: {
      cloudflare: { availableDomains },
    },
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
          async ({ subdomain, cloudFlareDomain, description, proxied }) => {
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

              //
              queryClient.invalidateQueries({
                queryKey: trpc.getFlareDomains.queryKey(),
              });
            };

            //
            await submitDDNSEntry
              .mutateAsync({
                subdomain,
                cloudFlareDomain,
                description,
                proxied: proxied ?? willDomainBeCFProxiedByDefault,
              })
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
              <option value="">Pick a domain...</option>
              {availableDomains.map((cloudflareDomain) => (
                <option key={cloudflareDomain}>{cloudflareDomain}</option>
              ))}
            </select>
          </div>
        </fieldset>
        <fieldset className="fieldset w-full">
          <legend className="fieldset-legend">
            <img src={cloudflareLogo} width={16} /> Use Cloudflare proxy
            features ?
          </legend>
          <input
            {...register("proxied")}
            type="checkbox"
            className="checkbox"
            placeholder="Describe what this subdomain is used for"
            disabled={isSubmitting}
          />
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
