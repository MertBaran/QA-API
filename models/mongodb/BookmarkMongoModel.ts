import mongoose, { Document, Schema } from 'mongoose';
import { BookmarkTargetType } from '../interfaces/IBookmarkModel';

export interface IBookmarkMongo extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  target_type: BookmarkTargetType;
  target_id: mongoose.Types.ObjectId;
  target_data: {
    title: string;
    content: string;
    author?: string;
    authorId?: mongoose.Types.ObjectId;
    created_at: string;
    url?: string;
  };
  tags?: string[];
  notes?: string;
  is_public: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkSchema = new Schema<IBookmarkMongo>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      ref: 'User',
      index: true,
    },
    target_type: {
      type: String,
      required: [true, 'Target type is required'],
      enum: ['question', 'answer', 'note', 'article', 'comment'],
      index: true,
    },
    target_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
      index: true,
    },
    target_data: {
      title: {
        type: String,
        required: [true, 'Title is required'],
        maxlength: [200, 'Title cannot exceed 200 characters'],
      },
      content: {
        type: String,
        required: [true, 'Content is required'],
        maxlength: [2000, 'Content cannot exceed 2000 characters'],
      },
      author: {
        type: String,
        maxlength: [100, 'Author name cannot exceed 100 characters'],
      },
      authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      created_at: {
        type: String,
        required: [true, 'Created at is required'],
      },
      url: {
        type: String,
        maxlength: [500, 'URL cannot exceed 500 characters'],
      },
    },
    tags: [
      {
        type: String,
        maxlength: [50, 'Tag cannot exceed 50 characters'],
      },
    ],
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
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

// Compound indexes for efficient queries
BookmarkSchema.index(
  { user_id: 1, target_type: 1, target_id: 1 },
  { unique: true }
);
BookmarkSchema.index({ user_id: 1, target_type: 1 });
BookmarkSchema.index({ user_id: 1, is_public: 1 });
BookmarkSchema.index({ target_type: 1, target_id: 1 });

const BookmarkMongo = mongoose.model<IBookmarkMongo>(
  'Bookmark',
  BookmarkSchema
);

export default BookmarkMongo;
