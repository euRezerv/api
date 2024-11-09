import { PassportStatic } from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import prisma from "@utils/prisma";
import { validatePassword } from "@services/auth/auth.service";
import { normalizeError } from "@utils/errors";
import { EMAIL_REGEX } from "@utils/regex";
import { User } from "@prisma/client";
import parsePhoneNumber, { isValidNumber } from "libphonenumber-js";

export const localStrategy = (passport: PassportStatic) => {
  passport.use(
    new LocalStrategy({ usernameField: "identifier", passwordField: "password" }, async (identifier, password, done) => {
      try {
        let user: User | null = null;

        const identifierIsEmail = new RegExp(EMAIL_REGEX).test(identifier);
        if (identifierIsEmail) {
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
          return done(null, false, { message: "User not found." });
        }

        const isValid = await validatePassword(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid password." });
        }

        return done(null, user);
      } catch (err) {
        return done(normalizeError(err));
      }
    })
  );
};
