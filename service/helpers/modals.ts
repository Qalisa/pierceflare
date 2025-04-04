export const modalIds = {
  deleteDDNS: "delete-ddns-modal",
  createDDNS: "create-ddns-modal",
} as const;

type Values = (typeof modalIds)[keyof typeof modalIds];

//
export const getModal = (id: Values) => ({
  openModal: () =>
    (document.getElementById(id) as HTMLDialogElement)?.showModal(),

  closeModal: (onAnimationEnded?: () => void) => {
    const modal = document.getElementById(id) as HTMLDialogElement;
    if (modal == null) return;

    //
    if (onAnimationEnded) {
      modal.addEventListener("transitionend", onAnimationEnded, { once: true });
    }

    //
    return modal.close();
  },
});
