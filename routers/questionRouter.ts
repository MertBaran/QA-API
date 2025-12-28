import express, { Router } from 'express';
// api/questions
import answer from './answerRouter';
import { container } from 'tsyringe';
import { QuestionController } from '../controllers/questionController';
import {
  getAccessToRoute,
  getQuestionOwnerAccess,
} from '../middlewares/authorization/authMiddleware';
import { checkQuestionExist } from '../middlewares/database/databaseErrorHelpers';
import { AuditMiddleware } from '../middlewares/audit/auditMiddleware';
import { IValidationProvider } from '../infrastructure/validation/IValidationProvider';
import {
  IdParamSchema,
  UserIdParamSchema,
} from '../types/dto/common/id-param.dto';
import {
  createQuestionSchema,
  updateQuestionSchema,
} from '../infrastructure/validation/schemas/questionSchemas';
import { PaginationQuerySchema } from '../types/dto/question/pagination.dto';

const router: Router = express.Router();
const questionController = new QuestionController(
  container.resolve('IQuestionService')
);
const validator = container.resolve<IValidationProvider>('IValidationProvider');
const auditMiddleware = new AuditMiddleware(
  container.resolve('IAuditProvider')
);

router.get('/', questionController.getAllQuestions);
router.get('/search', questionController.searchQuestions);
router.get(
  '/paginated',
  validator.validateQuery(PaginationQuerySchema) as any,
  questionController.getQuestionsPaginated
);
router.get(
  '/paginated/with-parents',
  validator.validateQuery(PaginationQuerySchema) as any,
  questionController.getQuestionsWithParents
);
router.get(
  '/user/:userId',
  validator.validateParams!(UserIdParamSchema),
  questionController.getQuestionsByUser
);
router.get(
  '/parent/:id',
  validator.validateParams!(IdParamSchema),
  questionController.getQuestionsByParent
);
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
  auditMiddleware.createMiddleware('QUESTION_CREATE', {
    targetExtractor: (req: any) => ({ type: 'question', id: req.body?._id }),
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
router.get(
  '/:id/dislike',
  [
    getAccessToRoute,
    validator.validateParams!(IdParamSchema),
    checkQuestionExist,
  ],
  questionController.dislikeQuestion
);
router.get(
  '/:id/undo_dislike',
  [
    getAccessToRoute,
    validator.validateParams!(IdParamSchema),
    checkQuestionExist,
  ],
  questionController.undoDislikeQuestion
);
router.put(
  '/:id/edit',
  [
    getAccessToRoute,
    validator.validateParams!(IdParamSchema),
    checkQuestionExist,
    getQuestionOwnerAccess,
    validator.validateBody(updateQuestionSchema),
    auditMiddleware.createMiddleware('QUESTION_UPDATE', {
      targetExtractor: (req: any) => ({
        type: 'question',
        id: req.params['id'],
      }),
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
    auditMiddleware.createMiddleware('QUESTION_DELETE', {
      targetExtractor: (req: any) => ({
        type: 'question',
        id: req.params['id'],
      }),
    }),
  ],
  questionController.deleteQuestion
);

router.use('/:question_id/answers', checkQuestionExist, answer);

export default router;
