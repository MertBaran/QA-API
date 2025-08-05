import type { RequestHandler } from 'express';

export interface IValidationProvider {
  validateBody(schema: any): RequestHandler;
  validateParams(schema: any): RequestHandler;
  validateQuery(schema: any): RequestHandler;
}
