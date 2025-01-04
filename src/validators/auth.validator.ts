import { NextFunction, Request, Response, RequestHandler } from "express";
import { check } from "express-validator";
import validationResultFormatter from "./validationResultFormatter";
import { isObjectEmpty } from "@toolbox/common/objects";
import { standardResponse } from "@utils/responses";
import { EMAIL_REGEX } from "@utils/regex";
import { isSupportedCountry, isValidPhoneNumber } from "libphonenumber-js";

export const validateLogin: RequestHandler[] = [
  check("identifier").not().isEmpty({ ignore_whitespace: true }).withMessage("Identifier is required").toLowerCase(),
  check("password").not().isEmpty({ ignore_whitespace: true }).withMessage("Password is required"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResultFormatter(req);
    if (!isObjectEmpty(errors)) {
      res.status(400).json(standardResponse({ isSuccess: false, res, message: "Validation error", errors }));
      return;
    }

    next();
  },
];

export const validateRegister: RequestHandler[] = [
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
  check("password")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Password is required")
    .isString()
    .not()
    .contains(" ")
    .withMessage("Password must not contain spaces")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .isStrongPassword()
    .withMessage("Password must contain at least 1 uppercase letter, 1 number, and 1 symbol"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResultFormatter(req);
    if (!isObjectEmpty(errors)) {
      res.status(400).json(standardResponse({ isSuccess: false, res, message: "Validation error", errors }));
      return;
    }

    next();
  },
];
