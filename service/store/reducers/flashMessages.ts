import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";

//
//
//

export const ISO_DATE_REGEX = /\d{4}-[01]\d-[0-3]\d/;

export const $flashMessages = z.object({
  flashMessages: z.array(
    z
      .object({
        msgType: z.enum(["error", "success"]),
        message: z.string(),
        id: z.string().regex(ISO_DATE_REGEX),
      })
      .required({
        message: true,
        msgType: true,
        id: true,
      }),
  ),
});

export type FlashMessages = z.infer<typeof $flashMessages>;
export type FlashMessageType =
  FlashMessages["flashMessages"][number]["msgType"];

//
//
//

const initialState: FlashMessages = { flashMessages: [] };

const flashMessagesSlice = createSlice({
  name: "flashMessagesState",
  initialState,
  reducers: {
    addSuccessMessage(state, { payload: message }: PayloadAction<string>) {
      state.flashMessages = [
        ...state.flashMessages,
        {
          msgType: "success",
          message: message,
          id: new Date().toISOString(),
        },
      ];
    },
    addErrorMessage(state, { payload: errorString }: PayloadAction<string>) {
      state.flashMessages = [
        ...state.flashMessages,
        {
          msgType: "error",
          message: errorString,
          id: new Date().toISOString(),
        },
      ];
    },
    clearFlashMessages(
      state,
      { payload: { idsToDelete } }: PayloadAction<{ idsToDelete: string[] }>,
    ) {
      //
      if (idsToDelete.length === 0) return;
      state.flashMessages = state.flashMessages.filter(
        ({ id }) => !idsToDelete.includes(id),
      );
    },
  },
});

export const { addErrorMessage, clearFlashMessages, addSuccessMessage } =
  flashMessagesSlice.actions;
const flashMessagesReducer = flashMessagesSlice.reducer;
export default flashMessagesReducer;
