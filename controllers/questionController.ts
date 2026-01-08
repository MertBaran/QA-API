import { Request, Response, NextFunction } from 'express';
import asyncErrorWrapper from 'express-async-handler';
import { injectable, inject } from 'tsyringe';
import { IQuestionService } from '../services/contracts/IQuestionService';
import { QuestionConstants } from './constants/ControllerMessages';
import type { SuccessResponseDTO } from '../types/dto/common/success-response.dto';
import type { IQuestionModel } from '../models/interfaces/IQuestionModel';
import type {
  IdParamDTO,
  UserIdParamDTO,
} from '../types/dto/common/id-param.dto';
import type { CreateQuestionDTO } from '../types/dto/question/create-question.dto';
import type { UpdateQuestionDTO } from '../types/dto/question/update-question.dto';
import type {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../types/dto/question/pagination.dto';
import { i18n } from '../types/i18n';
import {
  SearchOptions,
  SearchOptionsQueryParams,
} from '../types/SearchOptions';

type AuthenticatedRequest<P = any, B = any> = Request<P, any, B> & {
  user?: { id: string };
};

@injectable()
export class QuestionController {
  constructor(
    @inject('IQuestionService') private questionService: IQuestionService
  ) {}

  askNewQuestion = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<{}, CreateQuestionDTO>,
      res: Response<SuccessResponseDTO<IQuestionModel>>,
      _next: NextFunction
    ): Promise<void> => {
      const information = req.body;
      const question = await this.questionService.createQuestion(
        information,
        req.user!.id
      );
      res.status(200).json({ success: true, data: question });
    }
  );

  getAllQuestions = asyncErrorWrapper(
    async (
      _req: Request,
      res: Response<SuccessResponseDTO<IQuestionModel[]>>,
      _next: NextFunction
    ): Promise<void> => {
      const questions = await this.questionService.getAllQuestions();
      res.status(200).json({ success: true, data: questions });
    }
  );

  getQuestionsPaginated = asyncErrorWrapper(
    async (
      req: Request<{}, {}, {}, PaginationQueryDTO>,
      res: Response<SuccessResponseDTO<PaginatedResponse<IQuestionModel>>>,
      _next: NextFunction
    ): Promise<void> => {
      const filters = req.query;
      const result = await this.questionService.getQuestionsPaginated(filters);
      res.status(200).json({ success: true, data: result });
    }
  );

  getQuestionsWithParents = asyncErrorWrapper(
    async (
      req: Request<{}, {}, {}, PaginationQueryDTO>,
      res: Response<SuccessResponseDTO<PaginatedResponse<IQuestionModel>>>,
      _next: NextFunction
    ): Promise<void> => {
      const filters = req.query;
      const result =
        await this.questionService.getQuestionsWithParents(filters);
      res.status(200).json({ success: true, data: result });
    }
  );

  getSingleQuestion = asyncErrorWrapper(
    async (
      req: Request<IdParamDTO>,
      res: Response<SuccessResponseDTO<IQuestionModel>>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      const question = await this.questionService.getQuestionById(id);
      res.status(200).json({ success: true, data: question });
    }
  );

  editQuestion = asyncErrorWrapper(
    async (
      req: Request<IdParamDTO, any, UpdateQuestionDTO>,
      res: Response<SuccessResponseDTO<IQuestionModel>>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      const question = await this.questionService.updateQuestion(id, req.body);
      res.status(200).json({ success: true, data: question });
    }
  );

  deleteQuestion = asyncErrorWrapper(
    async (
      req: Request<IdParamDTO>,
      res: Response<SuccessResponseDTO<IQuestionModel>>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      await this.questionService.deleteQuestion(id);
      const message = await i18n(
        QuestionConstants.QuestionDeleteSuccess,
        req.locale
      );
      res.status(200).json({ success: true, message });
    }
  );

  likeQuestion = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<IdParamDTO>,
      res: Response<SuccessResponseDTO<IQuestionModel>>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      const question = await this.questionService.likeQuestion(
        id,
        req.user!.id
      );
      res.status(200).json({ success: true, data: question });
    }
  );

  undoLikeQuestion = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<IdParamDTO>,
      res: Response<SuccessResponseDTO<IQuestionModel>>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      const question = await this.questionService.undoLikeQuestion(
        id,
        req.user!.id
      );
      res.status(200).json({ success: true, data: question });
    }
  );

  dislikeQuestion = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<IdParamDTO>,
      res: Response<SuccessResponseDTO<IQuestionModel>>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      const question = await this.questionService.dislikeQuestion(
        id,
        req.user!.id
      );
      res.status(200).json({ success: true, data: question });
    }
  );

  undoDislikeQuestion = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<IdParamDTO>,
      res: Response<SuccessResponseDTO<IQuestionModel>>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      const question = await this.questionService.undoDislikeQuestion(
        id,
        req.user!.id
      );
      res.status(200).json({ success: true, data: question });
    }
  );

  getQuestionsByUser = asyncErrorWrapper(
    async (
      req: Request<
        UserIdParamDTO,
        {},
        {},
        { page?: string; limit?: string }
      >,
      res: Response<
        SuccessResponseDTO<PaginatedResponse<IQuestionModel>>
      >,
      _next: NextFunction
    ): Promise<void> => {
      const { userId } = req.params;
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const result = await this.questionService.getQuestionsByUser(
        userId,
        page,
        limit
      );
      res.status(200).json({ success: true, data: result });
    }
  );

  getQuestionsByParent = asyncErrorWrapper(
    async (
      req: Request<IdParamDTO>,
      res: Response<SuccessResponseDTO<IQuestionModel[]>>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      const questions = await this.questionService.getQuestionsByParent(id);
      res.status(200).json({ success: true, data: questions });
    }
  );

  searchQuestions = asyncErrorWrapper(
    async (
      req: Request<
        {},
        {},
        {},
        SearchOptionsQueryParams & {
          q?: string;
          page?: string;
          limit?: string;
          includeAnswers?: string;
          excludeQuestionIds?: string;
        }
      >,
      res: Response<
        SuccessResponseDTO<{ data: IQuestionModel[]; pagination: any }>
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

      // Her zaman cevapları dahil et, cevaplarda geçen soru ID'lerini bul ve çıkar
      let excludeQuestionIds: string[] | undefined = undefined;
      if (req.query.excludeQuestionIds) {
        // Frontend'den gelen excludeQuestionIds'i kullan
        excludeQuestionIds = Array.isArray(req.query.excludeQuestionIds)
          ? req.query.excludeQuestionIds
          : [req.query.excludeQuestionIds];
      }

      const result = await this.questionService.searchQuestions(
        searchTerm,
        page,
        limit,
        searchOptions.searchMode,
        searchOptions.matchType,
        searchOptions.typoTolerance || 'medium',
        searchOptions.smartSearch || false,
        smartOptions,
        excludeQuestionIds,
        searchOptions.language
      );
      res.status(200).json({ success: true, data: result });
    }
  );
}
