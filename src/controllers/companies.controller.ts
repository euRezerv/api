import {
  CreateCompanyRequestType,
  GetCompaniesRequestType,
  GetCompanyByIdRequestType,
} from "@toolbox/request/types/companies";
import { RequestWithBody, RequestWithParams, RequestWithQuery } from "@toolbox/request/types/types";
import { standardResponse, getPaginationResponse } from "@utils/responses";
import {
  CreateCompanyResponseType,
  GetCompaniesResponseType,
  GetCompanyByIdResponseType,
} from "@toolbox/response/types/companies";
import { CompanyEmployeeRole } from "@prisma/client";
import { normalizeError } from "@toolbox/common/errors";
import log from "@utils/logger";
import { Response } from "express";
import CompanyService from "src/services/company.service";

export const getCompanies = async (
  req: RequestWithQuery<GetCompaniesRequestType>,
  res: Response<GetCompaniesResponseType>
) => {
  try {
    const { employeeId, employeeRole } = req.query;
    const { skip, take, page, pageSize } = req.pagination!;

    const constraints = {
      ...(employeeId &&
        employeeRole && {
          employees: {
            some: {
              employeeId: employeeId,
              role: employeeRole,
            },
          },
        }),
    };

    let companies = [];
    try {
      companies = await CompanyService.getAllCompanies({ filters: constraints, skip, take });
    } catch (error) {
      log.error(error);
      res
        .status(500)
        .json(
          standardResponse({ isSuccess: false, res, message: "Failed to fetch companies", errors: normalizeError(error) })
        );
      return;
    }

    let totalCount;
    try {
      totalCount = await CompanyService.getCompaniesCount({ filters: constraints });
    } catch (error) {
      log.error(error);
      res.status(500).json(
        standardResponse({
          isSuccess: false,
          res,
          message: "Failed to fetch total company count",
          errors: normalizeError(error),
        })
      );
      return;
    }

    res.status(200).json(
      standardResponse({
        isSuccess: true,
        res,
        data: {
          companies: companies.map((company) => ({
            id: company.id,
            name: company.name,
            country: company.country,
            county: company.county,
            city: company.city,
            street: company.street,
            postalCode: company.postalCode,
            latitude: company.latitude,
            longitude: company.longitude,
            createdById: company.createdById,
            createdAt: company.createdAt.toISOString(),
          })),
          ...getPaginationResponse(page, pageSize, totalCount),
        },
      })
    );
  } catch (error) {
    log.error(error);
    res
      .status(500)
      .json(standardResponse({ isSuccess: false, res, message: "Something went wrong", errors: normalizeError(error) }));
  }
};

export const getCompanyById = async (
  req: RequestWithParams<GetCompanyByIdRequestType>,
  res: Response<GetCompanyByIdResponseType>
) => {
  try {
    const { id: companyId } = req.params;

    let company;
    try {
      company = await CompanyService.getCompanyById(companyId);
    } catch (error) {
      log.error(error);
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

    res.status(200).json(
      standardResponse({
        isSuccess: true,
        res,
        data: {
          company: {
            id: company.id,
            name: company.name,
            country: company.country,
            county: company.county,
            city: company.city,
            street: company.street,
            postalCode: company.postalCode,
            latitude: company.latitude,
            longitude: company.longitude,
            createdById: company.createdById,
            createdAt: company.createdAt.toISOString(),
          },
        },
      })
    );
  } catch (error) {
    log.error(error);
    res
      .status(500)
      .json(standardResponse({ isSuccess: false, res, message: "Something went wrong", errors: normalizeError(error) }));
  }
};

export const createCompany = async (
  req: RequestWithBody<CreateCompanyRequestType>,
  res: Response<CreateCompanyResponseType>
) => {
  try {
    const { name, country, county, city, street, postalCode, latitude, longitude } = req.body;

    if (!req?.user?.id) {
      res.status(500).json(standardResponse({ isSuccess: false, res, message: "No user id found" }));
      return;
    }

    let company;
    try {
      company = await CompanyService.createCompany({
        createdById: req.user.id,
        data: {
          name,
          country,
          county,
          city,
          street,
          postalCode,
          latitude,
          longitude,
        },
      });
    } catch (error) {
      log.error(error);
      res
        .status(500)
        .json(
          standardResponse({ isSuccess: false, res, message: "Failed to create company", errors: normalizeError(error) })
        );
      return;
    }

    res.status(201).json(
      standardResponse({
        isSuccess: true,
        res,
        data: {
          company: {
            id: company.id,
            name: company.name,
            country: company.country,
            county: company.county,
            city: company.city,
            street: company.street,
            postalCode: company.postalCode,
            latitude: company.latitude,
            longitude: company.longitude,
            createdById: company.createdById,
            createdAt: company.createdAt.toISOString(),
          },
        },
      })
    );
  } catch (error) {
    log.error(error);
    res
      .status(500)
      .json(standardResponse({ isSuccess: false, res, message: "Something went wrong", errors: normalizeError(error) }));
  }
};
