import { z } from 'zod';
import { ContentAssetType } from '../../../infrastructure/storage/content/ContentAssetType';

const contentAssetTypeValues = [
  ContentAssetType.QuestionThumbnail,
  ContentAssetType.QuestionAttachment,
  ContentAssetType.AnswerAttachment,
  ContentAssetType.UserProfileAvatar,
  ContentAssetType.UserProfileBackground,
] as const;

export const DeleteAssetSchema = z.object({
  key: z.string().min(1),
  type: z.enum(contentAssetTypeValues),
  ownerId: z.string().optional(),
  entityId: z.string().optional(),
});

export type DeleteAssetDTO = z.infer<typeof DeleteAssetSchema>;
