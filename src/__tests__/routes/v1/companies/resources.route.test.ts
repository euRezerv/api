import TestAgent from "supertest/lib/agent";
import createServer from "src/config/server";
import supertest from "supertest";
import {
  addTestUserToCompany,
  clearTestDb,
  createAndAuthTestUser,
  createTestCompany,
  createTestUser,
} from "src/__tests__/testUtils/db";
import { Company, CompanyEmployee, CompanyEmployeeRole, DayOfWeek, ResourceCategory, User } from "@prisma/client";
import CompanyEmployeeService from "src/services/companyEmployee.service";

describe("/v1/companies/:companyId/resources", () => {
  let agent: InstanceType<typeof TestAgent>;

  beforeEach(async () => {
    agent = supertest.agent(createServer());
    await clearTestDb();
  });

  describe("POST /", () => {
    let authCompanyOwner: User;
    let company: Company;
    let companyEmployeeOwner: CompanyEmployee;

    beforeEach(async () => {
      authCompanyOwner = await createAndAuthTestUser(agent);
      company = await createTestCompany(authCompanyOwner.id);
      companyEmployeeOwner = await addTestUserToCompany(company.id, authCompanyOwner.id, CompanyEmployeeRole.OWNER);
    });

    const getCreateResourceBody = <T extends Record<string, any>>(data?: T) => ({
      name: "Test Resource",
      description: "Test Resource Description",
      availabilityTime: [
        {
          dayOfWeek: DayOfWeek.MONDAY,
          startTime: "09:00",
          endTime: "17:00",
        },
      ],
      category: ResourceCategory.BEAUTY,
      assignedEmployeesIds: [companyEmployeeOwner.id],
      requiresBookingApproval: false,
      ...data,
    });

    it("should return 201 and the resource if the auth user is company owner (with owner as assigned employees)", async () => {
      // arrange
      const resourceData = getCreateResourceBody();

      // act
      const res = await agent.post(`/v1/companies/${company.id}/resources`).send(resourceData);

      // assert
      expect(res.status).toEqual(201);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.resource).toMatchObject({
        id: expect.any(String),
        name: resourceData.name,
        description: resourceData.description,
        availabilityTime: resourceData.availabilityTime,
        category: resourceData.category,
        requiresBookingApproval: resourceData.requiresBookingApproval,
        assignedEmployees: [{ employeeId: companyEmployeeOwner.id }],
      });
      expect(res.body.data.failedResourceEmployeeAssignments).toBeUndefined();
    });

    it("should return 201 and the resource if the auth user is company owner (with owner and invalid users as assigned employees)", async () => {
      // arrange
      const resourceData = getCreateResourceBody({
        assignedEmployeesIds: [companyEmployeeOwner.id, "invalid-employee-id1", "invalid-employee-id2"],
      });

      // act
      const res = await agent.post(`/v1/companies/${company.id}/resources`).send(resourceData);

      // assert
      expect(res.status).toEqual(201);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.resource).toMatchObject({
        id: expect.any(String),
        name: resourceData.name,
        description: resourceData.description,
        availabilityTime: resourceData.availabilityTime,
        category: resourceData.category,
        requiresBookingApproval: resourceData.requiresBookingApproval,
        assignedEmployees: [{ employeeId: companyEmployeeOwner.id }],
      });
      expect(res.body.data.failedResourceEmployeeAssignments).toEqual([
        { employeeId: "invalid-employee-id1" },
        { employeeId: "invalid-employee-id2" },
      ]);
    });

    it("should return 201 and the resource if the auth user is company owner (with owner and the same user twice as assigned employees)", async () => {
      // arrange
      const user = await createTestUser();
      const regularCompanyEmployee = await addTestUserToCompany(company.id, user.id, CompanyEmployeeRole.REGULAR);
      const resourceData = getCreateResourceBody({
        assignedEmployeesIds: [companyEmployeeOwner.id, regularCompanyEmployee.id, regularCompanyEmployee.id],
      });

      // act
      const res = await agent.post(`/v1/companies/${company.id}/resources`).send(resourceData);

      // assert
      expect(res.status).toEqual(201);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.resource).toMatchObject({
        id: expect.any(String),
        name: resourceData.name,
        description: resourceData.description,
        availabilityTime: resourceData.availabilityTime,
        category: resourceData.category,
        requiresBookingApproval: resourceData.requiresBookingApproval,
        assignedEmployees: [{ employeeId: companyEmployeeOwner.id }, { employeeId: regularCompanyEmployee.id }],
      });
      expect(res.body.data.failedResourceEmployeeAssignments).toBeUndefined();
    });

    it("should return 201 and the resource if the auth user is company manager (with owner twice and the manager twice as assigned employees)", async () => {
      // arrange
      const managerUser = await createAndAuthTestUser(agent);
      const companyEmployeeManager = await addTestUserToCompany(company.id, managerUser.id, CompanyEmployeeRole.MANAGER);
      const resourceData = getCreateResourceBody({
        availabilityTime: [
          {
            dayOfWeek: DayOfWeek.MONDAY,
            startTime: "09:00",
            endTime: "17:00",
          },
          {
            dayOfWeek: DayOfWeek.TUESDAY,
            startTime: "09:00",
            endTime: "17:00",
          },
          {
            dayOfWeek: DayOfWeek.WEDNESDAY,
            startTime: "09:00",
            endTime: "17:00",
          },
          {
            dayOfWeek: DayOfWeek.THURSDAY,
            startTime: "09:00",
            endTime: "17:00",
          },
          {
            dayOfWeek: DayOfWeek.FRIDAY,
            startTime: "09:00",
            endTime: "17:00",
          },
          {
            dayOfWeek: DayOfWeek.SATURDAY,
            startTime: "09:00",
            endTime: "17:00",
          },
          {
            dayOfWeek: DayOfWeek.SUNDAY,
            startTime: "09:00",
            endTime: "17:00",
          },
        ],
        assignedEmployeesIds: [
          companyEmployeeOwner.id,
          companyEmployeeOwner.id,
          companyEmployeeManager.id,
          companyEmployeeManager.id,
        ],
        requiresBookingApproval: "false",
      });

      // act
      const res = await agent.post(`/v1/companies/${company.id}/resources`).send(resourceData);

      // assert
      expect(res.status).toEqual(201);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.resource).toMatchObject({
        id: expect.any(String),
        name: resourceData.name,
        description: resourceData.description,
        availabilityTime: resourceData.availabilityTime,
        category: resourceData.category,
        // requiresBookingApproval is converted to boolean
        requiresBookingApproval: (resourceData.requiresBookingApproval as any) === "true",
        assignedEmployees: [{ employeeId: companyEmployeeOwner.id }, { employeeId: companyEmployeeManager.id }],
      });
      expect(res.body.data.failedResourceEmployeeAssignments).toBeUndefined();
    });

    it("should return 201 and the resource if no description is provided", async () => {
      // arrange
      const resourceData = getCreateResourceBody({
        description: undefined,
        requiresBookingApproval: true,
      });

      // act
      const res = await agent.post(`/v1/companies/${company.id}/resources`).send(resourceData);

      // assert
      expect(res.status).toEqual(201);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.resource).toMatchObject({
        id: expect.any(String),
        name: resourceData.name,
        description: null,
        availabilityTime: resourceData.availabilityTime,
        category: resourceData.category,
        requiresBookingApproval: resourceData.requiresBookingApproval,
        assignedEmployees: [{ employeeId: companyEmployeeOwner.id }],
      });
      expect(res.body.data.failedResourceEmployeeAssignments).toBeUndefined();
    });

    it("should return 201 and the resource if enums are in incorrect case (lowercase)", async () => {
      // arrange
      const resourceData = getCreateResourceBody({
        description: undefined,
        availabilityTime: [
          {
            dayOfWeek: DayOfWeek.MONDAY.toLowerCase(),
            startTime: "09:00",
            endTime: "17:00",
          },
        ],
        category: ResourceCategory.HEALTH.toLowerCase(),
        requiresBookingApproval: true,
      });

      // act
      const res = await agent.post(`/v1/companies/${company.id}/resources`).send(resourceData);

      // assert
      expect(res.status).toEqual(201);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.resource).toMatchObject({
        id: expect.any(String),
        name: resourceData.name,
        description: null,
        availabilityTime: resourceData.availabilityTime.map((time) => ({
          ...time,
          dayOfWeek: time.dayOfWeek.toUpperCase(),
        })),
        category: resourceData.category.toUpperCase(),
        requiresBookingApproval: resourceData.requiresBookingApproval,
        assignedEmployees: [{ employeeId: companyEmployeeOwner.id }],
      });
      expect(res.body.data.failedResourceEmployeeAssignments).toBeUndefined();
    });

    const validationTestCases = [
      {
        name: "missing name, availabilityTime, category, assignedEmployeesIds and requiresBookingApproval",
        getBody: () => ({}),
        expectedErrors: [
          { field: "name", message: "Name is required" },
          {
            field: "availabilityTime",
            message: "Availability time must be an array of at least 1 item and at most 7 items",
          },
          { field: "category", message: "Category is required" },
          { field: "assignedEmployeesIds", message: "Assigned employees IDs must be an array of at least 1 item" },
          { field: "requiresBookingApproval", message: "Requires booking approval is required" },
        ],
      },
      {
        name: "name, category and requiresBookingApproval contains only whitespace",
        getBody: () => ({
          name: " ",
          category: " ",
          requiresBookingApproval: " ",
          availabilityTime: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: "09:00",
              endTime: "17:00",
            },
          ],
          assignedEmployeesIds: [companyEmployeeOwner.id],
        }),
        expectedErrors: [
          { field: "name", message: "Name is required" },
          { field: "category", message: "Category is required" },
          { field: "requiresBookingApproval", message: "Requires booking approval is required" },
        ],
      },
      {
        name: "availabilityTime is not an array",
        getBody: () => ({
          availabilityTime: {
            dayOfWeek: DayOfWeek.MONDAY,
            startTime: "09:00",
            endTime: "17:00",
          },
        }),
        expectedErrors: [
          {
            field: "availabilityTime",
            message: "Availability time must be an array of at least 1 item and at most 7 items",
          },
        ],
      },
      {
        name: "availabilityTime is an empty array",
        getBody: () => ({
          availabilityTime: [],
        }),
        expectedErrors: [
          {
            field: "availabilityTime",
            message: "Availability time must be an array of at least 1 item and at most 7 items",
          },
        ],
      },
      {
        name: "availabilityTime is an array with more than 7 items",
        getBody: () => ({
          availabilityTime: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: "09:00",
              endTime: "17:00",
            },
            {
              dayOfWeek: DayOfWeek.TUESDAY,
              startTime: "09:00",
              endTime: "17:00",
            },
            {
              dayOfWeek: DayOfWeek.WEDNESDAY,
              startTime: "09:00",
              endTime: "17:00",
            },
            {
              dayOfWeek: DayOfWeek.THURSDAY,
              startTime: "09:00",
              endTime: "17:00",
            },
            {
              dayOfWeek: DayOfWeek.FRIDAY,
              startTime: "09:00",
              endTime: "17:00",
            },
            {
              dayOfWeek: DayOfWeek.SATURDAY,
              startTime: "09:00",
              endTime: "17:00",
            },
            {
              dayOfWeek: DayOfWeek.SUNDAY,
              startTime: "09:00",
              endTime: "17:00",
            },
            {
              dayOfWeek: DayOfWeek.SUNDAY,
              startTime: "09:00",
              endTime: "17:00",
            },
          ],
        }),
        expectedErrors: [
          {
            field: "availabilityTime",
            message: "Availability time must be an array of at least 1 item and at most 7 items",
          },
        ],
      },
      {
        name: "availabilityTime does not contain dayOfWeek",
        getBody: () => ({
          availabilityTime: [
            {
              startTime: "09:00",
              endTime: "17:00",
            },
          ],
        }),
        expectedErrors: [
          { field: "availabilityTime", message: "Each availability time item must have day of week property" },
        ],
      },
      {
        name: "availabilityTime.dayOfWeek is not part of the enum",
        getBody: () => ({
          availabilityTime: [
            {
              startTime: "09:00",
              endTime: "17:00",
              dayOfWeek: "invalid-day",
            },
          ],
        }),
        expectedErrors: [
          {
            field: "availabilityTime",
            message: `Invalid day of week. Must be one of: ${Object.values(DayOfWeek).join(", ")}`,
          },
        ],
      },
      {
        name: "availabilityTime does not contain startTime",
        getBody: () => ({
          availabilityTime: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              endTime: "17:00",
            },
          ],
        }),
        expectedErrors: [
          { field: "availabilityTime", message: "Each availability time item must have start time property" },
        ],
      },
      {
        name: "availabilityTime.startTime is not a string",
        getBody: () => ({
          availabilityTime: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: 123,
              endTime: "17:00",
            },
          ],
        }),
        expectedErrors: [{ field: "availabilityTime", message: "Start time must be a string" }],
      },
      {
        name: "availabilityTime.startTime is an empty string",
        getBody: () => ({
          availabilityTime: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: "",
              endTime: "17:00",
            },
          ],
        }),
        expectedErrors: [{ field: "availabilityTime", message: "Start time cannot be empty" }],
      },
      {
        name: "availabilityTime does not contain endTime",
        getBody: () => ({
          availabilityTime: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: "09:00",
            },
          ],
        }),
        expectedErrors: [{ field: "availabilityTime", message: "Each availability time item must have end time property" }],
      },
      {
        name: "availabilityTime.endTime is not a string",
        getBody: () => ({
          availabilityTime: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: "09:00",
              endTime: 123,
            },
          ],
        }),
        expectedErrors: [{ field: "availabilityTime", message: "End time must be a string" }],
      },
      {
        name: "availabilityTime.endTime is an empty string",
        getBody: () => ({
          availabilityTime: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: "09:00",
              endTime: "",
            },
          ],
        }),
        expectedErrors: [{ field: "availabilityTime", message: "End time cannot be empty" }],
      },
      {
        name: "availabilityTime contains the same dayOfWeek more than once",
        getBody: () => ({
          availabilityTime: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: "09:00",
              endTime: "17:00",
            },
            {
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: "09:00",
              endTime: "17:00",
            },
          ],
        }),
        expectedErrors: [
          { field: "availabilityTime", message: "Availability time cannot have the same day of week more than once" },
        ],
      },
      {
        name: "category is not part of the enum",
        getBody: () => ({
          category: "invalid-category",
        }),
        expectedErrors: [
          { field: "category", message: `Invalid category. Must be one of: ${Object.values(ResourceCategory).join(", ")}` },
        ],
      },
      {
        name: "assignedEmployeesIds is not an array",
        getBody: () => ({
          assignedEmployeesIds: "invalid-employee-id",
        }),
        expectedErrors: [
          { field: "assignedEmployeesIds", message: "Assigned employees IDs must be an array of at least 1 item" },
        ],
      },
      {
        name: "assignedEmployeesIds is an empty array",
        getBody: () => ({
          assignedEmployeesIds: [],
        }),
        expectedErrors: [
          { field: "assignedEmployeesIds", message: "Assigned employees IDs must be an array of at least 1 item" },
        ],
      },
      {
        name: "assignedEmployeesIds is an array of non-string items",
        getBody: () => ({
          assignedEmployeesIds: ["string", 12],
        }),
        expectedErrors: [{ field: "assignedEmployeesIds", message: "Assigned employees IDs must be an array of strings" }],
      },
      {
        name: "assignedEmployeesIds contains only invalid employee ids",
        getBody: () => ({
          name: "Test Resource",
          availabilityTime: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: "09:00",
              endTime: "17:00",
            },
          ],
          category: ResourceCategory.BEAUTY,
          assignedEmployeesIds: ["invalid-employee-id1", "invalid-employee-id2"],
          requiresBookingApproval: false,
        }),
        expectedErrors: [{ field: "assignedEmployeesIds", message: "No valid employees found" }],
      },
      {
        name: "requiresBookingApproval is not a boolean",
        getBody: () => ({
          requiresBookingApproval: "invalid-boolean",
        }),
        expectedErrors: [{ field: "requiresBookingApproval", message: "Requires booking approval must be a boolean" }],
      },
    ];

    validationTestCases.forEach(({ name, getBody, expectedErrors }) => {
      it(`should return 400 if ${name}`, async () => {
        // arrange
        const resourceData = getBody();

        // act
        const res = await agent.post(`/v1/companies/${company.id}/resources`).send(resourceData);

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

    it("should return 403 if the auth user is not an owner or manager of the company", async () => {
      // arrange
      const user = await createAndAuthTestUser(agent);
      const companyEmployee = await addTestUserToCompany(company.id, user.id, CompanyEmployeeRole.REGULAR);
      const resourceData = getCreateResourceBody();

      // act
      const res = await agent.post(`/v1/companies/${company.id}/resources`).send(resourceData);

      // assert
      expect(res.status).toBe(403);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("You are not authorized to create a resource");
    });

    it("should return 403 if the auth user is not an employee of the company", async () => {
      // arrange
      const user = await createAndAuthTestUser(agent);
      const resourceData = getCreateResourceBody();

      // act
      const res = await agent.post(`/v1/companies/${company.id}/resources`).send(resourceData);

      // assert
      expect(res.status).toBe(403);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("User must be an employee of the company");
    });

    it("should return 404 if the company does not exist", async () => {
      // arrange
      const resourceData = getCreateResourceBody();

      // act
      const res = await agent.post(`/v1/companies/invalid-company-id/resources`).send(resourceData);

      // assert
      expect(res.status).toBe(404);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Company not found");
    });
  });
});
