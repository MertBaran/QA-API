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

export const ResolveAssetUrlSchema = z.object({
  key: z.string().min(1),
  type: z.enum(contentAssetTypeValues),
  ownerId: z.string().optional(),
  entityId: z.string().optional(),
  visibility: z.enum(contentAssetVisibilityValues).optional(),
  forcePresignedUrl: z.boolean().optional(),
  expiresInSeconds: z.number().int().positive().max(3600).optional(),
  download: z.boolean().optional(),
  responseContentType: z.string().optional(),
  responseDispositionFilename: z.string().optional(),
});

export type ResolveAssetUrlDTO = z.infer<typeof ResolveAssetUrlSchema>;
