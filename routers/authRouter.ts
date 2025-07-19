import express, { Router } from "express";
import { container as di } from "../services/container";
import { AuthController } from "../controllers/authController";
import { IValidationProvider } from "../infrastructure/validation/IValidationProvider";
const router: Router = express.Router();

import { getAccessToRoute } from "../middlewares/authorization/authMiddleware";
import profileImageUpload from "../middlewares/libraries/profileImageUpload";
import { auditMiddleware } from '../middlewares/audit/auditMiddleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../infrastructure/validation/schemas/authSchemas";

const authController = di.resolve(AuthController);
const validator = di.resolve<IValidationProvider>('ValidationProvider');

router.post("/register", validator.validateBody(registerSchema), auditMiddleware('USER_CREATE'), authController.register);
router.post("/login", validator.validateBody(loginSchema), auditMiddleware('USER_LOGIN'), authController.login);
router.get("/logout", authController.logout);
router.post("/forgotpassword", validator.validateBody(forgotPasswordSchema), authController.forgotpassword);
router.put("/resetpassword", validator.validateBody(resetPasswordSchema), auditMiddleware('PASSWORD_UPDATE'), authController.resetPassword);
router.get("/profile", getAccessToRoute, authController.getUser);
router.post(
  "/upload",
  [getAccessToRoute, profileImageUpload.single("profile_image")],
  authController.imageUpload
);
router.post("/loginGoogle", authController.googleLogin);

export default router;
