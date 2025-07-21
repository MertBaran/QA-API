import { Request, Response, NextFunction } from 'express';
import CustomError from '../../helpers/error/CustomError';

function customErrorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  let customError = err;

  if (err.name === 'SyntaxError') {
    const message = 'Unexpected Syntax';
    customError = new CustomError(message, 400);
  }
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(', ');
    customError = new CustomError(message, 400);
  }
  if (err.code === 11000) {
    const message = 'Duplicate Field Value Enter';
    customError = new CustomError(message, 400);
  }
  if (err.name === 'CastError') {
    const message = 'Please provide a valid id';
    customError = new CustomError(message, 400);
  }

  console.log(customError);

  res.status(customError.statusCode || 500).json({
    success: false,
    error: customError.message || 'Server Error',
  });
}

export default customErrorHandler;
