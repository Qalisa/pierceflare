import { modalIds } from "@/helpers/modals";
import APIKeyCreateForm from "../forms/APIKeyCreateForm";
//
const ManageAPIKeysModal = () => {
  const { form, buttons } = APIKeyCreateForm({ submitButtonOutside: true });
  return (
    <>
      <dialog id={modalIds.manageAPIKeys} className="modal">
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

export default ManageAPIKeysModal;
