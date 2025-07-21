import express, { Router } from 'express';
import { container } from 'tsyringe';
import { UserController } from '../controllers/userController';
import { checkUserExist } from '../middlewares/database/databaseErrorHelpers';
import { IValidationProvider } from '../infrastructure/validation/IValidationProvider';
import { IdParamSchema } from '../types/dto/common/id-param.dto';

const router: Router = express.Router();
const userController = new UserController(container.resolve('IAdminService'));
const validator = container.resolve<IValidationProvider>('IValidationProvider');

router.get('/', userController.getAllUsers);
router.get(
  '/:id',
  validator.validateParams!(IdParamSchema),
  checkUserExist,
  userController.getSingleUser
);

export default router;
