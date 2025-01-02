import passport from "passport";
import { localStrategy } from "./local.strategy";
import { googleStrategy } from "./google.strategy";
import prisma from "@utils/prisma";
import log from "@utils/logger";
import UserService from "src/services/user.service";

export default () => {
  localStrategy(passport);
  googleStrategy(passport);

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await UserService.getUserById(id);
      done(null, user);
    } catch (err) {
      log.error(err);
      done(err);
    }
  });
};
