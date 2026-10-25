/** What a user sees about their own tracked applications and purchases. */

export type ActivityState = "tracked" | "confirmed" | "not_confirmed";

export interface ActivityItem {
  id: string;
  kind: "card_application" | "purchase";
  /** Card name for applications, merchant name for purchases. */
  title: string;
  merchant: string | null;
  state: ActivityState;
  date: string | null;
}
