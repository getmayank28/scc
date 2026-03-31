// /types/affiliate.ts
import { Types } from "mongoose";

export type LinkType = "affiliate" | "bank" | "fallback";

export interface LinkProps {
  _id: Types.ObjectId;

  cardId?: Types.ObjectId;
  bankId?: Types.ObjectId;

  partnerId?: Types.ObjectId;
  partnerName?: string;

  url: string;

  type: LinkType;
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
