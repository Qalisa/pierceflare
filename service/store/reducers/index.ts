// store/index.ts
import { combineReducers } from "@reduxjs/toolkit";
import flashMessagesReducer from "./flashMessages";

const rootReducer = combineReducers({
  flashMessages: flashMessagesReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
