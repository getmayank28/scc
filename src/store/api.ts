import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/" }), // adjust backend URL
  tagTypes: ["UserCards"],
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
    sendVerificationCode: builder.mutation({
      query: ({ email }) => ({
        url: "/send-verification-code",
        method: "POST",
        body: {
          email,
        },
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
    changePassword: builder.mutation({
      query: (body) => ({
        url: "/change-password",
        method: "POST",
        body,
      }),
    }),
    createChatSession: builder.mutation({
      query: (body) => ({
        url: "/chat/session/create",
        method: "POST",
        body,
      }),
    }),
    chatSessionToken: builder.mutation({
      query: (sessionId) => ({
        url: "/chat/token",
        method: "POST",
        body: { sessionId },
      }),
    }),
    userChatSessions: builder.mutation({
      query: (id) => ({
        url: "/chat/session/get",
        method: "POST",
        body: { id },
      }),
    }),
    getCardBySearch: builder.query({
      query: ({ query }) => ({
        url: `cards/search`,
        params: { q: query },
      }),
    }),
    AddCard: builder.mutation({
      query: (body) => ({
        url: "cards/user/add",
        method: "POST",
        body,
      }),
      invalidatesTags: ["UserCards"],
    }),
    getUserCards: builder.query({
      query: ({ userId }) => ({
        url: `cards/${userId}`,
      }),
      providesTags: ["UserCards"],
    }),
    removeUserCard: builder.mutation({
      query: (body) => ({
        url: `cards/remove`,
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["UserCards"],
    }),
    chatCommunication: builder.mutation({
      query: (message) => ({
        url: `cards/communicate`,
        method: "POST",
        body: {
          message,
        },
      }),
    }),
  }),
});

export const {
  useGetQuestionsQuery,
  useLazyCheckUsernameAvailabilityQuery,
  useCreateAccountMutation,
  useVerifyCodeMutation,
  useSendVerificationCodeMutation,
  useChangePasswordMutation,
  useCreateChatSessionMutation,
  useChatSessionTokenMutation,
  useUserChatSessionsMutation,
  useLazyGetCardBySearchQuery,
  useAddCardMutation,
  useGetUserCardsQuery,
  useRemoveUserCardMutation,
  useChatCommunicationMutation,
} = api;
