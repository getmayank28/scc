export interface Error {
  status: string;
  error: string;
  data: { errorCode: string };
  message: string;
}

export interface ErrorProp {
  error: Error | null;
  onErrorTryAgain?: () => void;
}
