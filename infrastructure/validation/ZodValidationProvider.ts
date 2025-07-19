import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { IValidationProvider } from './IValidationProvider';

export const ZodValidationProvider: IValidationProvider = {
  validateBody(schema: ZodSchema<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: result.error.issues.map(e => ({ path: e.path, message: e.message })),
        });
      }
      req.body = result.data;
      next();
    };
  },
  validateParams(schema: ZodSchema<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: result.error.issues.map(e => ({ path: e.path, message: e.message })),
        });
      }
      req.params = result.data;
      next();
    };
  }
}; 