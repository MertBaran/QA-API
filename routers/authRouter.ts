import express, { Router } from 'express';
import { container } from 'tsyringe';
import { AuthController } from '../controllers/authController';
import { IValidationProvider } from '../infrastructure/validation/IValidationProvider';
const router: Router = express.Router();

import { getAccessToRoute } from '../middlewares/authorization/authMiddleware';
import profileImageUpload from '../middlewares/libraries/profileImageUpload';
import { AuditMiddleware } from '../middlewares/audit/auditMiddleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  editProfileSchema,
} from '../infrastructure/validation/schemas/authSchemas';

let loggerProvider: any;
try {
  loggerProvider = container.resolve('ILoggerProvider');
} catch {
  loggerProvider = console;
}

import { TOKENS } from '../services/TOKENS';

const authController = new AuthController(
  container.resolve('IAuthService'),
  container.resolve('IUserService'),
  container.resolve('IUserRoleService'),
  container.resolve('IRoleService'),
  container.resolve('IPermissionService'),
  container.resolve(TOKENS.IContentAssetService),
  loggerProvider,
  container.resolve('IExceptionTracker')
);
const validator = container.resolve<IValidationProvider>('IValidationProvider');
const auditMiddleware = new AuditMiddleware(
  container.resolve('IAuditProvider')
);

router.post(
  '/register',
  validator.validateBody(registerSchema),
  auditMiddleware.createMiddleware('USER_CREATE'),
  authController.register
);
router.post(
  '/login',
  validator.validateBody(loginSchema),
  auditMiddleware.createMiddleware('USER_LOGIN'),
  authController.login
);
router.get('/logout', authController.logout);
router.post(
  '/forgotpassword',
  validator.validateBody(forgotPasswordSchema),
  authController.forgotpassword
);
router.put(
  '/resetpassword',
  validator.validateBody(resetPasswordSchema),
  auditMiddleware.createMiddleware('PASSWORD_UPDATE'),
  authController.resetPassword
);
router.get('/profile', getAccessToRoute, authController.getUser);
router.put(
  '/edit',
  getAccessToRoute,
  validator.validateBody(editProfileSchema),
  auditMiddleware.createMiddleware('PROFILE_UPDATE'),
  authController.editProfile
);
router.post(
  '/upload',
  [getAccessToRoute, profileImageUpload.single('profile_image')],
  authController.imageUpload
);
router.put(
  '/background',
  getAccessToRoute,
  authController.updateProfileBackground
);
router.put(
  '/profile-image',
  getAccessToRoute,
  authController.updateProfileImage
);
router.post('/loginGoogle', authController.googleLogin);

router.get('/test-error', authController.testError);

// Admin permission check endpoint'i
router.get(
  '/check-admin-permissions',
  getAccessToRoute,
  authController.checkAdminPermissions
);

export default router;
