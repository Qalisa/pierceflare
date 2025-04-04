export const modalIds = {
  deleteDDNS: "delete-ddns-modal",
  createDDNS: "create-ddns-modal",
} as const;

type Values = (typeof modalIds)[keyof typeof modalIds];

//
export const getModal = (id: Values) => ({
  openModal: () =>
    (document.getElementById(id) as HTMLDialogElement)?.showModal(),

  closeModal: () => (document.getElementById(id) as HTMLDialogElement)?.close(),
});
