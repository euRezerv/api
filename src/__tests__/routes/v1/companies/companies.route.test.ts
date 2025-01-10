import { omitKeys } from "@toolbox/common/objects";
import { Company, CompanyEmployeeRole, InvitationStatus, User } from "@prisma/client";
import {
  addTestUserToCompany,
  clearTestDb,
  createAndAuthTestUser,
  createTestCompany,
  createTestUser,
  getTestCompanyData,
} from "src/__tests__/testUtils/db";
import createServer from "src/config/server";
import supertest from "supertest";
import TestAgent from "supertest/lib/agent";
import prisma from "@utils/prisma";
import ms from "milliseconds";
import CompanyEmployeeService from "src/services/companyEmployee.service";

const baseUrl = "/v1/companies";

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
      const res = await agent.get(baseUrl).query({ pageSize });

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
      const res = await agent.get(baseUrl).query({ pageSize });

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
      const res = await agent.get(baseUrl).query({ pageSize });

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
      const res = await agent.get(baseUrl).query({ pageSize, page });

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
      const res = await agent.get(baseUrl).query({ pageSize });

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
      const res = await agent.get(baseUrl).query({ pageSize });

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
      const res = await agent.get(baseUrl).query({ pageSize, page });

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
      const res1 = await agent.get(baseUrl).query({ pageSize, employeeId: user1.id });
      const res2 = await agent.get(baseUrl).query({ pageSize, employeeId: user2.id });

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
        .get(baseUrl)
        .query({ pageSize, employeeId: user1.id, employeeRole: CompanyEmployeeRole.OWNER });
      const res2 = await agent
        .get(baseUrl)
        .query({ pageSize, employeeId: user1.id, employeeRole: CompanyEmployeeRole.MANAGER });
      const res3 = await agent
        .get(baseUrl)
        .query({ pageSize, employeeId: user1.id, employeeRole: CompanyEmployeeRole.REGULAR });
      const res4 = await agent
        .get(baseUrl)
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
        const res = await agent.get(baseUrl).query(query);

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
  });

  describe("GET /:id", () => {
    it("should return a 200 and the company", async () => {
      // arrange
      const loggedUser = await createAndAuthTestUser(agent);
      const company = await createTestCompany(loggedUser.id);

      // act
      const res = await agent.get(`${baseUrl}/${company.id}`);

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.company).toMatchObject({
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
    });

    it("should return a 404 if the company does not exist", async () => {
      // arrange
      await createAndAuthTestUser(agent);

      // act
      const res = await agent.get(`${baseUrl}/nonexistent-id`);

      // assert
      expect(res.status).toBe(404);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Company not found");
    });
  });

  describe("POST /", () => {
    const getPostCompanyData = () => {
      return omitKeys(getTestCompanyData(), ["createdAt", "deletedAt"]);
    };

    it("should return a 201 and the created company, and add the owner as an employee", async () => {
      // arrange
      const loggedUser = await createAndAuthTestUser(agent);
      const companyData = getPostCompanyData();

      // act
      const res = await agent.post(baseUrl).send(companyData);

      // assert
      expect(res.status).toBe(201);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.company).toMatchObject({
        name: companyData.name,
        country: companyData.country,
        county: companyData.county,
        city: companyData.city,
        street: companyData.street,
        postalCode: companyData.postalCode,
        latitude: companyData.latitude,
        longitude: companyData.longitude,
        createdById: loggedUser.id,
      });

      const employees = await prisma.companyEmployee.findMany({ where: { companyId: res.body.data.company.id } });
      expect(employees).toHaveLength(1);
      expect(employees[0]).toMatchObject({
        employeeId: loggedUser.id,
        companyId: res.body.data.company.id,
        role: CompanyEmployeeRole.OWNER,
      });
    });

    const validationTestCases = [
      {
        name: "missing name, country, county, city, street, postalCode, latitude, longitude",
        companyData: {},
        expectedErrors: [
          { message: "Name is required", field: "name" },
          { message: "Country is required", field: "country" },
          { message: "County is required", field: "county" },
          { message: "City is required", field: "city" },
          { message: "Street is required", field: "street" },
          { message: "Postal code is required", field: "postalCode" },
          { message: "Latitude is required", field: "latitude" },
          { message: "Longitude is required", field: "longitude" },
        ],
      },
      {
        name: "name, country, county, city, street, postalCode, latitude, longitude contain only whitespaces",
        companyData: {
          name: " ",
          country: " ",
          county: " ",
          city: " ",
          street: " ",
          postalCode: " ",
          latitude: " ",
          longitude: " ",
        },
        expectedErrors: [
          { message: "Name is required", field: "name" },
          { message: "Country is required", field: "country" },
          { message: "County is required", field: "county" },
          { message: "City is required", field: "city" },
          { message: "Street is required", field: "street" },
          { message: "Postal code is required", field: "postalCode" },
          { message: "Latitude is required", field: "latitude" },
          { message: "Longitude is required", field: "longitude" },
        ],
      },
      {
        name: "latitude and longitude are not numbers",
        companyData: { ...getPostCompanyData(), latitude: "not-a-number", longitude: "not-a-number" },
        expectedErrors: [
          { message: "Latitude must be a number", field: "latitude" },
          { message: "Longitude must be a number", field: "longitude" },
        ],
      },
    ];

    validationTestCases.forEach(({ name, companyData, expectedErrors }) => {
      it(`should return a 400 if ${name}`, async () => {
        // arrange
        await createAndAuthTestUser(agent);

        // act
        const res = await agent.post(baseUrl).send(companyData);

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
  });

  describe("POST /:id/invitations", () => {
    let authCompanyOwner: User;
    let company: Company;
    let user: User;

    beforeEach(async () => {
      authCompanyOwner = await createAndAuthTestUser(agent);
      company = await createTestCompany(authCompanyOwner.id);
      await addTestUserToCompany(company.id, authCompanyOwner.id, CompanyEmployeeRole.OWNER);
      user = await createTestUser();
    });

    it("should return a 200 and the invitation", async () => {
      jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] }).setSystemTime(new Date("2025-01-01"));

      // act
      const res = await agent
        .post(`${baseUrl}/${company.id}/invitations`)
        .send({ invitedUserId: user.id, role: CompanyEmployeeRole.REGULAR });

      // assert
      expect(res.status).toBe(201);
      expect(res.body.isSuccess).toBe(true);
      const companyOwnerEmployee = await CompanyEmployeeService.getCompanyEmployee(company.id, authCompanyOwner.id);
      expect(res.body.data.invitation).toMatchObject({
        senderCompanyEmployeeId: companyOwnerEmployee?.id,
        invitedUserId: user.id,
        role: CompanyEmployeeRole.REGULAR,
        status: "PENDING",
        expiresIn: ms.weeks(1).toString(),
        expiresAt: expect.stringContaining(new Date(Date.now() + ms.weeks(1)).toISOString().slice(0, 20)),
      });

      jest.useRealTimers();
    });

    it("should return a 200 and the invitation with the correct role", async () => {
      jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] }).setSystemTime(new Date("2025-01-01"));

      // act
      const res = await agent
        .post(`${baseUrl}/${company.id}/invitations`)
        .send({ invitedUserId: user.id, role: CompanyEmployeeRole.OWNER });

      // assert
      expect(res.status).toBe(201);
      expect(res.body.isSuccess).toBe(true);
      const companyOwnerEmployee = await CompanyEmployeeService.getCompanyEmployee(company.id, authCompanyOwner.id);
      expect(res.body.data.invitation).toMatchObject({
        senderCompanyEmployeeId: companyOwnerEmployee?.id,
        invitedUserId: user.id,
        role: CompanyEmployeeRole.OWNER,
        status: "PENDING",
        expiresIn: ms.weeks(1).toString(),
        expiresAt: expect.stringContaining(new Date(Date.now() + ms.weeks(1)).toISOString().slice(0, 20)),
      });

      jest.useRealTimers();
    });

    it("should return a 200 and the invitation if the existing invitation is not pending and the invited user is not part of the company", async () => {
      jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] }).setSystemTime(new Date("2025-01-01"));

      // arrange
      const companyOwnerEmployee = await CompanyEmployeeService.getCompanyEmployee(company.id, authCompanyOwner.id);
      const existingInvitation = await CompanyEmployeeService.createCompanyEmployeeInvitation({
        senderId: companyOwnerEmployee?.id!,
        invitedUserId: user.id,
        role: CompanyEmployeeRole.REGULAR,
        expiresInMillis: ms.weeks(1),
      });
      await prisma.companyEmployeeInvitation.update({
        where: { id: existingInvitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });

      // act
      const res = await agent
        .post(`${baseUrl}/${company.id}/invitations`)
        .send({ invitedUserId: user.id, role: CompanyEmployeeRole.REGULAR });

      // assert
      expect(res.status).toBe(201);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.invitation).toMatchObject({
        senderCompanyEmployeeId: companyOwnerEmployee?.id,
        invitedUserId: user.id,
        role: CompanyEmployeeRole.REGULAR,
        status: "PENDING",
        expiresIn: ms.weeks(1).toString(),
        expiresAt: expect.stringContaining(new Date(Date.now() + ms.weeks(1)).toISOString().slice(0, 20)),
      });

      jest.useRealTimers();
    });

    const validationTestCases = [
      {
        name: "missing invitedUserId and role",
        getBody: async () => ({}),
        expectedErrors: [
          { message: "Invited user ID is required", field: "invitedUserId" },
          { message: "Role is required", field: "role" },
        ],
      },
      {
        name: "invitedUserId and role contain only whitespaces",
        getBody: async () => ({ invitedUserId: " ", role: " " }),
        expectedErrors: [
          { message: "Invited user ID is required", field: "invitedUserId" },
          { message: "Role is required", field: "role" },
        ],
      },
      {
        name: "role is not a valid CompanyEmployeeRole",
        getBody: async () => ({ invitedUserId: user!.id, role: "INVALID_ROLE" }),
        expectedErrors: [
          { message: `Invalid role. Must be one of: ${Object.values(CompanyEmployeeRole).join(", ")}`, field: "role" },
        ],
      },
      {
        name: "the invited user is the same as the authenticated user",
        getBody: async () => ({ invitedUserId: authCompanyOwner!.id, role: CompanyEmployeeRole.REGULAR }),
        expectedErrors: [{ message: "You cannot invite yourself to a company", field: "invitedUserId" }],
      },
    ];

    validationTestCases.forEach(({ name, getBody, expectedErrors }) => {
      it(`should return a 400 if ${name}`, async () => {
        // act
        const res = await agent.post(`${baseUrl}/${company.id}/invitations`).send(await getBody());

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

    it("should return a 400 if the user is already an employee of the company", async () => {
      // arrange
      await addTestUserToCompany(company.id, user.id, CompanyEmployeeRole.REGULAR);

      // act
      const res = await agent
        .post(`${baseUrl}/${company.id}/invitations`)
        .send({ invitedUserId: user.id, role: CompanyEmployeeRole.REGULAR });

      // assert
      expect(res.status).toBe(400);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("This user is already an employee of this company");
    });

    it("should return a 400 if the user has an existing invitation to the company", async () => {
      // arrange
      const companyOwnerEmployee = await CompanyEmployeeService.getCompanyEmployee(company.id, authCompanyOwner.id);
      await CompanyEmployeeService.createCompanyEmployeeInvitation({
        senderId: companyOwnerEmployee?.id!,
        invitedUserId: user.id,
        role: CompanyEmployeeRole.REGULAR,
        expiresInMillis: ms.weeks(1),
      });

      // act
      const res = await agent
        .post(`${baseUrl}/${company.id}/invitations`)
        .send({ invitedUserId: user.id, role: CompanyEmployeeRole.REGULAR });

      // assert
      expect(res.status).toBe(400);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("This user already has a pending invitation");
    });

    it("should return a 403 if the authenticated user is not an owner of the company", async () => {
      // arrange
      const userNotOwner = await createAndAuthTestUser(agent);
      await addTestUserToCompany(company.id, userNotOwner.id, CompanyEmployeeRole.REGULAR);

      // act
      const res = await agent
        .post(`${baseUrl}/${company.id}/invitations`)
        .send({ invitedUserId: user.id, role: CompanyEmployeeRole.REGULAR });

      // assert
      expect(res.status).toBe(403);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("You are not authorized to invite employees to this company");
    });

    it("should return a 404 if the company does not exist", async () => {
      // act
      const res = await agent
        .post(`${baseUrl}/nonexistent-id/invitations`)
        .send({ invitedUserId: user.id, role: CompanyEmployeeRole.REGULAR });

      // assert
      expect(res.status).toBe(404);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Company not found");
    });

    it("should return a 404 if the authenticated user is not an employee of the company", async () => {
      // arrange
      const userNotInCompany = await createAndAuthTestUser(agent);

      // act
      const res = await agent
        .post(`${baseUrl}/${company.id}/invitations`)
        .send({ invitedUserId: user.id, role: CompanyEmployeeRole.REGULAR });

      // assert
      expect(res.status).toBe(404);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Sender must be an employee of the company");
    });

    it("should return a 404 if the invited user does not exist", async () => {
      // act
      const res = await agent
        .post(`${baseUrl}/${company.id}/invitations`)
        .send({ invitedUserId: "nonexistent-id", role: CompanyEmployeeRole.REGULAR });

      // assert
      expect(res.status).toBe(404);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Invited user not found");
    });
  });
});
