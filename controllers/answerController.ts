import { Request, Response, NextFunction } from 'express';
import asyncErrorWrapper from 'express-async-handler';
import { injectable, inject } from 'tsyringe';
import { IAnswerService } from '../services/contracts/IAnswerService';
import {
  SearchOptions,
  SearchOptionsQueryParams,
} from '../types/SearchOptions';
import { AnswerConstants } from './constants/ControllerMessages';

import type { QuestionIdParamDTO } from '../types/dto/common/question-id-param.dto';
import type { AnswerIdParamDTO } from '../types/dto/common/answer-id-param.dto';
import type { UserIdParamDTO } from '../types/dto/common/id-param.dto';
import type { CreateAnswerDTO } from '../types/dto/answer/create-answer.dto';
import type { UpdateAnswerDTO } from '../types/dto/answer/update-answer.dto';
import type { SuccessResponseDTO } from '../types/dto/common/success-response.dto';
import type { IAnswerModel } from '../models/interfaces/IAnswerModel';
import { i18n } from '../types/i18n';

type AuthenticatedRequest<P = any, B = any> = Request<P, any, B> & {
  user?: {
    id: string;
  };
};
@injectable()
export class AnswerController {
  constructor(
    @inject('IAnswerService') private answerService: IAnswerService
  ) {}

  addNewAnswerToQuestion = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<QuestionIdParamDTO, CreateAnswerDTO>,
      res: Response<SuccessResponseDTO<IAnswerModel>>,
      _next: NextFunction
    ): Promise<void> => {
      const { question_id } = req.params;
      const user_id = req.user!.id; // getAccessToRoute middleware ensures existence
      const answer = await this.answerService.createAnswer(
        req.body,
        question_id,
        user_id
      );
      res.status(200).json({ success: true, data: answer });
    }
  );

  getAllAnswersByQuestion = asyncErrorWrapper(
    async (
      req: Request<
        QuestionIdParamDTO,
        {},
        {},
        { page?: string; limit?: string }
      >,
      res: Response<
        SuccessResponseDTO<{
          data: IAnswerModel[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
          };
        }>
      >,
      _next: NextFunction
    ): Promise<void> => {
      const { question_id } = req.params;
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;
      const result = await this.answerService.getAnswersByQuestion(
        question_id,
        page,
        limit
      );
      res.status(200).json({ success: true, data: result });
    }
  );

  getAnswerPageNumber = asyncErrorWrapper(
    async (
      req: Request<
        QuestionIdParamDTO & AnswerIdParamDTO,
        {},
        {},
        { limit?: string }
      >,
      res: Response<SuccessResponseDTO<{ page: number | null }>>,
      _next: NextFunction
    ): Promise<void> => {
      const { question_id, answer_id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;
      const page = await this.answerService.getAnswerPageNumber(
        question_id,
        answer_id,
        limit
      );
      res.status(200).json({ success: true, data: { page } });
    }
  );

  getSingleAnswer = asyncErrorWrapper(
    async (
      req: Request<AnswerIdParamDTO>,
      res: Response<SuccessResponseDTO<IAnswerModel>>,
      _next: NextFunction
    ): Promise<void> => {
      const { answer_id } = req.params;
      const answer = await this.answerService.getAnswerById(answer_id);
      res.status(200).json({ success: true, data: answer });
    }
  );

  editAnswer = asyncErrorWrapper(
    async (
      req: Request<AnswerIdParamDTO, any, UpdateAnswerDTO>,
      res: Response<SuccessResponseDTO<IAnswerModel & { old_content: string }>>,
      _next: NextFunction
    ): Promise<void> => {
      const { answer_id } = req.params;
      const { content } = req.body;
      const oldAnswer = await this.answerService.getAnswerById(answer_id);
      const old_content = oldAnswer.content;
      const answer = await this.answerService.updateAnswer(answer_id, content);
      const responseData = { ...answer, old_content } as IAnswerModel & {
        old_content: string;
      };
      res.status(200).json({ success: true, data: responseData });
    }
  );

  deleteAnswer = asyncErrorWrapper(
    async (
      req: Request<AnswerIdParamDTO & QuestionIdParamDTO>,
      res: Response<SuccessResponseDTO>,
      _next: NextFunction
    ): Promise<void> => {
      const { answer_id, question_id } = req.params as AnswerIdParamDTO &
        QuestionIdParamDTO;
      await this.answerService.deleteAnswer(answer_id, question_id);
      const message = await i18n(
        AnswerConstants.AnswerDeleteSuccess,
        req.locale
      );
      res.status(200).json({ success: true, message });
    }
  );

  likeAnswer = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<AnswerIdParamDTO>,
      res: Response,
      _next: NextFunction
    ): Promise<void> => {
      const { answer_id } = req.params;
      const question_id = (req.params as any).question_id;

      const answer = await this.answerService.likeAnswer(
        answer_id,
        req.user!.id
      );
      res.status(200).json({ success: true, data: answer });
    }
  );

  undoLikeAnswer = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<AnswerIdParamDTO>,
      res: Response,
      _next: NextFunction
    ): Promise<void> => {
      const { answer_id } = req.params;
      const question_id = (req.params as any).question_id;
      const answer = await this.answerService.undoLikeAnswer(
        answer_id,
        req.user!.id
      );
      res.status(200).json({ success: true, data: answer });
    }
  );

  dislikeAnswer = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<AnswerIdParamDTO>,
      res: Response,
      _next: NextFunction
    ): Promise<void> => {
      const { answer_id } = req.params;
      const question_id = (req.params as any).question_id;
      const answer = await this.answerService.dislikeAnswer(
        answer_id,
        req.user!.id
      );
      res.status(200).json({ success: true, data: answer });
    }
  );

  undoDislikeAnswer = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<AnswerIdParamDTO>,
      res: Response,
      _next: NextFunction
    ): Promise<void> => {
      const { answer_id } = req.params;
      const question_id = (req.params as any).question_id;
      const answer = await this.answerService.undoDislikeAnswer(
        answer_id,
        req.user!.id
      );
      res.status(200).json({ success: true, data: answer });
    }
  );

  getAnswersByUser = asyncErrorWrapper(
    async (
      req: Request<
        UserIdParamDTO,
        {},
        {},
        { page?: string; limit?: string }
      >,
      res: Response<
        SuccessResponseDTO<{
          data: IAnswerModel[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
          };
        }>
      >,
      _next: NextFunction
    ): Promise<void> => {
      const { userId } = req.params;
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const result = await this.answerService.getAnswersByUser(
        userId,
        page,
        limit
      );
      res.status(200).json({ success: true, data: result });
    }
  );

  searchAnswers = asyncErrorWrapper(
    async (
      req: Request<
        {},
        {},
        {},
        SearchOptionsQueryParams & {
          q?: string;
          page?: string;
          limit?: string;
        }
      >,
      res: Response<
        SuccessResponseDTO<{ data: IAnswerModel[]; pagination: any }>
      >,
      _next: NextFunction
    ): Promise<void> => {
      const searchTerm = req.query.q || '';
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '10', 10);

      // searchOptions'ı query parametrelerinden oluştur
      // Language önce query parametresinden, yoksa req.locale'den, yoksa 'tr' varsayılan
      const languageParam = Array.isArray(req.query.language)
        ? req.query.language[0]
        : req.query.language;
      const language = (languageParam as string) || req.locale || 'tr';
      const searchOptions = SearchOptions.fromQuery({
        searchMode: req.query.searchMode,
        matchType: req.query.matchType,
        typoTolerance: req.query.typoTolerance,
        smartSearch: req.query.smartSearch,
        smartLinguistic: req.query.smartLinguistic,
        smartSemantic: req.query.smartSemantic,
        language,
      });

      const smartOptions = searchOptions.toSmartOptions();

      const result = await this.answerService.searchAnswers(
        searchTerm,
        page,
        limit,
        searchOptions.searchMode,
        searchOptions.matchType,
        searchOptions.typoTolerance || 'medium',
        searchOptions.smartSearch || false,
        smartOptions,
        searchOptions.language
      );
      res.status(200).json({ success: true, data: result });
    }
  );
}
