import express, { Router } from 'express';
import {
  getAccessToRoute,
  getAdminAccess,
} from '../middlewares/authorization/authMiddleware';
import { checkUserExist } from '../middlewares/database/databaseErrorHelpers';
import { auditMiddleware } from '../middlewares/audit/auditMiddleware';
import { container as di } from '../services/container';
import { AdminController } from '../controllers/adminController';
import { ICacheProvider } from '../infrastructure/cache/ICacheProvider';
import { IValidationProvider } from '../infrastructure/validation/IValidationProvider';
import { IdParamSchema } from '../types/dto/common/id-param.dto';

const router: Router = express.Router();
const adminController = di.resolve(AdminController);
const validator = di.resolve<IValidationProvider>('IValidationProvider');

router.use(getAccessToRoute, getAdminAccess);
router.use(auditMiddleware('ADMIN_ACTION', { tags: ['admin'] }));

//Block User
router.get(
  '/block/:id',
  validator.validateParams!(IdParamSchema),
  checkUserExist,
  adminController.blockUser
);

router.delete(
  '/user/:id',
  validator.validateParams!(IdParamSchema),
  checkUserExist,
  adminController.deleteUser
);

// Basit Redis test endpointi
router.get('/redis-test', async (req, res) => {
  const { key = 'test', value } = req.query;
  const cacheProvider = di.resolve<ICacheProvider>('ICacheProvider');
  if (value) {
    await cacheProvider.set(key as string, value, 60); // 60 sn cache
  }
  const data = await cacheProvider.get(key as string);
  res.json({ key, value: data });
});

export default router;
