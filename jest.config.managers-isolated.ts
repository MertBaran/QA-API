// Isolated unit test config for managers - no MongoDB or external dependencies
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/unit/services/managers/*.search.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  // No setupFilesAfterEnv - completely isolated
  testTimeout: 60000,
  verbose: true,
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};

export default config;
