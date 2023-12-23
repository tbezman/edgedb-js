/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  setupFilesAfterEnv: ["./src/jestPolyfills.ts", "./src/setupJest.ts"],
  testEnvironment: "jsdom",
  moduleDirectories: ["node_modules", "../../node_modules"],
  testPathIgnorePatterns: ["./dist", "./esm", "./mts", "./cjs", "./deno"],
  transform: {},
  globals: {
    "ts-jest": {
      diagnostics: false,
    },
  },
};
