import { createSlice } from "@reduxjs/toolkit";
import { z } from "zod";

//
//
//

export const $contactFormInputs = z
  .object({
    firstName: z.string().min(1, { message: "Merci de saisir un prénom" }),
    lastName: z.string().min(1, { message: "Merci de saisir un nom" }),
    email: z.string().email({ message: "Merci de saisir un e-mail valide" }),
    phone: z.string(),
    message: z.string().min(1, { message: "Merci de saisir un court message" }),
    consent: z.literal<boolean>(true, {
      errorMap: (_, __) => {
        return { message: "Le consentement est obligatoire" };
      },
    }),
  })
  .required({
    firstName: true,
    lastName: true,
    email: true,
    message: true,
    consent: true,
  });

export type ContactForm_Inputs = z.infer<typeof $contactFormInputs>;

//
//
//

const initialState: Partial<ContactForm_Inputs> = {
  consent: false,
  // @ts-ignore
  thematic: null,
  email: "",
  firstName: "",
  lastName: "",
  message: "",
  phone: "",
};

const contactFormSlice = createSlice({
  name: "contactFormState",
  initialState,
  reducers: {
    resetContactThematic(state) {
      state.consent = undefined;
    },
  },
});

export const { resetContactThematic } = contactFormSlice.actions;
export default contactFormSlice.reducer;
