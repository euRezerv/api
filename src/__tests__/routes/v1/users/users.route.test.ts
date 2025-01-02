import prisma from "@utils/prisma";
import { clearTestDb, createAndAuthTestUser, createTestUser } from "src/__tests__/testUtils/db";
import createServer from "src/config/server";
import supertest from "supertest";
import TestAgent from "supertest/lib/agent";

describe("/v1/users", () => {
  let agent: InstanceType<typeof TestAgent>;

  beforeEach(async () => {
    agent = supertest.agent(createServer());
    await clearTestDb();
  });

  describe("GET /auth-user", () => {
    it("should return a 200 and the authenticated user's data", async () => {
      // arrange
      const user = await createAndAuthTestUser(agent);

      // act
      const response = await agent.get("/v1/users/auth-user");

      // assert
      expect(response.status).toBe(200);
      expect(response.body.isSuccess).toBe(true);
      expect(response.body.data.user).toMatchObject({
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
      const response = await agent.get("/v1/users/auth-user");

      // assert
      expect(response.status).toBe(200);
      expect(response.body.isSuccess).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: incompleteUser.id,
        isProfileComplete: false,
        createdAt: incompleteUser.createdAt.toISOString(),
        updatedAt: incompleteUser.updatedAt.toISOString(),
      });
    });

    it("should return a 401 if the user is not authenticated", async () => {
      // act
      const response = await agent.get("/v1/users/auth-user");

      // assert
      expect(response.status).toBe(401);
      expect(response.body.isSuccess).toBe(false);
      expect(response.body.message).toBe("Unauthorized");
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
      const response = await agent.get(`/v1/users/${user.id}`);

      // assert
      expect(response.status).toBe(401);
      expect(response.body.isSuccess).toBe(false);
      expect(response.body.message).toBe("Unauthorized");
    });

    it("should return a 404 if the user does not exist", async () => {
      // arrange
      const loggedUser = await createAndAuthTestUser(agent);

      // act
      const response = await agent.get(`/v1/users/${loggedUser.id + "nonexistent-id"}`);

      // assert
      expect(response.status).toBe(404);
      expect(response.body.isSuccess).toBe(false);
      expect(response.body.message).toBe("User not found");
    });
  });
});
