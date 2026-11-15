import api from "./api";

export const redemptions = api.injectEndpoints({
  endpoints: (builder) => ({
    addRedemption: builder.mutation({
      query: (body) => ({
        url: `/redemption/add`,
        method: "POST",
        body,
      }),
    }),
  }),
  overrideExisting: false, // safe default
});

export const { useAddRedemptionMutation } = redemptions;
