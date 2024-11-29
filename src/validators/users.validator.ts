import { param } from "express-validator";
import validationResultFormatter from "./validationResultFormatter";
import { standardResponse } from "@common/response/responses";
import { isObjectEmpty } from "@utils/objects";
import { NextFunction, Request, RequestHandler, Response } from "express";

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
