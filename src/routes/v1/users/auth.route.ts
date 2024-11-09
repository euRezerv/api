import { validateLogin, validateRegister } from "../../../validators/auth.validator";
import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import { standardResponse } from "@common/response/responses";
import prisma from "@utils/prisma";
import { normalizeError } from "@utils/errors";
import argon2 from "argon2";
import log from "@utils/logger";
import { User } from "@prisma/client";
import { AuthLoginResponseType, AuthRegisterResponseType } from "@common/response/types";
import { AuthLoginRequestType, AuthRegisterRequestType, RequestWithBody } from "@common/request/types";
import { isSupportedCountry, parsePhoneNumberWithError } from "libphonenumber-js";
import { isAuthenticated } from "@services/auth/auth.service";

const router = Router();

/**
 * @swagger
 * /v1/users/auth/test:
 *   get:
 *     summary: Test stuff
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Test successful
 *       401:
 *         description: Unauthorized
 */
router.get("/test", isAuthenticated.local, (req: Request, res: Response) => {
  console.log(req.isAuthenticated());
  res.json(standardResponse({ isSuccess: true, res, message: "Test successful." }));
});

/**
 * @swagger
 * /v1/users/auth/login:
 *   post:
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged in successfully
 *       400:
 *         description: Validation error
 *       401:
 *        description: Incorrect credentials
 *       500:
 *        description: Internal server error
 */
router.post(
  "/login",
  validateLogin,
  (req: RequestWithBody<AuthLoginRequestType>, res: Response<AuthLoginResponseType>, next: NextFunction) => {
    passport.authenticate(
      "local",
      { session: true },
      (err: Error | null, user: User | false, info: { message: string } | undefined) => {
        if (err) {
          return res
            .status(500)
            .json(standardResponse({ isSuccess: false, res, message: "Something went wrong.", errors: err }));
        }

        if (!user) {
          return res
            .status(401)
            .json(standardResponse({ isSuccess: false, res, message: "Failed to login.", errors: info?.message }));
        }

        req.logIn(user, (loginErr) => {
          if (loginErr) {
            return res
              .status(500)
              .json(standardResponse({ isSuccess: false, res, message: "Something went wrong.", errors: loginErr }));
          }

          return res.json(
            standardResponse({
              isSuccess: true,
              res,
              message: "Logged in successfully.",
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
  }
);

/**
 * @swagger
 * /v1/users/auth/register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumberCountryISO:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registered successfully
 *       400:
 *        description: Validation error
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
router.post(
  "/register",
  validateRegister,
  async (req: RequestWithBody<AuthRegisterRequestType>, res: Response<AuthRegisterResponseType>) => {
    const { email, password, phoneNumber, phoneNumberCountryISO, firstName, lastName } = req.body;

    try {
      const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
      if (existingUserByEmail) {
        res
          .status(409)
          .json(standardResponse({ isSuccess: false, res, message: "An account with these details already exists." }));
        return;
      }

      if (!isSupportedCountry(phoneNumberCountryISO)) {
        throw new Error("Phone number prefix is invalid.");
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
          .json(standardResponse({ isSuccess: false, res, message: "An account with these details already exists." }));
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
          throw new Error("Failed to create user.");
        });

      res.status(201).json(
        standardResponse({
          isSuccess: true,
          res,
          message: "User registered successfully.",
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
        .json(standardResponse({ isSuccess: false, res, message: "Something went wrong.", errors: normalizeError(error) }));
    }
  }
);

export default router;
