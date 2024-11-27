import { isAuthenticated } from "@services/auth.service";
import { addPagination } from "@services/pagination.service";
import { Router } from "express";
import { createCompany, getCompanies, getCompanyById } from "src/controllers/companies.controller";
import { validateCreateCompany, validateGetCompanies, validateGetCompanyById } from "src/validators/companies.validator";

const router = Router();

/**
 * @swagger
 * /v1/companies:
 *   get:
 *     summary: Get companies
 *     tags: [Companies]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         required: false
 *         schema:
 *           type: string
 *         description: Employee ID
 *       - in: query
 *         name: employeeRole
 *         required: false
 *         schema:
 *           type: string
 *           enum: [MANAGER, REGULAR]
 *         description: Employee role in the company
 *       - in: query
 *         name: pageSize
 *         required: false
 *         schema:
 *           type: int
 *         description: Page size
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: int
 *         description: Page number
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/", isAuthenticated.local, addPagination, validateGetCompanies, getCompanies);

/**
 * @swagger
 * /v1/companies/{id}:
 *   get:
 *     summary: Get a company by id
 *     tags: [Companies]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company id
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", isAuthenticated.local, validateGetCompanyById, getCompanyById);

/**
 * @swagger
 * /v1/companies:
 *   post:
 *     summary: Create a new company
 *     tags: [Companies]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               country:
 *                 type: string
 *               county:
 *                 type: string
 *               city:
 *                 type: string
 *               street:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: Company created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/", isAuthenticated.local, validateCreateCompany, createCompany);

export default router;
