import { parsePhoneNumberWithError } from "libphonenumber-js";
import prisma from "@utils/prisma";
import { clearTestDb, createAndAuthTestUser, createTestUser, getTestLocalProfile } from "src/__tests__/testUtils/db";
import createServer from "src/config/server";
import supertest from "supertest";
import TestAgent from "supertest/lib/agent";

describe("/v1/users", () => {
  let agent: InstanceType<typeof TestAgent>;

  beforeEach(async () => {
    agent = supertest.agent(createServer());
    await clearTestDb();
  });

  describe("GET /current-user", () => {
    it("should return a 200 and the authenticated user's data", async () => {
      // arrange
      const user = await createAndAuthTestUser(agent);

      // act
      const res = await agent.get("/v1/users/current-user");

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.user).toMatchObject({
        id: user.id,
        isProfileComplete: true,
        givenName: user.localProfile!.givenName,
        familyName: user.localProfile!.familyName,
        email: user.localProfile!.email,
        isEmailVerified: user.localProfile!.isEmailVerified,
        phoneNumber: user.localProfile!.phoneNumberFormatted,
        isPhoneVerified: user.localProfile!.isPhoneVerified,
        isSystemAdmin: user.localProfile!.isSystemAdmin,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });
    });

    it("should return a 200 and the authenticated user's incomplete data", async () => {
      // arrange
      const incompleteUser = await createAndAuthTestUser(agent);
      await prisma.localProfile.delete({
        where: {
          userId: incompleteUser.id,
        },
      });

      // act
      const res = await agent.get("/v1/users/current-user");

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.user).toMatchObject({
        id: incompleteUser.id,
        isProfileComplete: false,
        createdAt: incompleteUser.createdAt.toISOString(),
        updatedAt: incompleteUser.updatedAt.toISOString(),
      });
    });

    it("should return a 401 if the user is not authenticated", async () => {
      // act
      const res = await agent.get("/v1/users/current-user");

      // assert
      expect(res.status).toBe(401);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });
  });

  describe("GET /:id", () => {
    it("should return a 200 and the user, regardless of the user's authentication status", async () => {
      // arrange
      const loggedUser = await createAndAuthTestUser(agent);
      const user = await createTestUser();

      // act
      const loggedUserResponse = await agent.get(`/v1/users/${loggedUser.id}`);
      const userResponse = await agent.get(`/v1/users/${user.id}`);

      // assert
      expect(loggedUserResponse.status).toBe(200);
      expect(loggedUserResponse.body.isSuccess).toBe(true);
      expect(loggedUserResponse.body.data.user).toMatchObject({
        id: loggedUser.id,
        givenName: loggedUser.localProfile!.givenName,
        familyName: loggedUser.localProfile!.familyName,
        email: loggedUser.localProfile!.email,
        isEmailVerified: loggedUser.localProfile!.isEmailVerified,
        isPhoneVerified: loggedUser.localProfile!.isPhoneVerified,
        isSystemAdmin: loggedUser.localProfile!.isSystemAdmin,
        createdAt: loggedUser.createdAt.toISOString(),
      });

      expect(userResponse.status).toBe(200);
      expect(userResponse.body.isSuccess).toBe(true);
      expect(userResponse.body.data.user).toMatchObject({
        id: user.id,
        givenName: user.localProfile!.givenName,
        familyName: user.localProfile!.familyName,
        email: user.localProfile!.email,
        isEmailVerified: user.localProfile!.isEmailVerified,
        isPhoneVerified: user.localProfile!.isPhoneVerified,
        isSystemAdmin: user.localProfile!.isSystemAdmin,
        createdAt: user.createdAt.toISOString(),
      });
    });

    it("should return a 401 if the user is not authenticated", async () => {
      // arrange
      const user = await createTestUser();

      // act
      const res = await agent.get(`/v1/users/${user.id}`);

      // assert
      expect(res.status).toBe(401);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Unauthorized");
    });

    it("should return a 404 if the user does not exist", async () => {
      // arrange
      const loggedUser = await createAndAuthTestUser(agent);

      // act
      const res = await agent.get(`/v1/users/${loggedUser.id + "nonexistent-id"}`);

      // assert
      expect(res.status).toBe(404);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("User not found");
    });
  });

  describe("PUT /local-profile", () => {
    const getNewLocalProfileData = async () => {
      const data = (await getTestLocalProfile()).data;

      return {
        givenName: data.givenName,
        familyName: data.familyName,
        email: data.email,
        phoneNumberCountryISO: data.phoneNumberCountryISO,
        phoneNumber: data.phoneNumber,
      };
    };

    it("should return a 200 and the updated user's data", async () => {
      // arrange
      const user = await createAndAuthTestUser(agent);
      const updatedData = await getNewLocalProfileData();
      const phoneNumberFormatted = parsePhoneNumberWithError(
        updatedData.phoneNumber,
        updatedData.phoneNumberCountryISO as any
      ).number;

      // act
      const res = await agent.put("/v1/users/local-profile").send(updatedData);

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.localProfile).toMatchObject({
        modifiedUserId: user.id,
        givenName: updatedData.givenName,
        familyName: updatedData.familyName,
        email: updatedData.email,
        phoneNumber: phoneNumberFormatted,
      });
    });

    it("should return a 200 and the updated user's data even if the phone number is taken by the logged user", async () => {
      // arrange
      const user = await createAndAuthTestUser(agent);
      const updatedData = {
        ...(await getNewLocalProfileData()),
        phoneNumberCountryISO: user.localProfile?.phoneNumberCountryISO,
        phoneNumber: user.localProfile?.phoneNumber,
      };

      // act
      const res = await agent.put("/v1/users/local-profile").send(updatedData);

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.localProfile).toMatchObject({
        modifiedUserId: user.id,
        givenName: updatedData.givenName,
        familyName: updatedData.familyName,
        email: updatedData.email,
        phoneNumber: user.localProfile?.phoneNumberFormatted,
      });
    });

    it("should return a 200 and the updated user's data even if the email is taken by the logged user", async () => {
      // arrange
      const user = await createAndAuthTestUser(agent);
      const updatedData = {
        ...(await getNewLocalProfileData()),
        email: user.localProfile?.email,
      };
      const phoneNumberFormatted = parsePhoneNumberWithError(
        updatedData.phoneNumber,
        updatedData.phoneNumberCountryISO as any
      ).number;

      // act
      const res = await agent.put("/v1/users/local-profile").send(updatedData);

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.localProfile).toMatchObject({
        modifiedUserId: user.id,
        givenName: updatedData.givenName,
        familyName: updatedData.familyName,
        email: user.localProfile?.email,
        phoneNumber: phoneNumberFormatted,
      });
    });

    const validationTestCases = [
      {
        name: "missing givenName, familyName, email, phoneNumberCountryISO, phoneNumber",
        localProfileData: {},
        expectedErrors: [
          { message: "Given name is required", field: "givenName" },
          { message: "Family name is required", field: "familyName" },
          { message: "Email is required", field: "email" },
          { message: "Phone number prefix is required", field: "phoneNumberCountryISO" },
          { message: "Phone number is required", field: "phoneNumber" },
        ],
      },
      {
        name: "empty givenName, familyName, email, phoneNumberCountryISO, phoneNumber",
        localProfileData: { givenName: "", familyName: "", email: "", phoneNumberCountryISO: "", phoneNumber: "" },
        expectedErrors: [
          { message: "Given name is required", field: "givenName" },
          { message: "Family name is required", field: "familyName" },
          { message: "Email is required", field: "email" },
          { message: "Phone number prefix is required", field: "phoneNumberCountryISO" },
          { message: "Phone number is required", field: "phoneNumber" },
        ],
      },
      {
        name: "invalid email",
        localProfileData: { email: "invalid-email" },
        expectedErrors: [{ message: "Email is invalid", field: "email" }],
      },
      {
        name: "invalid phoneNumberCountryISO",
        localProfileData: { phoneNumberCountryISO: "invalid-prefix" },
        expectedErrors: [{ message: "Phone number prefix is not supported", field: "phoneNumberCountryISO" }],
      },
      {
        name: "invalid phoneNumber",
        localProfileData: { phoneNumber: "invalid-phone-number" },
        expectedErrors: [{ message: "Phone number is invalid", field: "phoneNumber" }],
      },
    ];

    validationTestCases.forEach(({ name, localProfileData, expectedErrors }) => {
      it(`should return a 400 if ${name}`, async () => {
        // arrange
        await createAndAuthTestUser(agent);

        // act
        const res = await agent.put("/v1/users/local-profile").send(localProfileData);

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

    it("should return a 400 if the phoneNumber does not match the country code", async () => {
      // arrange
      await createAndAuthTestUser(agent);
      const localProfileData = {
        ...(await getNewLocalProfileData()),
        phoneNumberCountryISO: "RO",
        phoneNumber: "+41712345678",
      };

      // act
      const res = await agent.put("/v1/users/local-profile").send(localProfileData);

      // assert
      expect(res.status).toBe(400);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Validation error");
      expect(res.body.errors).toMatchObject([
        {
          message: "Phone number does not match the country code",
          field: "phoneNumber",
        },
      ]);
    });

    it("should return a 409 if the email is already taken by another user", async () => {
      // arrange
      await createAndAuthTestUser(agent);
      const user = await createTestUser();
      const updatedData = {
        ...(await getNewLocalProfileData()),
        email: user.localProfile?.email,
      };

      // act
      const res = await agent.put("/v1/users/local-profile").send(updatedData);

      // assert
      expect(res.status).toBe(409);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Credentials already exist");
    });

    it("should return a 409 if the email is already taken by another soft deleted user", async () => {
      // arrange
      await createAndAuthTestUser(agent);
      const user = await createTestUser({
        userData: {
          deletedAt: new Date(),
        },
      });
      const updatedData = {
        ...(await getNewLocalProfileData()),
        email: user.localProfile?.email,
      };

      // act
      const res = await agent.put("/v1/users/local-profile").send(updatedData);

      // assert
      expect(res.status).toBe(409);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Credentials already exist");
    });

    it("should return a 409 if the phone number is already taken by another user", async () => {
      // arrange
      await createAndAuthTestUser(agent);
      const user = await createTestUser();
      const updatedData = {
        ...(await getNewLocalProfileData()),
        phoneNumberCountryISO: user.localProfile?.phoneNumberCountryISO,
        phoneNumber: user.localProfile?.phoneNumber,
      };

      // act
      const res = await agent.put("/v1/users/local-profile").send(updatedData);

      // assert
      expect(res.status).toBe(409);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Credentials already exist");
    });

    it("should return a 409 if the phone number is already taken by another soft deleted user", async () => {
      // arrange
      await createAndAuthTestUser(agent);
      const user = await createTestUser({
        userData: {
          deletedAt: new Date(),
        },
      });
      const updatedData = {
        ...(await getNewLocalProfileData()),
        phoneNumberCountryISO: user.localProfile?.phoneNumberCountryISO,
        phoneNumber: user.localProfile?.phoneNumber,
      };

      // act
      const res = await agent.put("/v1/users/local-profile").send(updatedData);

      // assert
      expect(res.status).toBe(409);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Credentials already exist");
    });
  });

  describe("PUT /local-profile/:userId", () => {
    const getNewLocalProfileData = async () => {
      const data = (await getTestLocalProfile()).data;

      return {
        givenName: data.givenName,
        familyName: data.familyName,
        email: data.email,
        phoneNumberCountryISO: data.phoneNumberCountryISO,
        phoneNumber: data.phoneNumber,
      };
    };

    it("should return a 200 and another user's updated data if logged user is systemAdmin", async () => {
      // arrange
      await createAndAuthTestUser(agent, { localProfileData: { isSystemAdmin: true } });
      const user = await createTestUser();
      const updatedData = await getNewLocalProfileData();
      const phoneNumberFormatted = parsePhoneNumberWithError(
        updatedData.phoneNumber,
        updatedData.phoneNumberCountryISO as any
      ).number;

      // act
      const res = await agent.put(`/v1/users/local-profile/${user.id}`).send(updatedData);

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.localProfile).toMatchObject({
        modifiedUserId: user.id,
        givenName: updatedData.givenName,
        familyName: updatedData.familyName,
        email: updatedData.email,
        phoneNumber: phoneNumberFormatted,
      });
    });

    it("should return a 200 and another user's updated data if logged user is systemAdmin, even though the email is already taken by the user to update", async () => {
      // arrange
      await createAndAuthTestUser(agent, { localProfileData: { isSystemAdmin: true } });
      const user = await createTestUser();
      const updatedData = {
        ...(await getNewLocalProfileData()),
        email: user.localProfile?.email,
      };
      const phoneNumberFormatted = parsePhoneNumberWithError(
        updatedData.phoneNumber,
        updatedData.phoneNumberCountryISO as any
      ).number;

      // act
      const res = await agent.put(`/v1/users/local-profile/${user.id}`).send(updatedData);

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.localProfile).toMatchObject({
        modifiedUserId: user.id,
        givenName: updatedData.givenName,
        familyName: updatedData.familyName,
        email: user.localProfile?.email,
        phoneNumber: phoneNumberFormatted,
      });
    });

    it("should return a 200 and another user's updated data if logged user is systemAdmin, even though the phone number is already taken by the user to update", async () => {
      // arrange
      await createAndAuthTestUser(agent, { localProfileData: { isSystemAdmin: true } });
      const user = await createTestUser();
      const updatedData = {
        ...(await getNewLocalProfileData()),
        phoneNumberCountryISO: user.localProfile?.phoneNumberCountryISO,
        phoneNumber: user.localProfile?.phoneNumber,
      };

      // act
      const res = await agent.put(`/v1/users/local-profile/${user.id}`).send(updatedData);

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data.localProfile).toMatchObject({
        modifiedUserId: user.id,
        givenName: updatedData.givenName,
        familyName: updatedData.familyName,
        email: updatedData.email,
        phoneNumber: user.localProfile?.phoneNumberFormatted,
      });
    });

    it(`should return a 400 if the logged user is not systemAdmin`, async () => {
      // arrange
      const user = await createAndAuthTestUser(agent);
      const updatedData = await getNewLocalProfileData();

      // act
      const res = await agent.put(`/v1/users/local-profile/${user.id}`).send(updatedData);

      // assert
      expect(res.status).toBe(400);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Validation error");
      expect(res.body.errors).toMatchObject([
        {
          message: "Current user is not a system admin",
          field: "userId",
        },
      ]);
    });

    const validationTestCases = [
      {
        name: "missing givenName, familyName, email, phoneNumberCountryISO, phoneNumber",
        localProfileData: {},
        expectedErrors: [
          { message: "Given name is required", field: "givenName" },
          { message: "Family name is required", field: "familyName" },
          { message: "Email is required", field: "email" },
          { message: "Phone number prefix is required", field: "phoneNumberCountryISO" },
          { message: "Phone number is required", field: "phoneNumber" },
        ],
      },
      {
        name: "empty givenName, familyName, email, phoneNumberCountryISO, phoneNumber",
        localProfileData: { givenName: "", familyName: "", email: "", phoneNumberCountryISO: "", phoneNumber: "" },
        expectedErrors: [
          { message: "Given name is required", field: "givenName" },
          { message: "Family name is required", field: "familyName" },
          { message: "Email is required", field: "email" },
          { message: "Phone number prefix is required", field: "phoneNumberCountryISO" },
          { message: "Phone number is required", field: "phoneNumber" },
        ],
      },
      {
        name: "invalid email",
        localProfileData: { email: "invalid-email" },
        expectedErrors: [{ message: "Email is invalid", field: "email" }],
      },
      {
        name: "invalid phoneNumberCountryISO",
        localProfileData: { phoneNumberCountryISO: "invalid-prefix" },
        expectedErrors: [{ message: "Phone number prefix is not supported", field: "phoneNumberCountryISO" }],
      },
      {
        name: "invalid phoneNumber",
        localProfileData: { phoneNumber: "invalid-phone-number" },
        expectedErrors: [{ message: "Phone number is invalid", field: "phoneNumber" }],
      },
    ];

    validationTestCases.forEach(({ name, localProfileData, expectedErrors }) => {
      it(`should return a 400 if the logged user is systemAdmin, but ${name}`, async () => {
        // arrange
        await createAndAuthTestUser(agent, { localProfileData: { isSystemAdmin: true } });
        const userToUpdate = await createTestUser();

        // act
        const res = await agent.put(`/v1/users/local-profile/${userToUpdate.id}`).send(localProfileData);

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

    it("should return a 400 if the logged user is systemAdmin, but the phoneNumber does not match the country code", async () => {
      // arrange
      await createAndAuthTestUser(agent, { localProfileData: { isSystemAdmin: true } });
      const userToUpdate = await createTestUser();
      const localProfileData = {
        ...(await getNewLocalProfileData()),
        phoneNumberCountryISO: "RO",
        phoneNumber: "+41712345678",
      };

      // act
      const res = await agent.put(`/v1/users/local-profile/${userToUpdate.id}`).send(localProfileData);

      // assert
      expect(res.status).toBe(400);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Validation error");
      expect(res.body.errors).toMatchObject([
        {
          message: "Phone number does not match the country code",
          field: "phoneNumber",
        },
      ]);
    });

    it("should return a 404 if the logged user is systemAdmin, but the provided userId does not exist", async () => {
      // arrange
      await createAndAuthTestUser(agent, { localProfileData: { isSystemAdmin: true } });
      const updatedData = await getNewLocalProfileData();

      // act
      const res = await agent.put(`/v1/users/local-profile/nonexistent-id`).send(updatedData);

      // assert
      expect(res.status).toBe(404);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("User not found");
    });

    it("should return a 409 if the email is already taken by the current (systemAdmin logged) user", async () => {
      // arrange
      const loggedUser = await createAndAuthTestUser(agent, { localProfileData: { isSystemAdmin: true } });
      const user = await createTestUser();
      const updatedData = {
        ...(await getNewLocalProfileData()),
        email: loggedUser.localProfile?.email,
      };

      // act
      const res = await agent.put(`/v1/users/local-profile/${user.id}`).send(updatedData);

      // assert
      expect(res.status).toBe(409);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Credentials already exist");
    });

    it("should return a 409 if the phone number is already taken by the current (systemAdmin logged) user", async () => {
      // arrange
      const loggedUser = await createAndAuthTestUser(agent, { localProfileData: { isSystemAdmin: true } });
      const user = await createTestUser();
      const updatedData = {
        ...(await getNewLocalProfileData()),
        phoneNumberCountryISO: loggedUser.localProfile?.phoneNumberCountryISO,
        phoneNumber: loggedUser.localProfile?.phoneNumber,
      };

      // act
      const res = await agent.put(`/v1/users/local-profile/${user.id}`).send(updatedData);

      // assert
      expect(res.status).toBe(409);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Credentials already exist");
    });

    it("should return a 409 if the email is already taken by another user, other than the one to update", async () => {
      // arrange
      await createAndAuthTestUser(agent, { localProfileData: { isSystemAdmin: true } });
      const userToUpdate = await createTestUser();
      const userToConflict = await createTestUser();
      const updatedData = {
        ...(await getNewLocalProfileData()),
        email: userToConflict.localProfile?.email,
      };

      // act
      const res = await agent.put(`/v1/users/local-profile/${userToUpdate.id}`).send(updatedData);

      // assert
      expect(res.status).toBe(409);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Credentials already exist");
    });

    it("should return a 409 if the email is already taken by another soft deleted user", async () => {
      // arrange
      await createAndAuthTestUser(agent, { localProfileData: { isSystemAdmin: true } });
      const userToUpdate = await createTestUser();
      const userToConflict = await createTestUser({
        userData: {
          deletedAt: new Date(),
        },
      });
      const updatedData = {
        ...(await getNewLocalProfileData()),
        email: userToConflict.localProfile?.email,
      };

      // act
      const res = await agent.put(`/v1/users/local-profile/${userToUpdate.id}`).send(updatedData);

      // assert
      expect(res.status).toBe(409);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Credentials already exist");
    });

    it("should return a 409 if the phone number is already taken by another user, other than the one to update", async () => {
      // arrange
      await createAndAuthTestUser(agent, { localProfileData: { isSystemAdmin: true } });
      const userToUpdate = await createTestUser();
      const userToConflict = await createTestUser();
      const updatedData = {
        ...(await getNewLocalProfileData()),
        phoneNumberCountryISO: userToConflict.localProfile?.phoneNumberCountryISO,
        phoneNumber: userToConflict.localProfile?.phoneNumber,
      };

      // act
      const res = await agent.put(`/v1/users/local-profile/${userToUpdate.id}`).send(updatedData);

      // assert
      expect(res.status).toBe(409);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Credentials already exist");
    });

    it("should return a 409 if the phone number is already taken by another soft deleted user", async () => {
      // arrange
      await createAndAuthTestUser(agent, { localProfileData: { isSystemAdmin: true } });
      const userToUpdate = await createTestUser();
      const userToConflict = await createTestUser({
        userData: {
          deletedAt: new Date(),
        },
      });
      const updatedData = {
        ...(await getNewLocalProfileData()),
        phoneNumberCountryISO: userToConflict.localProfile?.phoneNumberCountryISO,
        phoneNumber: userToConflict.localProfile?.phoneNumber,
      };

      // act
      const res = await agent.put(`/v1/users/local-profile/${userToUpdate.id}`).send(updatedData);

      // assert
      expect(res.status).toBe(409);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Credentials already exist");
    });
  });
});
