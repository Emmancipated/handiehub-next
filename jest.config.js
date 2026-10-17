/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  moduleNameMapper: {
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
    "^@/(.*)$": "<rootDir>/app/$1",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  setupFiles: ["<rootDir>/test/setup.ts"],
};
