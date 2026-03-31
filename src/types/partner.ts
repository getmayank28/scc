export type PartnerType = "affiliate_network" | "bank" | "direct";

export interface Partner {
  _id: string;
  name: string;
  slug: string;
  type: PartnerType;
  baseUrl?: string;
  trackingTemplate?: string;
  contactEmail?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
