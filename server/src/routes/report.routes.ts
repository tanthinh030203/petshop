import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { branchFilter } from '../middlewares/branch.middleware';
import * as reportController from '../controllers/report.controller';

const router = Router();

router.use(authenticate, authorize('reports:view'), branchFilter);

router.get('/revenue', reportController.getRevenue);
router.get('/top-products', reportController.getTopProducts);
router.get('/top-services', reportController.getTopServices);
router.get('/customers', reportController.getCustomerStats);
router.get('/appointments', reportController.getAppointmentStats);
router.get('/stock-alerts', reportController.getStockAlerts);

export default router;
