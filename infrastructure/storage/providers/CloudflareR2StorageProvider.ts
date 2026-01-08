import { inject, injectable } from 'tsyringe';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  IObjectStorageProvider,
  UploadObjectInput,
  UploadObjectResult,
  DeleteObjectInput,
  GetObjectUrlOptions,
  PresignedUploadInput,
  PresignedUploadResult,
  ListObjectsInput,
  ListObjectsResult,
} from '../IObjectStorageProvider';
import { IConfigurationService } from '../../../services/contracts/IConfigurationService';
import { TOKENS } from '../../../services/TOKENS';
import { ILoggerProvider } from '../../logging/ILoggerProvider';
import { ObjectStorageConfig } from '../../../services/contracts/object-storage/ObjectStorageConfig';
import { HttpRequest as AwsHttpRequest } from '@smithy/protocol-http';

interface CloudflareEndpointMeta {
  isGlobalEndpoint: boolean;
  endpointUrl: URL;
}

const DEFAULT_PRESIGNED_EXPIRES_SECONDS = 900; // 15 minutes
const DEFAULT_LIST_MAX_KEYS = 100;

@injectable()
export class CloudflareR2StorageProvider implements IObjectStorageProvider {
  private readonly client: S3Client;
  private readonly presignedClient: S3Client; // Separate client for presigned URLs
  private readonly bucket: string;
  private readonly publicBaseUrl?: string;
  private readonly endpointMeta: CloudflareEndpointMeta;
  private readonly credentials: ObjectStorageConfig['credentials'];

  constructor(
    @inject(TOKENS.IConfigurationService)
    private readonly configurationService: IConfigurationService,
    @inject(TOKENS.ILoggerProvider)
    private readonly logger: ILoggerProvider
  ) {
    const storageConfig = this.configurationService.getObjectStorageConfig();

    if (storageConfig.provider !== 'cloudflare-r2') {
      throw new Error(
        'CloudflareR2StorageProvider yalnızca cloudflare-r2 provider konfigürasyonu ile kullanılabilir.'
      );
    }

    this.bucket = storageConfig.bucket;
    this.publicBaseUrl = storageConfig.publicBaseUrl
      ? storageConfig.publicBaseUrl.replace(/\/$/, '')
      : undefined;
    this.credentials = storageConfig.credentials;
    this.endpointMeta = this.resolveEndpoint(storageConfig.endpoint);

    this.client = new S3Client({
      region: 'auto',
      endpoint: storageConfig.endpoint,
      forcePathStyle: true,
      disableHostPrefix: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: storageConfig.credentials.accessKeyId,
        secretAccessKey: storageConfig.credentials.secretAccessKey,
      },
    });

    // Create a separate client for presigned URLs with account ID middleware
    this.presignedClient = new S3Client({
      region: 'auto',
      endpoint: storageConfig.endpoint,
      forcePathStyle: true,
      disableHostPrefix: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: storageConfig.credentials.accessKeyId,
        secretAccessKey: storageConfig.credentials.secretAccessKey,
      },
    });

    try {
      this.client.middlewareStack.remove('flexibleChecksumsMiddleware');
      this.client.middlewareStack.remove('flexibleChecksumsMiddlewareOptions');
      this.client.middlewareStack.remove('bucketEndpointMiddleware');

      this.presignedClient.middlewareStack.remove(
        'flexibleChecksumsMiddleware'
      );
      this.presignedClient.middlewareStack.remove(
        'flexibleChecksumsMiddlewareOptions'
      );
      this.presignedClient.middlewareStack.remove('bucketEndpointMiddleware');
    } catch (error) {
      this.logger.warn('Cloudflare R2 middleware temizliği başarısız oldu', {
        error,
      });
    }

    // Register middleware only for global endpoint
    // Account-specific endpoints don't require account ID header
    if (this.endpointMeta.isGlobalEndpoint) {
      this.registerGlobalEndpointMiddleware();
      this.registerPresignedGlobalEndpointMiddleware();
    }
  }

  public async uploadObject(
    input: UploadObjectInput
  ): Promise<UploadObjectResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: input.cacheControl,
        Metadata: input.metadata,
        ContentEncoding: input.encoding,
      });

      const response = await this.client.send(command);

      const url = this.publicBaseUrl
        ? this.composePublicUrl(input.key)
        : undefined;

      return {
        key: input.key,
        bucket: this.bucket,
        eTag: response.ETag ?? undefined,
        url,
      };
    } catch (error) {
      this.logger.error('Cloudflare R2 uploadObject hata verdi', {
        key: input.key,
        bucket: this.bucket,
        error,
      });
      throw error;
    }
  }

  public async deleteObject(input: DeleteObjectInput): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
      });
      await this.client.send(command);
    } catch (error) {
      this.logger.error('Cloudflare R2 deleteObject hata verdi', {
        key: input.key,
        bucket: this.bucket,
        error,
      });
      throw error;
    }
  }

  public async getObjectUrl(
    key: string,
    options?: GetObjectUrlOptions
  ): Promise<string> {
    // Use public URL if presignedUrl is explicitly false and publicBaseUrl is configured
    const usePresignedUrl = options?.presignedUrl !== false;

    if (!usePresignedUrl && this.publicBaseUrl) {
      return this.composePublicUrl(key);
    }

    // Generate presigned URL
    const expiresIn =
      options?.expiresInSeconds ?? DEFAULT_PRESIGNED_EXPIRES_SECONDS;
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentType: options?.responseContentType,
      ResponseContentDisposition: options?.responseDispositionFilename
        ? this.buildContentDisposition(
            options.responseDispositionFilename,
            options.download
          )
        : undefined,
    });

    return getSignedUrl(this.client, command, {
      expiresIn,
    });
  }

  public async createPresignedUpload(
    input: PresignedUploadInput
  ): Promise<PresignedUploadResult> {
    const expiresIn =
      input.expiresInSeconds ?? DEFAULT_PRESIGNED_EXPIRES_SECONDS;

    // Use presignedClient only for global endpoint (requires account ID middleware)
    // Account-specific endpoints don't need account ID middleware
    const clientToUse = this.endpointMeta.isGlobalEndpoint
      ? this.presignedClient
      : this.client;

    // Create PutObjectCommand with ContentType for metadata (not signature)
    // IMPORTANT: ContentType is stored in metadata for validation purposes,
    // but it's NOT included in the signature due to AWS SDK limitations.
    // Security: We rely on metadata validation after upload to ensure file type matches.
    const metadataWithContentType = {
      ...input.metadata,
      // Store expected content-type in metadata for post-upload validation
      ...(input.contentType
        ? { 'qa-expected-content-type': input.contentType }
        : {}),
    };

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.key,
      ContentType: input.contentType, // Used for R2 metadata, not signature
      Metadata: metadataWithContentType,
    });

    const url = await getSignedUrl(clientToUse, command, {
      expiresIn,
    });

    const headers: Record<string, string> = {};

    // Add account ID header only for global endpoint
    // Account-specific endpoints don't require account ID header in presigned URLs
    if (this.endpointMeta.isGlobalEndpoint && this.credentials.accountId) {
      headers['x-amz-account-id'] = this.credentials.accountId;
    }

    // Note: We don't include x-amz-content-sha256 or content-type in headers because
    // AWS SDK's getSignedUrl doesn't include them in the signature (only 'host' is signed).
    // Including them would cause signature mismatch (403 Forbidden).
    // The ContentType parameter in PutObjectCommand is used for metadata, not signature.

    return {
      url,
      expiresInSeconds: expiresIn,
      headers,
    };
  }

  public async listObjects(
    input?: ListObjectsInput
  ): Promise<ListObjectsResult> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: input?.prefix,
      ContinuationToken: input?.continuationToken,
      MaxKeys: input?.maxKeys ?? DEFAULT_LIST_MAX_KEYS,
    });

    const response = await this.client.send(command);
    const objects =
      response.Contents?.map(item => ({
        key: item.Key ?? '',
        size: item.Size,
        lastModified: item.LastModified,
        etag: item.ETag ?? undefined,
      })).filter(obj => obj.key.length > 0) ?? [];

    return {
      objects,
      nextContinuationToken: response.NextContinuationToken ?? undefined,
    };
  }

  private composePublicUrl(key: string): string {
    if (!this.publicBaseUrl) {
      throw new Error('Public base URL tanımlı değil.');
    }
    return `${this.publicBaseUrl.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  }

  private buildContentDisposition(
    filename: string,
    download?: boolean
  ): string {
    const dispositionType = download ? 'attachment' : 'inline';
    const safeFilename = filename.replace(/"/g, '');
    const encodedFilename = encodeURIComponent(filename);
    return `${dispositionType}; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`;
  }

  private resolveEndpoint(endpoint: string): CloudflareEndpointMeta {
    const endpointUrl = new URL(endpoint);
    const isGlobalEndpoint =
      endpointUrl.hostname === 'r2.cloudflarestorage.com';
    return { endpointUrl, isGlobalEndpoint };
  }

  private registerGlobalEndpointMiddleware(): void {
    const accountId = this.credentials.accountId;
    if (!accountId) {
      this.logger.warn(
        'Cloudflare R2 global endpoint kullanılıyor ancak accountId belirtilmemiş. İmzalı istekler başarısız olabilir.'
      );
      return;
    }

    this.client.middlewareStack.add(
      next => async args => {
        if (AwsHttpRequest.isInstance(args.request)) {
          const request = args.request as AwsHttpRequest;
          request.headers = request.headers ?? {};
          request.headers['x-amz-account-id'] = accountId;
          request.headers['host'] = 'r2.cloudflarestorage.com';
          request.headers['x-amz-content-sha256'] =
            request.headers['x-amz-content-sha256'] ?? 'UNSIGNED-PAYLOAD';
        }
        return next(args);
      },
      {
        step: 'build',
        name: 'addR2AccountIdHeader',
        priority: 'high',
      }
    );
  }

  private registerPresignedGlobalEndpointMiddleware(): void {
    const accountId = this.credentials.accountId;
    if (!accountId) {
      return;
    }

    // Add middleware specifically for presigned URL generation
    this.presignedClient.middlewareStack.add(
      next => async args => {
        if (AwsHttpRequest.isInstance(args.request)) {
          const request = args.request as AwsHttpRequest;
          request.headers = request.headers ?? {};
          request.headers['x-amz-account-id'] = accountId;
          request.headers['host'] = 'r2.cloudflarestorage.com';
          request.headers['x-amz-content-sha256'] =
            request.headers['x-amz-content-sha256'] ?? 'UNSIGNED-PAYLOAD';
        }
        return next(args);
      },
      {
        step: 'build',
        name: 'addR2AccountIdHeaderForPresigned',
        priority: 'high',
      }
    );
  }
}
