import { Response } from "express";
import { PaginationResponseType, StandardErrorType, StandardResponseType } from "../toolbox/src/response/types/types";

type StandardResponseParamsType<R> = {
  isSuccess: boolean;
  res: Response;
  statusCode?: number;
  message?: string;
  data?: R;
  errors?: string | string[] | Error | Error[] | StandardErrorType | StandardErrorType[];
};

/**
 * @param {StandardResponseParamsType} params - The parameters for the standard response
 * @returns {StandardResponseType} - The standard response
 */
export function standardResponse<R extends { [key: string]: any }>({
  isSuccess,
  res,
  statusCode,
  message,
  data,
  errors,
}: StandardResponseParamsType<R>): StandardResponseType<R> {
  if (!statusCode) {
    statusCode = res?.statusCode || (isSuccess ? 200 : 400);
  }

  let normalizedErrors: StandardErrorType[] | null = null;
  if (errors) {
    if (Array.isArray(errors)) {
      normalizedErrors = errors.map((error) => {
        if (typeof error === "string") {
          return { message: error };
        } else if (error instanceof Error) {
          return { message: error.message, stack: error.stack };
        } else {
          return error;
        }
      });
    } else {
      normalizedErrors = [
        typeof errors === "string" ? { message: errors } : errors instanceof Error ? { message: errors.message } : errors,
      ];
    }
  }

  return {
    isSuccess,
    statusCode,
    ...(message && { message }),
    ...(data && { data }),
    ...(normalizedErrors && { errors: normalizedErrors }),
    timestamp: new Date().toISOString(),
  };
}

/**
 * @param {number} page - The current page
 * @param {number} pageSize - The size of the page
 * @param {number} totalCount - The total count of items
 * @returns {PaginationResponseType} - The pagination response
 */
export const getPaginationResponse = (page: number, pageSize: number, totalCount: number): PaginationResponseType => {
  return {
    pagination: {
      currentPage: page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
};
