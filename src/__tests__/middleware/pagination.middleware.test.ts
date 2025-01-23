import { addPagination } from "src/middleware/pagination.middleware";
import { Request, Response, Express } from "express";
import TestAgent from "supertest/lib/agent";
import createServer from "src/config/server";
import supertest from "supertest";
import { App } from "supertest/types";
import { standardResponse } from "@utils/responses";

const baseUrl = "/test-pagination-middleware";

const createTestServerWithPagination = () => {
  const app: Express = createServer();

  app.get(baseUrl, addPagination, (req: Request, res: Response) => {
    res.status(200).json(
      standardResponse({
        isSuccess: true,
        res,
        message: "Pagination applied",
        data: req.pagination,
      })
    );
  });

  return app;
};

describe("addPagination", () => {
  let agent: InstanceType<typeof TestAgent>;

  beforeEach(async () => {
    agent = supertest.agent(createTestServerWithPagination());
  });

  it("should apply pagination when query parameters are provided", async () => {
    const test1 = async () => {
      // arrange
      const page = 2;
      const pageSize = 20;

      // act
      const res = await agent.get(baseUrl).query({ page, pageSize });

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data).toEqual({
        skip: 20,
        take: 20,
        page: page,
        pageSize: pageSize,
      });
    };

    const test2 = async () => {
      // arrange
      const page = 5;
      const pageSize = 10;

      // act
      const res = await agent.get(baseUrl).query({ page, pageSize });

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data).toEqual({
        skip: 40,
        take: 10,
        page: page,
        pageSize: pageSize,
      });
    };

    const test3 = async () => {
      // arrange
      const page = 1;
      const pageSize = 5;

      // act
      const res = await agent.get(baseUrl).query({ page, pageSize });

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data).toEqual({
        skip: 0,
        take: 5,
        page: page,
        pageSize: pageSize,
      });
    };

    const test4 = async () => {
      // arrange
      const page = 1;
      const pageSize = 100;

      // act
      const res = await agent.get(baseUrl).query({ page, pageSize });

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data).toEqual({
        skip: 0,
        take: 100,
        page: page,
        pageSize: pageSize,
      });
    };

    const test5 = async () => {
      // arrange
      const page = 100;
      const pageSize = 100;

      // act
      const res = await agent.get(baseUrl).query({ page, pageSize });

      // assert
      expect(res.status).toBe(200);
      expect(res.body.isSuccess).toBe(true);
      expect(res.body.data).toEqual({
        skip: 9900,
        take: 100,
        page: page,
        pageSize: pageSize,
      });
    };

    await test1();
    await test2();
    await test3();
    await test4();
    await test5();
  });

  it("should apply pagination when only page query parameter is provided", async () => {
    // arrange
    const page = 2;

    // act
    const res = await agent.get(baseUrl).query({ page });

    // assert
    expect(res.status).toBe(200);
    expect(res.body.isSuccess).toBe(true);
    expect(res.body.data).toEqual({
      skip: 10,
      take: 10,
      page: page,
      pageSize: 10,
    });
  });

  it("should apply pagination when only pageSize query parameter is provided", async () => {
    // arrange
    const pageSize = 20;

    // act
    const res = await agent.get(baseUrl).query({ pageSize });

    // assert
    expect(res.status).toBe(200);
    expect(res.body.isSuccess).toBe(true);
    expect(res.body.data).toEqual({
      skip: 0,
      take: 20,
      page: 1,
      pageSize: pageSize,
    });
  });

  it("should apply default pagination when no query parameters are provided", async () => {
    // act
    const res = await agent.get(baseUrl);

    // assert
    expect(res.status).toBe(200);
    expect(res.body.isSuccess).toBe(true);
    expect(res.body.data).toEqual({
      skip: 0,
      take: 10,
      page: 1,
      pageSize: 10,
    });
  });

  const validationTestCases = [
    {
      name: "page is lower than 1",
      query: { page: 0, pageSize: 10 },
      expectedErrors: [{ message: "Page must be greater than 0", field: "page" }],
    },
    {
      name: "pageSize is lower than 1",
      query: { page: 1, pageSize: 0 },
      expectedErrors: [{ message: "Page size must be a positive integer between 1 and 100", field: "pageSize" }],
    },
    {
      name: "pageSize is greater than 100",
      query: { page: 1, pageSize: 101 },
      expectedErrors: [{ message: "Page size must be a positive integer between 1 and 100", field: "pageSize" }],
    },
    {
      name: "page and pageSize are lower than 1",
      query: { page: 0, pageSize: 0 },
      expectedErrors: [
        { message: "Page must be greater than 0", field: "page" },
        { message: "Page size must be a positive integer between 1 and 100", field: "pageSize" },
      ],
    },
  ];

  validationTestCases.forEach(({ name, query, expectedErrors }) => {
    it(`should return 400 if ${name}`, async () => {
      // act
      const res = await agent.get(baseUrl).query(query);

      // assert
      expect(res.status).toBe(400);
      expect(res.body.isSuccess).toBe(false);
      expect(res.body.message).toBe("Validation error");
      const mappedResBodyErrors = res.body.errors.map((error: any) => ({ message: error.message, field: error.field }));
      expectedErrors.forEach((expectedError) => {
        expect(mappedResBodyErrors).toEqual(
          expect.arrayContaining([
            {
              message: expect.stringContaining(expectedError.message),
              field: expectedError.field,
            },
          ])
        );
      });
    });
  });
});
