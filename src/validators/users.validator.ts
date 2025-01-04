import { check, param } from "express-validator";
import validationResultFormatter from "./validationResultFormatter";
import { standardResponse } from "@utils/responses";
import { isObjectEmpty } from "@toolbox/common/objects";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { EMAIL_REGEX } from "@utils/regex";
import { isSupportedCountry, isValidPhoneNumber } from "libphonenumber-js";
import { isSystemAdmin } from "@utils/validators";

export const validateGetUserById: RequestHandler[] = [
  param("id")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("User ID is required")
    .isString()
    .withMessage("User ID must be a string"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResultFormatter(req);
    if (!isObjectEmpty(errors)) {
      res.status(400).json(standardResponse({ isSuccess: false, res, message: "Validation error", errors }));
      return;
    }

    next();
  },
];

export const validateCreateOrUpdateUserLocalProfile: RequestHandler[] = [
  check("userId")
    .optional()
    .isString()
    .withMessage("User ID must be a string")
    .custom((value, { req }) => {
      if (!req.user) {
        throw new Error("No user found in request");
      }

      if (!isSystemAdmin(req.user)) {
        throw new Error("User is not a system admin");
      }

      return true;
    }),
  check("givenName")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Given name is required")
    .isString()
    .isLength({ min: 2 })
    .withMessage("Given name must be at least 2 characters long"),
  check("familyName")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Family name is required")
    .isString()
    .isLength({ min: 2 })
    .withMessage("Family name must be at least 2 characters long"),
  check("email")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Email is required")
    .toLowerCase()
    .matches(EMAIL_REGEX)
    .withMessage("Email is invalid"),
  check("phoneNumberCountryISO")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Phone number prefix is required")
    .isString()
    .withMessage("Phone number prefix must be a string")
    .toUpperCase()
    .custom((prefixISO) => isSupportedCountry(prefixISO))
    .withMessage("Phone number prefix is not supported"),
  check("phoneNumber")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Phone number is required")
    .isString()
    .withMessage("Phone number must be a string")
    .custom((value, { req }) => {
      return isValidPhoneNumber(req.body.phoneNumber, req.body.phoneNumberCountryISO);
    })
    .withMessage("Phone number is invalid"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResultFormatter(req);
    if (!isObjectEmpty(errors)) {
      res.status(400).json(standardResponse({ isSuccess: false, res, message: "Validation error", errors }));
      return;
    }

    next();
  },
];
