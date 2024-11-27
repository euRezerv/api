import { query, ValidationChain } from "express-validator";

export const paginationValidations: ValidationChain[] = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer.").toInt(),
  query("pageSize")
    .not()
    .isEmpty()
    .withMessage("Page size is required.")
    .isInt({ min: 1, max: 100 })
    .withMessage("Page size must be a positive integer between 1 and 100.")
    .toInt(),
];
