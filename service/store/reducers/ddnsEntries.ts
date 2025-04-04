import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";

//
//
//

export const $ddnsEntries = z.object({
  selected: z.array(z.string()),
  selectedForDeletion: z.array(z.string()),
});

export type DDNSEntries = z.infer<typeof $ddnsEntries>;

//
//
//

const initialState: DDNSEntries = { selected: [], selectedForDeletion: [] };

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
  },
});

export const {
  clearSelected,
  defineSelected,
  defineSelectedAsToBeDeleted,
  clearSelectedForDeletion,
} = ddnsEntriesSlice.actions;
const ddnsEntriesReducer = ddnsEntriesSlice.reducer;
export default ddnsEntriesReducer;
