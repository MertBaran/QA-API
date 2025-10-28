import { Request, Response, NextFunction } from 'express';
import CustomError from '../../infrastructure/error/CustomError';
import jwt from 'jsonwebtoken';
import {
  isTokenIncluded,
  getAccessTokenFromHeader,
} from '../../infrastructure/auth/tokenHelpers';
import asyncErrorWrapper from 'express-async-handler';
import { container } from 'tsyringe';
// UserRepository kullanılmıyor, kaldırıldı
import { QuestionRepository } from '../../repositories/QuestionRepository';
import { AnswerRepository } from '../../repositories/AnswerRepository';
import { AuthMiddlewareMessages } from '../constants/MiddlewareMessages';

interface DecodedToken {
  id: string;
  name: string;
  role?: string;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    role?: string;
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
  if (!process.env['JWT_SECRET_KEY']) {
    return next(new CustomError(AuthMiddlewareMessages.JwtSecretMissing, 500));
  }
  jwt.verify(
    access_token,
    process.env['JWT_SECRET_KEY']!,
    async (err, decoded) => {
      if (err)
        return next(new CustomError(AuthMiddlewareMessages.Unauthorized, 401));
      const decodedToken = decoded as DecodedToken & {
        lang?: 'en' | 'tr' | 'de';
        iat?: number;
      };

      // Token'ın oluşturulma zamanını kontrol et
      if (decodedToken.iat) {
        const tokenCreatedAt = new Date(decodedToken.iat * 1000);

        // Kullanıcının son şifre değişiklik zamanını kontrol et
        try {
          const userService = container.resolve('IUserService') as any;
          const user = await userService.findById(decodedToken.id);

          if (
            user &&
            user.lastPasswordChange &&
            tokenCreatedAt < user.lastPasswordChange
          ) {
            return next(
              new CustomError(AuthMiddlewareMessages.TokenExpired, 401)
            );
          }
        } catch (error) {
          // Veritabanı hatası durumunda token'ı kabul et (güvenlik için)
          console.error('Password change check error:', error);
        }
      }

      req.user = {
        id: decodedToken.id,
        name: decodedToken.name,
        role: decodedToken.role,
      } as any;
      req.locale = decodedToken.lang ?? 'en';
      next();
    }
  );
};

// getAdminAccess artık permission middleware'de requireAdmin olarak tanımlandı
// Kaldırıldı - requireAdmin kullanılmalı

const getQuestionOwnerAccess = asyncErrorWrapper(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const questionId = req.params['id'];
    if (!questionId) throw new Error('questionId is required');
    const questionRepository = container.resolve<QuestionRepository>(
      'IQuestionRepository'
    );
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
    const answerId = req.params['answer_id'];
    if (!answerId) throw new Error('answerId is required');
    const answerRepository =
      container.resolve<AnswerRepository>('IAnswerRepository');
    const answer = await answerRepository.findById(answerId);
    const answerUserId =
      answer &&
      typeof answer.user === 'object' &&
      answer.user !== null &&
      '_id' in answer.user
        ? (answer.user as { _id: string })._id
        : answer && answer.user;
    if (!answer || answerUserId !== userId) {
      return next(new CustomError(AuthMiddlewareMessages.OwnerOnly, 403));
    }
    next();
  }
);

export { getAccessToRoute, getQuestionOwnerAccess, getAnswerOwnerAccess };
