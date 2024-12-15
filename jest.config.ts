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
  moduleNameMapper: {
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@toolbox/(.*)$": "<rootDir>/src/toolbox/src/$1",
    "^src/(.*)$": "<rootDir>/src/$1",
  },
};

export default config;
