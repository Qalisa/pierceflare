import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import { z } from "zod";

//
//
//

export const $staleness = z.object({
  tableStaleness: z.object({ flareDomains: z.boolean(), flares: z.boolean() }),
});

export type Staleness = z.infer<typeof $staleness>;

//
//
//

const initialState: Staleness = {
  tableStaleness: {
    flareDomains: false,
    flares: false,
  },
};

const stalenessSlice = createSlice({
  name: "stalenessState",
  initialState,
  reducers: {
    //
    notifyTableStaleness(
      state,
      { payload }: PayloadAction<keyof Staleness["tableStaleness"]>,
    ) {
      state.tableStaleness[payload] = true;
    },
    unsetStaleness(
      state,
      { payload }: PayloadAction<keyof Staleness["tableStaleness"]>,
    ) {
      state.tableStaleness[payload] = false;
    },
  },
});

export const { notifyTableStaleness, unsetStaleness } = stalenessSlice.actions;
const stalenessReducer = stalenessSlice.reducer;
export default stalenessReducer;
