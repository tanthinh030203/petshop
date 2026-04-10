import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { branchFilter } from '../middlewares/branch.middleware';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateStatusSchema,
} from '../validators/appointment.validator';
import * as appointmentController from '../controllers/appointment.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('appointments:read'), branchFilter, appointmentController.getAll);
router.post('/', authorize('appointments:write'), branchFilter, validate(createAppointmentSchema), appointmentController.create);
router.get('/calendar', authorize('appointments:read'), branchFilter, appointmentController.getCalendar);
router.get('/:id', authorize('appointments:read'), appointmentController.getById);
router.put('/:id', authorize('appointments:write'), validate(updateAppointmentSchema), appointmentController.update);
router.patch('/:id/status', authorize('appointments:write'), validate(updateStatusSchema), appointmentController.updateStatus);

export default router;
