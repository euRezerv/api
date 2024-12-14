import { StandardErrorType } from "@toolbox/response/types/types";
import { Request } from "express";
import { FieldValidationError, ValidationError, validationResult } from "express-validator";

const isFieldValidationError = (err: ValidationError): err is FieldValidationError => {
  return err.type === "field";
};

const validationErrorFormatter = (err: ValidationError): StandardErrorType => {
  if (isFieldValidationError(err)) {
    return {
      message: err.msg,
      field: err.path,
      fieldType: err.location,
      value: err.value,
    };
  }

  throw new Error("Not implemented error type");
};

export default (req: Request) => {
  return validationResult(req).formatWith(validationErrorFormatter).array();
};
