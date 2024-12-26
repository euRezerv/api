import { Company, CompanyEmployeeRole } from "@prisma/client";
import {
  addTestUserToCompany,
  clearTestDb,
  createAndAuthTestUser,
  createTestCompany,
  createTestUser,
} from "src/__tests__/testUtils/db";
import createServer from "src/config/server";
import supertest from "supertest";
import TestAgent from "supertest/lib/agent";

describe("/v1/companies", () => {
  let agent: InstanceType<typeof TestAgent>;

  beforeEach(async () => {
    agent = supertest.agent(createServer());
    await clearTestDb();
  });

  describe("GET /", () => {
    const getExpectedCompanyFormat = (company: Company) => ({
      id: company.id,
      name: company.name,
      country: company.country,
      county: company.county,
      city: company.city,
      street: company.street,
      postalCode: company.postalCode,
      latitude: company.latitude,
      longitude: company.longitude,
      createdById: company.createdById,
      createdAt: company.createdAt.toISOString(),
    });

    it("should return a 200 and the (companies and pagination) response", async () => {
      // arrange
      const loggedUser = await createAndAuthTestUser(agent);
      const company = await createTestCompany(loggedUser.id);
      const pageSize = 10;

      // act
      const res = await agent.get("/v1/companies").query({ pageSize });

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.companies).toHaveLength(1);
      expect(res.body.data.companies[0]).toMatchObject(getExpectedCompanyFormat(company));
      expect(res.body.data.pagination).toMatchObject({ currentPage: 1, pageSize, totalCount: 1 });
    });

    it("should return a 200 and all the (companies and pagination) when pagination allows", async () => {
      // arrange
      const loggedUser = await createAndAuthTestUser(agent);
      const companies = [
        await createTestCompany(loggedUser.id),
        await createTestCompany(loggedUser.id),
        await createTestCompany(loggedUser.id),
        await createTestCompany(loggedUser.id),
      ];
      const pageSize = 10;

      // act
      const res = await agent.get("/v1/companies").query({ pageSize });

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.companies).toHaveLength(companies.length);
      companies.forEach((company, index) => {
        expect(res.body.data.companies[index]).toMatchObject(getExpectedCompanyFormat(company));
      });
      expect(res.body.data.pagination).toMatchObject({ currentPage: 1, pageSize, totalCount: companies.length });
    });

    it("should return a 200 and the (companies and pagination) specified by pageSize", async () => {
      // arrange
      const loggedUser = await createAndAuthTestUser(agent);
      const companies = [
        await createTestCompany(loggedUser.id),
        await createTestCompany(loggedUser.id),
        await createTestCompany(loggedUser.id),
        await createTestCompany(loggedUser.id),
      ];
      const pageSize = 2;

      // act
      const res = await agent.get("/v1/companies").query({ pageSize });

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.companies).toHaveLength(pageSize);
      for (let i = 0; i < pageSize; i++) {
        expect(res.body.data.companies[i]).toMatchObject(getExpectedCompanyFormat(companies[i]));
      }
      expect(res.body.data.pagination).toMatchObject({ currentPage: 1, pageSize, totalCount: companies.length });
    });

    it("should return a 200 and the (companies and pagination) specified by pagination", async () => {
      // arrange
      const loggedUser = await createAndAuthTestUser(agent);
      const companies = [
        await createTestCompany(loggedUser.id),
        await createTestCompany(loggedUser.id),
        await createTestCompany(loggedUser.id),
        await createTestCompany(loggedUser.id),
      ];
      const pageSize = 2;
      const page = 2;

      // act
      const res = await agent.get("/v1/companies").query({ pageSize, page });

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.companies).toHaveLength(pageSize);
      for (let i = 0; i < pageSize; i++) {
        expect(res.body.data.companies[i]).toMatchObject(getExpectedCompanyFormat(companies[pageSize + i]));
      }
      expect(res.body.data.pagination).toMatchObject({ currentPage: page, pageSize, totalCount: companies.length });
    });

    it("should return a 200 and (an empty array and pagination) if no companies exist", async () => {
      // arrange
      await createAndAuthTestUser(agent);
      const pageSize = 10;

      // act
      const res = await agent.get("/v1/companies").query({ pageSize });

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.companies).toHaveLength(0);
      expect(res.body.data.pagination).toMatchObject({ currentPage: 1, pageSize, totalCount: 0 });
    });

    it("should return a 200 and return only non deleted companies (and count for pagination)", async () => {
      // arrange
      const loggedUser = await createAndAuthTestUser(agent);
      await createTestCompany(loggedUser.id, { deletedAt: new Date() });
      const existingCompany = await createTestCompany(loggedUser.id);
      const pageSize = 10;

      // act
      const res = await agent.get("/v1/companies").query({ pageSize });

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.companies).toHaveLength(1);
      expect(res.body.data.companies[0]).toMatchObject(getExpectedCompanyFormat(existingCompany));
      expect(res.body.data.pagination).toMatchObject({ currentPage: 1, pageSize, totalCount: 1 });
    });

    it("should return a 200 and (an empty array and pagination) if the page is out of bounds", async () => {
      // arrange
      const loggedUser = await createAndAuthTestUser(agent);
      await createTestCompany(loggedUser.id);
      const pageSize = 10;
      const page = 2;

      // act
      const res = await agent.get("/v1/companies").query({ pageSize, page });

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.companies).toHaveLength(0);
      expect(res.body.data.pagination).toMatchObject({ currentPage: page, pageSize, totalCount: 1 });
    });

    it("should return a 200 and the (companies and pagination) filtered by employeeId", async () => {
      // arrange
      const user1 = await createAndAuthTestUser(agent);
      const company1 = await createTestCompany(user1.id);
      await addTestUserToCompany(company1.id, user1.id, "OWNER");
      const user2 = await createTestUser();
      const company2 = await createTestCompany(user1.id);
      await addTestUserToCompany(company2.id, user2.id, "REGULAR");
      const pageSize = 10;

      // act
      const res1 = await agent.get("/v1/companies").query({ pageSize, employeeId: user1.id });
      const res2 = await agent.get("/v1/companies").query({ pageSize, employeeId: user2.id });

      // assert
      expect(res1.status).toBe(200);
      expect(res1.body.isSuccess).toBe(true);
      expect(res1.body.data.companies).toHaveLength(1);
      expect(res1.body.data.companies[0]).toMatchObject(getExpectedCompanyFormat(company1));
      expect(res1.body.data.pagination).toMatchObject({ currentPage: 1, pageSize, totalCount: 1 });

      expect(res2.status).toBe(200);
      expect(res2.body.isSuccess).toBe(true);
      expect(res2.body.data.companies).toHaveLength(1);
      expect(res2.body.data.companies[0]).toMatchObject(getExpectedCompanyFormat(company2));
      expect(res2.body.data.pagination).toMatchObject({ currentPage: 1, pageSize, totalCount: 1 });
    });

    it("should return a 200 and the (companies and pagination) filtered by employeeId and employeeRole", async () => {
      // arrange
      const user1 = await createAndAuthTestUser(agent);
      const user2 = await createAndAuthTestUser(agent);
      const company1 = await createTestCompany(user1.id);
      await addTestUserToCompany(company1.id, user1.id, CompanyEmployeeRole.OWNER);
      const company2 = await createTestCompany(user1.id);
      await addTestUserToCompany(company2.id, user1.id, CompanyEmployeeRole.MANAGER);
      const company3 = await createTestCompany(user1.id);
      await addTestUserToCompany(company3.id, user1.id, CompanyEmployeeRole.MANAGER);
      const pageSize = 10;

      // act
      const res1 = await agent
        .get("/v1/companies")
        .query({ pageSize, employeeId: user1.id, employeeRole: CompanyEmployeeRole.OWNER });
      const res2 = await agent
        .get("/v1/companies")
        .query({ pageSize, employeeId: user1.id, employeeRole: CompanyEmployeeRole.MANAGER });
      const res3 = await agent
        .get("/v1/companies")
        .query({ pageSize, employeeId: user1.id, employeeRole: CompanyEmployeeRole.REGULAR });
      const res4 = await agent
        .get("/v1/companies")
        .query({ pageSize, employeeId: user2.id, employeeRole: CompanyEmployeeRole.OWNER });

      // assert
      expect(res1.status).toBe(200);
      expect(res1.body.isSuccess).toBe(true);
      expect(res1.body.data.companies).toHaveLength(1);
      expect(res1.body.data.companies[0]).toMatchObject(getExpectedCompanyFormat(company1));
      expect(res1.body.data.pagination).toMatchObject({ currentPage: 1, pageSize, totalCount: 1 });

      expect(res2.status).toBe(200);
      expect(res2.body.isSuccess).toBe(true);
      expect(res2.body.data.companies).toHaveLength(2);
      expect(res2.body.data.companies[0]).toMatchObject(getExpectedCompanyFormat(company2));
      expect(res2.body.data.companies[1]).toMatchObject(getExpectedCompanyFormat(company3));
      expect(res2.body.data.pagination).toMatchObject({ currentPage: 1, pageSize, totalCount: 2 });

      expect(res3.status).toBe(200);
      expect(res3.body.isSuccess).toBe(true);
      expect(res3.body.data.companies).toHaveLength(0);
      expect(res3.body.data.pagination).toMatchObject({ currentPage: 1, pageSize, totalCount: 0 });

      expect(res4.status).toBe(200);
      expect(res4.body.isSuccess).toBe(true);
      expect(res4.body.data.companies).toHaveLength(0);
      expect(res4.body.data.pagination).toMatchObject({ currentPage: 1, pageSize, totalCount: 0 });
    });

    const validationTestCases = [
      {
        name: "missing pageSize",
        query: {},
        expectedErrors: [{ message: "Page size is required", field: "pageSize" }],
      },
      {
        name: "pageSize is less than 1",
        query: { pageSize: 0 },
        expectedErrors: [{ message: "Page size must be a positive integer between 1 and 100", field: "pageSize" }],
      },
      {
        name: "pageSize is greater than 100",
        query: { pageSize: 101 },
        expectedErrors: [{ message: "Page size must be a positive integer between 1 and 100", field: "pageSize" }],
      },
      {
        name: "page is less than 1",
        query: { pageSize: 10, page: 0 },
        expectedErrors: [{ message: "Page must be a positive integer", field: "page" }],
      },
      {
        name: "employeeRole is provided without employeeId",
        query: { pageSize: 10, employeeRole: CompanyEmployeeRole.OWNER },
        expectedErrors: [{ message: "Employee role cannot be provided without employee ID", field: "employeeRole" }],
      },
      {
        name: "employeeRole does not exist in the enum",
        query: { pageSize: 10, employeeId: "someId", employeeRole: "INVALID_ROLE_123" },
        expectedErrors: [
          {
            message: `Invalid employee role.`,
            field: "employeeRole",
          },
        ],
      },
    ];

    validationTestCases.forEach(({ name, query, expectedErrors }) => {
      it(`should return a 400 if ${name}`, async () => {
        // arrange
        await createAndAuthTestUser(agent);

        // act
        const res = await agent.get("/v1/companies").query(query);

        // assert
        expect(res.status).toBe(400);
        expect(res.body.isSuccess).toBe(false);
        expect(res.body.message).toBe("Validation error");
        const mappedResBodyErrors = res.body.errors.map((error: any) => ({ message: error.message, field: error.field }));
        expectedErrors.forEach((expectedError) => {
          expect(mappedResBodyErrors).toEqual(
            expect.arrayContaining([
              {
                message: expect.stringContaining(expectedError.message),
                field: expectedError.field,
              },
            ])
          );
        });
      });
    });

    it("should return a 401 if the user is not authenticated", async () => {
      // act
      const res = await agent.get("/v1/companies");

      // assert
      expect(res.status).toBe(401);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });
  });
});
