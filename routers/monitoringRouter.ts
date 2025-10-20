import { Router } from 'express';
import { MonitoringController } from '../controllers/monitoringController';
import { getAccessToRoute } from '../middlewares/authorization/authMiddleware';
import { requireAdmin } from '../middlewares/authorization/permissionMiddleware';

const router = Router();
const monitoringController = new MonitoringController();

// Admin yetkisi gerektiren endpoint'ler
router.use(getAccessToRoute, requireAdmin);

// Connection status
router.get('/connections', (req, res, next) => {
  monitoringController.getConnectionStatus(req, res, next);
});

// Alert history
router.get('/alerts', (req, res, next) => {
  monitoringController.getAlertHistory(req, res, next);
});

// Monitoring stats
router.get('/stats', (req, res, next) => {
  monitoringController.getMonitoringStats(req, res, next);
});

// Start monitoring
router.post('/start', (req, res, next) => {
  monitoringController.startMonitoring(req, res, next);
});

// Stop monitoring
router.post('/stop', (req, res, next) => {
  monitoringController.stopMonitoring(req, res, next);
});

export default router;
