import express, { Router } from 'express';
import { container } from 'tsyringe';
import { ContentAssetController } from '../controllers/contentAssetController';
import { getAccessToRoute } from '../middlewares/authorization/authMiddleware';
import { IValidationProvider } from '../infrastructure/validation/IValidationProvider';
import { CreatePresignedAssetUploadSchema } from '../types/dto/content/create-presigned-asset.dto';
import { ResolveAssetUrlSchema } from '../types/dto/content/resolve-asset-url.dto';
import { DeleteAssetSchema } from '../types/dto/content/delete-asset.dto';

const router: Router = express.Router();
const controller = container.resolve(ContentAssetController);
const validator = container.resolve<IValidationProvider>('IValidationProvider');

router.post(
  '/presigned-upload',
  getAccessToRoute,
  validator.validateBody(CreatePresignedAssetUploadSchema),
  controller.createPresignedUpload
);

router.post(
  '/resolve-url',
  getAccessToRoute,
  validator.validateBody(ResolveAssetUrlSchema),
  controller.resolveAssetUrl
);

router.delete(
  '/',
  getAccessToRoute,
  validator.validateBody(DeleteAssetSchema),
  controller.deleteAsset
);

export default router;
