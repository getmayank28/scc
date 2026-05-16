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
    getGiftors: builder.query({
      query: () => "/admin/giftors",
      providesTags: ["Giftor"],
    }),

    getGiftorsByCardSlug: builder.query({
      query: (slug: string) => `/admin/giftors/${slug}?id=${slug}`,
      providesTags: ["Giftor"],
    }),

    // CREATE
    createGiftor: builder.mutation({
      query: (body) => ({
        url: "/admin/giftors",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Giftor"],
    }),

    // UPDATE
    updateGiftor: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/giftors/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Giftor", id },
        "Giftor",
      ],
    }),
    // DELETE
    deleteGiftor: builder.mutation({
      query: (id: string) => ({
        url: `admin/giftors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Giftor"],
    }),

    getPortals: builder.query({
      query: () => "admin/portals",
      providesTags: ["Portal"],
    }),
    // CREATE
    createPortal: builder.mutation({
      query: (body) => ({
        url: "admin/portals",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Portal"],
    }),

    // UPDATE
    updatePortal: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `admin/portals/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Portal", id },
        "Portal",
      ],
    }),

    // DELETE
    deletePortal: builder.mutation({
      query: (id: string) => ({
        url: `admin/portals/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Portal"],
    }),

    getWhatsAppMessages: builder.query({
      query: ({
        direction,
        page,
      }: {
        direction: "outbound" | "inbound";
        page: number;
      }) => ({
        url: "admin/whatsapp",
        params: { direction, page, limit: 50 },
      }),
      providesTags: ["WhatsApp"],
    }),

    getEmailMessages: builder.query({
      query: ({
        page,
        status,
        templateId,
      }: {
        page: number;
        status?: string;
        templateId?: string;
      }) => ({
        url: "admin/email",
        params: { page, limit: 50, status, templateId },
      }),
      providesTags: ["Email"],
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
  useGetGiftorsQuery,
  useCreateGiftorMutation,
  useDeleteGiftorMutation,
  useGetPortalsQuery,
  useCreatePortalMutation,
  useDeletePortalMutation,
  useLazyGetGiftorsByCardSlugQuery,
  useGetWhatsAppMessagesQuery,
  useGetEmailMessagesQuery,
} = admin;
