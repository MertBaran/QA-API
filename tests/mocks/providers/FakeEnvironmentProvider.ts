import { IEnvironmentProvider } from '../../../services/contracts/IEnvironmentProvider';

export class FakeEnvironmentProvider implements IEnvironmentProvider {
  private config: Record<string, string> = {};

  setConfig(config: Record<string, string>): void {
    this.config = config;
  }

  get(key: string): string | undefined {
    return this.config[key];
  }

  getRequired(key: string): string {
    const value = this.config[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  has(key: string): boolean {
    return key in this.config;
  }

  getAll(): Record<string, string> {
    return { ...this.config };
  }

  getNodeEnv(): string {
    return this.config['NODE_ENV'] || 'test';
  }

  isDevelopment(): boolean {
    return this.config['NODE_ENV'] === 'development';
  }

  isProduction(): boolean {
    return this.config['NODE_ENV'] === 'production';
  }

  isTest(): boolean {
    return this.config['NODE_ENV'] === 'test';
  }

  // IEnvironmentProvider interface'den eksik metodlar
  getEnvironment(): string {
    return this.config['NODE_ENV'] || 'test';
  }

  getEnvironmentVariable(key: string, defaultValue?: string): string {
    return this.config[key] || defaultValue || '';
  }

  getEnvironmentVariableAsNumber(key: string, defaultValue?: number): number {
    const value = this.config[key];
    if (!value) return defaultValue || 0;
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue || 0 : num;
  }

  getEnvironmentVariableAsBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.config[key];
    if (!value) return defaultValue || false;
    return value.toLowerCase() === 'true';
  }
}
