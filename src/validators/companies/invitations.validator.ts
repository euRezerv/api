import { NextFunction, Request, RequestHandler, Response } from "express";
import { check, param, query } from "express-validator";
import validationResultFormatter from "../validationResultFormatter";
import { isObjectEmpty } from "@toolbox/common/objects";
import { standardResponse } from "@utils/responses";
import { CompanyEmployeeRole } from "@prisma/client";

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

export const validateAcceptEmployeeToCompanyInvitation: RequestHandler[] = [
  param("companyId")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Company ID is required")
    .isString()
    .withMessage("Company ID must be a string"),
  param("invitationId")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Invitation ID is required")
    .isString()
    .withMessage("Invitation ID must be a string"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResultFormatter(req);
    if (!isObjectEmpty(errors)) {
      res.status(400).json(standardResponse({ isSuccess: false, res, message: "Validation error", errors }));
      return;
    }

    next();
  },
];
