import { EntityId } from '../database';
import { ContentType } from './RelationType';

/**
 * Soyut içerik interface
 * Question ve Answer'ın ortak özelliklerini içerir
 */
export interface IContent {
  _id: EntityId;
  contentType: ContentType;
  content: string;
  user: EntityId;
  createdAt: Date;
  updatedAt?: Date;
  userInfo?: {
    _id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
  likes: EntityId[];
  dislikes: EntityId[];
  // İlişki özellikleri
  parentContentId?: EntityId; // Hangi içeriğe bağlı (form hiyerarşisi)
  relatedContents?: EntityId[]; // İlgili içerikler
}

/**
 * Content repository interface
 */
export interface IContentRepository<T extends IContent> {
  findById(id: EntityId): Promise<T | null>;
  findByUser(userId: EntityId): Promise<T[]>;
  findAll(): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  updateById(id: EntityId, data: Partial<T>): Promise<T>;
  deleteById(id: EntityId): Promise<T>;
  findByParent(parentId: EntityId): Promise<T[]>;
  findRelated(contentId: EntityId): Promise<T[]>;
}
