import { query, ValidationChain } from "express-validator";

export const paginationValidations: ValidationChain[] = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be greater than 0").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Page size must be a positive integer between 1 and 100")
    .toInt(),
];
