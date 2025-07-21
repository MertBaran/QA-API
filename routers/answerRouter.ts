import express, { Router } from 'express';
import { container } from 'tsyringe';
import { AnswerController } from '../controllers/answerController';
import {
  getAccessToRoute,
  getAnswerOwnerAccess,
} from '../middlewares/authorization/authMiddleware';
import { checkQuestionAndAnswerExist } from '../middlewares/database/databaseErrorHelpers';
import { AuditMiddleware } from '../middlewares/audit/auditMiddleware';
import { IValidationProvider } from '../infrastructure/validation/IValidationProvider';
import {
  createAnswerSchema,
  updateAnswerSchema,
} from '../infrastructure/validation/schemas/answerSchemas';
import { QuestionIdParamSchema } from '../types/dto/common/question-id-param.dto';
import { AnswerIdParamSchema } from '../types/dto/common/answer-id-param.dto';

const router: Router = express.Router({ mergeParams: true }); // question_id parametresini üst router'dan alır
const answerController = new AnswerController(
  container.resolve('IAnswerService')
);
const validator = container.resolve<IValidationProvider>('IValidationProvider');
const auditMiddleware = new AuditMiddleware(
  container.resolve('IAuditProvider')
);

// POST /api/questions/:question_id/answers
router.post(
  '/',
  getAccessToRoute,
  validator.validateParams(QuestionIdParamSchema),
  validator.validateBody(createAnswerSchema),
  auditMiddleware.createMiddleware('ANSWER_CREATE', {
    targetExtractor: (req: any) => ({ type: 'answer', id: req.body?._id }),
  }),
  answerController.addNewAnswerToQuestion
);

router.get(
  '/:answer_id',
  validator.validateParams(AnswerIdParamSchema),
  checkQuestionAndAnswerExist,
  answerController.getSingleAnswer
);

router.get(
  '/:answer_id/like',
  [
    getAccessToRoute,
    validator.validateParams(AnswerIdParamSchema),
    checkQuestionAndAnswerExist,
  ],
  answerController.likeAnswer
);

router.get(
  '/:answer_id/undo_like',
  [
    getAccessToRoute,
    validator.validateParams(AnswerIdParamSchema),
    checkQuestionAndAnswerExist,
  ],
  answerController.undoLikeAnswer
);

router.get(
  '/',
  validator.validateParams(QuestionIdParamSchema),
  answerController.getAllAnswersByQuestion
);

router.put(
  '/:answer_id/edit',
  [
    validator.validateParams!(AnswerIdParamSchema),
    checkQuestionAndAnswerExist,
    getAccessToRoute,
    getAnswerOwnerAccess,
    validator.validateBody(updateAnswerSchema),
    auditMiddleware.createMiddleware('ANSWER_UPDATE', {
      targetExtractor: (req: any) => ({
        type: 'answer',
        id: req.params['answer_id'],
      }),
    }),
  ],
  answerController.editAnswer
);

router.delete(
  '/:answer_id/delete',
  [
    validator.validateParams!(AnswerIdParamSchema),
    checkQuestionAndAnswerExist,
    getAccessToRoute,
    getAnswerOwnerAccess,
    auditMiddleware.createMiddleware('ANSWER_DELETE', {
      targetExtractor: (req: any) => ({
        type: 'answer',
        id: req.params['answer_id'],
      }),
    }),
  ],
  answerController.deleteAnswer
);

export default router;
