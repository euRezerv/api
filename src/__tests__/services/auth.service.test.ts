import { isAuthenticated } from "../../services/auth.service";
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
    (req.isAuthenticated as unknown as jest.Mock).mockReturnValue(true);

    isAuthenticated.local(req as Request, res as Response, next);

    expect(req.isAuthenticated).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should return 401 if user is not authenticated", () => {
    (req.isAuthenticated as unknown as jest.Mock).mockReturnValue(false);

    isAuthenticated.local(req as Request, res as Response, next);

    expect(req.isAuthenticated).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      standardResponse({ isSuccess: false, res: res as Response, message: "Unauthorized" })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
