import { Request, Response, NextFunction } from "express";
import CustomError from "../../helpers/error/CustomError";
import jwt from "jsonwebtoken";
import {
  isTokenIncluded,
  getAccessTokenFromHeader,
} from "../../helpers/authorization/tokenHelpers";
import asyncErrorWrapper from "express-async-handler";
import { container } from "tsyringe";
import { UserRepository } from "../../repositories/UserRepository";
import { QuestionRepository } from "../../repositories/QuestionRepository";
import { AnswerRepository } from "../../repositories/AnswerRepository";
import { AuthMiddlewareMessages } from "../constants/MiddlewareMessages";

interface DecodedToken {
  id: string;
  name: string;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
  };
}

const getAccessToRoute = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!isTokenIncluded(req)) {
    return next(new CustomError(AuthMiddlewareMessages.Unauthorized, 401));
  }

  const access_token = getAccessTokenFromHeader(req);
  if (!access_token) {
    return next(new CustomError(AuthMiddlewareMessages.NoAccessToken, 401));
  }
  if (!process.env["JWT_SECRET_KEY"]) {
    return next(new CustomError(AuthMiddlewareMessages.JwtSecretMissing, 500));
  }
  jwt.verify(access_token, process.env["JWT_SECRET_KEY"]!, (err, decoded) => {
    if (err)
      return next(new CustomError(AuthMiddlewareMessages.Unauthorized, 401));
    const decodedToken = decoded as DecodedToken & {
      lang?: "en" | "tr" | "de";
    };
    req.user = { id: decodedToken.id, name: decodedToken.name } as any;
    req.locale = decodedToken.lang ?? "en";
    next();
  });
};

const getAdminAccess = asyncErrorWrapper(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id } = req.user!;
    const userRepository = container.resolve<UserRepository>("UserRepository");
    const user = await userRepository.findById(id);
    if (!user || user.role !== "admin") {
      return next(new CustomError(AuthMiddlewareMessages.OnlyAdmins, 403));
    }
    next();
  }
);

const getQuestionOwnerAccess = asyncErrorWrapper(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const questionId = req.params["id"];
    if (!questionId) throw new Error("questionId is required");
    const questionRepository =
      container.resolve<QuestionRepository>("QuestionRepository");
    const question = await questionRepository.findById(questionId);
    if (!question || question.user !== userId) {
      return next(new CustomError(AuthMiddlewareMessages.OwnerOnly, 403));
    }
    next();
  }
);

const getAnswerOwnerAccess = asyncErrorWrapper(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const answerId = req.params["answer_id"];
    if (!answerId) throw new Error("answerId is required");
    const answerRepository =
      container.resolve<AnswerRepository>("AnswerRepository");
    const answer = await answerRepository.findById(answerId);
    const answerUserId =
      answer &&
      typeof answer.user === "object" &&
      answer.user !== null &&
      "_id" in answer.user
        ? (answer.user as { _id: string })._id
        : answer && answer.user;
    if (!answer || answerUserId !== userId) {
      return next(new CustomError(AuthMiddlewareMessages.OwnerOnly, 403));
    }
    next();
  }
);

export {
  getAccessToRoute,
  getAdminAccess,
  getQuestionOwnerAccess,
  getAnswerOwnerAccess,
};
