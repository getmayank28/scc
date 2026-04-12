import api from "./api";
import type { SalaryRangeValue } from "@/schemas/userInfoSchema";

interface UpdateUserInfoPayload {
  verificationToken: string;
  salaryRange: SalaryRangeValue;
  informationConsent: boolean;
  promotionalConsent: boolean;
}

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserById: builder.query({
      query: (id) => `/user/get/${id}`,
    }),
    updateUserById: builder.mutation({
      query: ({ id, body }) => ({
        url: `/user/update/${id}`,
        method: "PATCH",
        body,
      }),
    }),
    updateUserInfo: builder.mutation<{ success: boolean }, UpdateUserInfoPayload>({
      query: (body) => ({
        url: `/user/update-info`,
        method: "PATCH",
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUserByIdQuery,
  useUpdateUserByIdMutation,
  useUpdateUserInfoMutation,
} = usersApi;
