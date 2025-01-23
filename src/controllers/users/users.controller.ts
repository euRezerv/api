import { RequestWithBodyAndQuery, RequestWithPath, RequestWithQuery } from "@toolbox/request/types/types";
import { CreateOrReplaceUserLocalProfileRequestType, GetUserByIdRequestType } from "@toolbox/request/types/users";
import { standardResponse } from "@utils/responses";
import {
  CreateOrReplaceUserLocalProfileResponseType,
  GetCurrentUserResponseType,
  GetUserByIdResponseType,
} from "@toolbox/response/types/users";
import { normalizeError } from "@toolbox/common/errors";
import log from "@utils/logger";
import { Request, Response } from "express";
import UserService from "src/services/user.service";
import { CompleteUser } from "src/globalTypes";
import { isSupportedCountry, parsePhoneNumberWithError } from "libphonenumber-js";

export const getCurrentUser = async (req: Request, res: Response<GetCurrentUserResponseType>) => {
  if (!req.user) {
    res.status(500).json(standardResponse({ isSuccess: false, res, message: "Failed to fetch user" }));
    return;
  }

  let user: CompleteUser | null = null;
  try {
    user = await UserService.getUserById(req.user.id);
  } catch (error: any) {
    log.error(error, req);
    res
      .status(500)
      .json(standardResponse({ isSuccess: false, res, message: "Failed to fetch user", errors: normalizeError(error) }));
  }

  if (!user) {
    res.status(404).json(standardResponse({ isSuccess: false, res, message: "User not found" }));
    return;
  }

  res.status(200).json(
    standardResponse({
      isSuccess: true,
      res,
      data: {
        user: {
          id: user.id,
          isProfileComplete: !!user.localProfile,
          ...(user.localProfile && {
            givenName: user.localProfile.givenName,
            familyName: user.localProfile.familyName,
            email: user.localProfile.email,
            isEmailVerified: user.localProfile.isEmailVerified,
            phoneNumber: user.localProfile.phoneNumberFormatted,
            isPhoneVerified: user.localProfile.isPhoneVerified,
            isSystemAdmin: user.localProfile.isSystemAdmin,
          }),
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      },
    })
  );
};

export const getUserById = async (
  req: RequestWithPath<GetUserByIdRequestType["path"]>,
  res: Response<GetUserByIdResponseType>
) => {
  try {
    const { id: userId } = req.params;

    let user;
    try {
      user = await UserService.getUserById(userId);
    } catch (error: any) {
      log.error(error, req);
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
            phoneNumber: user.localProfile.phoneNumberFormatted,
            isPhoneVerified: user.localProfile.isPhoneVerified,
            isSystemAdmin: user.localProfile.isSystemAdmin,
            createdAt: user.createdAt.toISOString(),
          },
        },
      })
    );
  } catch (error: any) {
    log.error(error, req);
    res
      .status(500)
      .json(standardResponse({ isSuccess: false, res, message: "Something went wrong", errors: normalizeError(error) }));
  }
};

export const createOrReplaceUserLocalProfile = async (
  req: RequestWithBodyAndQuery<
    CreateOrReplaceUserLocalProfileRequestType["body"],
    CreateOrReplaceUserLocalProfileRequestType["query"]
  >,
  res: Response<CreateOrReplaceUserLocalProfileResponseType>
) => {
  const { givenName, familyName, email, phoneNumberCountryISO, phoneNumber } = req.body;
  const { userId } = req.query;
  const userIdToCreateOrReplace = userId || req.user?.id;

  try {
    if (!userIdToCreateOrReplace) {
      log.error("Could not find user ID", req);
      res.status(400).json(standardResponse({ isSuccess: false, res, message: "Could not find user ID" }));
      return;
    }

    let userToCreateOrReplace: CompleteUser | null = null;
    try {
      userToCreateOrReplace = await UserService.getUserById(userIdToCreateOrReplace);
    } catch (error: any) {
      log.error(error, req);
      res
        .status(500)
        .json(standardResponse({ isSuccess: false, res, message: "Failed to fetch user", errors: normalizeError(error) }));
    }

    if (!userToCreateOrReplace) {
      res.status(404).json(standardResponse({ isSuccess: false, res, message: "User not found" }));
      return;
    }

    const existingUserByEmail = await UserService.getUserByEmail(email, true);
    if (existingUserByEmail && existingUserByEmail.id !== userIdToCreateOrReplace) {
      res.status(409).json(standardResponse({ isSuccess: false, res, message: "Credentials already exist" }));
      return;
    }

    if (!isSupportedCountry(phoneNumberCountryISO)) {
      throw new Error("Phone number prefix is invalid");
    }

    const phoneNumberFormatted = parsePhoneNumberWithError(phoneNumber, phoneNumberCountryISO);
    if (phoneNumberFormatted.country !== phoneNumberCountryISO) {
      res.status(400).json(
        standardResponse({
          isSuccess: false,
          res,
          message: "Validation error",
          errors: [
            {
              message: "Phone number does not match the country code",
              field: "phoneNumber",
              fieldType: "body",
              value: phoneNumber,
            },
          ],
        })
      );
      return;
    }

    const existingUserByPhoneNumber = await UserService.getUserByPhoneNumber(
      phoneNumberFormatted.nationalNumber,
      phoneNumberCountryISO,
      true
    );
    if (existingUserByPhoneNumber && existingUserByPhoneNumber.id !== userIdToCreateOrReplace) {
      res.status(409).json(standardResponse({ isSuccess: false, res, message: "Credentials already exist" }));
      return;
    }

    try {
      const modifiedUser = await UserService.createOrUpdateUserById(userIdToCreateOrReplace, {
        localProfileData: {
          givenName: givenName,
          familyName: familyName,
          email: email,
          phoneNumberCountryISO: phoneNumberCountryISO,
          phoneNumber: phoneNumberFormatted.nationalNumber,
          phoneNumberFormatted: phoneNumberFormatted.number,
        },
      });

      res.status(200).json(
        standardResponse({
          isSuccess: true,
          res,
          message: "User profile updated successfully",
          data: {
            localProfile: {
              modifiedUserId: modifiedUser.id,
              givenName: modifiedUser.localProfile!.givenName,
              familyName: modifiedUser.localProfile!.familyName,
              email: modifiedUser.localProfile!.email,
              phoneNumber: modifiedUser.localProfile!.phoneNumberFormatted,
            },
          },
        })
      );
    } catch (error: any) {
      log.error(error, req);
      res
        .status(500)
        .json(standardResponse({ isSuccess: false, res, message: "Failed to update user", errors: normalizeError(error) }));
    }
  } catch (error: any) {
    log.error(error, req);
    res
      .status(500)
      .json(standardResponse({ isSuccess: false, res, message: "Something went wrong", errors: normalizeError(error) }));
  }
};
