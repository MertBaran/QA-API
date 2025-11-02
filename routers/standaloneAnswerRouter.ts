import express, { Request, Response, NextFunction, Router } from 'express';
import { container } from 'tsyringe';
import { AnswerController } from '../controllers/answerController';
import { IValidationProvider } from '../infrastructure/validation/IValidationProvider';
import {
  UserIdParamSchema,
  IdParamSchema,
} from '../types/dto/common/id-param.dto';
import type { IdParamDTO } from '../types/dto/common/id-param.dto';

const router: Router = express.Router();
const answerController = new AnswerController(
  container.resolve('IAnswerService')
);
const validator = container.resolve<IValidationProvider>('IValidationProvider');

// Get single answer by ID
router.get(
  '/:id',
  validator.validateParams!(IdParamSchema),
  async (req: Request<IdParamDTO>, res: Response, next: NextFunction) => {
    // Map id to answer_id for the controller
    (req.params as any).answer_id = req.params.id;
    await answerController.getSingleAnswer(req as any, res, next);
  }
);

// Get answers by user ID
router.get(
  '/user/:userId',
  validator.validateParams!(UserIdParamSchema),
  answerController.getAnswersByUser
);

export default router;
