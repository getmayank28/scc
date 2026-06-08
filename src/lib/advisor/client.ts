// Client-side helper for calling /api/recommend/* endpoints.
//
// Throws on network errors and on { success: false } responses so callers can
// use a single try/catch.

import type { ApiSuccess, ApiError } from "@/lib/utils/ApiResponse";

export type RecommendEndpoint =
  | "travel"
  | "shopping"
  | "food"
  | "allrounder"
  | "travel/phase1"
  | "shopping/phase1"
  | "food/phase1"
  | "allrounder/phase1";

export async function fetchRecommend<TResult>(
  endpoint: RecommendEndpoint,
  body: unknown,
): Promise<TResult> {
  const res = await fetch(`/api/recommend/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await res.json()) as ApiSuccess | ApiError;
  if (!payload.success) {
    throw new Error(payload.message || "Recommendation failed");
  }
  return payload.result as TResult;
}
