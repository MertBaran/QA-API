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

    if (this.options.useDatePrefix) {
      const now = new Date();
      segments.push(
        now.getUTCFullYear().toString(),
        String(now.getUTCMonth() + 1).padStart(2, '0'),
        String(now.getUTCDate()).padStart(2, '0')
      );
    }

    segments.push(this.resolveBaseFolder(descriptor.type));

    if (descriptor.ownerId) {
      segments.push('owner', descriptor.ownerId);
    }

    if (descriptor.entityId) {
      segments.push('entity', descriptor.entityId);
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
