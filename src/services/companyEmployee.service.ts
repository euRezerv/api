import { CompanyEmployeeRole, InvitationStatus } from "@prisma/client";
import { normalizeError } from "@toolbox/common/errors";
import log from "@utils/logger";
import prisma from "@utils/prisma";

type GetCompanyEmployeeInvitationProps = {
  senderId: string;
  invitedUserId: string;
  role?: CompanyEmployeeRole[];
  status?: InvitationStatus[];
};
type CreateCompanyEmployeeInvitationProps = {
  senderId: string;
  invitedUserId: string;
  role: CompanyEmployeeRole;
  expiresInMillis: number;
};
type AddEmployeeToCompanyProps = { companyId: string; employeeId: string; role: CompanyEmployeeRole };

export default class CompanyEmployeeService {
  static async getCompanyEmployee(companyId: string, userId: string) {
    try {
      return await prisma.companyEmployee.findUnique({
        where: {
          companyId_employeeId: {
            companyId,
            employeeId: userId,
          },
        },
      });
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }

  static async getCompanyEmployeeInvitation({ senderId, invitedUserId, role, status }: GetCompanyEmployeeInvitationProps) {
    try {
      return await prisma.companyEmployeeInvitation.findFirst({
        where: {
          senderId,
          invitedUserId,
          role: role && { in: role },
          status: status && { in: status },
        },
      });
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }

  static async createCompanyEmployeeInvitation({
    senderId,
    invitedUserId,
    role,
    expiresInMillis,
  }: CreateCompanyEmployeeInvitationProps) {
    try {
      const invitation = await prisma.companyEmployeeInvitation.create({
        data: {
          senderId,
          invitedUserId,
          role,
          expiresAt: new Date(Date.now() + expiresInMillis),
        },
      });

      return invitation;
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }

  static async addEmployeeToCompany({ companyId, employeeId, role }: AddEmployeeToCompanyProps) {
    try {
      const companyEmployee = await prisma.companyEmployee.create({
        data: {
          companyId,
          employeeId,
          role,
        },
      });

      return companyEmployee;
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }
}
