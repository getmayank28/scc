import api from "./api";
import type { EmploymentTypeValue, IncomeRangeValue } from "@/schemas/userInfoSchema";
import type { ActivityItem } from "@/types/affiliate";
import type { DealsResponse } from "@/types/deals";
import type { RevealedVoucher, RewardsResponse } from "@/types/rewards";

interface UpdateProfileInfoPayload {
  employmentType: EmploymentTypeValue;
  salaryRange?: IncomeRangeValue;
}

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDeals: builder.query<DealsResponse, { portal?: string; cards?: boolean } | void>({
      query: (arg) => {
        const params = new URLSearchParams();
        if (arg?.portal) params.set("portal", arg.portal);
        if (arg?.cards === false) params.set("cards", "0");
        const qs = params.toString();
        return `/deals${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (res: { result?: DealsResponse }) =>
        res.result ?? { merchants: [], walletEmpty: false, walletBanks: [] },
    }),
    getAffiliateActivity: builder.query<ActivityItem[], void>({
      query: () => `/user/affiliate-activity`,
      transformResponse: (res: { result?: ActivityItem[] }) => res.result ?? [],
    }),
    getRewards: builder.query<RewardsResponse, void>({
      query: () => `/rewards/claims`,
      transformResponse: (res: { result?: RewardsResponse }) =>
        res.result ?? { claims: [], hasUnrevealed: false },
      providesTags: ["Rewards"],
    }),
    revealVoucher: builder.mutation<RevealedVoucher, string>({
      query: (id) => ({ url: `/rewards/claims/${id}/reveal`, method: "POST" }),
      transformResponse: (res: { result: RevealedVoucher }) => res.result,
      invalidatesTags: ["Rewards"],
    }),
    setVoucherUsed: builder.mutation<void, { id: string; used: boolean }>({
      query: ({ id, used }) => ({ url: `/rewards/claims/${id}/used`, method: "POST", body: { used } }),
      invalidatesTags: ["Rewards"],
    }),
    getUserById: builder.query({
      query: (id) => `/user/get/${id}`,
      providesTags: ["User"],
    }),
    updateUserById: builder.mutation({
      query: ({ id, body }) => ({
        url: `/user/update/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    updateProfileInfo: builder.mutation<{ success: boolean }, { id: string; body: UpdateProfileInfoPayload }>({
      query: ({ id, body }) => ({
        url: `/user/update/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUserByIdQuery,
  useUpdateUserByIdMutation,
  useUpdateProfileInfoMutation,
  useGetAffiliateActivityQuery,
  useGetDealsQuery,
  useGetRewardsQuery,
  useRevealVoucherMutation,
  useSetVoucherUsedMutation,
} = usersApi;
