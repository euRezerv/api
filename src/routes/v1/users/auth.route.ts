import { SwaggerDocsManager } from "@utils/swaggerDocs";
import { validateLogin, validateRegister } from "../../../validators/auth.validator";
import { Router } from "express";
import { loginUser, registerUser } from "src/controllers/users/auth.controller";

const router = Router();
const AuthDocs = new SwaggerDocsManager();

router.post("/login", validateLogin, loginUser);
AuthDocs.add({
  "/v1/users/auth/login": {
    post: {
      summary: "Login a user",
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                identifier: { type: "string" },
                password: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Logged in successfully" },
        400: { description: "Validation error" },
        401: { description: "Incorrect credentials" },
        500: { description: "Internal server error" },
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
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                firstName: { type: "string" },
                lastName: { type: "string" },
                email: { type: "string" },
                phoneNumberCountryISO: { type: "string" },
                phoneNumber: { type: "string" },
                password: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Registered successfully" },
        400: { description: "Validation error" },
        409: { description: "User already exists" },
        500: { description: "Internal server error" },
      },
    },
  },
});

export { AuthDocs };
export default router;
