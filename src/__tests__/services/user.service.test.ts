import UserService from "src/services/user.service";
import { clearTestDb, createTestUser, getTestGoogleProfileData, getTestLocalProfile } from "../testUtils/db";
import log from "@utils/logger";

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
      const dbUser = await createTestUser({ userData: { deletedAt: new Date() } });

      // act
      const result = await UserService.getUserById(dbUser.id);

      // assert
      expect(result).toBeNull();
    });

    it("should return the existing user if specified to include soft deleted users", async () => {
      // arrange
      const dbUser = await createTestUser();

      // act
      const result = await UserService.getUserById(dbUser.id, true);

      // assert
      expect(result).toEqual(dbUser);
    });

    it("should return the deleted user if specified to include soft deleted users", async () => {
      // arrange
      const dbUser = await createTestUser({ userData: { deletedAt: new Date() } });

      // act
      const result = await UserService.getUserById(dbUser.id, true);

      // assert
      expect(result).toEqual(dbUser);
    });
  });

  describe("getUserByEmail", () => {
    it("should return the user with the given email", async () => {
      // arrange
      const dbUser = await createTestUser();

      // act
      const result = await UserService.getUserByEmail(dbUser.localProfile!.email);

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
      const dbUser = await createTestUser({ userData: { deletedAt: new Date() } });

      // act
      const result = await UserService.getUserByEmail(dbUser.localProfile!.email);

      // assert
      expect(result).toBeNull();
    });

    it("should return the existing user if specified to include soft deleted users", async () => {
      // arrange
      const dbUser = await createTestUser();

      // act
      const result = await UserService.getUserByEmail(dbUser.localProfile!.email, true);

      // assert
      expect(result).toEqual(dbUser);
    });

    it("should return the deleted user if specified to include soft deleted users", async () => {
      // arrange
      const dbUser = await createTestUser({ userData: { deletedAt: new Date() } });

      // act
      const result = await UserService.getUserByEmail(dbUser.localProfile!.email, true);

      // assert
      expect(result).toEqual(dbUser);
    });
  });

  describe("getUserByPhoneNumber", () => {
    it("should return the user with the given phone number", async () => {
      // arrange
      const dbUser = await createTestUser();

      // act
      const result = await UserService.getUserByPhoneNumber(
        dbUser.localProfile!.phoneNumber,
        dbUser.localProfile!.phoneNumberCountryISO
      );

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
      const dbUser = await createTestUser({ userData: { deletedAt: new Date() } });

      // act
      const result = await UserService.getUserByPhoneNumber(
        dbUser.localProfile!.phoneNumber,
        dbUser.localProfile!.phoneNumberCountryISO
      );

      // assert
      expect(result).toBeNull();
    });

    it("should return the existing user if specified to include soft deleted users", async () => {
      // arrange
      const dbUser = await createTestUser();

      // act
      const result = await UserService.getUserByPhoneNumber(
        dbUser.localProfile!.phoneNumber,
        dbUser.localProfile!.phoneNumberCountryISO,
        true
      );

      // assert
      expect(result).toEqual(dbUser);
    });

    it("should return the deleted user if specified to include soft deleted users", async () => {
      // arrange
      const dbUser = await createTestUser({ userData: { deletedAt: new Date() } });

      // act
      const result = await UserService.getUserByPhoneNumber(
        dbUser.localProfile!.phoneNumber,
        dbUser.localProfile!.phoneNumberCountryISO,
        true
      );

      // assert
      expect(result).toEqual(dbUser);
    });
  });

  describe("getUserByGoogleId", () => {
    it("should return the user with the given google id", async () => {
      // arrange
      const dbUser = await createTestUser({ googleProfileData: getTestGoogleProfileData() });

      // act
      const result = await UserService.getUserByGoogleId(dbUser.googleProfile!.googleId);

      // assert
      expect(result).toEqual(dbUser);
    });

    it("should return null if the user does not exist", async () => {
      // act
      const result = await UserService.getUserByGoogleId("non-existing-google-id");

      // assert
      expect(result).toBeNull();
    });

    it("should return null if the user was deleted", async () => {
      // arrange
      const dbUser = await createTestUser({
        googleProfileData: getTestGoogleProfileData(),
        userData: { deletedAt: new Date() },
      });

      // act
      const result = await UserService.getUserByGoogleId(dbUser.googleProfile!.googleId);

      // assert
      expect(result).toBeNull();
    });

    it("should return the existing user if specified to include soft deleted users", async () => {
      // arrange
      const dbUser = await createTestUser({ googleProfileData: getTestGoogleProfileData() });

      // act
      const result = await UserService.getUserByGoogleId(dbUser.googleProfile!.googleId, true);

      // assert
      expect(result).toEqual(dbUser);
    });

    it("should return the deleted user if specified to include soft deleted users", async () => {
      // arrange
      const dbUser = await createTestUser({
        googleProfileData: getTestGoogleProfileData(),
        userData: { deletedAt: new Date() },
      });

      // act
      const result = await UserService.getUserByGoogleId(dbUser.googleProfile!.googleId, true);

      // assert
      expect(result).toEqual(dbUser);
    });
  });

  describe("createUser", () => {
    it("should create a new empty user", async () => {
      // act
      const result = await UserService.createUser({});

      // assert
      expect(result).toMatchObject({
        id: expect.any(String),
        localProfile: null,
        googleProfile: null,
        deletedAt: null,
      });
    });

    it("should create a new user with provided data", async () => {
      // arrange
      const userData = {
        createdAt: new Date("2025-01-02"),
        updatedAt: new Date("2025-01-03"),
        deletedAt: new Date("2025-01-03"),
      };

      // act
      const result = await UserService.createUser({ userData });

      // assert
      expect(result).toMatchObject({
        id: expect.any(String),
        localProfile: null,
        googleProfile: null,
        ...userData,
      });
    });

    it("should create a new user with provided local profile", async () => {
      // arrange
      const localProfileData = (await getTestLocalProfile()).data;

      // act
      const result = await UserService.createUser({ localProfileData });

      // assert
      expect(result).toMatchObject({
        id: expect.any(String),
        localProfile: localProfileData,
        googleProfile: null,
        deletedAt: null,
      });
    });

    it("should create a new user with provided google profile", async () => {
      // arrange
      const googleProfileData = getTestGoogleProfileData();

      // act
      const result = await UserService.createUser({ googleProfileData });

      // assert
      expect(result).toMatchObject({
        id: expect.any(String),
        localProfile: null,
        googleProfile: googleProfileData,
        deletedAt: null,
      });
    });

    it("should create a new user with provided local and google profiles", async () => {
      // arrange
      const localProfileData = (await getTestLocalProfile()).data;
      const googleProfileData = getTestGoogleProfileData();

      // act
      const result = await UserService.createUser({ localProfileData, googleProfileData });

      // assert
      expect(result).toMatchObject({
        id: expect.any(String),
        localProfile: localProfileData,
        googleProfile: googleProfileData,
        deletedAt: null,
      });
    });

    it("should create a new user with provided local and google profiles and user data", async () => {
      // arrange
      const localProfileData = (await getTestLocalProfile()).data;
      const googleProfileData = getTestGoogleProfileData();
      const userData = {
        createdAt: new Date("2025-01-02"),
        updatedAt: new Date("2025-01-03"),
        deletedAt: new Date("2025-01-03"),
      };

      // act
      const result = await UserService.createUser({ localProfileData, googleProfileData, userData });

      // assert
      expect(result).toMatchObject({
        id: expect.any(String),
        localProfile: localProfileData,
        googleProfile: googleProfileData,
        ...userData,
      });
    });

    it("should throw an error if the email is duplicated", async () => {
      const silenceLogs = jest.spyOn(log, "error").mockImplementation();

      // arrange
      const email = "taken@email.com";
      await createTestUser({ localProfileData: { email } });
      const duplicatedUserLocalProfileData = {
        ...(await getTestLocalProfile()).data,
        email: email,
      };

      // act
      const promise = UserService.createUser({ localProfileData: duplicatedUserLocalProfileData });

      // assert
      await expect(promise).rejects.toThrow();

      silenceLogs.mockRestore();
    });

    it("should not throw an error if the phone number is duplicated but the ISO differs", async () => {
      // arrange
      const phoneNumber = "123456789";
      const phoneNumberCountryISO = "US";
      await createTestUser({ localProfileData: { phoneNumber, phoneNumberCountryISO } });
      const duplicatedUserLocalProfileData = {
        ...(await getTestLocalProfile()).data,
        phoneNumber,
        phoneNumberCountryISO: "CA",
      };

      // act
      const result = await UserService.createUser({ localProfileData: duplicatedUserLocalProfileData });

      // assert
      expect(result).toMatchObject({
        id: expect.any(String),
        localProfile: duplicatedUserLocalProfileData,
        googleProfile: null,
        deletedAt: null,
      });
    });

    it("should not throw an error if the phone number ISO is duplicated but the phone number differs", async () => {
      // arrange
      const phoneNumber = "123456789";
      const phoneNumberCountryISO = "US";
      await createTestUser({ localProfileData: { phoneNumber, phoneNumberCountryISO } });
      const duplicatedUserLocalProfileData = {
        ...(await getTestLocalProfile()).data,
        phoneNumber: "987654321",
        phoneNumberCountryISO,
      };

      // act
      const result = await UserService.createUser({ localProfileData: duplicatedUserLocalProfileData });

      // assert
      expect(result).toMatchObject({
        id: expect.any(String),
        localProfile: duplicatedUserLocalProfileData,
        googleProfile: null,
        deletedAt: null,
      });
    });

    it("should throw an error if the phone number is duplicated", async () => {
      const silenceLogs = jest.spyOn(log, "error").mockImplementation();

      // arrange
      const phoneNumber = "123456789";
      const phoneNumberCountryISO = "US";
      await createTestUser({ localProfileData: { phoneNumber, phoneNumberCountryISO } });
      const duplicatedUserLocalProfileData = {
        ...(await getTestLocalProfile()).data,
        phoneNumber,
        phoneNumberCountryISO,
      };

      // act
      const promise = UserService.createUser({ localProfileData: duplicatedUserLocalProfileData });

      // assert
      await expect(promise).rejects.toThrow();

      silenceLogs.mockRestore();
    });
  });
});
