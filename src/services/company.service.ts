import { CompanyEmployeeRole, Prisma } from "@prisma/client";
import { normalizeError } from "@toolbox/common/errors";
import log from "@utils/logger";
import prisma from "@utils/prisma";

type GetAllProps = { skip?: number; take?: number; filters?: Prisma.CompanyWhereInput };
type GetCompaniesCountProps = { filters?: Prisma.CompanyWhereInput };
type CreateCompanyProps = { createdById: string; data: Omit<Prisma.CompanyCreateInput, "createdBy"> };
type UpdateCompanyProps = { companyId: string; data: Prisma.CompanyUpdateInput };
type AddEmployeeToCompanyProps = { companyId: string; employeeId: string; role: CompanyEmployeeRole };

export default class CompanyService {
  static async getCompanyById(companyId: string) {
    try {
      return await prisma.company.findUnique({ where: { id: companyId, deletedAt: null } });
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }

  static async getAllCompanies({ skip, take, filters }: GetAllProps) {
    const constraints = {
      ...filters,
      deletedAt: null,
    };

    try {
      return await prisma.company.findMany({ where: constraints, skip, take });
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }

  static async getCompaniesCount({ filters }: GetCompaniesCountProps) {
    const constraints = {
      ...filters,
      deletedAt: null,
    };

    let totalCount;
    try {
      totalCount = await prisma.company.count({ where: constraints });
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }

    return totalCount;
  }

  static async createCompany({ createdById, data }: CreateCompanyProps) {
    try {
      const company = await prisma.company.create({ data: { ...data, createdBy: { connect: { id: createdById } } } });

      await this.addEmployeeToCompany({ companyId: company.id, employeeId: createdById, role: CompanyEmployeeRole.OWNER });

      return company;
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }

  static async updateCompany({ companyId, data }: UpdateCompanyProps) {
    try {
      const company = await prisma.company.update({ where: { id: companyId, deletedAt: null }, data });

      return company;
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
