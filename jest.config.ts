import type { Config } from "jest";

const config: Config = {
  verbose: true,
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: [
    "<rootDir>/src/__tests__/coverage/",
    "<rootDir>/build/",
    "<rootDir>/logs/",
    "<rootDir>/node_modules/",
    "<rootDir>/prisma/",
  ],
  coverageDirectory: "<rootDir>/src/__tests__/coverage/",
  resetMocks: true,
};

export default config;
