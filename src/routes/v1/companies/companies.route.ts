import { isAuthenticated } from "../../../middleware/auth.middleware";
import { addPagination } from "../../../middleware/pagination.middleware";
import { Router } from "express";
import {
  validateCreateCompany,
  validateGetCompanies,
  validateGetCompanyById,
} from "src/validators/companies/companies.validator";
import { CompanyEmployeeRole } from "@prisma/client";
import {
  cookieSecurity,
  HTTP_RESPONSES,
  jsonRequestBody,
  paginationQueryParams,
  SwaggerDocsManager,
} from "@utils/swaggerDocs";
import { getCompanies } from "src/controllers/companies/companies/getCompanies.controller";
import { getCompanyById } from "src/controllers/companies/companies/getCompanyById.controller";
import { createCompany } from "src/controllers/companies/companies/createCompany.controller";

const router = Router();
const CompaniesDocs = new SwaggerDocsManager();

router.get("/", isAuthenticated, addPagination, validateGetCompanies, getCompanies);
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

router.get("/:companyId", isAuthenticated, validateGetCompanyById, getCompanyById);
CompaniesDocs.add({
  "/v1/companies/{companyId}": {
    get: {
      summary: "Get a company by id",
      tags: ["Companies"],
      ...cookieSecurity,
      parameters: [
        {
          in: "path",
          name: "companyId",
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

// router.get("/:companyId/employees", (req, res) => {
//   res.status(501).send("Not implemented");
// });
// CompaniesDocs.add({
//   "/v1/companies/{companyId}/employees": {
//     get: {
//       summary: "Get company employees",
//       tags: ["Companies"],
//       parameters: [],
//       responses: {
//         ...HTTP_RESPONSES.OK200(),
//         ...HTTP_RESPONSES.BAD_REQUEST400({ description: "Validation error" }),
//         ...HTTP_RESPONSES.UNAUTHORIZED401(),
//         ...HTTP_RESPONSES.NOT_FOUND404({ description: "Company not found" }),
//         ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500({ description: "Internal server error" }),
//       },
//     },
//   },
// });

router.post("/", isAuthenticated, validateCreateCompany, createCompany);
CompaniesDocs.add({
  "/v1/companies": {
    post: {
      summary: "Create a new company",
      tags: ["Companies"],
      ...cookieSecurity,
      requestBody: jsonRequestBody({
        name: { type: "string", isRequired: true },
        country: { type: "string", isRequired: true },
        county: { type: "string", isRequired: true },
        city: { type: "string", isRequired: true },
        street: { type: "string", isRequired: true },
        postalCode: { type: "string", isRequired: true },
        latitude: { type: "number", isRequired: true },
        longitude: { type: "number", isRequired: true },
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
