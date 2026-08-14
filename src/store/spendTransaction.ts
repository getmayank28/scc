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
    // In-house spend optimizer. Replaces the third-party bot call that used to
    // run from the browser — scoring now happens server-side against the
    // advisor's precomputed card rules.
    optimizeSpend: builder.mutation({
      query: (body) => ({
        url: `/spend-optimizer`,
        method: "POST",
        body,
      }),
    }),
    // Categories a merchant has rules in, so the UI can infer the category
    // instead of asking (most merchants map to exactly one).
    getMerchantCategories: builder.query({
      query: (merchant: string) =>
        `/spend-optimizer/merchant-categories?merchant=${encodeURIComponent(merchant)}`,
    }),
  }),
  overrideExisting: false, // safe default
});

export const {
  useGetTransactionAnalyticsQuery,
  useGetUserSpendTransactionQuery,
  useAddSpendTransactionMutation,
  useOptimizeSpendMutation,
  useGetMerchantCategoriesQuery,
} = spendTransaction;
