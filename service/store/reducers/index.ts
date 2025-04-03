// store/index.ts
import { combineReducers } from "@reduxjs/toolkit";
import contactFormReducer from "./contactForm";

const rootReducer = combineReducers({
  contactForm: contactFormReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
