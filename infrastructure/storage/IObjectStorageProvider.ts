import { Readable } from 'stream';

export type ObjectBody = string | Buffer | Uint8Array | Readable;

export interface UploadObjectInput {
  key: string;
  body: ObjectBody;
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
  encoding?: string;
}

export interface UploadObjectResult {
  key: string;
  bucket: string;
  eTag?: string;
  url?: string;
}

export interface DeleteObjectInput {
  key: string;
}

export interface GetObjectUrlOptions {
  expiresInSeconds?: number;
  forcePresignedUrl?: boolean;
  download?: boolean;
  responseContentType?: string;
  responseDispositionFilename?: string;
}

export interface PresignedUploadInput {
  key: string;
  expiresInSeconds?: number;
  contentType?: string;
  contentLength?: number;
  metadata?: Record<string, string>;
}

export interface PresignedUploadResult {
  url: string;
  expiresInSeconds: number;
  headers: Record<string, string>;
}

export interface ListObjectsInput {
  prefix?: string;
  continuationToken?: string;
  maxKeys?: number;
}

export interface ListObjectsResultObject {
  key: string;
  size?: number;
  lastModified?: Date;
  etag?: string;
}

export interface ListObjectsResult {
  objects: ListObjectsResultObject[];
  nextContinuationToken?: string;
}

export interface IObjectStorageProvider {
  uploadObject(input: UploadObjectInput): Promise<UploadObjectResult>;
  deleteObject(input: DeleteObjectInput): Promise<void>;
  getObjectUrl(key: string, options?: GetObjectUrlOptions): Promise<string>;
  createPresignedUpload(
    input: PresignedUploadInput
  ): Promise<PresignedUploadResult>;
  listObjects(input?: ListObjectsInput): Promise<ListObjectsResult>;
}
