import prisma from "@utils/prisma";
import { PassportStatic } from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import UserService from "src/services/user.service";

export const googleStrategy = (passport: PassportStatic) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const APP_URL = process.env.URL;
  const PORT = process.env.PORT;
  const CALLBACK_URL = `${APP_URL}:${PORT}/v1/users/auth/google/callback`;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !APP_URL || !PORT) {
    throw new Error("Google client ID, Google client secret, app URL or PORT is missing");
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { id: googleId } = profile;

          let user = await UserService.getUserByGoogleId(googleId, true);

          if (!user) {
            user = await UserService.createUser({
              googleProfileData: {
                googleId,
                accessToken,
                refreshToken,
                responseJson: JSON.stringify(profile._json),
              },
            });
          }

          if (user?.deletedAt) {
            return done(null, false, { message: "This account has been deleted" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};
