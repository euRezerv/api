import Prisma from "@prisma/client";

export type CompleteUser = Prisma.User & {
  localProfile: Prisma.LocalProfile | null;
  googleProfile: Prisma.GoogleProfile | null;
};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // # Server
      NODE_ENV: "test" | "development" | "production";
      PORT: string;
      URL: string;

      // # Database
      DATABASE_USER: string;
      DATABASE_PASSWORD: string;
      DATABASE_HOST: string;
      DATABASE_PORT: string;
      DATABASE_NAME: string;
      CONNECTION_STRING: string;

      // # Auth
      SESSION_SECRET: string;

      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;

      // # Web
      WEB_URL: string;
    }
  }

  namespace Express {
    interface User extends CompleteUser {} // Overwrite the Express.User interface

    interface Request {
      user?: CompleteUser; // Overwrite the existing req's object User interface
      pagination?: {
        skip: number;
        take: number;
        page: number;
        pageSize: number;
      };
    }
  }
}
