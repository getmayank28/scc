import api from "./api";
import type { PointsSnapshot } from "@/app/api/redemption/latest/route";

export const redemptions = api.injectEndpoints({
  endpoints: (builder) => ({
    addRedemption: builder.mutation({
      query: (body) => ({
        url: `/redemption/add`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Points"],
    }),
    // Latest points check per card, valued at the best and worst redemption.
    getLatestPoints: builder.query<PointsSnapshot[], void>({
      query: () => `/redemption/latest`,
      transformResponse: (res: { result?: { cards?: PointsSnapshot[] } }) =>
        res.result?.cards ?? [],
      providesTags: ["Points"],
    }),
  }),
  overrideExisting: false, // safe default
});

export const { useAddRedemptionMutation, useGetLatestPointsQuery } = redemptions;
