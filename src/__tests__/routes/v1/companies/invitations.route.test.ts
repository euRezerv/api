import { Company, CompanyEmployeeRole, InvitationStatus, User } from "@prisma/client";
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
import prisma from "@utils/prisma";
import ms from "milliseconds";
import CompanyEmployeeService from "src/services/companyEmployee.service";
import { CompleteUser } from "src/globalTypes";

const baseUrl = "/v1/companies";

describe("/v1/companies/:id", () => {
  let agent: InstanceType<typeof TestAgent>;

  beforeEach(async () => {
    agent = supertest.agent(createServer());
    await clearTestDb();
  });

  describe("POST /invitations", () => {
    let authCompanyOwner: User;
    let company: Company;
    let user: User;

    beforeEach(async () => {
      authCompanyOwner = await createAndAuthTestUser(agent);
      company = await createTestCompany(authCompanyOwner.id);
      await addTestUserToCompany(company.id, authCompanyOwner.id, CompanyEmployeeRole.OWNER);
      user = await createTestUser();
    });

    it("should return a 201 and the invitation", async () => {
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

    it("should return a 201 and the invitation with the correct role", async () => {
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

    it("should return a 201 and the invitation if the existing invitation is not pending and the invited user is not part of the company", async () => {
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

  describe("PATCH /invitations/:invitationId/accept", () => {
    let authInvitedUser: User;
    let companyOwner: CompleteUser;
    let company: Company;

    beforeEach(async () => {
      authInvitedUser = await createAndAuthTestUser(agent);
      companyOwner = await createTestUser();
      company = await createTestCompany(companyOwner.id);
      await addTestUserToCompany(company.id, companyOwner.id, CompanyEmployeeRole.OWNER);
    });

    const createTestInvitation = async (
      role: CompanyEmployeeRole,
      companyId?: string,
      senderId?: string,
      invitedUserId?: string
    ) => {
      if ((!!companyId && !senderId) || (!companyId && !!senderId)) {
        throw new Error("companyId and senderId must both be provided");
      }

      let senderCompanyEmployee;
      if (companyId && senderId) {
        senderCompanyEmployee = await CompanyEmployeeService.getCompanyEmployee(companyId, senderId);
      } else {
        senderCompanyEmployee = await CompanyEmployeeService.getCompanyEmployee(company.id, companyOwner.id);
      }

      return await CompanyEmployeeService.createCompanyEmployeeInvitation({
        senderId: senderCompanyEmployee!.id,
        invitedUserId: invitedUserId ?? authInvitedUser.id,
        role,
        expiresInMillis: ms.weeks(1),
      });
    };

    it("should return a 200 and the updated invitation and new employee with the REGULAR role", async () => {
      // arrange
      const invitation = await createTestInvitation(CompanyEmployeeRole.REGULAR);

      // act
      const res = await agent.patch(`${baseUrl}/${company.id}/invitations/${invitation.id}/accept`);

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.message).toBe("Invitation accepted successfully");
      expect(res.body.data.invitation).toMatchObject({
        id: invitation.id,
        status: InvitationStatus.ACCEPTED,
      });
      expect(res.body.data.employee).toMatchObject({
        companyId: company.id,
        employeeId: authInvitedUser.id,
        role: CompanyEmployeeRole.REGULAR,
      });
    });

    it("should return a 200 and the updated invitation and new employee with the MANAGER role", async () => {
      // arrange
      const invitation = await createTestInvitation(CompanyEmployeeRole.MANAGER);

      // act
      const res = await agent.patch(`${baseUrl}/${company.id}/invitations/${invitation.id}/accept`);

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.message).toBe("Invitation accepted successfully");
      expect(res.body.data.invitation).toMatchObject({
        id: invitation.id,
        status: InvitationStatus.ACCEPTED,
      });
      expect(res.body.data.employee).toMatchObject({
        companyId: company.id,
        employeeId: authInvitedUser.id,
        role: CompanyEmployeeRole.MANAGER,
      });
    });

    it("should return a 200 and the updated invitation and new employee with the OWNER role", async () => {
      // arrange
      const invitation = await createTestInvitation(CompanyEmployeeRole.OWNER);

      // act
      const res = await agent.patch(`${baseUrl}/${company.id}/invitations/${invitation.id}/accept`);

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.message).toBe("Invitation accepted successfully");
      expect(res.body.data.invitation).toMatchObject({
        id: invitation.id,
        status: InvitationStatus.ACCEPTED,
      });
      expect(res.body.data.employee).toMatchObject({
        companyId: company.id,
        employeeId: authInvitedUser.id,
        role: CompanyEmployeeRole.OWNER,
      });
    });

    it("should return a 400 if the invitation is already accepted", async () => {
      // arrange
      const invitation = await createTestInvitation(CompanyEmployeeRole.REGULAR);
      await CompanyEmployeeService.updateCompanyEmployeeInvitation({
        invitationId: invitation.id,
        data: { status: InvitationStatus.ACCEPTED },
      });

      // act
      const res = await agent.patch(`${baseUrl}/${company.id}/invitations/${invitation.id}/accept`);

      // assert
      expect(res.status).toBe(400);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("This invitation has already been accepted");
    });

    it("should return a 400 if the invitation is already declined", async () => {
      // arrange
      const invitation = await createTestInvitation(CompanyEmployeeRole.REGULAR);
      await CompanyEmployeeService.updateCompanyEmployeeInvitation({
        invitationId: invitation.id,
        data: { status: InvitationStatus.DECLINED },
      });

      // act
      const res = await agent.patch(`${baseUrl}/${company.id}/invitations/${invitation.id}/accept`);

      // assert
      expect(res.status).toBe(400);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("This invitation has already been rejected");
    });

    it("should return a 400 if the invitation is already cancelled", async () => {
      // arrange
      const invitation = await createTestInvitation(CompanyEmployeeRole.REGULAR);
      await CompanyEmployeeService.updateCompanyEmployeeInvitation({
        invitationId: invitation.id,
        data: { status: InvitationStatus.CANCELLED },
      });

      // act
      const res = await agent.patch(`${baseUrl}/${company.id}/invitations/${invitation.id}/accept`);

      // assert
      expect(res.status).toBe(400);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("This invitation has already been cancelled");
    });

    it("should return a 400 if the invitation is expired", async () => {
      // arrange
      const invitation = await createTestInvitation(CompanyEmployeeRole.REGULAR);
      await CompanyEmployeeService.updateCompanyEmployeeInvitation({
        invitationId: invitation.id,
        data: { status: InvitationStatus.EXPIRED },
      });

      // act
      const res = await agent.patch(`${baseUrl}/${company.id}/invitations/${invitation.id}/accept`);

      // assert
      expect(res.status).toBe(400);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("This invitation has expired");
    });

    it("should return a 400 if the invitation expiration date has passed", async () => {
      jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] }).setSystemTime(new Date("2025-01-01"));

      // arrange
      const invitation = await createTestInvitation(CompanyEmployeeRole.REGULAR);
      await CompanyEmployeeService.updateCompanyEmployeeInvitation({
        invitationId: invitation.id,
        data: { expiresAt: new Date(Date.now() - ms.days(1)) },
      });

      // act
      const res = await agent.patch(`${baseUrl}/${company.id}/invitations/${invitation.id}/accept`);

      // assert
      expect(res.status).toBe(400);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("This invitation has expired");

      jest.useRealTimers();
    });

    it("should return a 400 if the invited user already belongs to the company", async () => {
      // arrange
      const invitation = await createTestInvitation(CompanyEmployeeRole.REGULAR);
      await addTestUserToCompany(company.id, authInvitedUser.id, CompanyEmployeeRole.REGULAR);

      // act
      const res = await agent.patch(`${baseUrl}/${company.id}/invitations/${invitation.id}/accept`);

      // assert
      expect(res.status).toBe(400);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("User is already an employee of this company");
    });

    it("should return a 403 if the invitation does not belong to the authenticated user", async () => {
      // arrange
      const invitation = await createTestInvitation(CompanyEmployeeRole.REGULAR);
      const notInvitedAuthUser = await createAndAuthTestUser(agent);

      // act
      const res = await agent.patch(`${baseUrl}/${company.id}/invitations/${invitation.id}/accept`);

      // assert
      expect(res.status).toBe(403);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("No invitation found for this user");
    });

    it("should return a 404 if the company does not exist", async () => {
      // arrange
      const invitation = await createTestInvitation(CompanyEmployeeRole.REGULAR);

      // act
      const res = await agent.patch(`${baseUrl}/nonexistent-id/invitations/${invitation.id}/accept`);

      // assert
      expect(res.status).toBe(404);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Company not found");
    });

    it("should return a 404 if the invitation does not exist", async () => {
      // act
      const res = await agent.patch(`${baseUrl}/${company.id}/invitations/nonexistent-id/accept`);

      // assert
      expect(res.status).toBe(404);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Invitation not found");
    });
  });
});
