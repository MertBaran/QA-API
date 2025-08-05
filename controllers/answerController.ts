import { Request, Response, NextFunction } from 'express';
import asyncErrorWrapper from 'express-async-handler';
import { injectable, inject } from 'tsyringe';
import { IAnswerService } from '../services/contracts/IAnswerService';
import { AnswerConstants } from './constants/ControllerMessages';

import type { QuestionIdParamDTO } from '../types/dto/common/question-id-param.dto';
import type { AnswerIdParamDTO } from '../types/dto/common/answer-id-param.dto';
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
      req: Request<QuestionIdParamDTO>,
      res: Response<SuccessResponseDTO<IAnswerModel[]>>,
      _next: NextFunction
    ): Promise<void> => {
      const { question_id } = req.params;
      const answers =
        await this.answerService.getAnswersByQuestion(question_id);
      res.status(200).json({ success: true, data: answers });
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
}
