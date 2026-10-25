import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ZIJUS_API_URL } from "@/lib/constants/zijus";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/" }), // adjust backend URL
  tagTypes: ["User", "UserCards", "Cards", "Partner", "Links", "Giftor", "Portal", "WhatsApp", "Email"],
  endpoints: (builder) => ({
    getQuestions: builder.query({
      query: () => "/questions",
    }),
    createChatSession: builder.mutation({
      query: (body) => ({
        url: "/chat/session/create",
        method: "POST",
        body,
      }),
    }),
    chatSessionToken: builder.mutation({
      query: () => ({
        url: "/chat/token",
        method: "POST",
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
      query: ({ message, token }) => ({
        url: ZIJUS_API_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token?.token,
        },
        body: {
          messages: [{ content: message }],
        },
      }),
    }),
    getUserChatSession: builder.query({
      query: () => ({
        url: `user/sessions`,
      }),
    }),
    getUserBotChatSessions: builder.query({
      query: () => ({
        url: `chat/session/bot`,
      }),
    }),
    getUserBotChatSessionsDetails: builder.query({
      query: (sessionId) => ({
        url: `chat/session/bot/details`,
        params: { sessionId },
      }),
    }),
    waitlist: builder.mutation({
      query: (body) => ({
        url: `waitlist`,
        method: "POST",
        body,
      }),
    }),

    submitFeedback: builder.mutation({
      query: (feedback: string) => ({
        url: `feedback`,
        method: "POST",
        body: { feedback },
      }),
      invalidatesTags: ["UserCards"],
    }),
  }),
});

export const {
  useSubmitFeedbackMutation,
  useGetUserBotChatSessionsDetailsQuery,
  useGetUserBotChatSessionsQuery,
  useGetUserChatSessionQuery,
  useGetQuestionsQuery,
  useCreateChatSessionMutation,
  useChatSessionTokenMutation,
  useUserChatSessionsMutation,
  useLazyGetCardBySearchQuery,
  useAddCardMutation,
  useGetUserCardsQuery,
  useRemoveUserCardMutation,
  useChatCommunicationMutation,
  useWaitlistMutation,
} = api;
export default api;
