import mongoose, { Document, Schema } from "mongoose";
import slugify from "slugify";

export interface IQuestionMongo extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  slug: string;
  createdAt: Date;
  user: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  answers: mongoose.Types.ObjectId[];
  makeSlug(): string;
}

const QuestionSchema = new Schema<IQuestionMongo>({
  title: {
    type: String,
    required: [true, "Please provide a title"],
    minlength: [10, "Please provide a title at least 10 characters"],
    unique: true
  },
  content: {
    type: String,
    required: [true, "Please provide a content"],
    minlength: [20, "Please provide a content at least 20 characters"],
  },
  slug: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  answers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer"
    }
  ]
});

QuestionSchema.pre("save", function(next) {
  if (!this.isModified("title")) {
    next();
  }
  this.slug = this.makeSlug();
  next();
});

QuestionSchema.methods['makeSlug'] = function(): string {
  let title = this['title'];
  // Remove all non-alphanumeric and non-space characters
  title = title.replace(/[^a-zA-Z0-9\s]/g, '');
  // Remove extra spaces and replace with single space
  title = title.replace(/\s+/g, ' ');
  // Trim spaces
  title = title.trim();
  
  return slugify(title, {
    replacement: '-',
    lower: true
  });
}

const QuestionMongo = mongoose.model<IQuestionMongo>("Question", QuestionSchema);
export default QuestionMongo; 