import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import { z } from "zod";

//
//
//

export const ISO_DATE_REGEX = /\d{4}-[01]\d-[0-3]\d/;

export const $unseenUpdates = z.object({
  unseenUpdates: z.object({
    flares: z.number(),
    domains: z.number(),
  }),
});

export type UnseenUpdates = z.infer<typeof $unseenUpdates>;
export type UnseenUpdatesType = keyof UnseenUpdates["unseenUpdates"];

//
//
//

const initialState: UnseenUpdates = {
  unseenUpdates: {
    flares: 0,
    domains: 0,
  },
};

const unseenUpdatesSlice = createSlice({
  name: "unseenUpdatesState",
  initialState,
  reducers: {
    incrementUnseenCount(state, { payload }: PayloadAction<UnseenUpdatesType>) {
      state.unseenUpdates[payload]++;
    },
    resetUnseenCount(state, { payload }: PayloadAction<UnseenUpdatesType>) {
      state.unseenUpdates[payload] = 0;
    },
  },
});

export const { resetUnseenCount, incrementUnseenCount } =
  unseenUpdatesSlice.actions;
const unseenUpdatesReducer = unseenUpdatesSlice.reducer;
export default unseenUpdatesReducer;
