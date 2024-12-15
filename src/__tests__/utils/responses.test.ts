import { StandardErrorType, StandardResponseType } from "@toolbox/response/types/types";
import { getPaginationResponse, standardResponse } from "@utils/responses";
import { Response } from "express";

describe("standardResponse", () => {
  const getMockResponse = (statusCode: number): Partial<Response> => {
    return {
      statusCode,
    };
  };

  it("should return a successful response with data and a default status code", () => {
    const data = { key: "value" };
    const result = standardResponse({
      isSuccess: true,
      res: getMockResponse(200) as Response,
      data,
      message: "Operation successful",
    });

    expect(result).toEqual<StandardResponseType<typeof data>>({
      isSuccess: true,
      statusCode: 200,
      message: "Operation successful",
      data,
      timestamp: expect.any(String),
    });
  });

  it("should default to 200 or 400 if res is provided without a statusCode", () => {
    const mockResponse = {} as Response;

    const successResult = standardResponse({
      isSuccess: true,
      res: mockResponse,
    });
    expect(successResult.statusCode).toBe(200);

    const failureResult = standardResponse({
      isSuccess: false,
      res: mockResponse,
    });
    expect(failureResult.statusCode).toBe(400);
  });

  it("should return a failure response with normalized string error", () => {
    const errors = "Something went wrong";
    const result = standardResponse({
      isSuccess: false,
      res: getMockResponse(400) as Response,
      errors,
    });

    expect(result).toEqual<StandardResponseType<{}>>({
      isSuccess: false,
      statusCode: 400,
      errors: [{ message: errors }],
      timestamp: expect.any(String),
    });
  });

  it("should normalize array of errors", () => {
    const errors = ["Error 1", "Error 2"];
    const result = standardResponse({
      isSuccess: false,
      res: getMockResponse(400) as Response,
      errors,
    });

    expect(result).toEqual<StandardResponseType<{}>>({
      isSuccess: false,
      statusCode: 400,
      errors: [{ message: "Error 1" }, { message: "Error 2" }],
      timestamp: expect.any(String),
    });
  });

  it("should normalize an Error object", () => {
    const error = new Error("Internal server error");
    const result = standardResponse({
      isSuccess: false,
      res: getMockResponse(400) as Response,
      errors: error,
    });

    expect(result).toEqual<StandardResponseType<{}>>({
      isSuccess: false,
      statusCode: 400,
      errors: [{ message: error.message }],
      timestamp: expect.any(String),
    });
  });

  it("should normalize an array of Error objects", () => {
    const errors = [new Error("Internal server error"), new Error("Failed to access database")];
    const result = standardResponse({
      isSuccess: false,
      res: getMockResponse(400) as Response,
      errors,
    });

    expect(result).toEqual<StandardResponseType<{}>>({
      isSuccess: false,
      statusCode: 400,
      errors: errors.map((error) => ({ message: error.message, stack: error.stack })),
      timestamp: expect.any(String),
    });
  });

  it("should use custom status code if provided", () => {
    const result = standardResponse({
      isSuccess: true,
      res: getMockResponse(200) as Response,
      statusCode: 201,
      message: "Resource created",
    });

    expect(result).toEqual<StandardResponseType<{}>>({
      isSuccess: true,
      statusCode: 201,
      message: "Resource created",
      timestamp: expect.any(String),
    });
  });

  it("should handle no errors and no data gracefully", () => {
    const result = standardResponse({
      isSuccess: true,
      res: getMockResponse(200) as Response,
    });

    expect(result).toEqual<StandardResponseType<{}>>({
      isSuccess: true,
      statusCode: 200,
      timestamp: expect.any(String),
    });
  });

  it("should correctly normalize StandardErrorType", () => {
    const errors: StandardErrorType = { message: "Validation error", field: "email" };
    const result = standardResponse({
      isSuccess: false,
      res: getMockResponse(400) as Response,
      errors,
    });

    expect(result).toEqual<StandardResponseType<{}>>({
      isSuccess: false,
      statusCode: 400,
      errors: [errors],
      timestamp: expect.any(String),
    });
  });

  it("should correctly normalize StandardErrorType array", () => {
    const errors: StandardErrorType[] = [
      { message: "Validation error", field: "email" },
      { message: "Validation error", field: "password" },
    ];
    const result = standardResponse({
      isSuccess: false,
      res: getMockResponse(400) as Response,
      errors,
    });

    expect(result).toEqual<StandardResponseType<{}>>({
      isSuccess: false,
      statusCode: 400,
      errors: errors,
      timestamp: expect.any(String),
    });
  });
});

describe("getPaginationResponse", () => {
  it("should return the correct pagination response for possible values", () => {
    expect(getPaginationResponse(1, 10, 100)).toEqual({
      pagination: {
        currentPage: 1,
        pageSize: 10,
        totalCount: 100,
        totalPages: 10,
      },
    });

    expect(getPaginationResponse(10, 10, 100)).toEqual({
      pagination: {
        currentPage: 10,
        pageSize: 10,
        totalCount: 100,
        totalPages: 10,
      },
    });

    expect(getPaginationResponse(1, 10, 0)).toEqual({
      pagination: {
        currentPage: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
    });
  });

  it("should return the correct pagination response for cases that should teoretically never happen", () => {
    expect(getPaginationResponse(2, 10, 1)).toEqual({
      pagination: {
        currentPage: 2,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1,
      },
    });
  });
});
