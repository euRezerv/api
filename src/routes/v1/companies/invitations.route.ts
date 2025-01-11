import { isAuthenticated } from "../../../middleware/auth.middleware";
import { Router } from "express";
import { validateInviteEmployeeToCompany } from "src/validators/companies.validator";
import { CompanyEmployeeRole } from "@prisma/client";
import { cookieSecurity, HTTP_RESPONSES, jsonRequestBody, SwaggerDocsManager } from "@utils/swaggerDocs";
import { inviteEmployeeToCompany } from "src/controllers/companies/inviteEmployeeToCompany.controller";

const router = Router();
const CompanyInvitationDocs = new SwaggerDocsManager();

router.post("/:id/invitations", isAuthenticated, validateInviteEmployeeToCompany, inviteEmployeeToCompany);
CompanyInvitationDocs.add({
  "/v1/companies/{id}/invitations": {
    post: {
      summary: "Invite employee to company",
      tags: ["Company Invitations"],
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

export { CompanyInvitationDocs };
export default router;
