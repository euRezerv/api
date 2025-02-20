import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

import prisma from "@utils/prisma";

/*
 * Used for unit testing controllers and services that use Prisma.
 * Mocks PrismaClient to avoid making actual database calls.
 * */
jest.mock("@utils/prisma", () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  mockReset(prismaMock);
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
