import { NextFunction, Response } from "express";
import { User } from "@prisma/client";
import { LoginResponseType, RegisterResponseType } from "@common/response/types/userAuth";
import { LoginRequestType, RegisterRequestType } from "@common/request/types/userAuth";
import { RequestWithBody } from "@common/request/types/types";
import passport from "passport";
import { standardResponse } from "@common/response/responses";
import log from "@utils/logger";
import { normalizeError } from "@utils/errors";
import prisma from "@utils/prisma";
import { isSupportedCountry, parsePhoneNumberWithError } from "libphonenumber-js";
import argon2 from "argon2";

export const loginUser = (req: RequestWithBody<LoginRequestType>, res: Response<LoginResponseType>, next: NextFunction) => {
  passport.authenticate(
    "local",
    { session: true },
    (err: Error | null, user: User | false, info: { message: string } | undefined) => {
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

        return res.json(
          standardResponse({
            isSuccess: true,
            res,
            message: "Logged in successfully",
            data: {
              user: {
                id: user.id,
                email: user.email,
                phoneNumber: user.phoneNumber,
                firstName: user.firstName,
                lastName: user.lastName,
              },
            },
          })
        );
      });
    }
  )(req, res, next);
};

export const registerUser = async (req: RequestWithBody<RegisterRequestType>, res: Response<RegisterResponseType>) => {
  const { email, password, phoneNumber, phoneNumberCountryISO, firstName, lastName } = req.body;

  try {
    const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
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
    const existingUserByPhoneNumber = await prisma.user.findUnique({
      where: {
        phoneNumberCountryISO_phoneNumber: {
          phoneNumberCountryISO,
          phoneNumber: parsedPhoneNumber.nationalNumber,
        },
      },
    });
    if (existingUserByPhoneNumber) {
      res
        .status(409)
        .json(standardResponse({ isSuccess: false, res, message: "An account with these details already exists" }));
      return;
    }

    const hashedPassword = await argon2.hash(password);
    const newUser = await prisma.user
      .create({
        data: {
          email: email,
          password: hashedPassword,
          phoneNumber: parsedPhoneNumber.nationalNumber,
          phoneNumberCountryISO: phoneNumberCountryISO,
          firstName: firstName,
          lastName: lastName,
        },
      })
      .catch((error) => {
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
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
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
