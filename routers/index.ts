import express, { Request, Response, Router } from "express";
//  /api
const router: Router = express.Router();

import questionRouter from './questionRouter';

import authRouter from './authRouter';
import userRouter from './userRouter';
import adminRouter from './adminRouter';
import answerRouter from './answerRouter';
router.get("/", (req: Request, res: Response) => {
    res.send("Home Page");
});

router.use('/questions', questionRouter);
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/admin', adminRouter);
router.use('/questions/:question_id/answers', answerRouter);

export default router;
