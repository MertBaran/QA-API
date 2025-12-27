export type ObjectStorageProvider = 'cloudflare-r2';

export interface ObjectStorageCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  accountId?: string;
}

export interface ObjectStorageConfig {
  provider: ObjectStorageProvider;
  bucket: string;
  endpoint: string;
  credentials: ObjectStorageCredentials;
  publicBaseUrl?: string;
}
