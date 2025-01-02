import session from "express-session";
import passport from "passport";
import pgSession from "connect-pg-simple";
import { pool } from "@utils/prisma";
import { Express } from "express";
import ms from "milliseconds";
import log from "@utils/logger";

export default (app: Express) => {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    log.error("SESSION_SECRET is not defined in environment variables");
    throw new Error("SESSION_SECRET is not defined in environment variables");
  }

  app.use(
    session({
      store: new (pgSession(session))({
        pool,
        tableName: "_user_sessions",
        createTableIfMissing: true,
        errorLog: log.error,
      }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: ms.days(2),
        sameSite: "none",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());
};
