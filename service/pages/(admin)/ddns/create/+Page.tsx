import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onSubmitDDNSEntry } from "./Page.telefunc";
import { expectedInput } from "./schemas";

//
const DDNSCreatePage = () => {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(expectedInput),
    shouldFocusError: true,
    shouldUseNativeValidation: true,
    reValidateMode: "onChange",
  });

  //
  return (
    <div className="card">
      <form
        className="card-body"
        // method="POST"
        //action={routes.pages.createDDNS}
        onSubmit={handleSubmit(
          ({ ddnsForDomain, description }) => {
            return onSubmitDDNSEntry(ddnsForDomain, description);
          },
          (e) => {
            console.log(e);
          },
        )}
      >
        <h2 className="card-title">Create DDNS Entry</h2>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Page title</legend>
          <input
            {...register("ddnsForDomain")}
            type="text"
            className="input"
            placeholder="mysubdomain.<CloudflareDN>..."
            disabled={isSubmitting}
            required
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Page title</legend>
          <textarea
            {...register("description")}
            className="textarea"
            placeholder="Describe what this subdomain is used for"
            disabled={isSubmitting}
            required
          ></textarea>
        </fieldset>
        <button type="submit" className="btn btn-block" disabled={isSubmitting}>
          Create
          {isSubmitting && (
            <span className="loading loading-spinner loading-xs"></span>
          )}
        </button>
      </form>
    </div>
  );
};

export default DDNSCreatePage;
