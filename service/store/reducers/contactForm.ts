import { ContactTypesEnum } from "@/utils/contactHelper";
import { defaultEuropeanPhoneCode } from "@/utils/countriesPhoneCodes";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import validator from "validator";
import { z } from "zod";

//
//
//

export const $contactFormInputs = z
  .object({
    thematic: ContactTypesEnum,
    firstName: z.string().min(1, { message: "Merci de saisir un prénom" }),
    lastName: z.string().min(1, { message: "Merci de saisir un nom" }),
    email: z.string().email({ message: "Merci de saisir un e-mail valide" }),
    countryCode: z.string().default(defaultEuropeanPhoneCode.code),
    phone: z
      .string()
      .refine(
        (value) => (value == "" ? true : validator.isMobilePhone(value)),
        "Merci de saisir un numéro de téléphone portable valide",
      ),
    message: z.string().min(1, { message: "Merci de saisir un court message" }),
    consent: z.literal<boolean>(true, {
      errorMap: (_, __) => {
        return { message: "Le consentement est obligatoire" };
      },
    }),
  })
  .required({
    thematic: true,
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
  countryCode: defaultEuropeanPhoneCode.code,
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
    setContactThematic(
      state,
      action: PayloadAction<NonNullable<typeof initialState.thematic>>,
    ) {
      state.thematic = action.payload;
    },
    resetContactThematic(state) {
      state.thematic = undefined;
    },
  },
});

export const { setContactThematic, resetContactThematic } =
  contactFormSlice.actions;
export default contactFormSlice.reducer;
