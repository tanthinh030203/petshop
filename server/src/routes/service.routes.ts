import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import { createServiceSchema, updateServiceSchema, serviceQuerySchema } from '../validators/service.validator';
import * as serviceController from '../controllers/service.controller';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(serviceQuerySchema), serviceController.getAll);
router.post('/', validate(createServiceSchema), serviceController.create);
router.get('/:id', serviceController.getById);
router.put('/:id', validate(updateServiceSchema), serviceController.update);

export default router;
