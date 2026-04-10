import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { branchFilter } from '../middlewares/branch.middleware';
import {
  createInvoiceSchema,
  updateInvoiceStatusSchema,
  createPaymentSchema,
} from '../validators/invoice.validator';
import * as invoiceController from '../controllers/invoice.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('invoices:read'), branchFilter, invoiceController.getAll);
router.post('/', authorize('invoices:create'), branchFilter, validate(createInvoiceSchema), invoiceController.create);
router.get('/:id', authorize('invoices:read'), invoiceController.getById);
router.patch('/:id/status', authorize('invoices:write'), validate(updateInvoiceStatusSchema), invoiceController.updateStatus);
router.post('/:id/payments', authorize('payments:create'), branchFilter, validate(createPaymentSchema), invoiceController.addPayment);

export default router;
