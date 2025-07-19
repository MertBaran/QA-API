import { Request, Response, NextFunction } from "express";
import CustomError from "../../helpers/error/CustomError";
import { container } from 'tsyringe';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';
import { ValidationMiddlewareMessages } from "../constants/MiddlewareMessages";

interface CustomErrorType extends Error {
    statusCode?: number;
    code?: number;
}

const customErrorHandler = (err: CustomErrorType, req: Request, res: Response, next: NextFunction) => {

    let customError = err;

    if(err.name === "CastError"){
        customError = new CustomError(ValidationMiddlewareMessages.InvalidId, 400);
    }
    if(err.name === "SyntaxError"){
        customError = new CustomError(ValidationMiddlewareMessages.UnexpectedSyntax, 400);
    }
    if(err.name === "ValidationError"){
        customError = new CustomError(ValidationMiddlewareMessages.InvalidCredentials, 400);
    }
    if(err.code === 11000){
        customError = new CustomError(ValidationMiddlewareMessages.DuplicateKey, 400);
    }

    const logger = container.resolve<ILoggerProvider>('LoggerProvider');
    console.log(customError.name, customError.message, customError.statusCode);
    logger.error(`${customError.name}: ${customError.message}`, { statusCode: customError.statusCode });
    
    res.status(customError.statusCode || 500).json({
        success: false,
        message: customError.message || "Internal Server Error" 
    });
};

export default customErrorHandler;