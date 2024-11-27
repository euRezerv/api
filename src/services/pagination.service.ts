import { PaginationParamsType, RequestWithQuery } from "@common/request/types/types";
import { standardResponse } from "@common/response/responses";
import { normalizeError } from "@utils/errors";
import log from "@utils/logger";
import { isObjectEmpty } from "@utils/objects";
import { Response, NextFunction, Request } from "express";
import { paginationValidations } from "src/validators/pagination.validator";
import validationResultFormatter from "src/validators/validationResultFormatter";

export const addPagination = (req: Request, res: Response, next: NextFunction) => {
  Promise.all(paginationValidations.map((validation) => validation.run(req)))
    .then(() => {
      const errors = validationResultFormatter(req);
      if (!isObjectEmpty(errors)) {
        res.status(400).json(standardResponse({ isSuccess: false, res, message: "Validation error.", errors }));
        return;
      }

      const { page = 1, pageSize } = (req as unknown as RequestWithQuery<PaginationParamsType>).query;
      req.pagination = {
        skip: (page - 1) * pageSize,
        take: pageSize,
        page: page,
        pageSize: pageSize,
      };

      next();
    })
    .catch((error) => {
      log.error(error);
      res
        .status(500)
        .json(
          standardResponse({ isSuccess: false, res, message: "Failed to fetch company.", errors: normalizeError(error) })
        );
      return;
    });
};
