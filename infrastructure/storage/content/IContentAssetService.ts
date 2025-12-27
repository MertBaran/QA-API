import { UploadObjectResult } from '../IObjectStorageProvider';
import {
  ContentAssetDescriptor,
  ContentAssetLocation,
  ContentAssetType,
  ContentAssetVisibility,
} from './ContentAssetType';

export interface AssetUploadInput {
  descriptor: ContentAssetDescriptor;
  buffer: Buffer;
  filename: string;
  mimeType: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface AssetDeletionInput {
  descriptor: ContentAssetDescriptor;
  key?: string;
}

export interface PresignedAssetUploadInput {
  descriptor: ContentAssetDescriptor;
  filename: string;
  mimeType?: string;
  contentLength?: number;
  expiresInSeconds?: number;
}

export interface PresignedAssetUploadResult {
  uploadUrl: string;
  expiresInSeconds: number;
  headers: Record<string, string>;
  key: string;
}

export interface AssetUrlOptions {
  forcePresignedUrl?: boolean;
  expiresInSeconds?: number;
  download?: boolean;
  responseContentType?: string;
  responseDispositionFilename?: string;
}

export interface IContentAssetService {
  uploadAsset(input: AssetUploadInput): Promise<ContentAssetLocation>;
  deleteAsset(input: AssetDeletionInput): Promise<void>;
  getAssetUrl(
    descriptor: ContentAssetDescriptor,
    key: string,
    options?: AssetUrlOptions
  ): Promise<string>;
  createPresignedUpload(
    input: PresignedAssetUploadInput
  ): Promise<PresignedAssetUploadResult>;
}
