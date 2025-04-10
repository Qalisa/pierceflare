// store/index.ts
import { combineReducers } from "@reduxjs/toolkit";

import ddnsEntriesReducer from "./ddnsEntries";
import flashMessagesReducer from "./flashMessages";
import unseenUpdatesReducer from "./unseenUpdates";

const rootReducer = combineReducers({
  flashMessages: flashMessagesReducer,
  ddnsEntries: ddnsEntriesReducer,
  unseenUpdates: unseenUpdatesReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
