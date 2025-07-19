import mongoose, { Document, Schema } from "mongoose";
import QuestionMongo from "./QuestionMongoModel";

export interface IAnswerMongo extends Document {
  _id: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  user: mongoose.Types.ObjectId;
  question: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
}

const AnswerSchema = new Schema<IAnswerMongo>({
  content: {
    type: String,
    required: [true, "Please provide a content"],
    minlength: [10, "Please provide a content at least 10 characters"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]
});

AnswerSchema.pre("save", async function(this: IAnswerMongo, next) {
  if (!this.isModified("user")) return next();
  try {
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

AnswerSchema.pre("deleteOne", { document: true, query: false }, async function(this: IAnswerMongo, next) {
  try {
    const question = await QuestionMongo.findById(this.question);
    if (question) {
      question.answers = question.answers.filter(
        (answerId) => answerId.toString() !== this._id.toString()
      );
      await question.save();
    }
    next();
  } catch (err) {
    return next(err as any);
  }
});

const AnswerMongo = mongoose.model<IAnswerMongo>("Answer", AnswerSchema);
export default AnswerMongo; 