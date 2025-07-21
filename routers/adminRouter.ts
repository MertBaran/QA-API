import express, { Router } from 'express';
import {
  getAccessToRoute,
  getAdminAccess,
} from '../middlewares/authorization/authMiddleware';
import { checkUserExist } from '../middlewares/database/databaseErrorHelpers';
import { AuditMiddleware } from '../middlewares/audit/auditMiddleware';
import { container } from 'tsyringe';
import { AdminController } from '../controllers/adminController';
import { ICacheProvider } from '../infrastructure/cache/ICacheProvider';
import { IValidationProvider } from '../infrastructure/validation/IValidationProvider';
import { IdParamSchema } from '../types/dto/common/id-param.dto';

const router: Router = express.Router();
const adminController = new AdminController(container.resolve('IAdminService'));
const validator = container.resolve<IValidationProvider>('IValidationProvider');
const auditMiddleware = new AuditMiddleware(
  container.resolve('IAuditProvider')
);

router.use(getAccessToRoute, getAdminAccess);
router.use(
  auditMiddleware.createMiddleware('ADMIN_ACTION', { tags: ['admin'] })
);

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
  const cacheProvider = container.resolve<ICacheProvider>('ICacheProvider');
  if (value) {
    await cacheProvider.set(key as string, value, 60); // 60 sn cache
  }
  const data = await cacheProvider.get(key as string);
  res.json({ key, value: data });
});

export default router;
