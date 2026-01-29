import api from "./api";

export const spendTransaction = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserSpendTransaction: builder.query({
      query: () => `/spend-transactions/get`,
    }),
    addSpendTransaction: builder.mutation({
      query: (body) => ({
        url: `/spend-transactions/add`,
        method: "POST",
        body,
      }),
    }),
    getTransactionAnalytics: builder.query({
      query: () => `/cards/analytics`,
    }),
  }),
  overrideExisting: false, // safe default
});

export const {
  useGetTransactionAnalyticsQuery,
  useGetUserSpendTransactionQuery,
  useAddSpendTransactionMutation,
} = spendTransaction;
