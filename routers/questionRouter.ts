import express, { Router } from 'express';
// api/questions
import answer from './answerRouter';
import { container as di } from '../services/container';
import { QuestionController } from '../controllers/questionController';
import {
  getAccessToRoute,
  getQuestionOwnerAccess,
} from '../middlewares/authorization/authMiddleware';
import { checkQuestionExist } from '../middlewares/database/databaseErrorHelpers';
import { auditMiddleware } from '../middlewares/audit/auditMiddleware';
import { IValidationProvider } from '../infrastructure/validation/IValidationProvider';
import { IdParamSchema } from '../types/dto/common/id-param.dto';
import {
  createQuestionSchema,
  updateQuestionSchema,
} from '../infrastructure/validation/schemas/questionSchemas';

const router: Router = express.Router();
const questionController = di.resolve(QuestionController);
const validator = di.resolve<IValidationProvider>('IValidationProvider');

router.get('/', questionController.getAllQuestions);
router.get(
  '/:id',
  validator.validateParams!(IdParamSchema),
  checkQuestionExist,
  questionController.getSingleQuestion
);
router.post(
  '/ask',
  getAccessToRoute,
  validator.validateBody(createQuestionSchema),
  auditMiddleware('QUESTION_CREATE', {
    targetExtractor: req => ({ type: 'question', id: req.body?._id }),
  }),
  questionController.askNewQuestion
);
router.get(
  '/:id/like',
  [
    getAccessToRoute,
    validator.validateParams!(IdParamSchema),
    checkQuestionExist,
  ],
  questionController.likeQuestion
);
router.get(
  '/:id/undo_like',
  [
    getAccessToRoute,
    validator.validateParams!(IdParamSchema),
    checkQuestionExist,
  ],
  questionController.undoLikeQuestion
);
router.put(
  '/:id/edit',
  [
    getAccessToRoute,
    validator.validateParams!(IdParamSchema),
    checkQuestionExist,
    getQuestionOwnerAccess,
    validator.validateBody(updateQuestionSchema),
    auditMiddleware('QUESTION_UPDATE', {
      targetExtractor: req => ({ type: 'question', id: req.params['id'] }),
    }),
  ],
  questionController.editQuestion
);
router.delete(
  '/:id/delete',
  [
    getAccessToRoute,
    validator.validateParams!(IdParamSchema),
    checkQuestionExist,
    getQuestionOwnerAccess,
    auditMiddleware('QUESTION_DELETE', {
      targetExtractor: req => ({ type: 'question', id: req.params['id'] }),
    }),
  ],
  questionController.deleteQuestion
);

router.use('/:question_id/answers', checkQuestionExist, answer);

export default router;
