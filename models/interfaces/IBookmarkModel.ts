import { EntityId } from '../../types/database';
import { IBaseModel } from './IBaseModel';

export type BookmarkTargetType =
  | 'question'
  | 'answer'
  | 'note'
  | 'article'
  | 'comment';

export interface IBookmarkTargetData {
  title: string;
  content: string;
  author?: string;
  authorId?: EntityId;
  created_at: string;
  url?: string;
}

export interface IBookmarkModel extends IBaseModel {
  _id: EntityId;
  user_id: EntityId;
  target_type: BookmarkTargetType;
  target_id: EntityId;
  target_data: IBookmarkTargetData;
  tags?: string[];
  notes?: string;
  is_public: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookmarkCollectionModel extends IBaseModel {
  _id: EntityId;
  user_id: EntityId;
  name: string;
  description?: string;
  color?: string;
  is_public: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookmarkCollectionItemModel extends IBaseModel {
  _id: EntityId;
  bookmark_id: EntityId;
  collection_id: EntityId;
  added_at: Date;
}
