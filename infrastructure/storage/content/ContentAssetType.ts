export enum ContentAssetType {
  QuestionThumbnail = 'question-thumbnail',
  QuestionAttachment = 'question-attachment',
  AnswerAttachment = 'answer-attachment',
  UserProfileAvatar = 'user-profile-avatar',
  UserProfileBackground = 'user-profile-background',
}

export enum ContentAssetVisibility {
  Public = 'public',
  Private = 'private',
}

export interface ContentAssetDescriptor {
  type: ContentAssetType;
  ownerId?: string;
  entityId?: string;
  visibility?: ContentAssetVisibility;
}

export interface ContentAssetLocation {
  key: string;
  bucket: string;
  url?: string;
}
