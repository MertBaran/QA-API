import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { IValidationProvider } from './IValidationProvider';

export class ZodValidationProvider implements IValidationProvider {
  validateBody(schema: z.ZodType<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: result.error.issues.map(e => ({
            path: e.path,
            message: e.message,
          })),
        });
      }
      req.body = result.data;
      return next();
    };
  }

  validateParams(schema: z.ZodType<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: result.error.issues.map(e => ({
            path: e.path,
            message: e.message,
          })),
        });
      }
      req.params = result.data;
      return next();
    };
  }
}
