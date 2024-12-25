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
    "<rootDir>/src/__tests__/testUtils/",
    // Remove
    "<rootDir>/src/toolbox/",
  ],
  coverageDirectory: "<rootDir>/src/__tests__/coverage/",
  coveragePathIgnorePatterns: [
    "<rootDir>/src/__tests__/",
    "<rootDir>/src/config/server.ts",
    "<rootDir>/src/config/session.ts",
    "<rootDir>/src/config/swagger.ts",
  ],
  resetMocks: true,
  moduleNameMapper: {
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@toolbox/(.*)$": "<rootDir>/src/toolbox/src/$1",
    "^src/(.*)$": "<rootDir>/src/$1",
  },
};

export default config;
