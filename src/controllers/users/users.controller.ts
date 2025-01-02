import { RequestWithParams } from "@toolbox/request/types/types";
import { GetUserByIdRequestType } from "@toolbox/request/types/users";
import { standardResponse } from "@utils/responses";
import { GetAuthUserResponseType, GetUserByIdResponseType } from "@toolbox/response/types/users";
import { normalizeError } from "@toolbox/common/errors";
import log from "@utils/logger";
import { Request, Response } from "express";
import UserService from "src/services/user.service";
import { CompleteUser } from "src/globalTypes";

export const getAuthUser = async (req: Request, res: Response<GetAuthUserResponseType>) => {
  if (!req.user) {
    res.status(500).json(standardResponse({ isSuccess: false, res, message: "Failed to fetch user" }));
    return;
  }

  let user: CompleteUser | null = null;
  try {
    user = await UserService.getUserById(req.user.id);
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
  } catch (error) {
    log.error(error);
    res
      .status(500)
      .json(standardResponse({ isSuccess: false, res, message: "Something went wrong", errors: normalizeError(error) }));
  }
};
