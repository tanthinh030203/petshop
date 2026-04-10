import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import { createUserSchema, updateUserSchema, updateStatusSchema, userQuerySchema } from '../validators/user.validator';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('users:manage'));

router.get('/', validateQuery(userQuerySchema), userController.getAll);
router.post('/', validate(createUserSchema), userController.create);
router.get('/:id', userController.getById);
router.put('/:id', validate(updateUserSchema), userController.update);
router.patch('/:id/status', validate(updateStatusSchema), userController.updateStatus);

export default router;
