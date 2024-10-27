import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /v1/auth/login:
 *  post:
 *   summary: Login
 *  description: Login
 *  requestBody:
 *   required: true
 */
router.post("/login", (req, res) => {
  console.log("Login");
  res.send("Login");
});

/**
 * @swagger
 * /v1/auth/register:
 *  post:
 *   summary: Register
 *  description: Register
 *  requestBody:
 *   required: true
 */
router.post("/register", (req, res) => {
  console.log("Register");
  res.send("Register");
});

export default router;
