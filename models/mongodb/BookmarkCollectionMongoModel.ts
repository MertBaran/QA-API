import mongoose, { Document, Schema } from 'mongoose';

export interface IBookmarkCollectionMongo extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  color?: string;
  is_public: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkCollectionSchema = new Schema<IBookmarkCollectionMongo>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      ref: 'User',
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Collection name is required'],
      maxlength: [50, 'Collection name cannot exceed 50 characters'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      trim: true,
    },
    color: {
      type: String,
      maxlength: [7, 'Color must be a valid hex color'],
      validate: {
        validator: function (v: string) {
          return /^#[0-9A-F]{6}$/i.test(v);
        },
        message: 'Color must be a valid hex color (e.g., #FF0000)',
      },
    },
    is_public: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
BookmarkCollectionSchema.index({ user_id: 1, name: 1 }, { unique: true });
BookmarkCollectionSchema.index({ user_id: 1, is_public: 1 });

const BookmarkCollectionMongo = mongoose.model<IBookmarkCollectionMongo>(
  'BookmarkCollection',
  BookmarkCollectionSchema
);

export default BookmarkCollectionMongo;
