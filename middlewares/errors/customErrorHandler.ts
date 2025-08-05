import { Request, Response, NextFunction } from 'express';
import { appErrorHandler } from './appErrorHandler';

// Backward compatibility için eski ismi koruyoruz
function customErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Yeni app error handler'ı kullan
  appErrorHandler(err, req, res, next);
}

export default customErrorHandler;
