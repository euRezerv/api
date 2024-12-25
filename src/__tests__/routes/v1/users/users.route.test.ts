import { authTestUser, clearTestDb, createTestUser, getTestUser } from "src/__tests__/testUtils/db";
import createServer from "src/config/server";
import supertest from "supertest";
import TestAgent from "supertest/lib/agent";

describe("/v1/users", () => {
  let agent: InstanceType<typeof TestAgent>;

  beforeEach(async () => {
    agent = supertest.agent(createServer());
    await clearTestDb();
  });

  describe("GET /:id", () => {
    it("should return a 200 and the user", async () => {
      // arrange
      const loggedUserInfo = await getTestUser();
      const loggedUser = await createTestUser(loggedUserInfo.data);
      await authTestUser(loggedUserInfo.data.email, loggedUserInfo.plainPassword, agent);
      const user = await createTestUser();

      // act
      const loggedUserResponse = await agent.get(`/v1/users/${loggedUser.id}`);
      const userResponse = await agent.get(`/v1/users/${user.id}`);

      // assert
      expect(loggedUserResponse.status).toBe(200);
      expect(loggedUserResponse.body.isSuccess).toBe(true);
      expect(loggedUserResponse.body.data.user).toMatchObject({
        id: loggedUser.id,
        firstName: loggedUser.firstName,
        lastName: loggedUser.lastName,
        email: loggedUser.email,
        isEmailVerified: loggedUser.isEmailVerified,
        isPhoneVerified: loggedUser.isPhoneVerified,
        isSystemAdmin: loggedUser.isSystemAdmin,
        createdAt: loggedUser.createdAt.toISOString(),
      });

      expect(userResponse.status).toBe(200);
      expect(userResponse.body.isSuccess).toBe(true);
      expect(userResponse.body.data.user).toMatchObject({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isSystemAdmin: user.isSystemAdmin,
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
      const loggedUserInfo = await getTestUser();
      const loggedUser = await createTestUser(loggedUserInfo.data);
      await authTestUser(loggedUserInfo.data.email, loggedUserInfo.plainPassword, agent);

      // act
      const response = await agent.get(`/v1/users/nonexistent-id`);

      // assert
      expect(response.status).toBe(404);
      expect(response.body.isSuccess).toBe(false);
      expect(response.body.message).toBe("User not found");
    });
  });
});
