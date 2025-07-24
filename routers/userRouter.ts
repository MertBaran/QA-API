import express, { Router } from 'express';
import { container } from 'tsyringe';
import { UserController } from '../controllers/userController';
import { getAccessToRoute } from '../middlewares/authorization/authMiddleware';
import { requireAdmin } from '../middlewares/authorization/permissionMiddleware';
import { checkUserExist } from '../middlewares/database/databaseErrorHelpers';
import { IValidationProvider } from '../infrastructure/validation/IValidationProvider';
import { IdParamSchema } from '../types/dto/common/id-param.dto';

const router: Router = express.Router();
const userController = new UserController(
  container.resolve('IAdminService'),
  container.resolve('IUserRoleService')
);
const validator = container.resolve<IValidationProvider>('IValidationProvider');

// Admin yetkisi gerektiren endpoint'ler
router.use(getAccessToRoute, requireAdmin);

router.get('/', userController.getAllUsers);
router.get(
  '/:id',
  validator.validateParams!(IdParamSchema),
  checkUserExist,
  userController.getSingleUser
);

export default router;
