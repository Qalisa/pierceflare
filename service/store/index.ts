import { configureStore } from "@reduxjs/toolkit";
import rootReducer, { RootState } from "./reducers/index";

export const getRootStore = (preloadedState: Partial<RootState>) => {
  return configureStore({
    reducer: rootReducer,
    ...preloadedState,
  });
};
