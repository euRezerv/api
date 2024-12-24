import argon2 from "argon2";
import { clearTestDb, createTestUser } from "src/__tests__/testUtils/db";
import createServer from "src/config/server";
import supertest from "supertest";

describe("loginUser", () => {
  const app = createServer();

  beforeEach(() => {
    clearTestDb();
  });

  it("should return a 200 if the login is successful", async () => {
    // arrange
    const email = "myemail@test.com";
    const password = "Password123!";

    //  act
    const user = await createTestUser({ email, password: await argon2.hash(password) });
    const res = await supertest(app).post("/v1/users/auth/login").send({ identifier: email, password: password });

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

  it("should return a 400 if both the identifier and the password are missing", async () => {
    // arrange & act
    const res = await supertest(app).post("/v1/users/auth/login").send({});

    // assert
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      isSuccess: false,
      message: "Validation error",
      errors: [
        { message: "Identifier is required", field: "identifier" },
        { message: "Password is required", field: "password" },
      ],
    });
  });

  it("should return a 400 if the identifier is missing", async () => {
    // arrange & act
    const res = await supertest(app).post("/v1/users/auth/login").send({ password: "password123" });

    // assert
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      isSuccess: false,
      message: "Validation error",
      errors: [{ message: "Identifier is required", field: "identifier" }],
    });
  });

  it("should return a 400 if the identifier only contains whitespaces", async () => {
    // arrange & act
    const res = await supertest(app).post("/v1/users/auth/login").send({ identifier: "   ", password: "password123" });

    // assert
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      isSuccess: false,
      message: "Validation error",
      errors: [{ message: "Identifier is required", field: "identifier" }],
    });
  });

  it("should return a 400 if the password is missing", async () => {
    // arrange & act
    const res = await supertest(app).post("/v1/users/auth/login").send({ identifier: "Plosnitapufoasa2000" });

    // assert
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      isSuccess: false,
      message: "Validation error",
      errors: [{ message: "Password is required", field: "password" }],
    });
  });

  it("should return a 400 if the password only contains whitespaces", async () => {
    // arrange & act
    const res = await supertest(app)
      .post("/v1/users/auth/login")
      .send({ identifier: "Plosnitapufoasa2000", password: "   " });

    // assert
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      isSuccess: false,
      message: "Validation error",
      errors: [{ message: "Password is required", field: "password" }],
    });
  });

  it("should return a 401 if identifier (phoneNumber / email) not found", async () => {
    // act
    const res = await supertest(app)
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

    // act
    await createTestUser({ email, password: await argon2.hash(password) });
    const res = await supertest(app).post("/v1/users/auth/login").send({ identifier: email, password: "wrong-password" });

    // assert
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      isSuccess: false,
      message: "Failed to login",
      errors: [{ message: "Invalid credentials" }],
    });
  });
});
