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
          console.log({ accessToken, refreshToken, profile });
          const { id: googleId, emails, name, photos } = profile;
          const email = emails?.[0]?.value;

          let user = await UserService.getUserByGoogleId(googleId);
          // ToDo: Add support for creating a new user if the user does not exist
          // if (!user) {
          //   user = await prisma.user.create({
          //     data: {
          //       givenName: name?.givenName || "",
          //       familyName: name?.familyName || "",
          //       email: email || "",
          //       isEmailVerified: emails?.[0]?.verified,
          //       googleProfile: {
          //         create: {
          //           googleId,
          //           accessToken,
          //           refreshToken,
          //           profileImageUrl: photos?.[0]?.value,
          //         },
          //       },
          //     },
          //   });
          // }
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};
