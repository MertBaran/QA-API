import { ObjectStorageConfig } from './object-storage/ObjectStorageConfig';

export interface IEnvironmentProvider {
  getEnvironment(): string;
  isProduction(): boolean;
  isTest(): boolean;
  isDevelopment(): boolean;
  getEnvironmentVariable(key: string, defaultValue?: string): string;
  getEnvironmentVariableAsNumber(key: string, defaultValue?: number): number;
  getEnvironmentVariableAsBoolean(key: string, defaultValue?: boolean): boolean;
  getObjectStorageConfig(): ObjectStorageConfig;
}
