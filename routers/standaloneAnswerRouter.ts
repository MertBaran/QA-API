import express, { Router } from 'express';
import { container } from 'tsyringe';
import { AnswerController } from '../controllers/answerController';
import { IValidationProvider } from '../infrastructure/validation/IValidationProvider';
import { UserIdParamSchema } from '../types/dto/common/id-param.dto';

const router: Router = express.Router();
const answerController = new AnswerController(
  container.resolve('IAnswerService')
);
const validator = container.resolve<IValidationProvider>('IValidationProvider');

// Get answers by user ID
router.get(
  '/user/:userId',
  validator.validateParams!(UserIdParamSchema),
  answerController.getAnswersByUser
);

export default router;
