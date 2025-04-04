import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";

//
//
//

export const $flashMessages = z.array(
  z
    .object({
      msgType: z.enum(["error", "success"]),
      message: z.string(),
      id: z.date(),
      schedueledForDeletionAt: z.date().optional(),
    })
    .required({
      message: true,
      msgType: true,
      id: true,
    }),
);

export type FlashMessages = z.infer<typeof $flashMessages>;

//
//
//

const initialState: FlashMessages = [];

const flashMessagesSlice = createSlice({
  name: "flashMessagesState",
  initialState,
  reducers: {
    addSuccessMessage(state, action: PayloadAction<string>) {
      state = [
        ...state,
        {
          msgType: "success",
          message: JSON.stringify(action.payload),
          id: new Date(),
        },
      ];
    },
    addErrorMessage(state, action: PayloadAction<unknown>) {
      state = [
        ...state,
        {
          msgType: "error",
          message: JSON.stringify(action.payload),
          id: new Date(),
        },
      ];
    },
    schedueleForDeletion(
      state,
      {
        payload: { idsToDeleteLater },
      }: PayloadAction<{ idsToDeleteLater: Date[] }>,
    ) {
      const now = new Date();
      state = state.map((e) => {
        if (!idsToDeleteLater.includes(e.id)) return e;
        e.schedueledForDeletionAt = now;
        return e;
      });
    },
    resetSchedueler(_state) {
      _state = _state.map((e) => {
        delete e.schedueledForDeletionAt;
        return e;
      });
    },
    clearFlashMessages(
      state,
      { payload: { idsToDelete } }: PayloadAction<{ idsToDelete: Date[] }>,
    ) {
      state = state.filter(({ id }) => !idsToDelete.includes(id));
    },
  },
});

export const {
  resetSchedueler,
  schedueleForDeletion,
  addErrorMessage,
  clearFlashMessages,
} = flashMessagesSlice.actions;
const flashMessagesReducer = flashMessagesSlice.reducer;
export default flashMessagesReducer;
