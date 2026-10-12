import z from "zod";
import { UI_CATEGORY_TO_ENGINE } from "@/lib/logic/advisor/spendOptimizer";

// The UI category vocabulary is the source of truth for what a client may send;
// deriving the enum from the map means a category can never be accepted here
// without a corresponding engine category to score it against.
const UI_CATEGORY_VALUES = Object.keys(UI_CATEGORY_TO_ENGINE) as [
  string,
  ...string[],
];

export const spendOptimizerInputSchema = z.object({
  category: z.enum(UI_CATEGORY_VALUES),
  amountInr: z
    .number()
    .finite("must be a finite number")
    .positive("must be greater than 0")
    // A transaction above ₹1cr is a data-entry error, not a purchase; reject it
    // rather than let it distort per-period cap arithmetic.
    .max(10_000_000, "must be at most ₹1,00,00,000"),
  /** Portal/merchant display name, e.g. "Amazon". Optional. */
  merchant: z.string().trim().max(120).optional(),
  /** Card slugs to compare. Empty = score the user's whole wallet. */
  cardSlugs: z.array(z.string().min(1)).max(25).optional(),
  transactionMode: z.enum(["online", "offline"]).optional(),
});

export type SpendOptimizerInputPayload = z.infer<
  typeof spendOptimizerInputSchema
>;
