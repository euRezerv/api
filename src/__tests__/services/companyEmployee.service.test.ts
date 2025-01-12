import CompanyEmployeeService from "src/services/companyEmployee.service";
import { clearTestDb, createTestCompany, createTestUser } from "../testUtils/db";
import { CompanyEmployeeRole, User } from "@prisma/client";
import prisma from "@utils/prisma";

describe("CompanyEmployeeService", () => {
  let owner: User;
  let employee: User;

  beforeEach(async () => {
    await clearTestDb();
    owner = await createTestUser();
    employee = await createTestUser();
  });

  describe("addEmployeeToCompany", () => {
    it("should add an employee to the company", async () => {
      // arrange
      // Not using CompanyService.createCompany to avoid adding the owner as an employee
      const dbCompany = await createTestCompany(owner.id);

      // act
      await CompanyEmployeeService.addEmployeeToCompany({
        companyId: dbCompany.id,
        userId: employee.id,
        role: CompanyEmployeeRole.REGULAR,
      });
      const employees = await prisma.companyEmployee.findMany({ where: { companyId: dbCompany.id } });

      // assert
      expect(employees).toHaveLength(1);
      expect(employees[0].employeeId).toBe(employee.id);
      expect(employees[0].role).toBe(CompanyEmployeeRole.REGULAR);
    });
  });
});
