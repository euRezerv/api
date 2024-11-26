import passport from "passport";
import { localStrategy } from "./local.strategy";
import prisma from "@utils/prisma";
import log from "@utils/logger";

export default () => {
  localStrategy(passport);

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (err) {
      log.error(err);
      done(err);
    }
  });
};
