import express, { Router } from 'express';
import { container } from 'tsyringe';
import { UserController } from '../controllers/userController';
import { checkUserExist } from '../middlewares/database/databaseErrorHelpers';
import { IValidationProvider } from '../infrastructure/validation/IValidationProvider';
import { IdParamSchema } from '../types/dto/common/id-param.dto';
import { getAccessToRoute, getOptionalAccess } from '../middlewares/authorization/authMiddleware';

import { TOKENS } from '../services/TOKENS';

const router: Router = express.Router();
const userController = new UserController(
  container.resolve('IAdminService'),
  container.resolve('IUserService'),
  container.resolve('IUserRoleService'),
  container.resolve(TOKENS.IContentAssetService)
);
const validator = container.resolve<IValidationProvider>('IValidationProvider');

// Public endpoint - get user profile (with optional auth for isFollowing)
router.get(
  '/:id',
  getOptionalAccess, // Optional authentication - sets req.user if authenticated
  validator.validateParams!(IdParamSchema),
  checkUserExist,
  userController.getPublicUserProfile
);

// Authenticated endpoints - follow/unfollow
router.post(
  '/:id/follow',
  getAccessToRoute,
  validator.validateParams!(IdParamSchema),
  checkUserExist,
  userController.followUser
);

router.post(
  '/:id/unfollow',
  getAccessToRoute,
  validator.validateParams!(IdParamSchema),
  checkUserExist,
  userController.unfollowUser
);

// Public endpoints - get followers/following
router.get(
  '/:id/followers',
  validator.validateParams!(IdParamSchema),
  checkUserExist,
  userController.getFollowers
);

router.get(
  '/:id/following',
  validator.validateParams!(IdParamSchema),
  checkUserExist,
  userController.getFollowing
);

export default router;
