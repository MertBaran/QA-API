import mongoose, { Document, Schema } from 'mongoose';
import { EntityId } from '../../types/database';
import { IPermissionModel } from '../interfaces/IPermissionModel';

export interface IPermissionMongo extends Document, IPermissionModel {
  _id: EntityId;
}

const permissionSchema = new Schema<IPermissionMongo>(
  {
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Permission description is required'],
      trim: true,
    },
    resource: {
      type: String,
      required: [true, 'Resource is required'],
      trim: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['content', 'user', 'system'],
      default: 'content',
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

// Index'ler (name zaten unique: true ile index oluşturuyor)
permissionSchema.index({ resource: 1, action: 1 });
permissionSchema.index({ isActive: 1 });

const PermissionMongo = mongoose.model<IPermissionMongo>(
  'Permission',
  permissionSchema
);

export default PermissionMongo;
