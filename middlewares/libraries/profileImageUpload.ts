import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import CustomError from '../../infrastructure/error/CustomError';
import { UploadMiddlewareMessages } from '../constants/MiddlewareMessages';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
  savedProfileImage?: string;
}

const storage = multer.diskStorage({
  destination: (
    req: AuthenticatedRequest,
    file: any,
    cb: (error: Error | null, destination: string) => void
  ) => {
    const rootDir = path.dirname(require.main?.filename || '');
    cb(null, path.join(rootDir, 'public/uploads'));
  },
  filename: (
    req: AuthenticatedRequest,
    file: any,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const extension = file.mimetype.split('/')[1];
    req.savedProfileImage = `image_${req.user?.id}.${extension}`;
    cb(null, req.savedProfileImage);
  },
});

const fileFilter = (
  req: AuthenticatedRequest,
  file: any,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new CustomError(UploadMiddlewareMessages.InvalidFileType, 400));
  }

  return cb(null, true);
};

const profileImageUpload = multer({ storage, fileFilter });

export default profileImageUpload;
