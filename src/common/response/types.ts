export type StandardErrorType = {
  message: string;
  stack?: string;
  field?: string;
  value?: string;
};

export type StandardResponseType<R> = {
  isSuccess: boolean;
  statusCode: number;
  message?: string;
  data?: R;
  errors?: StandardErrorType[];
  timestamp: string;
};

export type AuthLoginResponseType = StandardResponseType<{
  user: {
    id: string;
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
  };
}>;

export type AuthRegisterResponseType = StandardResponseType<{
  user: {
    id: string;
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    createdAt: string;
  };
}>;
