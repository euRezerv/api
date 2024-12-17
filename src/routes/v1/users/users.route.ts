import { isAuthenticated } from "../../../middleware/auth.middleware";
import { Router } from "express";
import { cookieSecurity, HTTP_RESPONSES, SwaggerDocsManager } from "@utils/swaggerDocs";
import { validateGetUserById } from "src/validators/users.validator";
import { getUserById } from "src/controllers/users/users.controller";

const router = Router();
const UsersDocs = new SwaggerDocsManager();

router.get("/:id", isAuthenticated.local, validateGetUserById, getUserById);
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

export { UsersDocs };
export default router;
