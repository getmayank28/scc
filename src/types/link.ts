// /types/affiliate.ts
import { Types } from "mongoose";

export type LinkType = "affiliate" | "bank" | "fallback";

// `other` is any further affiliate network (e.g. the bitli.in → linkredirect.in
// links), redirected to as-is like GroMo.
export type LinkNetwork = "direct" | "cuelinks" | "gromo" | "other";

export interface LinkProps {
  _id: Types.ObjectId;

  cardId?: Types.ObjectId;
  bankId?: Types.ObjectId;

  partnerId?: Types.ObjectId;
  partnerName?: string;

  url: string;

  type: LinkType;
  network?: LinkNetwork;
  campaignId?: number;
  priority: number;

  active: boolean;

  startDate?: Date;
  endDate?: Date;

  geo?: string[];
  device?: string[];

  createdAt: Date;
  updatedAt: Date;
}

export interface ResolveContext {
  geo?: string;
  device?: "web" | "mobile";
}
