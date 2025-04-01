import { createSlice, PayloadAction } from "@reduxjs/toolkit";

//
//
//

const initialState = {
  shootBlank: import.meta.env.DEV,
  autofill: false,
};

const contactFormSlice = createSlice({
  name: "debugOptionsState",
  initialState,
  reducers: {
    toggleShootBlank(state) {
      state.shootBlank = !state.shootBlank;
    },
    toggleAutofill(state) {
      state.autofill = !state.autofill;
    },
    setAutofill(state, action: PayloadAction<boolean>) {
      state.autofill = action.payload;
    },
  },
});

export const { toggleShootBlank, toggleAutofill, setAutofill } =
  contactFormSlice.actions;
export default contactFormSlice.reducer;
