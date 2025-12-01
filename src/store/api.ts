import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/" }), // adjust backend URL
  endpoints: (builder) => ({
    getQuestions: builder.query({
      query: () => "/questions",
    }),
    checkUsernameAvailability: builder.query({
      query: ({ username }) => ({
        url: "/check-username-unique",
        params: { username },
      }),
    }),
    createAccount: builder.mutation({
      query: (body) => ({
        url: "/sign-up",
        method: "POST",
        body,
      }),
    }),
    verifyCode: builder.mutation({
      query: (body) => ({
        url: "/verify-code",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetQuestionsQuery,
  useLazyCheckUsernameAvailabilityQuery,
  useCreateAccountMutation,
  useVerifyCodeMutation,
} = api;
