import { isAuthenticated } from "../../../services/auth.service";
import { addPagination } from "../../../services/pagination.service";
import { Router } from "express";
import { createCompany, getCompanies, getCompanyById } from "src/controllers/companies.controller";
import { validateCreateCompany, validateGetCompanies, validateGetCompanyById } from "src/validators/companies.validator";
import { CompanyEmployeeRole } from "@prisma/client";
import {
  cookieSecurity,
  HTTP_RESPONSES,
  jsonRequestBody,
  paginationQueryParams,
  SwaggerDocsManager,
} from "@utils/swaggerDocs";

const router = Router();
const CompaniesDocs = new SwaggerDocsManager();

router.get("/", isAuthenticated.local, addPagination, validateGetCompanies, getCompanies);
CompaniesDocs.add({
  "/v1/companies": {
    get: {
      summary: "Get companies",
      tags: ["Companies"],
      ...cookieSecurity,
      parameters: [
        {
          in: "query",
          name: "employeeId",
          required: false,
          schema: { type: "string" },
          description: "Employee ID",
        },
        {
          in: "query",
          name: "employeeRole",
          required: false,
          schema: { type: "string", enum: Object.values(CompanyEmployeeRole) },
          description: "Employee role in the company",
        },
        ...paginationQueryParams,
      ],
      responses: {
        ...HTTP_RESPONSES.OK200(),
        ...HTTP_RESPONSES.BAD_REQUEST400({ description: "Validation error" }),
        ...HTTP_RESPONSES.UNAUTHORIZED401(),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500({ description: "Internal server error" }),
      },
    },
  },
});

router.get("/:id", isAuthenticated.local, validateGetCompanyById, getCompanyById);
CompaniesDocs.add({
  "/v1/companies/{id}": {
    get: {
      summary: "Get a company by id",
      tags: ["Companies"],
      ...cookieSecurity,
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
          description: "Company id",
        },
      ],
      responses: {
        ...HTTP_RESPONSES.OK200(),
        ...HTTP_RESPONSES.BAD_REQUEST400({ description: "Validation error" }),
        ...HTTP_RESPONSES.UNAUTHORIZED401(),
        ...HTTP_RESPONSES.NOT_FOUND404({ description: "Company not found" }),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500({ description: "Internal server error" }),
      },
    },
  },
});

router.post("/", isAuthenticated.local, validateCreateCompany, createCompany);
CompaniesDocs.add({
  "/v1/companies": {
    post: {
      summary: "Create a new company",
      tags: ["Companies"],
      ...cookieSecurity,
      requestBody: jsonRequestBody({
        name: { type: "string" },
        country: { type: "string" },
        county: { type: "string" },
        city: { type: "string" },
        street: { type: "string" },
        postalCode: { type: "string" },
        latitude: { type: "number" },
        longitude: { type: "number" },
      }),
      responses: {
        ...HTTP_RESPONSES.CREATED201({ description: "Company created successfully" }),
        ...HTTP_RESPONSES.BAD_REQUEST400({ description: "Validation error" }),
        ...HTTP_RESPONSES.UNAUTHORIZED401(),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500({ description: "Internal server error" }),
      },
    },
  },
});

export { CompaniesDocs };
export default router;
