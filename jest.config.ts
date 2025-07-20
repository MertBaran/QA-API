// jest.config.ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 60000, // Increased to 60 seconds
  verbose: true,
  maxWorkers: 1, // Run tests serially to avoid conflicts
  forceExit: true, // Force exit to prevent hanging
  detectOpenHandles: true, // Detect handles preventing exit
  collectCoverageFrom: [
    'src/**/*.ts',
    'controllers/**/*.ts',
    'models/**/*.ts',
    'middlewares/**/*.ts',
    'services/**/*.ts',
    'repositories/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/tests/**',
  ],
  coverageDirectory: 'coverage',
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
