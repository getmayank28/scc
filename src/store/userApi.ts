import api from "./api";
import type { EmploymentTypeValue, IncomeRangeValue } from "@/schemas/userInfoSchema";

interface UpdateUserInfoPayload {
  verificationToken: string;
  employmentType: EmploymentTypeValue;
  salaryRange?: IncomeRangeValue;
  informationConsent: boolean;
  promotionalConsent: boolean;
  phoneNumber?: string;
}

interface UpdateProfileInfoPayload {
  employmentType: EmploymentTypeValue;
  salaryRange?: IncomeRangeValue;
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
    updateProfileInfo: builder.mutation<{ success: boolean }, { id: string; body: UpdateProfileInfoPayload }>({
      query: ({ id, body }) => ({
        url: `/user/update/${id}`,
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
  useUpdateProfileInfoMutation,
} = usersApi;
