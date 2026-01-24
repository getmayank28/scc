import { HistoryActions, InputButtonGroupActionTypes } from "@/types/actions";

export const CHAT_ACTIONS: Record<string, InputButtonGroupActionTypes> = {
  EVALUTE_RECOMMENDATION: "action-evaluateRecommendation",
  CONTINUE_JOURNEY: "action-continueJourney",
  SWITCH_TO_ALL_ROUNDER: "action-swicth-to-all-rounder",
  END_JOURNEY: "action-endJournye",
  SELECT_CARD_CATEGORY: "action-selectCardCategory",
};

export const HISTORY_ACTIONS: Record<string, HistoryActions> = {
  EARLY_RECOMMENDATION: "earlyRecommendation",
  END_RECOMMENDATION: "endRecommendation",
};
