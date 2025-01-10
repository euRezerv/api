import { normalizeError } from "@toolbox/common/errors";
import { GetCompaniesRequestType } from "@toolbox/request/types/companies";
import { RequestWithQuery } from "@toolbox/request/types/types";
import { GetCompaniesResponseType } from "@toolbox/response/types/companies";
import log from "@utils/logger";
import { getPaginationResponse, standardResponse } from "@utils/responses";
import { Response } from "express";
import CompanyService from "src/services/company.service";

export const getCompanies = async (
  req: RequestWithQuery<GetCompaniesRequestType["query"]>,
  res: Response<GetCompaniesResponseType>
) => {
  try {
    const { employeeId, employeeRole } = req.query;
    const { skip, take, page, pageSize } = req.pagination!;

    const constraints = {
      ...((employeeId || employeeRole) && {
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
