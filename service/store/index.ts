import { configureStore } from "@reduxjs/toolkit";
import type { RootState } from "./reducers/index";
import rootReducer from "./reducers/index";

export const getRootStore = (preloadedState: Partial<RootState>) => {
  return configureStore({
    reducer: rootReducer,
    ...preloadedState,
  });
};
