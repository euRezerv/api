import { DayOfWeek, ResourceCategory } from "@prisma/client";
import { cookieSecurity, HTTP_RESPONSES, jsonRequestBody, SwaggerDocsManager } from "@utils/swaggerDocs";
import { Router } from "express";
import { createCompanyResource } from "src/controllers/companies/resources/createCompanyResource.controller";
import { isAuthenticated } from "src/middleware/auth.middleware";
import { validateCreateCompanyResource } from "src/validators/companies/resources.validator";

const router = Router({ mergeParams: true });
const ResourcesDocs = new SwaggerDocsManager();

router.post("/", isAuthenticated, validateCreateCompanyResource, createCompanyResource);
ResourcesDocs.add({
  "/v1/companies/{companyId}/resources": {
    post: {
      summary: "Create resource",
      tags: ["Resources"],
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
        name: { type: "string", isRequired: true },
        description: { type: "string" },
        availabilityTime: {
          type: "array",
          items: {
            type: "object",
            properties: {
              dayOfWeek: { type: "string", enum: Object.values(DayOfWeek) },
              startTime: { type: "string" },
              endTime: { type: "string" },
            },
            required: ["dayOfWeek", "startTime", "endTime"],
          },
          minItems: 1,
          maxItems: 7,
          isRequired: true,
        },
        category: { type: "string", enum: Object.values(ResourceCategory), isRequired: true },
        assignedEmployeesIds: { type: "array", items: { type: "string" }, isRequired: true },
        requiresBookingApproval: { type: "boolean", isRequired: true },
      }),
      responses: {
        ...HTTP_RESPONSES.CREATED201(),
        ...HTTP_RESPONSES.BAD_REQUEST400({ description: "Validation error" }),
        ...HTTP_RESPONSES.UNAUTHORIZED401(),
        ...HTTP_RESPONSES.FORBIDDEN403({ description: "User must be an Manager/Owner of the company" }),
        ...HTTP_RESPONSES.NOT_FOUND404({ description: "Company not found" }),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500({ description: "Internal server error" }),
      },
    },
  },
});

export { ResourcesDocs };
export default router;
