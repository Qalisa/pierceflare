import DDNSCreateForm from "../forms/DDNSCreateForm";
import { modalIds } from "@/helpers/modals";
//
const CreateDDNSEntryModal = () => {
  const { form, button } = DDNSCreateForm({ submitButtonOutside: true });
  return (
    <>
      <dialog id={modalIds.createDDNS} className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">
              ✕
            </button>
          </form>
          {form}
          <div className="modal-action">{button}</div>
        </div>
      </dialog>
    </>
  );
};

export default CreateDDNSEntryModal;
