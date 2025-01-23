import { normalizeError } from "@toolbox/common/errors";
import { isObjectEmpty } from "@toolbox/common/objects";
import log from "@utils/logger";
import { standardResponse } from "@utils/responses";
import { NextFunction, Request, Response } from "express";
import validationResultFormatter from "src/validators/validationResultFormatter";

export const addJsonErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  log.error(err, req);
  res
    .status(500)
    .send(standardResponse({ isSuccess: false, res, message: "Something went wrong", errors: normalizeError(err) }));

  return;
};

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResultFormatter(req);
  if (!isObjectEmpty(errors)) {
    res.status(400).json(standardResponse({ isSuccess: false, res, message: "Validation error", errors }));
    return;
  }

  next();
};
