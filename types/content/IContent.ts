import { EntityId } from '../database';
import { ContentType } from './RelationType';

/**
 * Parent content bilgisi
 * Question veya Answer olabilir
 */
export interface ParentContentInfo {
  id: EntityId;
  type: ContentType;
  // Question ise
  title?: string;
  slug?: string;
  // Answer ise
  questionId?: EntityId;
  questionTitle?: string;
  questionSlug?: string;
  // Common fields
  user?: EntityId;
  userInfo?: {
    _id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
}

/**
 * Parent referansı
 */
export interface ParentReference {
  id: EntityId;
  type: ContentType;
}

/**
 * Ancestor referansı (depth ile)
 */
export interface AncestorReference {
  id: EntityId;
  type: ContentType;
  depth: number;
}

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
  parent?: ParentReference; // Direkt parent referansı
  ancestors?: AncestorReference[]; // Hiyerarşik zincir (root'tan başlar, depth artar)
  parentContentInfo?: ParentContentInfo; // Parent content'in doldurulmuş bilgileri (UI için)
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
