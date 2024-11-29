import { StandardResponseType } from "./types";

export type GetUserByIdResponseType = StandardResponseType<{
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isEmailVerified: boolean;
    phoneNumber: string;
    isPhoneVerified: boolean;
    isSystemAdmin: boolean;
    createdAt: string;
  };
}>;
