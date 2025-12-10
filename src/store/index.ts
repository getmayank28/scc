// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import { api } from "./api";
import { wsApi } from "./socket";

export const store = configureStore({
  reducer: {
    // Add the generated reducer as a specific top-level slice
    [api.reducerPath]: api.reducer,
    [wsApi.reducerPath]: wsApi.reducer,
    // other reducers here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware).concat(wsApi.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

// types for use in app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
