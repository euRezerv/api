import { CompanyEmployeeRole, InvitationStatus, Prisma } from "@prisma/client";
import { normalizeError } from "@toolbox/common/errors";
import log from "@utils/logger";
import prisma from "@utils/prisma";

type GetCompanyEmployeeInvitationProps = {
  senderId: string;
  invitedUserId: string;
  role?: CompanyEmployeeRole[];
  status?: InvitationStatus[];
};
type UpdateCompanyEmployeeInvitationProps = { invitationId: string; data: Prisma.CompanyEmployeeInvitationUpdateInput };
type CreateCompanyEmployeeInvitationProps = {
  senderId: string;
  invitedUserId: string;
  role: CompanyEmployeeRole;
  expiresInMillis: number;
};
type AddEmployeeToCompanyProps = { companyId: string; userId: string; role: CompanyEmployeeRole };

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

  static async getCompanyEmployeeInvitationById(invitationId: string) {
    try {
      return await prisma.companyEmployeeInvitation.findUnique({
        where: {
          id: invitationId,
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

  static async updateCompanyEmployeeInvitation({ invitationId, data }: UpdateCompanyEmployeeInvitationProps) {
    try {
      const invitation = await prisma.companyEmployeeInvitation.update({
        where: { id: invitationId },
        data,
      });

      return invitation;
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }

  static async addEmployeeToCompany({ companyId, userId, role }: AddEmployeeToCompanyProps) {
    try {
      const companyEmployee = await prisma.companyEmployee.create({
        data: {
          companyId,
          employeeId: userId,
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
