// store/index.ts
import { combineReducers } from "@reduxjs/toolkit";
import contactFormReducer from "./contactForm";
import debugOptionsReducer from "./debug";

const rootReducer = combineReducers({
  // contactForm: contactFormReducer,
  // debugOptions: debugOptionsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
