import { isAuthenticated } from "../../../middleware/auth.middleware";
import { addPagination } from "../../../middleware/pagination.middleware";
import { Router } from "express";
import {
  validateCreateCompany,
  validateGetCompanies,
  validateGetCompanyById,
  validateInviteEmployeeToCompany,
} from "src/validators/companies.validator";
import { CompanyEmployeeRole } from "@prisma/client";
import {
  cookieSecurity,
  HTTP_RESPONSES,
  jsonRequestBody,
  paginationQueryParams,
  SwaggerDocsManager,
} from "@utils/swaggerDocs";
import { getCompanies } from "src/controllers/companies/getCompanies.controller";
import { getCompanyById } from "src/controllers/companies/getCompanyById.controller";
import { createCompany } from "src/controllers/companies/createCompany.controller";
import { inviteEmployeeToCompany } from "src/controllers/companies/inviteEmployeeToCompany.controller";

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

router.get("/:id", isAuthenticated, validateGetCompanyById, getCompanyById);
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

// router.get("/:id/employees", (req, res) => {
//   res.status(501).send("Not implemented");
// });
// CompaniesDocs.add({
//   "/v1/companies/{id}/employees": {
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

router.post("/:id/invitations", isAuthenticated, validateInviteEmployeeToCompany, inviteEmployeeToCompany);
CompaniesDocs.add({
  "/v1/companies/{id}/invitations": {
    post: {
      summary: "Invite employee to company",
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
      requestBody: jsonRequestBody({
        invitedUserId: { type: "string", isRequired: true },
        role: { type: "string", isRequired: true, enum: Object.values(CompanyEmployeeRole) },
      }),
      responses: {
        ...HTTP_RESPONSES.CREATED201({ description: "Invitation sent successfully" }),
        ...HTTP_RESPONSES.BAD_REQUEST400({ description: "Validation error" }),
        ...HTTP_RESPONSES.UNAUTHORIZED401(),
        ...HTTP_RESPONSES.FORBIDDEN403({ description: "Sender must be an employee of the company" }),
        ...HTTP_RESPONSES.NOT_FOUND404({ description: "Company not found" }),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500({ description: "Internal server error" }),
      },
    },
  },
});

export { CompaniesDocs };
export default router;
