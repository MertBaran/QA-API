import { Request } from 'express';

export interface AuthenticatedRequest<P = any, B = any, Q = any> extends Request<P, any, B, Q> {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
} 