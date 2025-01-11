import { NextFunction, Request, RequestHandler, Response } from "express";
import { check, param, query } from "express-validator";
import validationResultFormatter from "./validationResultFormatter";
import { isObjectEmpty } from "@toolbox/common/objects";
import { standardResponse } from "@utils/responses";
import { CompanyEmployeeRole } from "@prisma/client";

export const validateGetCompanyById: RequestHandler[] = [
  param("companyId")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Company ID is required")
    .isString()
    .withMessage("Company ID must be a string"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResultFormatter(req);
    if (!isObjectEmpty(errors)) {
      res.status(400).json(standardResponse({ isSuccess: false, res, message: "Validation error.", errors }));
      return;
    }

    next();
  },
];

export const validateGetCompanies: RequestHandler[] = [
  query("employeeId").optional().isString().withMessage("Employee ID must be a string"),
  query("employeeRole")
    .optional()
    .isString()
    .withMessage("Employee role must be a string")
    .custom((value, { req }) => {
      if (value && !req.query?.employeeId) {
        throw new Error("Employee role cannot be provided without employee ID");
      }

      if (!Object.values(CompanyEmployeeRole).includes(value.toUpperCase() as CompanyEmployeeRole)) {
        throw new Error(`Invalid employee role. Must be one of: ${Object.values(CompanyEmployeeRole).join(", ")}`);
      }

      return true;
    })
    .toUpperCase(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResultFormatter(req);
    if (!isObjectEmpty(errors)) {
      res.status(400).json(standardResponse({ isSuccess: false, res, message: "Validation error", errors }));
      return;
    }

    next();
  },
];

export const validateCreateCompany: RequestHandler[] = [
  check("name")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),
  check("country")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Country is required")
    .isString()
    .withMessage("Country must be a string"),
  check("county")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("County is required")
    .isString()
    .withMessage("County must be a string"),
  check("city")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("City is required")
    .isString()
    .withMessage("City must be a string"),
  check("street")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Street is required")
    .isString()
    .withMessage("Street must be a string"),
  check("postalCode")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Postal code is required")
    .isString()
    .withMessage("Postal code must be a string"),
  check("latitude")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Latitude is required")
    .not()
    .isString()
    .withMessage("Latitude must be a number")
    .isFloat()
    .withMessage("Latitude must be a number"),
  check("longitude")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Longitude is required")
    .not()
    .isString()
    .withMessage("Longitude must be a number")
    .isFloat()
    .withMessage("Longitude must be a number"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResultFormatter(req);
    if (!isObjectEmpty(errors)) {
      res.status(400).json(standardResponse({ isSuccess: false, res, message: "Validation error", errors }));
      return;
    }

    next();
  },
];

export const validateInviteEmployeeToCompany: RequestHandler[] = [
  param("companyId")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Company ID is required")
    .isString()
    .withMessage("Company ID must be a string"),
  check("invitedUserId")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Invited user ID is required")
    .isString()
    .withMessage("Invited user ID must be a string")
    .custom((value, { req }) => {
      if (value === req.user.id) {
        throw new Error("You cannot invite yourself to a company");
      }

      return true;
    }),
  check("role")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Role is required")
    .isString()
    .withMessage("Role must be a string")
    .custom((value) => {
      if (!Object.values(CompanyEmployeeRole).includes(value.toUpperCase() as CompanyEmployeeRole)) {
        throw new Error(`Invalid role. Must be one of: ${Object.values(CompanyEmployeeRole).join(", ")}`);
      }

      return true;
    })
    .toUpperCase(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResultFormatter(req);
    if (!isObjectEmpty(errors)) {
      res.status(400).json(standardResponse({ isSuccess: false, res, message: "Validation error", errors }));
      return;
    }

    next();
  },
];
