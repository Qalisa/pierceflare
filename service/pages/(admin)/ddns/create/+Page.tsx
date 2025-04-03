import { flareDomains$ } from "@/db/schema";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDDNSEntry } from "./create.telefunc";
import { routes } from "@/server/app";

const DDNSCreatePage = () => {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({ resolver: zodResolver(flareDomains$) });

  //
  return (
    <div className="card">
      <form
        className="card-body"
        method="POST"
        action={routes.pages.createDDNS}
        onSubmit={handleSubmit((data) => {
          console.log("caca");
          createDDNSEntry(data);
        })}
      >
        <h2 className="card-title">Create DDNS Entry</h2>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Page title</legend>
          <input
            {...register("ddnsForDomain")}
            className="input"
            placeholder="mysubdomain.<CloudflareDN>..."
            disabled={isSubmitting}
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Page title</legend>
          <textarea
            {...register("description")}
            className="textarea"
            placeholder="Describe what this subdomain is used for"
            disabled={isSubmitting}
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
