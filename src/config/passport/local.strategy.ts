import argon2 from "argon2";
import { PassportStatic } from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { normalizeError } from "@toolbox/common/errors";
import { isEmailFormat } from "@utils/regex";
import parsePhoneNumber from "libphonenumber-js";
import log from "@utils/logger";
import UserService from "src/services/user.service";
import { CompleteUser } from "src/globalTypes";

export const localStrategy = (passport: PassportStatic) => {
  passport.use(
    new LocalStrategy({ usernameField: "identifier", passwordField: "password" }, async (identifier, password, done) => {
      try {
        let user: CompleteUser | null = null;

        if (isEmailFormat(identifier)) {
          user = await UserService.getUserByEmail(identifier);
        } else {
          const parsedPhoneNumber = parsePhoneNumber(identifier);
          if (parsedPhoneNumber) {
            // For when the phone number is in international format
            if (parsedPhoneNumber.country) {
              user = await UserService.getUserByPhoneNumber(parsedPhoneNumber.nationalNumber, parsedPhoneNumber.country);
            }
          } else {
            // For when the phone number is in national format
            // ToDo: Add support for other countries
            const parsedRoPhoneNumber = parsePhoneNumber(identifier, "RO");
            if (parsedRoPhoneNumber) {
              user = await UserService.getUserByPhoneNumber(
                parsedRoPhoneNumber.nationalNumber,
                parsedRoPhoneNumber.country || "RO"
              );
            }
          }
        }
        if (!user) {
          return done(null, false, { message: "Invalid credentials" });
        }

        if (!user.localProfile?.password) {
          return done(null, false, { message: "Invalid credentials" });
        }

        const isValid = await argon2.verify(user.localProfile.password, password);
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
