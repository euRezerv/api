import { Request } from "express";

export type RequestWithBody<B> = Request<never, never, B>;

export type AuthLoginRequestType = {
  identifier: string;
  password: string;
};

export type AuthRegisterRequestType = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumberCountryISO: string;
  phoneNumber: string;
  password: string;
};
