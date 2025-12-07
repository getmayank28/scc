export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface APIFailure {
  status: number;
  data: {
    success: boolean;
    message: string;
  };
}

export interface APISuccess {
  success: boolean;
  message: string;
}

export const INFO_MESSAGE: Record<string, string> = {
  EMAIL_VERIFICATION_IS_NOT_REQUIRED: "EMAIL_VERIFICATION_IS_NOT_REQUIRED",
};
