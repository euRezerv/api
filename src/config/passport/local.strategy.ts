import argon2 from "argon2";
import { PassportStatic } from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import prisma from "@utils/prisma";
import { normalizeError } from "@toolbox/common/errors";
import { isEmailFormat } from "@utils/regex";
import { User } from "@prisma/client";
import parsePhoneNumber from "libphonenumber-js";
import log from "@utils/logger";

export const localStrategy = (passport: PassportStatic) => {
  passport.use(
    new LocalStrategy({ usernameField: "identifier", passwordField: "password" }, async (identifier, password, done) => {
      try {
        let user: User | null = null;

        if (isEmailFormat(identifier)) {
          user = await prisma.user.findUnique({ where: { email: identifier } });
        } else {
          const parsedPhoneNumber = parsePhoneNumber(identifier);
          if (parsedPhoneNumber) {
            // For when the phone number is in international format
            if (parsedPhoneNumber.country) {
              user = await prisma.user.findUnique({
                where: {
                  phoneNumberCountryISO_phoneNumber: {
                    phoneNumberCountryISO: parsedPhoneNumber.country,
                    phoneNumber: parsedPhoneNumber.nationalNumber,
                  },
                },
              });
            }
          } else {
            // For when the phone number is in national format
            // ToDo: Add support for other countries
            const parsedRoPhoneNumber = parsePhoneNumber(identifier, "RO");
            if (parsedRoPhoneNumber) {
              user = await prisma.user.findUnique({
                where: {
                  phoneNumberCountryISO_phoneNumber: {
                    phoneNumberCountryISO: parsedRoPhoneNumber.country || "RO",
                    phoneNumber: parsedRoPhoneNumber.nationalNumber,
                  },
                },
              });
            }
          }
        }
        if (!user) {
          return done(null, false, { message: "Invalid credentials" });
        }

        const isValid = await argon2.verify(user.password, password);
        if (!isValid) {
          return done(null, false, { message: "Invalid credentials" });
        }

        return done(null, user);
      } catch (err) {
        log.error(err);
        return done(normalizeError(err));
      }
    })
  );
};
