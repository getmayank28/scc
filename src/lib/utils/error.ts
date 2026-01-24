export function getErrorProp(e: unknown): {
  error: import("@/types/error").Error | null;
} {
  if (!e) return { error: null };
  if (
    typeof e === "object" &&
    e !== null &&
    "error" in e &&
    typeof (e as { error?: unknown }).error === "string"
  ) {
    const target = e as {
      error: string;
      status?: string | number;
      data?: { errorCode?: string };
      message?: string;
    };
    return {
      error: {
        status: target.status?.toString() ?? "",
        error: target.error,
        data: { errorCode: target.data?.errorCode ?? "" },
        message: target.message ?? String(target.error),
      },
    };
  }
  if (
    typeof e === "object" &&
    e !== null &&
    ("status" in e || "message" in e)
  ) {
    const target = e as {
      status?: string | number;
      error?: string;
      data?: { errorCode?: string };
      message?: string;
    };
    return {
      error: {
        status: target.status?.toString() ?? "",
        error: target.error ?? target.message ?? "Error",
        data: { errorCode: target.data?.errorCode ?? "" },
        message:
          target.message ??
          (typeof target.error === "string" ? target.error : "Error"),
      },
    };
  }
  return {
    error: {
      status: "",
      error: "An unexpected error occurred",
      data: { errorCode: "" },
      message: "An unexpected error occurred",
    },
  };
}

export interface ErrorResponse {
  status: number;
  data: {
    errorCode: string;
    description: string;
    errorBody: unknown | null;
  };
}
