import { HTTP_RESPONSES, jsonRequestBody, SwaggerDocsManager } from "@utils/swaggerDocs";
import { validateLogin, validateRegister } from "../../../validators/auth.validator";
import { Router } from "express";
import {
  googleLoginUser,
  googleLoginUserCallback,
  loginUser,
  logoutUser,
  registerUser,
} from "src/controllers/users/auth.controller";

const router = Router();
const AuthDocs = new SwaggerDocsManager();

router.post("/login", validateLogin, loginUser);
AuthDocs.add({
  "/v1/users/auth/login": {
    post: {
      summary: "Login a user",
      tags: ["Auth"],
      requestBody: jsonRequestBody({
        identifier: { type: "string", description: "Email or phone number", isRequired: true },
        password: { type: "string", isRequired: true },
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
        givenName: { type: "string", isRequired: true },
        familyName: { type: "string", isRequired: true },
        email: { type: "string", isRequired: true },
        phoneNumberCountryISO: { type: "string", isRequired: true },
        phoneNumber: { type: "string", isRequired: true },
        password: { type: "string", isRequired: true },
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

router.get("/google", googleLoginUser);
AuthDocs.add({
  "/v1/users/auth/google": {
    get: {
      summary: "Login with Google",
      tags: ["Auth"],
      responses: {
        ...HTTP_RESPONSES.OK200({ description: "Redirect to Google login" }),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500(),
      },
    },
  },
});

router.get("/google/callback", googleLoginUserCallback);
AuthDocs.add({
  "/v1/users/auth/google/callback": {
    get: {
      summary: "Callback for Google login",
      tags: ["Auth"],
      responses: {
        ...HTTP_RESPONSES.OK200({ description: "Redirect to the app" }),
        ...HTTP_RESPONSES.INTERNAL_SERVER_ERROR500(),
      },
    },
  },
});

export { AuthDocs };
export default router;
