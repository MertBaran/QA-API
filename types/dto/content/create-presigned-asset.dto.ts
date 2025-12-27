import { z } from 'zod';
import {
  ContentAssetType,
  ContentAssetVisibility,
} from '../../../infrastructure/storage/content/ContentAssetType';

const contentAssetTypeValues = [
  ContentAssetType.QuestionThumbnail,
  ContentAssetType.QuestionAttachment,
  ContentAssetType.AnswerAttachment,
  ContentAssetType.UserProfileAvatar,
  ContentAssetType.UserProfileBackground,
] as const;

const contentAssetVisibilityValues = [
  ContentAssetVisibility.Public,
  ContentAssetVisibility.Private,
] as const;

export const CreatePresignedAssetUploadSchema = z.object({
  type: z.enum(contentAssetTypeValues),
  filename: z.string().min(1),
  mimeType: z.string().min(1).optional(),
  contentLength: z.number().int().positive().optional(),
  ownerId: z.string().optional(),
  entityId: z.string().optional(),
  visibility: z.enum(contentAssetVisibilityValues).optional(),
  expiresInSeconds: z.number().int().positive().max(3600).optional(),
});

export type CreatePresignedAssetUploadDTO = z.infer<
  typeof CreatePresignedAssetUploadSchema
>;
