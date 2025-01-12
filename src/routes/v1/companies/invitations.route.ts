import { isAuthenticated } from "../../../middleware/auth.middleware";
import { Router } from "express";
import {
  validateAcceptEmployeeToCompanyInvitation,
  validateDeclineEmployeeToCompanyInvitation,
  validateInviteEmployeeToCompany,
} from "src/validators/companies/invitations.validator";
import { CompanyEmployeeRole } from "@prisma/client";
import { cookieSecurity, HTTP_RESPONSES, jsonRequestBody, SwaggerDocsManager } from "@utils/swaggerDocs";
import { inviteEmployeeToCompany } from "src/controllers/companies/invitations/inviteEmployeeToCompany.controller";
import { acceptEmployeeToCompanyInvitation } from "src/controllers/companies/invitations/acceptEmployeeToCompanyInvitation.controller";
import { declineEmployeeToCompanyInvitation } from "src/controllers/companies/invitations/declineEmployeeToCompanyInvitation.controller";

const router = Router();
const CompanyInvitationDocs = new SwaggerDocsManager();

router.post("/:companyId/invitations", isAuthenticated, validateInviteEmployeeToCompany, inviteEmployeeToCompany);
CompanyInvitationDocs.add({
  "/v1/companies/{companyId}/invitations": {
    post: {
      summary: "Invite employee to company",
      tags: ["Company Invitations"],
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

router.patch(
  "/:companyId/invitations/:invitationId/accept",
  isAuthenticated,
  validateAcceptEmployeeToCompanyInvitation,
  acceptEmployeeToCompanyInvitation
);
CompanyInvitationDocs.add({
  "/v1/companies/{companyId}/invitations/{invitationId}/accept": {
    patch: {
      summary: "Accept invitation",
      tags: ["Company Invitations"],
      ...cookieSecurity,
      parameters: [
        {
          in: "path",
          name: "companyId",
          required: true,
          schema: { type: "string" },
          description: "Company id",
        },
        {
          in: "path",
          name: "invitationId",
          required: true,
          schema: { type: "string" },
          description: "Invitation id",
        },
      ],
      responses: {
        ...HTTP_RESPONSES.OK200({ description: "Invitation accepted" }),
        ...HTTP_RESPONSES.BAD_REQUEST400({ description: "Validation error" }),
        ...HTTP_RESPONSES.UNAUTHORIZED401(),
        ...HTTP_RESPONSES.FORBIDDEN403({ description: "The invitation doesn't belong to the user" }),
        ...HTTP_RESPONSES.NOT_FOUND404({ description: "Company or invitation not found" }),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500({ description: "Internal server error" }),
      },
    },
  },
});

router.patch(
  "/:companyId/invitations/:invitationId/decline",
  isAuthenticated,
  validateDeclineEmployeeToCompanyInvitation,
  declineEmployeeToCompanyInvitation
);
CompanyInvitationDocs.add({
  "/v1/companies/{companyId}/invitations/{invitationId}/decline": {
    patch: {
      summary: "Decline invitation",
      tags: ["Company Invitations"],
      ...cookieSecurity,
      parameters: [
        {
          in: "path",
          name: "companyId",
          required: true,
          schema: { type: "string" },
          description: "Company id",
        },
        {
          in: "path",
          name: "invitationId",
          required: true,
          schema: { type: "string" },
          description: "Invitation id",
        },
      ],
      responses: {
        ...HTTP_RESPONSES.OK200({ description: "Invitation declined" }),
        ...HTTP_RESPONSES.BAD_REQUEST400({ description: "Validation error" }),
        ...HTTP_RESPONSES.UNAUTHORIZED401(),
        ...HTTP_RESPONSES.FORBIDDEN403({ description: "The invitation doesn't belong to the user" }),
        ...HTTP_RESPONSES.NOT_FOUND404({ description: "Company or invitation not found" }),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500({ description: "Internal server error" }),
      },
    },
  },
});

export { CompanyInvitationDocs };
export default router;
