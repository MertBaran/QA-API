import { Request, Response, NextFunction } from 'express';

export interface IMetricsProvider {
  middleware: (req: Request, res: Response, next: NextFunction) => void;
  endpoint: (req: Request, res: Response) => void;
}
