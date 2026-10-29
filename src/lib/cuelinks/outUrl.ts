/**
 * Builds the `/api/out` href for an outbound click. Safe to import on the
 * client: it only formats ids into a query string. The route resolves the
 * real destination server-side, so no URL ever travels in the link.
 */

export type OutType = "card" | "portal" | "voucher" | "offer";

export type OutSurface = "advisor" | "card-info" | "home" | "optimizer" | "deals" | "campaign";

export interface OutParams {
  type: OutType;
  /** Card slug, portal slug, giftor slug or Cuelinks offer id, depending on `type`. */
  id: string;
  surface: OutSurface;
  /** Card the user is acting on, for portal/voucher clicks. */
  card?: string;
}

export function outUrl({ type, id, surface, card }: OutParams): string {
  const params = new URLSearchParams({ type, id, surface });
  if (card) params.set("card", card);
  return `/api/out?${params.toString()}`;
}
