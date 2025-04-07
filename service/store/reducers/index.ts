// store/index.ts
import { combineReducers } from "@reduxjs/toolkit";
import flashMessagesReducer from "./flashMessages";
import ddnsEntriesReducer from "./ddnsEntries";
import stalenessReducer from "./staleness";

const rootReducer = combineReducers({
  flashMessages: flashMessagesReducer,
  ddnsEntries: ddnsEntriesReducer,
  staleness: stalenessReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
