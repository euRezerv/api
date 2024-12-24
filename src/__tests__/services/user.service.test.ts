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

    it("should return null if the user does not exist", async () => {
      // act
      const result = await UserService.getUserById("non-existing-id");

      // assert
      expect(result).toBeNull();
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

  describe("getUserByEmail", () => {
    it("should return the user with the given email", async () => {
      // arrange
      const dbUser = await createTestUser();

      // act
      const result = await UserService.getUserByEmail(dbUser.email);

      // assert
      expect(result).toEqual(dbUser);
    });

    it("should return null if the user does not exist", async () => {
      // act
      const result = await UserService.getUserByEmail("non-existing-email");

      // assert
      expect(result).toBeNull();
    });

    it("should return null if the user was deleted", async () => {
      // arrange
      const dbUser = await createTestUser({ deletedAt: new Date() });

      // act
      const result = await UserService.getUserByEmail(dbUser.email);

      // assert
      expect(result).toBeNull();
    });
  });

  describe("getUserByPhoneNumber", () => {
    it("should return the user with the given phone number", async () => {
      // arrange
      const dbUser = await createTestUser();

      // act
      const result = await UserService.getUserByPhoneNumber(dbUser.phoneNumber, dbUser.phoneNumberCountryISO);

      // assert
      expect(result).toEqual(dbUser);
    });

    it("should return null if the user does not exist", async () => {
      // act
      const result = await UserService.getUserByPhoneNumber("123456789", "US");

      // assert
      expect(result).toBeNull();
    });

    it("should return null if the user was deleted", async () => {
      // arrange
      const dbUser = await createTestUser({ deletedAt: new Date() });

      // act
      const result = await UserService.getUserByPhoneNumber(dbUser.phoneNumber, dbUser.phoneNumberCountryISO);

      // assert
      expect(result).toBeNull();
    });
  });
});
