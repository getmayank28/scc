import { Partner } from "@/types/partner";
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

    getAllLinks: builder.query({
      query: (params) => ({
        url: `admin/links`,
        params,
      }),
      providesTags: ["Links"],
    }),
    // GET ALL
    getPartners: builder.query<Partner[], void>({
      query: () => "/admin/partners",
      providesTags: ["Partner"],
    }),

    getBanks: builder.query({
      query: () => `/admin/banks/get-all`,
    }),

    // GET ONE
    getPartner: builder.query<Partner, string>({
      query: (id) => `/admin/partners/${id}`,
    }),

    // CREATE
    createPartner: builder.mutation<Partner, Partial<Partner>>({
      query: (body) => ({
        url: "/admin/partners",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Partner"],
    }),

    updatePartner: builder.mutation<
      Partner,
      { id: string; data: Partial<Partner> }
    >({
      query: ({ id, data }) => ({
        url: `/admin/partners/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Partner"],
    }),
    deletePartner: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/partners/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Partner"],
    }),
    deleteLink: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/links`,
        method: "DELETE",
        params: {
          id,
        },
      }),
      invalidatesTags: ["Links"],
    }),
    createLink: builder.mutation<Partner, Partial<Partner>>({
      query: (body) => ({
        url: "/admin/links",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Links"],
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
  useGetAllLinksQuery,
  useCreatePartnerMutation,
  useGetPartnersQuery,
  useUpdatePartnerMutation,
  useDeletePartnerMutation,
  useCreateLinkMutation,
  useGetBanksQuery,
  useDeleteLinkMutation,
} = admin;
