import express, { Router } from 'express';
import { container } from 'tsyringe';
import { UserController } from '../controllers/userController';
import { checkUserExist } from '../middlewares/database/databaseErrorHelpers';
import { IValidationProvider } from '../infrastructure/validation/IValidationProvider';
import { IdParamSchema } from '../types/dto/common/id-param.dto';

const router: Router = express.Router();
const userController = new UserController(
  container.resolve('IAdminService'),
  container.resolve('IUserService'),
  container.resolve('IUserRoleService')
);
const validator = container.resolve<IValidationProvider>('IValidationProvider');

// Public endpoint - get user profile
router.get(
  '/:id',
  validator.validateParams!(IdParamSchema),
  checkUserExist,
  userController.getPublicUserProfile
);

export default router;
