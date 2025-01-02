import Prisma from "@prisma/client";

export type CompleteUser = Prisma.User & {
  localProfile: Prisma.LocalProfile | null;
  googleProfile: Prisma.GoogleProfile | null;
};

declare global {
  namespace Express {
    interface User extends Prisma.User {}

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
