import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { branchFilter } from '../middlewares/branch.middleware';
import {
  createMedicalRecordSchema,
  updateMedicalRecordSchema,
  createPrescriptionSchema,
} from '../validators/medical.validator';
import * as medicalController from '../controllers/medical.controller';

const router = Router();

router.use(authenticate);

router.post('/', authorize('medical:write'), branchFilter, validate(createMedicalRecordSchema), medicalController.create);
router.get('/:id', authorize('medical:read'), medicalController.getById);
router.put('/:id', authorize('medical:write'), validate(updateMedicalRecordSchema), medicalController.update);
router.post('/:id/prescriptions', authorize('medical:write'), validate(createPrescriptionSchema), medicalController.addPrescriptions);

export default router;
