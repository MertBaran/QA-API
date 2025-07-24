import mongoose, { Document, Schema } from 'mongoose';
import { EntityId } from '../../types/database';
import { IUserRoleModel } from '../interfaces/IUserRoleModel';

export interface IUserRoleMongo extends Document, IUserRoleModel {
  _id: EntityId;
}

const userRoleSchema = new Schema<IUserRoleMongo>(
  {
    userId: {
      type: String,
      ref: 'User',
      required: true,
    },
    roleId: {
      type: String,
      ref: 'Role',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    assignedBy: {
      type: String,
      ref: 'User',
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for userId and roleId to prevent duplicates
userRoleSchema.index({ userId: 1, roleId: 1 }, { unique: true });

// Index for active roles
userRoleSchema.index({ userId: 1, isActive: 1 });

// Index for expired roles
userRoleSchema.index({ expiresAt: 1, isActive: 1 });

const UserRoleMongo = mongoose.model<IUserRoleMongo>(
  'UserRole',
  userRoleSchema
);
export default UserRoleMongo;
