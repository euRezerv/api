import { CreateCompanyResourceRequestType } from "@toolbox/request/types/companies/resources";
import { RequestWithPathAndBody } from "@toolbox/request/types/types";
import { CreateCompanyResourceResponseType } from "@toolbox/response/types/companies/resources";
import { Response } from "express";
import { standardResponse } from "@utils/responses";
import { normalizeError } from "@toolbox/common/errors";
import log from "@utils/logger";
import { Company, CompanyEmployee, DayOfWeek, Resource, ResourceAvailability, ResourceEmployee } from "@prisma/client";
import CompanyService from "src/services/company.service";
import CompanyEmployeeService from "src/services/companyEmployee.service";
import { employeeAccess } from "src/validators/companies/employeeAccess";
import CompanyResourceService from "src/services/companyResource.service";
import { asyncFilter, filterDuplicates } from "@toolbox/common/arrays";
import ResoruceEmployeeService from "src/services/resourceEmployee.service";

export const createCompanyResource = async (
  req: RequestWithPathAndBody<CreateCompanyResourceRequestType["path"], CreateCompanyResourceRequestType["body"]>,
  res: Response<CreateCompanyResourceResponseType>
) => {
  try {
    const userId = req?.user?.id;
    const { companyId } = req.params;
    const { name, description, availabilityTime, category, assignedEmployeesIds, requiresBookingApproval } = req.body;
    const totalAssignedEmployeesIds = filterDuplicates(assignedEmployeesIds);

    if (!userId) {
      res.status(500).json(standardResponse({ isSuccess: false, res, message: "No user id found" }));
      return;
    }

    let company: Company | null;
    try {
      company = await CompanyService.getCompanyById(companyId);
    } catch (error: any) {
      log.error(error, req);
      res
        .status(500)
        .json(
          standardResponse({ isSuccess: false, res, message: "Failed to fetch company", errors: normalizeError(error) })
        );
      return;
    }
    if (!company) {
      res.status(404).json(standardResponse({ isSuccess: false, res, message: "Company not found" }));
      return;
    }

    let employee: CompanyEmployee | null;
    try {
      employee = await CompanyEmployeeService.getCompanyEmployee(companyId, userId);
    } catch (error: any) {
      log.error(error, req);
      res
        .status(500)
        .json(
          standardResponse({ isSuccess: false, res, message: "Failed to fetch employee", errors: normalizeError(error) })
        );
      return;
    }
    if (!employee) {
      res.status(403).json(standardResponse({ isSuccess: false, res, message: "User must be an employee of the company" }));
      return;
    } else if (!employeeAccess(employee.role).canCreateResource) {
      res
        .status(403)
        .json(standardResponse({ isSuccess: false, res, message: "You are not authorized to create a resource" }));
      return;
    }

    const validAssignedEmployeesIds = await asyncFilter(totalAssignedEmployeesIds, async (employeeId) => {
      const employee = await CompanyEmployeeService.getCompanyEmployeeById(employeeId);

      return !!employee && employee.companyId === companyId;
    });
    if (validAssignedEmployeesIds.length === 0) {
      res.status(400).json(
        standardResponse({
          isSuccess: false,
          res,
          message: "Validation error",
          errors: [
            {
              message: "No valid employees found",
              field: "assignedEmployeesIds",
            },
          ],
        })
      );
      return;
    }

    let resource: Resource & { availabilityTime: ResourceAvailability[] };
    const availabilityTimeNormalized = availabilityTime.map((time) => ({
      ...time,
      dayOfWeek: time.dayOfWeek.toUpperCase() as DayOfWeek,
    }));
    try {
      resource = await CompanyResourceService.createResource({
        companyId: company.id,
        data: {
          name: name,
          description: description,
          availabilityTime: availabilityTimeNormalized,
          category: category,
          requiresBookingApproval: requiresBookingApproval,
        },
      });
    } catch (error: any) {
      log.error(error, req);
      res
        .status(500)
        .json(
          standardResponse({ isSuccess: false, res, message: "Failed to create resource", errors: normalizeError(error) })
        );
      return;
    }

    let resourceEmployees: ResourceEmployee[] = [];
    try {
      resourceEmployees = await Promise.all(
        validAssignedEmployeesIds.map((employeeId) =>
          ResoruceEmployeeService.addEmployeeToResource({
            resourceId: resource.id,
            employeeId,
          })
        )
      );
    } catch (error: any) {
      log.error(error, req);
    }

    const failedResourceEmployeeAssignments = totalAssignedEmployeesIds
      .filter((employeeId) => !validAssignedEmployeesIds.includes(employeeId))
      .map((employeeId) => ({
        employeeId,
      }));
    res.status(201).json(
      standardResponse({
        isSuccess: true,
        res,
        data: {
          resource: {
            id: resource.id,
            name: resource.name,
            description: resource.description,
            availabilityTime: resource.availabilityTime.map((time) => ({
              dayOfWeek: time.dayOfWeek,
              startTime: time.startTime,
              endTime: time.endTime,
            })),
            category: resource.category,
            requiresBookingApproval: resource.requiresBookingApproval,
            assignedEmployees: resourceEmployees
              ? resourceEmployees.map((resourceEmployee) => ({
                  employeeId: resourceEmployee.employeeId,
                }))
              : [],
          },
          ...(failedResourceEmployeeAssignments.length && { failedResourceEmployeeAssignments }),
        },
      })
    );
  } catch (error: any) {
    log.error(error, req);
    res
      .status(500)
      .json(
        standardResponse({ isSuccess: false, res, message: "Failed to create resource", errors: normalizeError(error) })
      );
  }
};
