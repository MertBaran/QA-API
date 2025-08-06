import mongoose, { Document, Schema } from 'mongoose';

export interface IBookmarkCollectionItemMongo extends Document {
  _id: mongoose.Types.ObjectId;
  bookmark_id: mongoose.Types.ObjectId;
  collection_id: mongoose.Types.ObjectId;
  added_at: Date;
}

const BookmarkCollectionItemSchema = new Schema<IBookmarkCollectionItemMongo>({
  bookmark_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Bookmark ID is required'],
    ref: 'Bookmark',
    index: true,
  },
  collection_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Collection ID is required'],
    ref: 'BookmarkCollection',
    index: true,
  },
  added_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
BookmarkCollectionItemSchema.index({ bookmark_id: 1, collection_id: 1 }, { unique: true });
BookmarkCollectionItemSchema.index({ collection_id: 1, added_at: -1 });

const BookmarkCollectionItemMongo = mongoose.model<IBookmarkCollectionItemMongo>(
  'BookmarkCollectionItem',
  BookmarkCollectionItemSchema
);

export default BookmarkCollectionItemMongo; 