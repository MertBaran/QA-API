import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { getAccessToRoute } from '../middlewares/authorization/authMiddleware';

const router = Router();
const adminController = new AdminController();

// Admin routes - tümü authentication ve admin yetkisi gerektirir
router.get('/users', getAccessToRoute, adminController.getUsers);
router.put('/users/:userId', getAccessToRoute, adminController.updateUser);
router.delete('/users/:userId', getAccessToRoute, adminController.deleteUser);
router.patch(
  '/users/:userId/block',
  getAccessToRoute,
  adminController.toggleUserBlock
);
router.patch(
  '/users/:userId/roles',
  getAccessToRoute,
  adminController.updateUserRoles
);
router.get('/users/stats', getAccessToRoute, adminController.getUserStats);

// ELSER model yönetimi
router.get(
  '/elser/status',
  getAccessToRoute,
  adminController.checkElserModelStatus
);
router.post(
  '/elser/download',
  getAccessToRoute,
  adminController.downloadElserModel
);
router.post(
  '/elser/deploy',
  getAccessToRoute,
  adminController.deployElserModel
);

export default router;
