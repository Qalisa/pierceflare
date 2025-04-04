import DDNSCreateForm from "../forms/DDNSCreateForm";

const modalId = "create-ddns-modal";

//
const CreateDDNSEntryModal = () => {
  const { form, button } = DDNSCreateForm({ submitButtonOutside: true });
  return (
    <>
      <dialog id={modalId} className="modal">
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

// eslint-disable-next-line react-refresh/only-export-components
export const openModal = () =>
  (document.getElementById(modalId) as HTMLDialogElement)?.showModal();

// eslint-disable-next-line react-refresh/only-export-components
export const closeModal = () =>
  (document.getElementById(modalId) as HTMLDialogElement)?.close();

export default CreateDDNSEntryModal;
