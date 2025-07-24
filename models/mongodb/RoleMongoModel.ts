import mongoose, { Document, Schema } from 'mongoose';
import { EntityId } from '../../types/database';
import { IRoleModel } from '../interfaces/IRoleModel';

export interface IRoleMongo extends Document, IRoleModel {
  _id: EntityId;
}

const roleSchema = new Schema<IRoleMongo>(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Role description is required'],
      trim: true,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Permission',
        required: true,
      },
    ],
    isSystem: {
      type: Boolean,
      default: false,
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
roleSchema.index({ isSystem: 1 });
roleSchema.index({ isActive: 1 });

const RoleMongo = mongoose.model<IRoleMongo>('Role', roleSchema);

export default RoleMongo;
