import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";

import { CheckCircleIcon, PlusIcon } from "@heroicons/react/24/solid";
import { Bars3BottomRightIcon } from "@heroicons/react/24/solid";
import { useMutation } from "@tanstack/react-query";

import CopyToClipboardButton from "#/components/CopyToClipboardButton";
import { getModal, modalIds } from "#/helpers/modals";
import { apiKeyCliEnvVariableName, cliTitle } from "#/helpers/static";
import { useTRPC } from "#/helpers/trpc";
import type { RootState } from "#/store/reducers";
import { addErrorMessage } from "#/store/reducers/flashMessages";

const formId = "api-key-creation";

//
const APIKeyCreateForm = ({
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

  const trpc = useTRPC();
  const createAPIKeyFor = useMutation(trpc.createAPIKeyFor.mutationOptions());

  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const keyCreated = generatedKey != null;

  //
  const dispatch = useDispatch();
  const { generateApiKeyFor } = useSelector(
    (state: RootState) => state.ddnsEntries,
  );

  const modal = getModal(modalIds.manageAPIKeys);

  //
  const buttons = (
    <>
      {keyCreated && (
        <CopyToClipboardButton
          flashForSuccess={true}
          tobeCopied={generatedKey}
          btnText="Copy key"
          size="md"
          lingerWaitMs={300}
        />
      )}
      <button
        className="btn"
        disabled={isSubmitting}
        onClick={() =>
          modal.closeModal({
            onAnimationEnded() {
              setGeneratedKey(null);
            },
          })
        }
      >
        {keyCreated ? "Back" : "Cancel"}
      </button>
      {!keyCreated && (
        <button
          form={formId}
          type="submit"
          className="btn btn-success"
          disabled={isSubmitting}
        >
          Create Key
          {isSubmitting ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <PlusIcon className="size-4" />
          )}
        </button>
      )}
    </>
  );

  //
  const form = (
    <form
      id={formId}
      className="card"
      onSubmit={handleSubmit(async () =>
        createAPIKeyFor
          .mutateAsync({ ddnsForDomain: generateApiKeyFor! })
          .then(setGeneratedKey)
          .catch((e: Error) => {
            dispatch(
              addErrorMessage(
                "abortValue" in e ? (e.abortValue as string) : e.message,
              ),
            );
          }),
      )}
    >
      <div className="card-body">
        <h2 className="card-title">Create API Key</h2>
        <p>Do you really want to create an API key for this subdomain ?</p>
        <br />
        <ul className="list bg-neutral text-neutral-content">
          {generateApiKeyFor &&
            [generateApiKeyFor].map((entry) => (
              <li key={entry} className="list-row">
                <Bars3BottomRightIcon className="size-6" /> {entry}
              </li>
            ))}
        </ul>
        {!submitButtonOutside && buttons}
      </div>
    </form>
  );

  //
  return {
    ...(submitButtonOutside ? { buttons } : {}),
    form: keyCreated ? <HeroKeyCreated apiKey={generatedKey!} /> : form,
  };
};

//
const HeroKeyCreated = ({ apiKey }: { apiKey: string }) => {
  return (
    <div className="hero">
      <div className="hero-content">
        <div className="max-w-md">
          <h1 className="flex items-center justify-center gap-2 font-bold">
            <CheckCircleIcon className="size-4" /> API Key Generated !
          </h1>
          <p className="py-6 text-center">
            Keep it somewhere safe. You can use it within your{" "}
            <strong>{cliTitle}</strong> by using setting the env variable below:
          </p>
          <div className="mockup-code w-full">
            <pre data-prefix="$">
              <code>
                <span className="italic">{`${apiKeyCliEnvVariableName}=`}</span>
                <span className="font-bold">{apiKey}</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIKeyCreateForm;
