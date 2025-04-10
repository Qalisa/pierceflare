import DDNSDeleteForm from "@/pages/(admin)/dashboard/forms/DDNSDeleteForm";
import { modalIds } from "@/helpers/modals";

//
const DeleteDDNSEntriesModal = () => {
  const { form, buttons } = DDNSDeleteForm({ submitButtonOutside: true });
  return (
    <>
      <dialog id={modalIds.deleteDDNS} className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">
              ✕
            </button>
          </form>
          {form}
          <div className="modal-action">{buttons}</div>
        </div>
      </dialog>
    </>
  );
};

export default DeleteDDNSEntriesModal;
