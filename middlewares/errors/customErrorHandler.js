const CustomError = require("../../helpers/error/CustomError");
const customErrorHandler = (err,req,res,next) => {

    let customError = err;

    if(err.name === "CastError"){
        customError = new CustomError("please provide a valid id", 400);
    }
    if(err.name === "SyntaxError"){
        customError = new CustomError("Unexpected Syntax", 400);
    }
    if(err.name === "ValidationError"){
        customError = new CustomError("Please provide a valid email or password", 400);
    }
    if(err.code === 11000){
        customError = new CustomError("Duplicate Key Found : Check Your Input", 400);
    }

    console.log(customError.name,customError.message,customError.statusCode);
    
    res.status(customError.statusCode || 500).json({
        success: false,
        message: customError.message || "Internal Server Error" 
    });
};

module.exports = customErrorHandler;