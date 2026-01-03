import api from "./api";

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
  }),
  overrideExisting: false, // safe default
});

export const { useGetUserByIdQuery, useUpdateUserByIdMutation } = usersApi;
