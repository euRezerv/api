import { RequestHandler } from "express";
import { check, param } from "express-validator";
import { DayOfWeek, ResourceCategory } from "@prisma/client";
import { isString } from "@toolbox/common/strings";
import { handleValidationErrors } from "src/middleware/error.middleware";
import { filterDuplicates } from "@toolbox/common/arrays";

export const validateCreateCompanyResource: RequestHandler[] = [
  param("companyId")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Company ID is required")
    .isString()
    .withMessage("Company ID must be a string"),
  check("name")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),
  check("description").optional().isString().withMessage("Description must be a string"),
  check("availabilityTime")
    .isArray({ min: 1, max: 7 })
    .withMessage("Availability time must be an array of at least 1 item and at most 7 items")
    .custom((value) => {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (!item.hasOwnProperty("dayOfWeek")) {
            throw new Error("Each availability time item must have day of week property");
          } else if (!isString(item.dayOfWeek)) {
            throw new Error("Day of week must be a string");
          } else if (!Object.values(DayOfWeek).includes(item.dayOfWeek.toUpperCase() as DayOfWeek)) {
            throw new Error(`Invalid day of week. Must be one of: ${Object.values(DayOfWeek).join(", ")}`);
          }

          if (!item.hasOwnProperty("startTime")) {
            throw new Error("Each availability time item must have start time property");
          } else if (!isString(item.startTime)) {
            throw new Error("Start time must be a string");
          } else if (!item.startTime.trim().length) {
            throw new Error("Start time cannot be empty");
          }

          if (!item.hasOwnProperty("endTime")) {
            throw new Error("Each availability time item must have end time property");
          } else if (!isString(item.endTime)) {
            throw new Error("End time must be a string");
          } else if (!item.endTime.trim().length) {
            throw new Error("End time cannot be empty");
          }
        }

        const hasDuplicateDays = filterDuplicates(value, (item) => item.dayOfWeek).length !== value.length;
        if (hasDuplicateDays) {
          throw new Error("Availability time cannot have the same day of week more than once");
        }
      }

      return true;
    }),
  check("category")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Category is required")
    .isString()
    .withMessage("Category must be a string")
    .custom((value) => {
      if (!Object.values(ResourceCategory).includes(value?.toUpperCase())) {
        throw new Error(`Invalid category. Must be one of: ${Object.values(ResourceCategory).join(", ")}`);
      }

      return true;
    })
    .toUpperCase(),
  check("assignedEmployeesIds")
    .isArray({ min: 1 })
    .withMessage("Assigned employees IDs must be an array of at least 1 item")
    .custom((value) => {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (!isString(item)) {
            throw new Error("Assigned employees IDs must be an array of strings");
          }
        }
      }

      return true;
    }),
  check("requiresBookingApproval")
    .not()
    .isEmpty({ ignore_whitespace: true })
    .withMessage("Requires booking approval is required")
    .isBoolean()
    .withMessage("Requires booking approval must be a boolean")
    .toBoolean(),
  handleValidationErrors,
];
