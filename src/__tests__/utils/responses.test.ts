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
    // arrange
    const data = { key: "value" };

    // act
    const result = standardResponse({
      isSuccess: true,
      res: getMockResponse(200) as Response,
      data,
      message: "Operation successful",
    });

    // assert
    expect(result).toEqual<StandardResponseType<typeof data>>({
      isSuccess: true,
      statusCode: 200,
      message: "Operation successful",
      data,
      timestamp: expect.any(String),
    });
  });

  it("should default to 200 or 400 if res is provided without a statusCode", () => {
    // arrange
    const mockResponse = {} as Response;

    // act
    const successResult = standardResponse({
      isSuccess: true,
      res: mockResponse,
    });

    const failureResult = standardResponse({
      isSuccess: false,
      res: mockResponse,
    });

    // assert
    expect(successResult.statusCode).toBe(200);
    expect(failureResult.statusCode).toBe(400);
  });

  it("should return a failure response with normalized string error", () => {
    // arrange
    const errors = "Something went wrong";

    // act
    const result = standardResponse({
      isSuccess: false,
      res: getMockResponse(400) as Response,
      errors,
    });

    // assert
    expect(result).toEqual<StandardResponseType<{}>>({
      isSuccess: false,
      statusCode: 400,
      errors: [{ message: errors }],
      timestamp: expect.any(String),
    });
  });

  it("should normalize array of errors", () => {
    // arrange
    const errors = ["Error 1", "Error 2"];

    // act
    const result = standardResponse({
      isSuccess: false,
      res: getMockResponse(400) as Response,
      errors,
    });

    // assert
    expect(result).toEqual<StandardResponseType<{}>>({
      isSuccess: false,
      statusCode: 400,
      errors: [{ message: "Error 1" }, { message: "Error 2" }],
      timestamp: expect.any(String),
    });
  });

  it("should normalize an Error object", () => {
    // arrange
    const error = new Error("Internal server error");

    // act
    const result = standardResponse({
      isSuccess: false,
      res: getMockResponse(400) as Response,
      errors: error,
    });

    // assert
    expect(result).toEqual<StandardResponseType<{}>>({
      isSuccess: false,
      statusCode: 400,
      errors: [{ message: error.message }],
      timestamp: expect.any(String),
    });
  });

  it("should normalize an array of Error objects", () => {
    // arrange
    const errors = [new Error("Internal server error"), new Error("Failed to access database")];

    // act
    const result = standardResponse({
      isSuccess: false,
      res: getMockResponse(400) as Response,
      errors,
    });

    // assert
    expect(result).toEqual<StandardResponseType<{}>>({
      isSuccess: false,
      statusCode: 400,
      errors: errors.map((error) => ({ message: error.message, stack: error.stack })),
      timestamp: expect.any(String),
    });
  });

  it("should use custom status code if provided", () => {
    // act
    const result = standardResponse({
      isSuccess: true,
      res: getMockResponse(200) as Response,
      statusCode: 201,
      message: "Resource created",
    });

    // assert
    expect(result).toEqual<StandardResponseType<{}>>({
      isSuccess: true,
      statusCode: 201,
      message: "Resource created",
      timestamp: expect.any(String),
    });
  });

  it("should handle no errors and no data gracefully", () => {
    // act
    const result = standardResponse({
      isSuccess: true,
      res: getMockResponse(200) as Response,
    });

    // assert
    expect(result).toEqual<StandardResponseType<{}>>({
      isSuccess: true,
      statusCode: 200,
      timestamp: expect.any(String),
    });
  });

  it("should correctly normalize StandardErrorType", () => {
    // arrange
    const errors: StandardErrorType = { message: "Validation error", field: "email" };

    // act
    const result = standardResponse({
      isSuccess: false,
      res: getMockResponse(400) as Response,
      errors,
    });

    // assert
    expect(result).toEqual<StandardResponseType<{}>>({
      isSuccess: false,
      statusCode: 400,
      errors: [errors],
      timestamp: expect.any(String),
    });
  });

  it("should correctly normalize StandardErrorType array", () => {
    // arrange
    const errors: StandardErrorType[] = [
      { message: "Validation error", field: "email" },
      { message: "Validation error", field: "password" },
    ];

    // act
    const result = standardResponse({
      isSuccess: false,
      res: getMockResponse(400) as Response,
      errors,
    });

    // assert
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
    // act & assert
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
    // act & assert
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
