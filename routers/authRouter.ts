import express, { Router, Request, Response, NextFunction } from 'express';
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
  requestPasswordChangeSchema,
  verifyPasswordChangeCodeSchema,
  confirmPasswordChangeSchema,
} from '../infrastructure/validation/schemas/authSchemas';

let loggerProvider: any;
try {
  loggerProvider = container.resolve('ILoggerProvider');
} catch {
  loggerProvider = console;
}

import { TOKENS } from '../services/TOKENS';

// Lazy resolve: initializeContainer (PostgreSQL/MongoDB seçimi) ilk request'ten ÖNCE çalışır,
// böylece doğru datasource resolve edilir
let _authController: AuthController;
function getAuthController(): AuthController {
  if (!_authController) {
    _authController = new AuthController(
      container.resolve('IAuthService'),
      container.resolve('IUserService'),
      container.resolve('IUserRoleService'),
      container.resolve('IRoleService'),
      container.resolve('IPermissionService'),
      container.resolve(TOKENS.IContentAssetService),
      loggerProvider,
      container.resolve('IExceptionTracker')
    );
  }
  return _authController;
}
const validator = container.resolve<IValidationProvider>('IValidationProvider');
const auditMiddleware = new AuditMiddleware(
  container.resolve('IAuditProvider')
);

router.post(
  '/register',
  validator.validateBody(registerSchema),
  auditMiddleware.createMiddleware('USER_CREATE'),
  (req: Request, res: Response, next: NextFunction) => getAuthController().register(req, res, next)
);
router.post(
  '/login',
  validator.validateBody(loginSchema),
  auditMiddleware.createMiddleware('USER_LOGIN'),
  (req: Request, res: Response, next: NextFunction) => getAuthController().login(req, res, next)
);
router.get('/logout', (req: Request, res: Response, next: NextFunction) => getAuthController().logout(req, res, next));
router.post(
  '/forgotpassword',
  validator.validateBody(forgotPasswordSchema),
  (req: Request, res: Response, next: NextFunction) => getAuthController().forgotpassword(req, res, next)
);
router.put(
  '/resetpassword',
  validator.validateBody(resetPasswordSchema),
  auditMiddleware.createMiddleware('PASSWORD_UPDATE'),
  (req: Request, res: Response, next: NextFunction) => getAuthController().resetPassword(req, res, next)
);
router.get('/profile', getAccessToRoute, (req: Request, res: Response, next: NextFunction) => getAuthController().getUser(req, res, next));
router.put(
  '/edit',
  getAccessToRoute,
  validator.validateBody(editProfileSchema),
  auditMiddleware.createMiddleware('PROFILE_UPDATE'),
  (req: Request, res: Response, next: NextFunction) => getAuthController().editProfile(req, res, next)
);
router.post(
  '/upload',
  [getAccessToRoute, profileImageUpload.single('profile_image')],
  (req: Request, res: Response, next: NextFunction) => getAuthController().imageUpload(req, res, next)
);
router.put(
  '/background',
  getAccessToRoute,
  (req: Request, res: Response, next: NextFunction) => getAuthController().updateProfileBackground(req, res, next)
);
router.put(
  '/profile-image',
  getAccessToRoute,
  (req: Request, res: Response, next: NextFunction) => getAuthController().updateProfileImage(req, res, next)
);
router.post('/loginGoogle', (req: Request, res: Response, next: NextFunction) => getAuthController().googleLogin(req, res, next));
router.post('/registerGoogle', (req: Request, res: Response, next: NextFunction) => getAuthController().googleRegister(req, res, next));
router.post(
  '/change-password/request',
  getAccessToRoute,
  validator.validateBody(requestPasswordChangeSchema),
  auditMiddleware.createMiddleware('PASSWORD_CHANGE_REQUEST'),
  (req: Request, res: Response, next: NextFunction) => getAuthController().requestPasswordChange(req, res, next)
);
router.post(
  '/change-password/verify',
  getAccessToRoute,
  validator.validateBody(verifyPasswordChangeCodeSchema),
  (req: Request, res: Response, next: NextFunction) => getAuthController().verifyPasswordChangeCode(req, res, next)
);
router.post(
  '/change-password/confirm',
  getAccessToRoute,
  validator.validateBody(confirmPasswordChangeSchema),
  auditMiddleware.createMiddleware('PASSWORD_UPDATE'),
  (req: Request, res: Response, next: NextFunction) => getAuthController().confirmPasswordChange(req, res, next)
);

router.get('/test-error', (req: Request, res: Response, next: NextFunction) => getAuthController().testError(req, res, next));

// Admin permission check endpoint'i
router.get(
  '/check-admin-permissions',
  getAccessToRoute,
  (req: Request, res: Response, next: NextFunction) => getAuthController().checkAdminPermissions(req, res, next)
);

export default router;
