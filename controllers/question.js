const Question = require("../models/Question");
const CustomError = require("../helpers/error/CustomError.js");
const asyncErrorWrapper = require("express-async-handler");


const askNewQuestion = asyncErrorWrapper(async (req, res, next) => {
    const information = req.body;
    
    const question = await Question.create({
        ...information,
        user: req.user.id
    });

    res.status(200)
    .json({
        success:true,
        data: question
    });
});

const getAllQuestions = asyncErrorWrapper(async (req, res,next) => {
    const  questions = await Question.find();
    return res.status(200).json({
        success: true,
        data: questions
    });
});

const getSingleQuestion = asyncErrorWrapper(async (req, res,next) => {
    const {id} = req.params;

    const  question = await Question.findById(id);

    return res.status(200).json({
        success: true,
        data: question
    });
});

const editQuestion = asyncErrorWrapper(async (req, res,next) => {
    const {id} = req.params;
    const {title,content} = req.body;

    
    await Question.findByIdAndUpdate(id,{title,content}); //böyle de bir şey varmış videoda yapmıyor belki de sonradan çıktı ama aynı işi yapıyor
    /*question.title = title;
    question.content = content;
        */

    let question = await Question.findById(id);
    // await question.save();

    return res.status(200).json({
        success: true,
        data: question
    });
});

const deleteQuestion = asyncErrorWrapper(async (req, res,next) => {
    const {id} = req.params;
    await Question.findByIdAndDelete(id);

    return res.status(200).json({
        success: true,
        message: "Question delete operation successfull"
    });
});

const likeQuestion = asyncErrorWrapper(async (req, res,next) => {
    const {id} = req.params;

    const question = await Question.findById(id);
    // Like etmişse
    if(question.likes.includes(req.user.id)){
        return next(new CustomError("You already like this question",400));
    }
    question.likes.push(req.user.id);
    await question.save();

    return res.status(200).json({
        success: true,
        data: question
    });
});

const undoLikeQuestion = asyncErrorWrapper(async (req, res,next) => {
    const {id} = req.params;

    const question = await Question.findById(id);
    // Like etmemişse
    if(!question.likes.includes(req.user.id)){
        return next(new CustomError("You can not undo like operation for this question",400));
    }
    const index = question.likes.indexOf(req.user.id);
    question.likes.splice(index,1);
    await question.save();
    
    return res.status(200).json({
        success: true,
        data: question
    });
});

module.exports = {
    getAllQuestions,
    askNewQuestion,
    getSingleQuestion,
    editQuestion,
    deleteQuestion,
    likeQuestion,
    undoLikeQuestion
};

