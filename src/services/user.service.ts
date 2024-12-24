import { normalizeError } from "@toolbox/common/errors";
import log from "@utils/logger";
import prisma from "@utils/prisma";

export default class UserService {
  static async getUserById(userId: string) {
    try {
      return await prisma.user.findUnique({ where: { id: userId, deletedAt: null } });
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }

  static async getUserByEmail(email: string) {
    try {
      return await prisma.user.findUnique({ where: { email, deletedAt: null } });
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }

  static async getUserByPhoneNumber(phoneNumber: string, phoneNumberCountryISO: string) {
    try {
      return await prisma.user.findUnique({
        where: {
          phoneNumberCountryISO_phoneNumber: {
            phoneNumberCountryISO,
            phoneNumber,
          },
        },
      });
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }
}
