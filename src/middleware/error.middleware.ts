import { normalizeError } from "@toolbox/common/errors";
import log from "@utils/logger";
import { standardResponse } from "@utils/responses";
import { NextFunction, Request, Response } from "express";

export const addJsonErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  log.error(err);
  res
    .status(500)
    .send(standardResponse({ isSuccess: false, res, message: "Something went wrong", errors: normalizeError(err) }));

  return;
};
