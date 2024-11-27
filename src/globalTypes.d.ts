import Prisma from "@prisma/client";

declare global {
  namespace Express {
    interface User extends Prisma.User {}

    interface Request {
      user?: User; // Overwrite the existing req's object User interface
      pagination?: {
        skip: number;
        take: number;
        page: number;
        pageSize: number;
      };
    }
  }
}
