import express, { Request, Response, Router } from 'express';
//  /api
const router: Router = express.Router();

import questionRouter from './questionRouter';
import authRouter from './authRouter';
import userRouter from './userRouter';
import publicUserRouter from './publicUserRouter';
import adminRouter from './adminRouter';
import answerRouter from './answerRouter';
import standaloneAnswerRouter from './standaloneAnswerRouter';
import notificationRouter from './notificationRouter';
import monitoringRouter from './monitoringRouter';
import permissionRouter from './permissionRouter';
import bookmarkRouter from './bookmarkRouter';
router.get('/', (req: Request, res: Response) => {
  res.send('Home Page');
});

router.use('/questions', questionRouter);
router.use('/auth', authRouter);
router.use('/public/users', publicUserRouter);
router.use('/users', userRouter);
router.use('/admin', adminRouter);
router.use('/questions/:question_id/answers', answerRouter);
router.use('/answers', standaloneAnswerRouter);
router.use('/notifications', notificationRouter);
router.use('/monitoring', monitoringRouter);
router.use('/permissions', permissionRouter);
router.use('/bookmarks', bookmarkRouter);

export default router;
