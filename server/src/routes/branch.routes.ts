import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import { createBranchSchema, updateBranchSchema, branchQuerySchema } from '../validators/branch.validator';
import * as branchController from '../controllers/branch.controller';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(branchQuerySchema), branchController.getAll);
router.post('/', authorize('branches:manage'), validate(createBranchSchema), branchController.create);
router.get('/:id', branchController.getById);
router.put('/:id', authorize('branches:manage'), validate(updateBranchSchema), branchController.update);
router.delete('/:id', authorize('branches:manage'), branchController.remove);

export default router;
