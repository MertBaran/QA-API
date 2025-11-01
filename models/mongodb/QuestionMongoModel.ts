import mongoose, { Document, Schema } from 'mongoose';
import slugify from 'slugify';

export interface IQuestionMongo extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  slug: string;
  category: string;
  tags: string[];
  createdAt: Date;
  user: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  answers: mongoose.Types.ObjectId[];
  makeSlug(): string;
}

const QuestionSchema = new Schema<IQuestionMongo>({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    minlength: [10, 'Please provide a title at least 10 characters'],
  },
  content: {
    type: String,
    required: [true, 'Please provide a content'],
    minlength: [20, 'Please provide a content at least 20 characters'],
  },
  //TODO: Category ayrı bir model olarak yapılacak
  category: {
    type: String,
    default: 'General',
  },
  tags: [
    {
      type: String,
    },
  ],
  slug: {
    type: String,
    unique: true,
    sparse: true, // null/undefined değerler için index oluşturma
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  answers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer',
    },
  ],
});

QuestionSchema.pre('save', function (next) {
  if (!this.isModified('title')) {
    next();
  }
  this.slug = this.makeSlug();
  next();
});

QuestionSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function (this: IQuestionMongo, next) {
    try {
      // Delete all answers for this question
      const AnswerMongo = require('./AnswerMongoModel').default;
      await AnswerMongo.deleteMany({ question: this._id });
      next();
    } catch (err) {
      return next(err as any);
    }
  }
);

QuestionSchema.pre('findOneAndDelete', async function (next) {
  try {
    const AnswerMongo = require('./AnswerMongoModel').default;
    const questionId = this.getQuery()._id;
    if (questionId) {
      await AnswerMongo.deleteMany({ question: questionId });
    }
    next();
  } catch (err) {
    return next(err as any);
  }
});

QuestionSchema.methods['makeSlug'] = function (): string {
  let title = this['title'];
  // Remove all non-alphanumeric and non-space characters
  title = title.replace(/[^a-zA-Z0-9\s]/g, '');
  // Remove extra spaces and replace with single space
  title = title.replace(/\s+/g, ' ');
  // Trim spaces
  title = title.trim();

  return slugify(title, {
    replacement: '-',
    lower: true,
  });
};

const QuestionMongo = mongoose.model<IQuestionMongo>(
  'Question',
  QuestionSchema
);
export default QuestionMongo;
