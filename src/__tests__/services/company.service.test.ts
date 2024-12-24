import { CompanyEmployeeRole, Prisma, User } from "@prisma/client";
import prisma from "@utils/prisma";
import CompanyService from "src/services/company.service";
import { clearTestDb, createTestCompany, createTestUser, getTestCompanyData } from "../testUtils/db";
import log from "@utils/logger";

describe("CompanyService", () => {
  let owner: User;
  let employee: User;

  beforeEach(async () => {
    await clearTestDb();
    owner = await createTestUser();
    employee = await createTestUser();
  });

  describe("getCompanyById", () => {
    it("should return the company with the given id", async () => {
      // arrange
      const dbCompany = await createTestCompany(owner.id);

      // act
      const result = await CompanyService.getCompanyById(dbCompany.id);

      // assert
      expect(result).toEqual(dbCompany);
    });

    it("should return null if the company does not exist", async () => {
      // act
      const result = await CompanyService.getCompanyById("non-existing-id");

      // assert
      expect(result).toBeNull();
    });

    it("should return null if the company was deleted", async () => {
      // arrange
      const dbCompany = await createTestCompany(owner.id, { deletedAt: new Date() });

      // act
      const result = await CompanyService.getCompanyById(dbCompany.id);

      // assert
      expect(result).toBeNull();
    });
  });

  describe("getAllCompanies", () => {
    it("should return all companies that are not deleted", async () => {
      // arrange
      const dbCompaniesGood = [];
      for (let i = 0; i < 4; i++) {
        dbCompaniesGood.push(await createTestCompany(owner.id));
      }
      await createTestCompany(owner.id, { deletedAt: new Date() });

      // act
      const result = await CompanyService.getAllCompanies({});

      // assert
      expect(result).toEqual(dbCompaniesGood);
    });

    it("should return all companies that are not deleted and match the filters", async () => {
      // arrange
      await createTestCompany(owner.id, { name: "Test Company1" });
      await createTestCompany(owner.id, { name: "Test Company", deletedAt: new Date() });
      await createTestCompany(owner.id, { name: "Test Company2", deletedAt: new Date() });
      const dbCompaniesGood = [
        await createTestCompany(owner.id, { name: "Test Company" }),
        await createTestCompany(owner.id, { name: "Test Company" }),
      ];

      // act
      const result = await CompanyService.getAllCompanies({ filters: { name: "Test Company" } });

      // assert
      expect(result).toEqual(dbCompaniesGood);
    });

    it("should return all companies that are not deleted and match the filters and pagination", async () => {
      // arrange
      const dbCompaniesGood = [];
      for (let i = 0; i < 2; i++) {
        dbCompaniesGood.push(await createTestCompany(owner.id));
      }
      for (let i = 0; i < 2; i++) {
        await createTestCompany(employee.id);
      }

      // act
      const result = await CompanyService.getAllCompanies({ filters: { createdById: owner.id }, skip: 1, take: 1 });

      // assert
      const expected = [dbCompaniesGood[1]];
      expect(result).toEqual(expected);
    });

    it("should return an empty array if there are no companies", async () => {
      // act
      const result = await CompanyService.getAllCompanies({});

      // assert
      expect(result).toEqual([]);
    });

    it("should return an empty array if there are no companies that match the filters", async () => {
      // arrange
      for (let i = 0; i < 5; i++) {
        await createTestCompany(employee.id, { name: "Test Company" });
      }

      // act
      const result = await CompanyService.getAllCompanies({ filters: { name: "Non-existent Company" } });

      // assert
      expect(result).toEqual([]);
    });
  });

  describe("getCompaniesCount", () => {
    it("should return the count of all companies that are not deleted", async () => {
      // arrange
      const dbCompaniesGood = [];
      for (let i = 0; i < 4; i++) {
        dbCompaniesGood.push(await createTestCompany(owner.id));
      }
      await createTestCompany(owner.id, { deletedAt: new Date() });

      // act
      const result = await CompanyService.getCompaniesCount({});

      // assert
      expect(result).toBe(dbCompaniesGood.length);
    });

    it("should return the count of all companies that are not deleted and match the filters", async () => {
      // arrange
      await createTestCompany(owner.id, { name: "Test Company1" });
      await createTestCompany(owner.id, { name: "Test Company", deletedAt: new Date() });
      await createTestCompany(owner.id, { name: "Test Company2", deletedAt: new Date() });
      const dbCompaniesGood = [
        await createTestCompany(owner.id, { name: "Test Company" }),
        await createTestCompany(owner.id, { name: "Test Company" }),
      ];

      // act
      const result = await CompanyService.getCompaniesCount({ filters: { name: "Test Company" } });

      // assert
      expect(result).toBe(dbCompaniesGood.length);
    });

    it("should return 0 if there are no companies", async () => {
      // act
      const result = await CompanyService.getCompaniesCount({});

      // assert
      expect(result).toBe(0);
    });

    it("should return 0 if there are no companies that match the filters", async () => {
      // arrange
      for (let i = 0; i < 5; i++) {
        await createTestCompany(employee.id, { name: "Test Company" });
      }

      // act
      const result = await CompanyService.getCompaniesCount({ filters: { name: "Non-existent Company" } });

      // assert
      expect(result).toBe(0);
    });
  });

  describe("createCompany", () => {
    it("should create a new company and add the owner as an employee", async () => {
      // act
      const company = getTestCompanyData();
      const result = await CompanyService.createCompany({ createdById: owner.id, data: company });
      const employees = await prisma.companyEmployee.findMany({ where: { companyId: result.id } });

      // assert
      const expected = { ...company, createdById: owner.id, id: result.id };
      expect(result).toEqual(expected);
      expect(employees).toHaveLength(1);
      expect(employees[0].employeeId).toBe(owner.id);
      expect(employees[0].role).toBe(CompanyEmployeeRole.OWNER);
    });
  });

  describe("updateCompany", () => {
    it("should update the company with the given id", async () => {
      // arrange
      const dbCompany = await createTestCompany(employee.id, { name: "Test Company" });

      // act
      const result = await CompanyService.updateCompany({ companyId: dbCompany.id, data: { name: "Updated Test Company" } });

      // assert
      const expected = { ...dbCompany, name: "Updated Test Company" };
      expect(result).toEqual(expected);
    });

    it("should throw an error if the company does not exist", async () => {
      const silenceLogs = jest.spyOn(log, "error").mockImplementation();

      // act
      const promise = CompanyService.updateCompany({
        companyId: "non-existent-id",
        data: { name: "Updated Test Company" },
      });

      // assert
      await expect(promise).rejects.toThrow();

      silenceLogs.mockRestore();
    });

    it("should throw an error if the company was deleted", async () => {
      const silenceLogs = jest.spyOn(log, "error").mockImplementation();

      // arrange
      const dbCompany = await createTestCompany(employee.id, { name: "Test Company", deletedAt: new Date() });

      // act
      const promise = CompanyService.updateCompany({ companyId: dbCompany.id, data: { name: "Updated Test Company" } });

      // assert
      await expect(promise).rejects.toThrow();

      silenceLogs.mockRestore();
    });
  });

  describe("addEmployeeToCompany", () => {
    it("should add an employee to the company", async () => {
      // arrange
      // Not using CompanyService.createCompany to avoid adding the owner as an employee
      const dbCompany = await createTestCompany(owner.id);

      // act
      await CompanyService.addEmployeeToCompany({
        companyId: dbCompany.id,
        employeeId: employee.id,
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
