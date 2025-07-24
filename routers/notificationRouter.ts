import { Router } from 'express';
import { container } from 'tsyringe';
import { NotificationController } from '../controllers/notificationController';
import { getAccessToRoute } from '../middlewares/authorization/authMiddleware';
import { requireAdmin } from '../middlewares/authorization/permissionMiddleware';

const router = Router();
const notificationController = new NotificationController(
  container.resolve('INotificationService')
);

// Admin yetkisi gerektiren endpoint'ler
router.use(getAccessToRoute, requireAdmin);

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

// Debug endpoint - notification'ları kontrol et
router.get(
  '/debug/:userId',
  getAccessToRoute,
  notificationController.debugNotifications.bind(notificationController)
);

// Queue durumunu kontrol etme
router.get(
  '/queue/status',
  getAccessToRoute,
  notificationController.getQueueStatus.bind(notificationController)
);

// Kullanıcının bildirimlerini getirme
router.get(
  '/user/:userId',
  getAccessToRoute,
  notificationController.getUserNotifications.bind(notificationController)
);

// Bildirim istatistiklerini getirme
router.get(
  '/stats',
  getAccessToRoute,
  notificationController.getNotificationStats.bind(notificationController)
);

export default router;
