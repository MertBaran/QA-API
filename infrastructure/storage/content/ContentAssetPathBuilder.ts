import { ContentAssetDescriptor, ContentAssetType } from './ContentAssetType';
import { randomUUID } from 'crypto';

export interface AssetPathBuilderOptions {
  useDatePrefix?: boolean;
}

export class ContentAssetPathBuilder {
  constructor(private readonly options: AssetPathBuilderOptions = {}) {}

  public buildKey(
    descriptor: ContentAssetDescriptor,
    filename: string
  ): string {
    const sanitizedFilename = this.sanitizeFilename(filename);
    const prefix = this.buildPrefix(descriptor);

    if (!sanitizedFilename || sanitizedFilename === 'placeholder') {
      return prefix;
    }

    const uniqueSegment = randomUUID();
    return `${prefix}/${uniqueSegment}-${sanitizedFilename}`.replace(
      /\/+/g,
      '/'
    );
  }

  private buildPrefix(descriptor: ContentAssetDescriptor): string {
    const segments: string[] = [];

    // Önce işlem biçimi (type folder)
    segments.push(this.resolveBaseFolder(descriptor.type));

    // Soru thumbnail'ları için: question-thumbnails/{questionId}
    if (descriptor.type === ContentAssetType.QuestionThumbnail) {
      if (descriptor.entityId) {
        segments.push(descriptor.entityId);
      }
    } else {
      // Diğer dosyalar için: {type}/{userId}
      if (descriptor.ownerId) {
        segments.push(descriptor.ownerId);
      }
    }

    return segments.join('/');
  }

  private resolveBaseFolder(type: ContentAssetType): string {
    switch (type) {
      case ContentAssetType.QuestionThumbnail:
        return 'question-thumbnails';
      case ContentAssetType.QuestionAttachment:
        return 'question-attachments';
      case ContentAssetType.AnswerAttachment:
        return 'answer-attachments';
      case ContentAssetType.UserProfileAvatar:
        return 'user-profile-avatars';
      case ContentAssetType.UserProfileBackground:
        return 'user-profile-backgrounds';
      default:
        return 'assets';
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .trim()
      .replace(/[^a-zA-Z0-9_.-]/g, '-')
      .replace(/-+/g, '-');
  }
}
