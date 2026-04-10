import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import { branchFilter } from '../middlewares/branch.middleware';
import { createPetSchema, updatePetSchema, petQuerySchema } from '../validators/pet.validator';
import * as petController from '../controllers/pet.controller';

const router = Router();

router.use(authenticate);
router.use(branchFilter);

router.get('/', validateQuery(petQuerySchema), petController.getAll);
router.post('/', validate(createPetSchema), petController.create);
router.get('/:id', petController.getById);
router.put('/:id', validate(updatePetSchema), petController.update);
router.get('/:id/medical-records', petController.getMedicalRecords);
router.get('/:id/vaccinations', petController.getVaccinations);
router.get('/:id/appointments', petController.getAppointments);

export default router;
