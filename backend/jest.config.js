module.exports = {
  testEnvironment: "node",
  setupFiles: ["dotenv/config"],
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  clearMocks: true
};
