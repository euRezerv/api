import { isAuthenticated } from "../../../middleware/auth.middleware";
import { Router } from "express";
import { cookieSecurity, HTTP_RESPONSES, jsonRequestBody, SwaggerDocsManager } from "@utils/swaggerDocs";
import { validateCreateOrUpdateUserLocalProfile, validateGetUserById } from "src/validators/users.validator";
import { createOrUpdateUserLocalProfile, getAuthUser, getUserById } from "src/controllers/users/users.controller";

const router = Router();
const UsersDocs = new SwaggerDocsManager();

router.get("/auth-user", isAuthenticated, getAuthUser);
UsersDocs.add({
  "/v1/users/auth-user": {
    get: {
      summary: "Get authenticated user data",
      tags: ["Users"],
      ...cookieSecurity,
      responses: {
        ...HTTP_RESPONSES.OK200(),
        ...HTTP_RESPONSES.UNAUTHORIZED401(),
        ...HTTP_RESPONSES.NOT_FOUND404({ description: "User not found (should never happen)" }),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500({ description: "Internal server error" }),
      },
    },
  },
});

router.get("/:id", isAuthenticated, validateGetUserById, getUserById);
UsersDocs.add({
  "/v1/users/{id}": {
    get: {
      summary: "Get a user by id",
      tags: ["Users"],
      ...cookieSecurity,
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
          description: "User ID",
        },
      ],
      responses: {
        ...HTTP_RESPONSES.OK200(),
        ...HTTP_RESPONSES.BAD_REQUEST400({ description: "Validation error" }),
        ...HTTP_RESPONSES.UNAUTHORIZED401(),
        ...HTTP_RESPONSES.NOT_FOUND404({ description: "User not found" }),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500({ description: "Internal server error" }),
      },
    },
  },
});

router.put("/local-profile", isAuthenticated, validateCreateOrUpdateUserLocalProfile, createOrUpdateUserLocalProfile);
UsersDocs.add({
  "/v1/users/local-profile": {
    put: {
      summary: "Create or update user local profile",
      tags: ["Users"],
      ...cookieSecurity,
      requestBody: jsonRequestBody({
        userId: {
          type: "string",
          default: undefined,
          description: "Must be system admin to update other users local profile",
        },
        givenName: { type: "string", isRequired: true },
        familyName: { type: "string", isRequired: true },
        email: { type: "string", isRequired: true },
        phoneNumberCountryISO: { type: "string", isRequired: true },
        phoneNumber: { type: "string", isRequired: true },
      }),
      responses: {
        ...HTTP_RESPONSES.OK200(),
        ...HTTP_RESPONSES.BAD_REQUEST400({ description: "Validation error" }),
        ...HTTP_RESPONSES.UNAUTHORIZED401(),
        ...HTTP_RESPONSES.FORBIDDEN403({ description: "Must be system admin to update other users local profile" }),
        ...HTTP_RESPONSES.NOT_FOUND404({ description: "User not found" }),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500({ description: "Internal server error" }),
      },
    },
  },
});

export { UsersDocs };
export default router;
