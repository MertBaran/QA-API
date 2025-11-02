import mongoose, { Document, Schema } from 'mongoose';
import { IContentRelationModel } from '../interfaces/IContentRelationModel';

export interface IContentRelationMongo extends Document {
  _id: mongoose.Types.ObjectId;
  sourceContentType: string;
  sourceContentId: mongoose.Types.ObjectId;
  targetContentType: string;
  targetContentId: mongoose.Types.ObjectId;
  relationType: string;
  metadata?: {
    weight?: number;
    description?: string;
  };
  createdAt: Date;
  createdBy?: mongoose.Types.ObjectId;
}

const ContentRelationSchema = new Schema<IContentRelationMongo>({
  sourceContentType: {
    type: String,
    required: true,
    enum: ['question', 'answer'],
  },
  sourceContentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'sourceContentType',
  },
  targetContentType: {
    type: String,
    required: true,
    enum: ['question', 'answer'],
  },
  targetContentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetContentType',
  },
  relationType: {
    type: String,
    required: true,
    enum: ['reply_to_question', 'reply_to_answer', 'follow_up', 'clarification', 'related'],
  },
  metadata: {
    weight: {
      type: Number,
      min: 0,
      max: 1,
    },
    description: {
      type: String,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// Indexes for performance
ContentRelationSchema.index({ sourceContentId: 1, sourceContentType: 1 });
ContentRelationSchema.index({ targetContentId: 1, targetContentType: 1 });
ContentRelationSchema.index({ relationType: 1 });

const ContentRelationMongo = mongoose.model<IContentRelationMongo>(
  'ContentRelation',
  ContentRelationSchema
);
export default ContentRelationMongo;

