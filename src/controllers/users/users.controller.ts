import { RequestWithParams } from "@toolbox/request/types/types";
import { GetUserByIdRequestType } from "@toolbox/request/types/users";
import { standardResponse } from "@utils/responses";
import { GetUserByIdResponseType } from "@toolbox/response/types/users";
import { normalizeError } from "@toolbox/common/errors";
import log from "@utils/logger";
import { Response } from "express";
import parsePhoneNumber, { isSupportedCountry } from "libphonenumber-js";
import UserService from "src/services/user.service";

export const getUserById = async (
  req: RequestWithParams<GetUserByIdRequestType>,
  res: Response<GetUserByIdResponseType>
) => {
  try {
    const { id: userId } = req.params;

    let user;
    try {
      user = await UserService.getUserById(userId);
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

    if (!user.localProfile) {
      res.status(200).json(
        standardResponse({
          isSuccess: true,
          res,
          data: {
            user: {
              id: user.id,
              isProfileComplete: false,
              createdAt: user.createdAt.toISOString(),
            },
          },
        })
      );
      return;
    }

    if (!isSupportedCountry(user.localProfile.phoneNumberCountryISO)) {
      log.error(`Phone number country is not supported: ${user.localProfile.phoneNumberCountryISO}`);
      res.status(500).json(
        standardResponse({
          isSuccess: false,
          res,
          message: "Phone number country is not supported",
        })
      );
      return;
    }

    const phoneNumber = parsePhoneNumber(user.localProfile.phoneNumber, user.localProfile.phoneNumberCountryISO)?.number;
    if (!phoneNumber) {
      log.error(`Failed to parse phone number: ${user.localProfile.phoneNumber}`);
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
            isProfileComplete: true,
            givenName: user.localProfile.givenName,
            familyName: user.localProfile.familyName,
            email: user.localProfile.email,
            isEmailVerified: user.localProfile.isEmailVerified,
            phoneNumber: phoneNumber,
            isPhoneVerified: user.localProfile.isPhoneVerified,
            isSystemAdmin: user.localProfile.isSystemAdmin,
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
