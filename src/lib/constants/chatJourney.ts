import { CardsType, MessageSourceType } from "@/types/card";
import { CARD_CATEGORY } from "../data/cards";
import { allRounderCard } from "./questions/allRounderCard";
import { foodCard } from "./questions/foodCard";
import { shoppingCard } from "./questions/shoppingCard";
import { travelCard } from "./questions/travelCard";
import { BaseMessage } from "@/types/chatMessages";

export const cardCategoryJourneyData = {
  [CARD_CATEGORY.TRAVEL]: travelCard,
  [CARD_CATEGORY.FOOD]: foodCard,
  [CARD_CATEGORY.SHOPPING]: shoppingCard,
  [CARD_CATEGORY.ALL_ROUNDER]: allRounderCard,
} as Record<CardsType, BaseMessage[]>;

export const INPUT_MESSAGE_SOURCE = {
  DIRECT: "DIRECT",
  JOURNEY: "JOURNEY",
} as Record<MessageSourceType, MessageSourceType>;
