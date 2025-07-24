import { EntityId } from '../../types/database';

export interface IRoleModel {
  _id: EntityId;
  name: string; // 'moderator'
  description: string; // 'Can moderate questions and answers'
  permissions: EntityId[]; // Permission ID'leri
  isSystem: boolean; // Sistem tarafından oluşturulan
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
