import express, { Router } from 'express';
import { container as di } from '../services/container';
import { AnswerController } from '../controllers/answerController';
import {
  getAccessToRoute,
  getAnswerOwnerAccess,
} from '../middlewares/authorization/authMiddleware';
import { checkQuestionAndAnswerExist } from '../middlewares/database/databaseErrorHelpers';
import { auditMiddleware } from '../middlewares/audit/auditMiddleware';
import { IValidationProvider } from '../infrastructure/validation/IValidationProvider';
import {
  createAnswerSchema,
  updateAnswerSchema,
} from '../infrastructure/validation/schemas/answerSchemas';
import { QuestionIdParamSchema } from '../types/dto/common/question-id-param.dto';
import { AnswerIdParamSchema } from '../types/dto/common/answer-id-param.dto';

const router: Router = express.Router({ mergeParams: true }); // question_id parametresini üst router'dan alır
const answerController = di.resolve<AnswerController>('AnswerController');
const validator = di.resolve<IValidationProvider>('IValidationProvider');

// POST /api/questions/:question_id/answers
router.post(
  '/',
  getAccessToRoute,
  validator.validateParams(QuestionIdParamSchema),
  validator.validateBody(createAnswerSchema),
  auditMiddleware('ANSWER_CREATE', {
    targetExtractor: req => ({ type: 'answer', id: req.body?._id }),
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
    auditMiddleware('ANSWER_UPDATE', {
      targetExtractor: req => ({
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
    auditMiddleware('ANSWER_DELETE', {
      targetExtractor: req => ({
        type: 'answer',
        id: req.params['answer_id'],
      }),
    }),
  ],
  answerController.deleteAnswer
);

export default router;
