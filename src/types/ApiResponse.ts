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
