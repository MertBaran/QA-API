const express = require("express");
//  /api
const router = express.Router();

const questionRouter = require('./question');
const authRouter = require('./auth');
const userRouter = require('./user');
const adminRouter = require('./admin');
const answerRouter = require('./answer');

router.get("/", (req, res) => {
    res.send("Home Page");
});

router.use('/questions', questionRouter);
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/admin',adminRouter);
router.use('/answers',answerRouter);

module.exports = router;
