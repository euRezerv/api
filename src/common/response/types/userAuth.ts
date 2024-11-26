import { StandardResponseType } from "./types";

export type LoginResponseType = StandardResponseType<{
  user: {
    id: string;
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
  };
}>;

export type RegisterResponseType = StandardResponseType<{
  user: {
    id: string;
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    createdAt: string;
  };
}>;
