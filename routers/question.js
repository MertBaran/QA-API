const express = require("express");
// api/questions
const answer = require("./answer");

const { 
    getAllQuestions,
    getSingleQuestion,
    askNewQuestion,
    editQuestion,
    deleteQuestion,
    likeQuestion,
    undoLikeQuestion
 } = require("../controllers/question");
const {getAccessToRoute, getQuestionOwnerAccess} = require("../middlewares/authorization/auth");
const { checkQuestionExist } = require("../middlewares/database/databaseErrorHelpers");

const router = express.Router();

router.get("/", getAllQuestions);
router.get("/:id", checkQuestionExist,getSingleQuestion);
router.post("/ask",getAccessToRoute,askNewQuestion);
router.get("/:id/like",[getAccessToRoute,checkQuestionExist],likeQuestion);
router.get("/:id/undo_like",[getAccessToRoute,checkQuestionExist],undoLikeQuestion);
router.put("/:id/edit",[getAccessToRoute,checkQuestionExist,getQuestionOwnerAccess],editQuestion);
router.delete("/:id/delete", [getAccessToRoute,checkQuestionExist,getQuestionOwnerAccess],deleteQuestion);

router.use("/:question_id/answers",checkQuestionExist,answer);

module.exports = router;

