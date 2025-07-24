import { Router } from 'express';
import { MonitoringController } from '../controllers/monitoringController';
import { getAccessToRoute } from '../middlewares/authorization/authMiddleware';
import { requireAdmin } from '../middlewares/authorization/permissionMiddleware';

const router = Router();
const monitoringController = new MonitoringController();

// Admin yetkisi gerektiren endpoint'ler
router.use(getAccessToRoute, requireAdmin);

// Connection status
router.get('/connections', (req, res) => {
  monitoringController.getConnectionStatus(req, res);
});

// Alert history
router.get('/alerts', (req, res) => {
  monitoringController.getAlertHistory(req, res);
});

// Monitoring stats
router.get('/stats', (req, res) => {
  monitoringController.getMonitoringStats(req, res);
});

// Start monitoring
router.post('/start', (req, res) => {
  monitoringController.startMonitoring(req, res);
});

// Stop monitoring
router.post('/stop', (req, res) => {
  monitoringController.stopMonitoring(req, res);
});

export default router;
