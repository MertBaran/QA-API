import { Request, Response, NextFunction } from "express";
import CustomError from "../../helpers/error/CustomError";
import asyncErrorWrapper from "express-async-handler";
import { container } from "tsyringe";
import { UserRepository } from "../../repositories/UserRepository";
import { QuestionRepository } from "../../repositories/QuestionRepository";
import { AnswerRepository } from "../../repositories/AnswerRepository";
import { DatabaseMiddlewareMessages } from "../constants/MiddlewareMessages";

const checkUserExist = asyncErrorWrapper(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id) throw new Error("id is required");
    const userRepository = container.resolve<UserRepository>("UserRepository");
    const user = await userRepository.findById(id);
    if (!user) {
        return next(new CustomError(DatabaseMiddlewareMessages.UserNotFound, 404));
    }
    next();
});

const checkQuestionExist = asyncErrorWrapper(async (req: Request, res: Response, next: NextFunction) => {
    const question_id = req.params["id"] || req.params["question_id"];
    if (!question_id) throw new Error("question_id is required");
    const questionRepository = container.resolve<QuestionRepository>("QuestionRepository");
    const question = await questionRepository.findById(question_id);
    if (!question) {
        return next(new CustomError(DatabaseMiddlewareMessages.QuestionNotFound, 404));
    }
    next();
});

const checkQuestionAndAnswerExist = asyncErrorWrapper(async (req: Request, res: Response, next: NextFunction) => {
    const question_id = req.params["question_id"];
    if (!question_id) throw new Error("question_id is required");
    const answer_id = req.params["answer_id"];
    if (!answer_id) throw new Error("answer_id is required");
    const answerRepository = container.resolve<AnswerRepository>("AnswerRepository");
    const answer = await answerRepository.findByQuestionAndId(answer_id, question_id);
    if (!answer) {
        return next(new CustomError(DatabaseMiddlewareMessages.AnswerNotFound, 404));
    }
    next();
});

// Utility helpers for testing and error handling
export function isValidationError(err: any): boolean {
  return err && err.name === 'ValidationError';
}

export function isDuplicateKeyError(err: any): boolean {
  return err && err.code === 11000;
}

export function getDuplicateKey(err: any): string | null {
  const match = err.message && err.message.match(/index: (\w+)_1/);
  return match ? match[1] : null;
}

export {
    checkUserExist,
    checkQuestionExist,
    checkQuestionAndAnswerExist
}


