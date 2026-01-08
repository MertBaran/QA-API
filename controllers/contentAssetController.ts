import { Request, Response, NextFunction } from 'express';
import asyncErrorWrapper from 'express-async-handler';
import { injectable, inject } from 'tsyringe';
import { IContentAssetService } from '../infrastructure/storage/content/IContentAssetService';
import { TOKENS } from '../services/TOKENS';
import {
  ContentAssetDescriptor,
  ContentAssetType,
  ContentAssetVisibility,
} from '../infrastructure/storage/content/ContentAssetType';
import { ApplicationError } from '../infrastructure/error/ApplicationError';
import { SuccessResponseDTO } from '../types/dto/common/success-response.dto';
import { CreatePresignedAssetUploadDTO } from '../types/dto/content/create-presigned-asset.dto';
import { ResolveAssetUrlDTO } from '../types/dto/content/resolve-asset-url.dto';
import { DeleteAssetDTO } from '../types/dto/content/delete-asset.dto';

interface AuthenticatedRequest<P = any, B = any, Q = any>
  extends Request<P, any, B, Q> {
  user?: { id: string };
}

@injectable()
export class ContentAssetController {
  constructor(
    @inject(TOKENS.IContentAssetService)
    private readonly contentAssetService: IContentAssetService
  ) {}

  createPresignedUpload = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<{}, CreatePresignedAssetUploadDTO>,
      res: Response<SuccessResponseDTO<any>>,
      _next: NextFunction
    ): Promise<void> => {
      const dto = req.body;

      const descriptor = this.buildDescriptor(dto, req.user?.id);
      const result = await this.contentAssetService.createPresignedUpload({
        descriptor,
        filename: dto.filename,
        mimeType: dto.mimeType,
        contentLength: dto.contentLength,
        expiresInSeconds: dto.expiresInSeconds,
      });

      res.status(201).json({ success: true, data: result });
    }
  );

  resolveAssetUrl = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<{}, ResolveAssetUrlDTO>,
      res: Response<SuccessResponseDTO<{ url: string }>>,
      _next: NextFunction
    ): Promise<void> => {
      const dto = req.body;
      const descriptor = this.buildDescriptor(dto, req.user?.id);
      const url = await this.contentAssetService.getAssetUrl(
        descriptor,
        dto.key,
        {
          presignedUrl: dto.presignedUrl,
          expiresInSeconds: dto.expiresInSeconds,
          download: dto.download,
          responseContentType: dto.responseContentType,
          responseDispositionFilename: dto.responseDispositionFilename,
        }
      );

      res.status(200).json({ success: true, data: { url } });
    }
  );

  deleteAsset = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<{}, DeleteAssetDTO>,
      res: Response<SuccessResponseDTO<null>>,
      _next: NextFunction
    ): Promise<void> => {
      const dto = req.body;
      const descriptor = this.buildDescriptor(dto, req.user?.id);
      await this.contentAssetService.deleteAsset({
        descriptor,
        key: dto.key,
      });

      res.status(200).json({ success: true, data: null });
    }
  );

  private buildDescriptor(
    dto: CreatePresignedAssetUploadDTO | ResolveAssetUrlDTO | DeleteAssetDTO,
    fallbackOwnerId?: string
  ): ContentAssetDescriptor {
    const type = this.parseAssetType(dto.type);
    const visibilityInput =
      'visibility' in dto
        ? (dto as { visibility?: string }).visibility
        : undefined;
    const visibility =
      this.parseVisibility(visibilityInput) ?? ContentAssetVisibility.Public;
    const ownerId = dto.ownerId ?? fallbackOwnerId;

    if (!ownerId) {
      throw ApplicationError.validationError(
        'ownerId must be provided either in request body or via authenticated user.'
      );
    }

    return {
      type,
      ownerId,
      entityId: dto.entityId,
      visibility,
    };
  }

  private parseAssetType(value: string): ContentAssetType {
    const match = Object.values(ContentAssetType).find(item => item === value);
    if (!match) {
      throw ApplicationError.validationError(
        `Unsupported content asset type: ${value}`
      );
    }
    return match;
  }

  private parseVisibility(value?: string): ContentAssetVisibility | undefined {
    if (!value) {
      return undefined;
    }
    const match = Object.values(ContentAssetVisibility).find(
      item => item === value
    );
    if (!match) {
      throw ApplicationError.validationError(
        `Unsupported content asset visibility: ${value}`
      );
    }
    return match;
  }
}
