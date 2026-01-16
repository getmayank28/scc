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
  }),
  overrideExisting: false, // safe default
});

export const {
  useGetUserSpendTransactionQuery,
  useAddSpendTransactionMutation,
} = spendTransaction;
