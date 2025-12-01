// utils/apiResponse.ts

export interface ApiSuccess {
  success: true;
  message: string;
  result?: unknown;
}

export interface ApiError {
  success: false;
  message: string;
}

export const ApiResponse = {
  success(message: string, status: number = 200, result?: unknown): Response {
    const body: ApiSuccess = {
      success: true,
      message,
      result,
    };

    return Response.json(body, { status });
  },

  error(message: string, status: number = 500): Response {
    const body: ApiError = {
      success: false,
      message,
    };

    return Response.json(body, { status });
  },
};
