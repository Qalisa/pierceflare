import { wait } from "./withLinger";

export const modalIds = {
  deleteDDNS: "delete-ddns-modal",
  createDDNS: "create-ddns-modal",
  manageAPIKeys: "manage-api-keys-modal",
} as const;

type Values = (typeof modalIds)[keyof typeof modalIds];

//
export const getModal = (id: Values) => ({
  openModal: () =>
    (document.getElementById(id) as HTMLDialogElement)?.showModal(),

  closeModal: (options?: {
    onAnimationEnded: () => void;
    delayMs?: number;
  }) => {
    //
    const modal = document.getElementById(id) as HTMLDialogElement;
    if (modal == null) return;

    //
    if (options?.onAnimationEnded) {
      modal.addEventListener(
        "transitionend",
        () => {
          wait(options?.delayMs ?? 300).then(options.onAnimationEnded);
        },
        { once: true },
      );
    }

    //
    return modal.close();
  },
});
