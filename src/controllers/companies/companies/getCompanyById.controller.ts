import { normalizeError } from "@toolbox/common/errors";
import { GetCompanyByIdRequestType } from "@toolbox/request/types/companies/companies";
import { RequestWithPath } from "@toolbox/request/types/types";
import { GetCompanyByIdResponseType } from "@toolbox/response/types/companies/companies";
import log from "@utils/logger";
import { standardResponse } from "@utils/responses";
import { Response } from "express";
import CompanyService from "src/services/company.service";

export const getCompanyById = async (
  req: RequestWithPath<GetCompanyByIdRequestType["path"]>,
  res: Response<GetCompanyByIdResponseType>
) => {
  try {
    const { companyId } = req.params;

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
