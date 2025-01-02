import { Prisma } from "@prisma/client";
import { normalizeError } from "@toolbox/common/errors";
import log from "@utils/logger";
import prisma from "@utils/prisma";

type CreateUserProps = {
  userData?: Omit<Prisma.UserCreateInput, "localProfile" | "googleProfile">;
  localProfileData?: Omit<Prisma.LocalProfileCreateInput, "user">;
  googleProfileData?: Omit<Prisma.GoogleProfileCreateInput, "user">;
};

export default class UserService {
  static async getUserById(userId: string, includeDeleted = false) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId, deletedAt: includeDeleted ? undefined : null },
        include: { localProfile: true, googleProfile: true },
      });
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }

  static async getUserByEmail(email: string, includeDeleted = false) {
    try {
      return await prisma.user.findFirst({
        where: {
          localProfile: {
            email,
          },
          deletedAt: includeDeleted ? undefined : null,
        },
        include: { googleProfile: true, localProfile: true },
      });
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }

  static async getUserByPhoneNumber(phoneNumber: string, phoneNumberCountryISO: string, includeDeleted = false) {
    try {
      return await prisma.user.findFirst({
        where: {
          localProfile: {
            phoneNumberCountryISO,
            phoneNumber,
          },
          deletedAt: includeDeleted ? undefined : null,
        },
        include: { googleProfile: true, localProfile: true },
      });
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }

  static async getUserByGoogleId(googleId: string, includeDeleted = false) {
    try {
      return await prisma.user.findFirst({
        where: {
          googleProfile: {
            googleId,
          },
          deletedAt: includeDeleted ? undefined : null,
        },
        include: {
          googleProfile: true,
          localProfile: true,
        },
      });
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }

  static async createUser({ userData, localProfileData, googleProfileData }: CreateUserProps) {
    try {
      return await prisma.user.create({
        data: {
          ...userData,
          localProfile: localProfileData ? { create: localProfileData } : undefined,
          googleProfile: googleProfileData ? { create: googleProfileData } : undefined,
        },
        include: { localProfile: true, googleProfile: true },
      });
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }
}
