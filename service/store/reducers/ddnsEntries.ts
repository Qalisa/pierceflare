import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import { z } from "zod";

//
//
//

export const $ddnsEntries = z.object({
  selected: z.array(z.string()),
  selectedForDeletion: z.array(z.string()),
  //
  generateApiKeyFor: z.string().optional(),
});

export type DDNSEntries = z.infer<typeof $ddnsEntries>;

//
//
//

const initialState: DDNSEntries = {
  selected: [],
  selectedForDeletion: [],
};

const ddnsEntriesSlice = createSlice({
  name: "ddnsEntriesState",
  initialState,
  reducers: {
    defineSelected(
      state,
      { payload: selected }: PayloadAction<DDNSEntries["selected"]>,
    ) {
      state.selected = [...selected];
      state.selectedForDeletion = [];
    },
    defineSelectedAsToBeDeleted(state) {
      state.selectedForDeletion = [...state.selected];
    },
    clearSelectedForDeletion(state) {
      state.selectedForDeletion = [];
    },
    clearSelected(state) {
      state.selected = [];
    },
    //
    manageAPIKeyOf(state, { payload: apiKey }: PayloadAction<string>) {
      state.generateApiKeyFor = apiKey;
    },
    stopManagingAPIKey(state) {
      state.generateApiKeyFor = undefined;
    },
  },
});

export const {
  clearSelected,
  defineSelected,
  defineSelectedAsToBeDeleted,
  clearSelectedForDeletion,
  manageAPIKeyOf,
  stopManagingAPIKey,
} = ddnsEntriesSlice.actions;
const ddnsEntriesReducer = ddnsEntriesSlice.reducer;
export default ddnsEntriesReducer;
