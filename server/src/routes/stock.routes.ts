import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { branchFilter } from '../middlewares/branch.middleware';
import {
  importStockSchema,
  exportStockSchema,
  transferStockSchema,
} from '../validators/stock.validator';
import * as stockController from '../controllers/stock.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('stock:read'), branchFilter, stockController.getStock);
router.post('/import', authorize('stock:write'), branchFilter, validate(importStockSchema), stockController.importStock);
router.post('/export', authorize('stock:write'), branchFilter, validate(exportStockSchema), stockController.exportStock);
router.post('/transfer', authorize('stock:write'), branchFilter, validate(transferStockSchema), stockController.transferStock);
router.get('/movements', authorize('stock:read'), branchFilter, stockController.getMovements);

export default router;
