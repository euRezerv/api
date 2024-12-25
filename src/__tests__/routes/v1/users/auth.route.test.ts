import log from "@utils/logger";
import argon2 from "argon2";
import { clearTestDb, createTestUser, getTestUserData } from "src/__tests__/testUtils/db";
import createServer from "src/config/server";
import supertest from "supertest";
import TestAgent from "supertest/lib/agent";

describe("/v1/users/auth", () => {
  let agent: InstanceType<typeof TestAgent>;

  beforeEach(async () => {
    agent = supertest.agent(createServer());
    await clearTestDb();
  });

  describe("POST /login", () => {
    it("should return a 200 if the login is successful", async () => {
      // arrange
      const email = "myemail@test.com";
      const password = "Password123!";
      const hashedPassword = await argon2.hash(password);

      //  act
      const user = await createTestUser({ email, password: hashedPassword });
      const res = await agent.post("/v1/users/auth/login").send({ identifier: email, password: password });

      // assert
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        isSuccess: true,
        message: "Logged in successfully",
      });
      expect(res.body.data).toMatchObject({
        user: {
          id: user.id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    });

    const payloadValidationTestCases = [
      {
        name: "missing identifier and password",
        payload: {},
        expectedErrors: [
          { message: "Identifier is required", field: "identifier" },
          { message: "Password is required", field: "password" },
        ],
      },
      {
        name: "missing identifier",
        payload: { password: "Password123!" },
        expectedErrors: [{ message: "Identifier is required", field: "identifier" }],
      },
      {
        name: "identifier contains only whitespaces",
        payload: { identifier: "   ", password: "Password123!" },
        expectedErrors: [{ message: "Identifier is required", field: "identifier" }],
      },
      {
        name: "missing password",
        payload: { identifier: "email@test.com" },
        expectedErrors: [{ message: "Password is required", field: "password" }],
      },
      {
        name: "missing password",
        payload: { identifier: "email@test.com", password: "   " },
        expectedErrors: [{ message: "Password is required", field: "password" }],
      },
    ];

    payloadValidationTestCases.forEach(({ name, payload, expectedErrors }) => {
      it(`should return a 400 if ${name}`, async () => {
        const res = await agent.post("/v1/users/auth/login").send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          isSuccess: false,
          message: "Validation error",
          errors: expectedErrors,
        });
      });
    });

    it("should return a 401 if identifier (phoneNumber / email) not found", async () => {
      // act
      const res = await agent
        .post("/v1/users/auth/login")
        .send({ identifier: "fake-email@test.com", password: "Password123" });

      // assert
      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        isSuccess: false,
        message: "Failed to login",
        errors: [{ message: "Invalid credentials" }],
      });
    });

    it("should return a 401 if password is incorrect", async () => {
      // arrange
      const email = "myemail@test.com";
      const password = "Password123!";
      const hashedPassword = await argon2.hash(password);

      // act
      await createTestUser({ email, password: hashedPassword });
      const res = await agent.post("/v1/users/auth/login").send({ identifier: email, password: "wrong-password" });

      // assert
      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        isSuccess: false,
        message: "Failed to login",
        errors: [{ message: "Invalid credentials" }],
      });
    });
  });

  describe("POST /logout", () => {
    it("should return a 200 if the logout is successful", async () => {
      // arrange
      const email = "myemail@test.com";
      const password = "Password123!";
      const hashedPassword = await argon2.hash(password);

      // act
      await createTestUser({ email, password: hashedPassword });
      await agent.post("/v1/users/auth/login").send({ identifier: email, password });
      const res = await agent.post("/v1/users/auth/logout");

      // assert
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        isSuccess: true,
        message: "Logged out successfully",
      });
    });

    it("should return a 400 if the user is not logged in", async () => {
      // act
      const res = await agent.post("/v1/users/auth/logout");

      // assert
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        isSuccess: false,
        message: "User is not logged in",
      });
    });
  });

  describe("POST /register", () => {
    const getRegisterPayload = async () => {
      const userData = await getTestUserData();

      return {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phoneNumberCountryISO: userData.phoneNumberCountryISO,
        phoneNumber: userData.phoneNumber,
        password: userData.password,
      };
    };

    it("should return a 201 if the registration is successful", async () => {
      // arrange
      const payload = await getRegisterPayload();

      // act
      const res = await agent.post("/v1/users/auth/register").send(payload);

      // assert
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        isSuccess: true,
        message: "User registered successfully",
      });
    });

    const payloadValidationTestCases = [
      {
        name: "missing firstName, lastName, email, phoneNumberCountryISO, phoneNumber, password",
        getPayload: async () => ({}),
        expectedErrors: [
          { message: "First name is required", field: "firstName" },
          { message: "Last name is required", field: "lastName" },
          { message: "Email is required", field: "email" },
          { message: "Phone number prefix is required", field: "phoneNumberCountryISO" },
          { message: "Phone number is required", field: "phoneNumber" },
          { message: "Password is required", field: "password" },
        ],
      },
      {
        name: "firstName, lastName, email, phoneNumberCountryISO, phoneNumber, password only contain whitespaces",
        getPayload: async () => ({
          firstName: "   ",
          lastName: "   ",
          email: "   ",
          phoneNumberCountryISO: "   ",
          phoneNumber: "   ",
          password: "   ",
        }),
        expectedErrors: [
          { message: "First name is required", field: "firstName" },
          { message: "Last name is required", field: "lastName" },
          { message: "Email is required", field: "email" },
          { message: "Phone number prefix is required", field: "phoneNumberCountryISO" },
          { message: "Phone number is required", field: "phoneNumber" },
          { message: "Password is required", field: "password" },
        ],
      },
      {
        name: "firstName, lastName are less than 2 characters",
        getPayload: async () => ({ ...(await getRegisterPayload()), firstName: "a", lastName: "b" }),
        expectedErrors: [
          { message: "First name must be at least 2 characters long", field: "firstName" },
          { message: "Last name must be at least 2 characters long", field: "lastName" },
        ],
      },
      {
        name: "email is invalid",
        getPayload: async () => ({ ...(await getRegisterPayload()), email: "invalid-email" }),
        expectedErrors: [{ message: "Email is invalid", field: "email" }],
      },
      {
        name: "phoneNumberCountryISO is not supported",
        getPayload: async () => ({ ...(await getRegisterPayload()), phoneNumberCountryISO: "ENG" }),
        expectedErrors: [{ message: "Phone number prefix is not supported", field: "phoneNumberCountryISO" }],
      },
      {
        name: "phoneNumber is invalid",
        getPayload: async () => ({ ...(await getRegisterPayload()), phoneNumber: "123" }),
        expectedErrors: [{ message: "Phone number is invalid", field: "phoneNumber" }],
      },
      {
        name: "password is less than 8 characters",
        getPayload: async () => ({ ...(await getRegisterPayload()), password: "1234567" }),
        expectedErrors: [{ message: "Password must be at least 8 characters long", field: "password" }],
      },
      {
        name: "password contains spaces",
        getPayload: async () => ({ ...(await getRegisterPayload()), password: "password 123" }),
        expectedErrors: [{ message: "Password must not contain spaces", field: "password" }],
      },
      {
        name: "password does not contain an uppercase letter, a number, and a symbol",
        getPayload: async () => ({ ...(await getRegisterPayload()), password: "password" }),
        expectedErrors: [
          { message: "Password must contain at least 1 uppercase letter, 1 number, and 1 symbol", field: "password" },
        ],
      },
    ];

    payloadValidationTestCases.forEach(({ name, getPayload, expectedErrors }) => {
      it(`should return a 400 if ${name}`, async () => {
        // arrange
        const payload = await getPayload();

        // act
        const res = await agent.post("/v1/users/auth/register").send(payload);

        // assert
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          isSuccess: false,
          message: "Validation error",
        });
        const mappedResBodyErrors = res.body.errors.map((error: any) => ({ message: error.message, field: error.field }));
        expect(mappedResBodyErrors).toEqual(expect.arrayContaining(expectedErrors));
      });
    });

    it("should return a 409 if the email already exists", async () => {
      // arrange
      const payload = await getRegisterPayload();
      await createTestUser({ email: payload.email });

      // act
      const res = await agent.post("/v1/users/auth/register").send(payload);

      // assert
      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({
        isSuccess: false,
        message: "An account with these details already exists",
      });
    });

    it("should return a 409 if the email already exists, but the user was soft deleted", async () => {
      // arrange
      const payload = await getRegisterPayload();
      await createTestUser({ email: payload.email, deletedAt: new Date() });

      // act
      const res = await agent.post("/v1/users/auth/register").send(payload);

      // assert
      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({
        isSuccess: false,
        message: "An account with these details already exists",
      });
    });

    it("should return a 409 if the phoneNumber already exists", async () => {
      // arrange
      const payload = await getRegisterPayload();
      await createTestUser({ phoneNumber: payload.phoneNumber });

      // act
      const res = await agent.post("/v1/users/auth/register").send(payload);

      // assert
      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({
        isSuccess: false,
        message: "An account with these details already exists",
      });
    });

    it("should return a 409 if the phoneNumber already exists, but the user was soft deleted", async () => {
      // arrange
      const payload = await getRegisterPayload();
      await createTestUser({ phoneNumber: payload.phoneNumber, deletedAt: new Date() });

      // act
      const res = await agent.post("/v1/users/auth/register").send(payload);

      // assert
      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({
        isSuccess: false,
        message: "An account with these details already exists",
      });
    });

    it("should return a 500 if an error occurs while creating the user", async () => {
      const silenceLogs = jest.spyOn(log, "error").mockImplementation();

      // arrange
      const payload = await getRegisterPayload();
      jest.spyOn(argon2, "hash").mockRejectedValue(new Error("Failed to hash password"));

      // act
      const res = await agent.post("/v1/users/auth/register").send(payload);

      // assert
      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        isSuccess: false,
        message: "Something went wrong",
      });

      silenceLogs.mockRestore();
    });
  });
});
