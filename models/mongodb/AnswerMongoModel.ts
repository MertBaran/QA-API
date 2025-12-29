import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswerMongo extends Document {
  _id: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  user: mongoose.Types.ObjectId;
  question: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  dislikes: mongoose.Types.ObjectId[];
  isAccepted?: boolean;
  parent?: {
    id: mongoose.Types.ObjectId;
    type: string;
  };
  ancestors?: Array<{
    id: mongoose.Types.ObjectId;
    type: string;
    depth: number;
  }>;
  relatedContents?: mongoose.Types.ObjectId[];
}

const AnswerSchema = new Schema<IAnswerMongo>({
  content: {
    type: String,
    required: [true, 'Please provide a content'],
    minlength: [5, 'Please provide a content at least 5 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  dislikes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  isAccepted: {
    type: Boolean,
    default: false,
  },
  parent: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'parent.type',
    },
    type: {
      type: String,
      enum: ['question', 'answer'],
    },
  },
  ancestors: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      type: {
        type: String,
        enum: ['question', 'answer'],
      },
      depth: {
        type: Number,
        min: 0,
      },
    },
  ],
  relatedContents: [
    {
      type: mongoose.Schema.Types.ObjectId,
    },
  ],
});

AnswerSchema.pre('save', async function (this: IAnswerMongo, next) {
  // Update updatedAt on each save
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }

  // Only process question relation if this is a new answer
  if (!this.isNew || !this.isModified('user')) return next();

  try {
    const QuestionMongo = require('./QuestionMongoModel').default;
    const question = await QuestionMongo.findById(this.question);
    if (question) {
      question.answers.push(this._id);
      await question.save();
    }
    next();
  } catch (err) {
    return next(err as any);
  }
});

AnswerSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function (this: IAnswerMongo, next) {
    try {
      const QuestionMongo = require('./QuestionMongoModel').default;
      const question = await QuestionMongo.findById(this.question);
      if (question) {
        question.answers = question.answers.filter(
          (answerId: any) => answerId.toString() !== this._id.toString()
        );
        await question.save();
      }
      next();
    } catch (err) {
      return next(err as any);
    }
  }
);

// Indexes for performance
AnswerSchema.index({ user: 1 }); // User'a göre arama için kritik
AnswerSchema.index({ question: 1 }); // Question'a göre arama için
AnswerSchema.index({ 'parent.id': 1 });
AnswerSchema.index({ 'ancestors.id': 1 });
AnswerSchema.index({ createdAt: -1 }); // Sıralama için
AnswerSchema.index({ 'ancestors.depth': 1 });

const AnswerMongo = mongoose.model<IAnswerMongo>('Answer', AnswerSchema);
export default AnswerMongo;
