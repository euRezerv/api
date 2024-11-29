import { CompanyEmployeeRole } from "@prisma/client";

export type GetCompanyByIdRequestType = {
  id: string;
};

export type GetCompaniesRequestType = {
  employeeId?: string;
  employeeRole?: CompanyEmployeeRole;
};

export type CreateCompanyRequestType = {
  name: string;
  country: string;
  county: string;
  city: string;
  street: string;
  postalCode: string;
  latitude: number;
  longitude: number;
};
