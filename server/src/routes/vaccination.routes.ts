import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { branchFilter } from '../middlewares/branch.middleware';
import { createVaccinationSchema } from '../validators/vaccination.validator';
import * as vaccinationController from '../controllers/vaccination.controller';

const router = Router();

router.use(authenticate);

router.post('/', authorize('vaccinations:write'), branchFilter, validate(createVaccinationSchema), vaccinationController.create);
router.get('/reminders', authorize('vaccinations:read'), branchFilter, vaccinationController.getReminders);
router.get('/:id', authorize('vaccinations:read'), vaccinationController.getById);

export default router;
