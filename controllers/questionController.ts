import { Request, Response, NextFunction } from "express";
import asyncErrorWrapper from "express-async-handler";
import { injectable, inject } from "tsyringe";
import { IQuestionService } from "../services/contracts/IQuestionService";
import { QuestionConstants } from "./constants/ControllerMessages";
import type { SuccessResponseDTO } from "../types/dto/common/success-response.dto";
import type { IQuestionModel } from "../models/interfaces/IQuestionModel";
import type { IdParamDTO } from "../types/dto/common/id-param.dto";
import type { CreateQuestionDTO } from "../types/dto/question/create-question.dto";
import type { UpdateQuestionDTO } from "../types/dto/question/update-question.dto";
import { i18n } from "../types/i18n";

type AuthenticatedRequest<P = any, B = any> = Request<P, any, B> & {
  user?: { id: string };
};

@injectable()
export class QuestionController {
  constructor(
    @inject("QuestionService") private questionService: IQuestionService
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
      const { title, content } = req.body;
      const question = await this.questionService.updateQuestion(id, {
        title,
        content,
      });
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
}
