import { PaginationResponseType, StandardResponseType } from "./types";

export type GetCompaniesResponseType = StandardResponseType<
  {
    companies: {
      id: string;
      name: string;
      country: string;
      county: string;
      city: string;
      street: string;
      postalCode: string;
      latitude: number;
      longitude: number;
      createdById: string;
      createdAt: string;
    }[];
  } & PaginationResponseType
>;

export type GetCompanyByIdResponseType = StandardResponseType<{
  company: {
    id: string;
    name: string;
    country: string;
    county: string;
    city: string;
    street: string;
    postalCode: string;
    latitude: number;
    longitude: number;
    createdById: string;
    createdAt: string;
  };
}>;

export type CreateCompanyResponseType = StandardResponseType<{
  company: {
    id: string;
    name: string;
    country: string;
    county: string;
    city: string;
    street: string;
    postalCode: string;
    latitude: number;
    longitude: number;
    createdById: string;
    createdAt: string;
  };
}>;
