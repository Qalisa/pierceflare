// store/index.ts
import { combineReducers } from "@reduxjs/toolkit";
import flashMessagesReducer from "./flashMessages";
import ddnsEntriesReducer from "./ddnsEntries";

const rootReducer = combineReducers({
  flashMessages: flashMessagesReducer,
  ddnsEntries: ddnsEntriesReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
