import UserService from "src/services/user.service";
import { clearTestDb, createTestUser } from "../testUtils/db";

describe("UserService", () => {
  beforeEach(async () => {
    await clearTestDb();
  });

  describe("getUserById", () => {
    it("should return the user with the given id", async () => {
      // arrange
      const dbUser = await createTestUser();

      // act
      const result = await UserService.getUserById(dbUser.id);

      // assert
      expect(result).toEqual(dbUser);
    });

    it("should return null if the user was deleted", async () => {
      // arrange
      const dbUser = await createTestUser({ deletedAt: new Date() });

      // act
      const result = await UserService.getUserById(dbUser.id);

      // assert
      expect(result).toBeNull();
    });
  });
});
