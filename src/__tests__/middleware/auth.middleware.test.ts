import { isAuthenticated } from "../../middleware/auth.middleware";
import { Request, Response, NextFunction } from "express";
import { standardResponse } from "@utils/responses";

jest.mock("@utils/responses");

describe("isAuthenticated.local", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      isAuthenticated: jest.fn() as unknown as Express.AuthenticatedRequest["isAuthenticated"],
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should call next if user is authenticated", () => {
    // arrange
    (req.isAuthenticated as unknown as jest.Mock).mockReturnValue(true);

    // act
    isAuthenticated.local(req as Request, res as Response, next);

    // assert
    expect(req.isAuthenticated).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should return 401 if user is not authenticated", () => {
    // arrange
    (req.isAuthenticated as unknown as jest.Mock).mockReturnValue(false);

    // act
    isAuthenticated.local(req as Request, res as Response, next);

    // assert
    expect(req.isAuthenticated).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      standardResponse({ isSuccess: false, res: res as Response, message: "Unauthorized" })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
