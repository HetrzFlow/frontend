import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  testMatch: ['**/__tests__/integration/**/*.test.ts'],
  testTimeout: 60000,
  verbose: true,
  collectCoverage: false,
  maxWorkers: 1,
  globalSetup: undefined,
  globalTeardown: undefined,
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/integration.setup.ts'],
};

export default config;
