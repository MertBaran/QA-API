import { EntityId } from '../../types/database';

export interface IUserRoleModel {
  _id: EntityId;
  userId: EntityId;
  roleId: EntityId;
  assignedAt: Date;
  assignedBy?: EntityId; // Hangi admin atadı
  expiresAt?: Date; // Geçici role atama için
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
