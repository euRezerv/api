import { HTTP_RESPONSES, jsonRequestBody, SwaggerDocsManager } from "@utils/swaggerDocs";
import { validateLogin, validateRegister } from "../../../validators/auth.validator";
import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "src/controllers/users/auth.controller";

const router = Router();
const AuthDocs = new SwaggerDocsManager();

router.post("/login", validateLogin, loginUser);
AuthDocs.add({
  "/v1/users/auth/login": {
    post: {
      summary: "Login a user",
      tags: ["Auth"],
      requestBody: jsonRequestBody({
        identifier: { type: "string", description: "Email or phone number" },
        password: { type: "string" },
      }),
      responses: {
        ...HTTP_RESPONSES.OK200({ description: "Logged in successfully" }),
        ...HTTP_RESPONSES.BAD_REQUEST400({ description: "Validation error" }),
        ...HTTP_RESPONSES.UNAUTHORIZED401({ description: "Incorrect credentials" }),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500(),
      },
    },
  },
});

router.post("/logout", logoutUser);
AuthDocs.add({
  "/v1/users/auth/logout": {
    post: {
      summary: "Logout a user",
      tags: ["Auth"],
      responses: {
        ...HTTP_RESPONSES.OK200({ description: "Logged out successfully" }),
        ...HTTP_RESPONSES.BAD_REQUEST400({ description: "User is not logged in" }),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500(),
      },
    },
  },
});

router.post("/register", validateRegister, registerUser);
AuthDocs.add({
  "/v1/users/auth/register": {
    post: {
      summary: "Register a new user",
      tags: ["Auth"],
      requestBody: jsonRequestBody({
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        phoneNumberCountryISO: { type: "string" },
        phoneNumber: { type: "string" },
        password: { type: "string" },
      }),
      responses: {
        ...HTTP_RESPONSES.CREATED201({ description: "Registered successfully" }),
        ...HTTP_RESPONSES.BAD_REQUEST400({ description: "Validation error" }),
        ...HTTP_RESPONSES.CONFLICT409({ description: "User already exists" }),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500(),
      },
    },
  },
});

export { AuthDocs };
export default router;
