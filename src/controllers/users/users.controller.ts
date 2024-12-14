import { RequestWithParams } from "@toolbox/request/types/types";
import { GetUserByIdRequestType } from "@toolbox/request/types/users";
import { standardResponse } from "@utils/responses";
import { GetUserByIdResponseType } from "@toolbox/response/types/users";
import { normalizeError } from "@toolbox/common/errors";
import log from "@utils/logger";
import prisma from "@utils/prisma";
import { Response } from "express";
import parsePhoneNumber, { isSupportedCountry } from "libphonenumber-js";

export const getUserById = async (
  req: RequestWithParams<GetUserByIdRequestType>,
  res: Response<GetUserByIdResponseType>
) => {
  try {
    const { id: userId } = req.params;

    let user;
    try {
      user = await prisma.user.findUnique({
        where: {
          id: userId,
          deletedAt: null,
        },
      });
    } catch (error) {
      log.error(error);
      res
        .status(500)
        .json(standardResponse({ isSuccess: false, res, message: "Failed to fetch user", errors: normalizeError(error) }));
    }

    if (!user) {
      res.status(404).json(standardResponse({ isSuccess: false, res, message: "User not found" }));
      return;
    }

    if (!isSupportedCountry(user.phoneNumberCountryISO)) {
      log.error(`Phone number country is not supported: ${user.phoneNumberCountryISO}`);
      res.status(500).json(
        standardResponse({
          isSuccess: false,
          res,
          message: "Phone number country is not supported",
        })
      );
      return;
    }

    const phoneNumber = parsePhoneNumber(user.phoneNumber, user.phoneNumberCountryISO)?.number;
    if (!phoneNumber) {
      log.error(`Failed to parse phone number: ${user.phoneNumber}`);
      res.status(500).json(
        standardResponse({
          isSuccess: false,
          res,
          message: "Failed to parse phone number",
        })
      );
      return;
    }

    res.status(200).json(
      standardResponse({
        isSuccess: true,
        res,
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            phoneNumber: phoneNumber,
            isPhoneVerified: user.isPhoneVerified,
            isSystemAdmin: user.isSystemAdmin,
            createdAt: user.createdAt.toISOString(),
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
