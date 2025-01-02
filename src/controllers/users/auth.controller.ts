import { NextFunction, Request, Response } from "express";
import { User } from "@prisma/client";
import { LoginResponseType, RegisterResponseType } from "@toolbox/response/types/userAuth";
import { LoginRequestType, RegisterRequestType } from "@toolbox/request/types/userAuth";
import { RequestWithBody } from "@toolbox/request/types/types";
import passport from "passport";
import { standardResponse } from "@utils/responses";
import log from "@utils/logger";
import { normalizeError } from "@toolbox/common/errors";
import { isSupportedCountry, parsePhoneNumberWithError } from "libphonenumber-js";
import argon2 from "argon2";
import UserService from "src/services/user.service";
import { CompleteUser } from "src/globalTypes";

export const loginUser = (req: RequestWithBody<LoginRequestType>, res: Response<LoginResponseType>, next: NextFunction) => {
  passport.authenticate(
    "local",
    { session: true },
    (err: Error | null, user: CompleteUser | false, info: { message: string } | undefined) => {
      if (err) {
        return res
          .status(500)
          .json(standardResponse({ isSuccess: false, res, message: "Something went wrong", errors: err }));
      }

      if (!user) {
        return res
          .status(401)
          .json(standardResponse({ isSuccess: false, res, message: "Failed to login", errors: info?.message }));
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res
            .status(500)
            .json(standardResponse({ isSuccess: false, res, message: "Something went wrong", errors: loginErr }));
        }

        return res.status(200).json(
          standardResponse({
            isSuccess: true,
            res,
            message: "Logged in successfully",
            data: {
              user: {
                id: user.id,
                isProfileComplete: !!user.localProfile,
                ...(user.localProfile && {
                  email: user.localProfile.email,
                  phoneNumber: user.localProfile.phoneNumber,
                  givenName: user.localProfile.givenName,
                  familyName: user.localProfile.familyName,
                }),
                createdAt: user.createdAt.toISOString(),
              },
            },
          })
        );
      });
    }
  )(req, res, next);
};

export const logoutUser = (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(400).json(standardResponse({ isSuccess: false, res, message: "User is not logged in" }));
    return;
  }

  req.logout((err) => {
    if (err) {
      log.error(err);
      return res
        .status(500)
        .json(standardResponse({ isSuccess: false, res, message: "Failed to logout", errors: normalizeError(err) }));
    }
  });

  res.json(standardResponse({ isSuccess: true, res, message: "Logged out successfully" }));
};

export const registerUser = async (req: RequestWithBody<RegisterRequestType>, res: Response<RegisterResponseType>) => {
  const { email, password, phoneNumber, phoneNumberCountryISO, givenName, familyName } = req.body;

  try {
    const existingUserByEmail = await UserService.getUserByEmail(email, true);
    if (existingUserByEmail) {
      res
        .status(409)
        .json(standardResponse({ isSuccess: false, res, message: "An account with these details already exists" }));
      return;
    }

    if (!isSupportedCountry(phoneNumberCountryISO)) {
      throw new Error("Phone number prefix is invalid");
    }

    const parsedPhoneNumber = parsePhoneNumberWithError(phoneNumber, phoneNumberCountryISO);
    const existingUserByPhoneNumber = await UserService.getUserByPhoneNumber(
      parsedPhoneNumber.nationalNumber,
      phoneNumberCountryISO,
      true
    );
    if (existingUserByPhoneNumber) {
      res
        .status(409)
        .json(standardResponse({ isSuccess: false, res, message: "An account with these details already exists" }));
      return;
    }

    const hashedPassword = await argon2.hash(password);
    const newUser = await UserService.createUser({
      localProfileData: {
        givenName: givenName,
        familyName: familyName,
        email: email,
        phoneNumberCountryISO: phoneNumberCountryISO,
        phoneNumber: parsedPhoneNumber.nationalNumber,
        password: hashedPassword,
      },
    }).catch((error) => {
      log.error(error);
      throw new Error("Failed to create user");
    });

    res.status(201).json(
      standardResponse({
        isSuccess: true,
        res,
        message: "User registered successfully",
        data: {
          user: {
            id: newUser.id,
            givenName: newUser.localProfile!.givenName,
            familyName: newUser.localProfile!.familyName,
            email: newUser.localProfile!.email,
            phoneNumber: parsedPhoneNumber.number,
            createdAt: newUser.createdAt.toISOString(),
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

export const googleLoginUser = passport.authenticate("google", { scope: ["profile", "email"], session: true });

export const googleLoginUserCallback = passport.authenticate("google", { failureRedirect: "/" });
