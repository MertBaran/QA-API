import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../../services/TOKENS';
import {
  IObjectStorageProvider,
  UploadObjectInput,
} from '../IObjectStorageProvider';
import {
  ContentAssetDescriptor,
  ContentAssetLocation,
  ContentAssetVisibility,
} from './ContentAssetType';
import {
  AssetDeletionInput,
  AssetUploadInput,
  AssetUrlOptions,
  IContentAssetService,
  PresignedAssetUploadInput,
  PresignedAssetUploadResult,
} from './IContentAssetService';
import { ContentAssetPathBuilder } from './ContentAssetPathBuilder';
import { ILoggerProvider } from '../../logging/ILoggerProvider';

@injectable()
export class ContentAssetService implements IContentAssetService {
  private readonly pathBuilder: ContentAssetPathBuilder;

  constructor(
    @inject(TOKENS.IObjectStorageProvider)
    private readonly storageProvider: IObjectStorageProvider,
    @inject(TOKENS.ILoggerProvider)
    private readonly logger: ILoggerProvider
  ) {
    this.pathBuilder = new ContentAssetPathBuilder({ useDatePrefix: true });
  }

  public async uploadAsset(
    input: AssetUploadInput
  ): Promise<ContentAssetLocation> {
    const key = this.pathBuilder.buildKey(input.descriptor, input.filename);

    const uploadInput: UploadObjectInput = {
      key,
      body: input.buffer,
      contentType: input.mimeType,
      cacheControl: input.cacheControl,
      metadata: this.buildAssetMetadata(input.descriptor, input.metadata),
    };

    const result = await this.storageProvider.uploadObject(uploadInput);

    this.logger.debug('Content asset uploaded', {
      descriptor: input.descriptor,
      key: result.key,
      bucket: result.bucket,
    });

    return {
      key: result.key,
      bucket: result.bucket,
      url: result.url,
    };
  }

  public async deleteAsset(input: AssetDeletionInput): Promise<void> {
    const key =
      input.key ?? this.pathBuilder.buildKey(input.descriptor, 'placeholder');

    await this.storageProvider.deleteObject({ key });

    this.logger.debug('Content asset deleted', {
      descriptor: input.descriptor,
      key,
    });
  }

  public async getAssetUrl(
    descriptor: ContentAssetDescriptor,
    key: string,
    options?: AssetUrlOptions
  ): Promise<string> {
    // Determine if presigned URL is required
    // Private assets always require presigned URLs for security
    const usePresignedUrl =
      options?.presignedUrl === true ||
      descriptor.visibility === ContentAssetVisibility.Private;

    return this.storageProvider.getObjectUrl(key, {
      presignedUrl: usePresignedUrl,
      expiresInSeconds: options?.expiresInSeconds,
      download: options?.download,
      responseContentType: options?.responseContentType,
      responseDispositionFilename: options?.responseDispositionFilename,
    });
  }

  public async createPresignedUpload(
    input: PresignedAssetUploadInput
  ): Promise<PresignedAssetUploadResult> {
    const key = this.pathBuilder.buildKey(input.descriptor, input.filename);

    const result = await this.storageProvider.createPresignedUpload({
      key,
      contentType: input.mimeType,
      contentLength: input.contentLength,
      expiresInSeconds: input.expiresInSeconds,
      metadata: this.buildAssetMetadata(input.descriptor),
    });

    return {
      uploadUrl: result.url,
      expiresInSeconds: result.expiresInSeconds,
      headers: result.headers,
      key,
    };
  }

  private buildAssetMetadata(
    descriptor: ContentAssetDescriptor,
    metadata?: Record<string, string>
  ): Record<string, string> {
    const baseMetadata: Record<string, string> = {
      'qa-content-type': descriptor.type,
    };

    if (descriptor.ownerId) {
      baseMetadata['qa-owner-id'] = descriptor.ownerId;
    }

    if (descriptor.entityId) {
      baseMetadata['qa-entity-id'] = descriptor.entityId;
    }

    if (descriptor.visibility) {
      baseMetadata['qa-visibility'] = descriptor.visibility;
    }

    return {
      ...baseMetadata,
      ...(metadata ?? {}),
    };
  }
}
