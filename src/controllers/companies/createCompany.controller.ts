import { normalizeError } from "@toolbox/common/errors";
import { CreateCompanyRequestType } from "@toolbox/request/types/companies";
import { RequestWithBody } from "@toolbox/request/types/types";
import { CreateCompanyResponseType } from "@toolbox/response/types/companies";
import log from "@utils/logger";
import { standardResponse } from "@utils/responses";
import { Response } from "express";
import CompanyService from "src/services/company.service";

export const createCompany = async (
  req: RequestWithBody<CreateCompanyRequestType["body"]>,
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
