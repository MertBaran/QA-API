import { Router } from 'express';
import { container } from 'tsyringe';
import { NotificationController } from '../controllers/notificationController';
import { getAccessToRoute } from '../middlewares/authorization/authMiddleware';

const router = Router();
const notificationController = container.resolve(NotificationController);

// Kullanıcının tüm aktif kanallarına bildirim gönderme
router.post(
  '/user/:userId',
  getAccessToRoute,
  notificationController.sendNotificationToUser.bind(notificationController)
);

// Belirli kanallara bildirim gönderme
router.post(
  '/channels',
  getAccessToRoute,
  notificationController.sendNotificationToChannels.bind(notificationController)
);

// Kullanıcının bildirim tercihlerini alma
router.get(
  '/preferences/:userId',
  getAccessToRoute,
  notificationController.getUserNotificationPreferences.bind(
    notificationController
  )
);

// Kullanıcının bildirim tercihlerini güncelleme
router.put(
  '/preferences/:userId',
  getAccessToRoute,
  notificationController.updateUserNotificationPreferences.bind(
    notificationController
  )
);

// Test amaçlı - tüm kanallara bildirim gönderme
router.post(
  '/test/:userId',
  getAccessToRoute,
  notificationController.sendTestNotification.bind(notificationController)
);

export default router;
