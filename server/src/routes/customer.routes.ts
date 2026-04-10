import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import { branchFilter } from '../middlewares/branch.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
  customerSearchSchema,
} from '../validators/customer.validator';
import * as customerController from '../controllers/customer.controller';

const router = Router();

router.use(authenticate);
router.use(branchFilter);

router.get('/search', validateQuery(customerSearchSchema), customerController.search);
router.get('/', validateQuery(customerQuerySchema), customerController.getAll);
router.post('/', authorize('customers:write'), validate(createCustomerSchema), customerController.create);
router.get('/:id', customerController.getById);
router.put('/:id', authorize('customers:write'), validate(updateCustomerSchema), customerController.update);
router.get('/:id/pets', customerController.getPets);

export default router;
