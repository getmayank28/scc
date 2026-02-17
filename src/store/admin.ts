import api from "./api";

export const admin = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllAvailableCards: builder.query({
      query: () => `/admin/cards/get-all-available-cards`,
      providesTags: ["Cards"],
    }),

    getAllTickets: builder.query({
      query: () => `/admin/get-all-tickets`,
    }),

    createCard: builder.mutation({
      query: (body) => ({
        url: `/admin/cards/add-card`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Cards"],
    }),

    updateCard: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/cards/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Cards"],
    }),

    deleteCard: builder.mutation({
      query: (id) => ({
        url: `/admin/cards/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cards"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllAvailableCardsQuery,
  useGetAllTicketsQuery,
  useCreateCardMutation,
  useUpdateCardMutation,
  useDeleteCardMutation,
} = admin;
