import { configureStore } from "@reduxjs/toolkit";
import canvasReducer from "./canvasSlice";
import toolReducer from "./toolSlice";

export const store = configureStore({
  reducer: {
    canvas: canvasReducer,
    tool: toolReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
