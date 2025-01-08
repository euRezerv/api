import { isAuthenticated } from "../../../middleware/auth.middleware";
import { Router } from "express";
import { cookieSecurity, HTTP_RESPONSES, jsonRequestBody, SwaggerDocsManager } from "@utils/swaggerDocs";
import { validateCreateOrReplaceUserLocalProfile, validateGetUserById } from "src/validators/users.validator";
import { createOrReplaceUserLocalProfile, getCurrentUser, getUserById } from "src/controllers/users/users.controller";

const router = Router();
const UsersDocs = new SwaggerDocsManager();

router.get("/current-user", isAuthenticated, getCurrentUser);
UsersDocs.add({
  "/v1/users/current-user": {
    get: {
      summary: "Get currently authenticated user data",
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

router.put(
  ["/local-profile", "/local-profile/:userId"],
  isAuthenticated,
  validateCreateOrReplaceUserLocalProfile,
  createOrReplaceUserLocalProfile
);
UsersDocs.add({
  "/v1/users/local-profile": {
    put: {
      summary: "Create or replace user local profile for the logged-in user",
      tags: ["Users"],
      ...cookieSecurity,
      requestBody: jsonRequestBody({
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
        ...HTTP_RESPONSES.NOT_FOUND404({ description: "User not found" }),
        ...HTTP_RESPONSES.CONFLICT409({ description: "Credentials already exist" }),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500({ description: "Internal server error" }),
      },
    },
  },
  "/v1/users/local-profile/{userId}": {
    put: {
      summary: "Create or replace user local profile for a specific user",
      tags: ["Users"],
      ...cookieSecurity,
      parameters: [
        {
          in: "path",
          name: "userId",
          required: true,
          schema: { type: "string", default: undefined },
          description: "Must be system admin to modify another user's local profile",
        },
      ],
      requestBody: jsonRequestBody({
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
        ...HTTP_RESPONSES.FORBIDDEN403({ description: "Must be system admin to modify another user's local profile" }),
        ...HTTP_RESPONSES.NOT_FOUND404({ description: "User not found" }),
        ...HTTP_RESPONSES.CONFLICT409({ description: "Credentials already exist" }),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500({ description: "Internal server error" }),
      },
    },
  },
});

export { UsersDocs };
export default router;
