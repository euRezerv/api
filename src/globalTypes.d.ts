import Prisma from "@prisma/client";

declare global {
  // Overwrite the existing req's User interface
  namespace Express {
    interface User extends Prisma.User {}

    interface Request {
      user?: User;
    }
  }
}
