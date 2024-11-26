export type LoginRequestType = {
  identifier: string;
  password: string;
};

export type RegisterRequestType = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumberCountryISO: string;
  phoneNumber: string;
  password: string;
};
