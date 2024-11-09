import { standardResponse } from "@common/response/responses";
import { Request, Response, NextFunction } from "express";
import argon2 from "argon2";

export async function validatePassword(inputPassword: string, hashedPassword: string) {
  return argon2.verify(hashedPassword, inputPassword);
}

export const isAuthenticated = {
  local: (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    } else {
      res.status(401).json(standardResponse({ isSuccess: false, res, message: "Unauthorized." }));
    }
  },
};
