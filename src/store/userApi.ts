import api from "./api";
import type { EmploymentTypeValue, IncomeRangeValue } from "@/schemas/userInfoSchema";

interface UpdateProfileInfoPayload {
  employmentType: EmploymentTypeValue;
  salaryRange?: IncomeRangeValue;
}

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
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
} = usersApi;
