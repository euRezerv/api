import { HTTP_RESPONSES, jsonRequestBody, SwaggerDocsManager } from "@utils/swaggerDocs";
import { OpenAPIV3 } from "openapi-types";

describe("SwaggerDocsManager", () => {
  let manager: SwaggerDocsManager;

  beforeEach(() => {
    manager = new SwaggerDocsManager();
  });

  it("should initialize with an empty docs object", () => {
    // assert
    expect(manager.getDocs()).toEqual({});
  });

  it("should add and aggregate documentation correctly", () => {
    // arrange
    const doc1: Record<string, OpenAPIV3.PathItemObject> = {
      "/users": {
        get: { summary: "Get all users", responses: { 200: { description: "Success" } } },
      },
    };

    const doc2: Record<string, OpenAPIV3.PathItemObject> = {
      "/users": {
        post: { summary: "Create a user", responses: { 201: { description: "Created" } } },
      },
      "/auth": {
        post: { summary: "Authenticate user", responses: { 200: { description: "Authenticated" } } },
      },
    };

    // act
    manager.add(doc1);
    manager.add(doc2);

    // assert
    expect(manager.getDocs()).toEqual({
      "/users": {
        get: { summary: "Get all users", responses: { 200: { description: "Success" } } },
      },
    });

    expect(manager.getDocs()).toEqual({
      "/users": {
        get: { summary: "Get all users", responses: { 200: { description: "Success" } } },
        post: { summary: "Create a user", responses: { 201: { description: "Created" } } },
      },
      "/auth": {
        post: { summary: "Authenticate user", responses: { 200: { description: "Authenticated" } } },
      },
    });
  });
});

describe("HTTP_RESPONSES", () => {
  it("should generate a 200 OK response with default properties", () => {
    // assert
    expect(HTTP_RESPONSES.OK200()).toEqual({
      200: { description: "Success" },
    });
  });

  it("should generate a 201 Created response with default properties", () => {
    // assert
    expect(HTTP_RESPONSES.CREATED201()).toEqual({
      201: { description: "Created" },
    });
  });

  it("should generate a 400 Bad Request response with custom properties", () => {
    // assert
    expect(HTTP_RESPONSES.BAD_REQUEST400({ description: "Invalid input data" })).toEqual({
      400: { description: "Invalid input data" },
    });
  });

  it("should generate a 401 Unauthorized response with default properties", () => {
    // assert
    expect(HTTP_RESPONSES.UNAUTHORIZED401()).toEqual({
      401: { description: "Unauthorized" },
    });
  });

  it("should generate a 404 Not Found response with default properties", () => {
    // assert
    expect(HTTP_RESPONSES.NOT_FOUND404()).toEqual({
      404: { description: "Not found" },
    });
  });

  it("should generate a 409 Conflict response with default properties", () => {
    // assert
    expect(HTTP_RESPONSES.CONFLICT409()).toEqual({
      409: { description: "Conflict" },
    });
  });

  it("should generate a 500 Internal Server Error response with custom properties", () => {
    // assert
    expect(HTTP_RESPONSES.INTERNAL_SERVER_ERROR500({ headers: { "Retry-After": { schema: { type: "integer" } } } })).toEqual(
      {
        500: {
          description: "Internal server error",
          headers: { "Retry-After": { schema: { type: "integer" } } },
        },
      }
    );
  });
});

describe("jsonRequestBody", () => {
  it("should generate a request body object with specified properties", () => {
    // arrange
    const properties: Record<string, OpenAPIV3.SchemaObject> = {
      name: { type: "string" },
      age: { type: "integer" },
    };

    // assert
    expect(jsonRequestBody(properties)).toEqual({
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              age: { type: "integer" },
            },
          },
        },
      },
    });
  });

  it("should include additional properties from extras", () => {
    // arrange
    const properties: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> = {
      email: { type: "string", format: "email" },
    };

    // assert
    expect(jsonRequestBody(properties, { description: "User data", required: false })).toEqual({
      required: false,
      description: "User data",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: { email: { type: "string", format: "email" } },
          },
        },
      },
    });
  });
});
