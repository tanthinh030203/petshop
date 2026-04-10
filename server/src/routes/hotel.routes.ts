import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { branchFilter } from '../middlewares/branch.middleware';
import { createBookingSchema } from '../validators/hotel.validator';
import * as hotelController from '../controllers/hotel.controller';

const router = Router();

router.use(authenticate);

router.get('/bookings', authorize('appointments:read'), branchFilter, hotelController.getAll);
router.post('/bookings', authorize('appointments:write'), branchFilter, validate(createBookingSchema), hotelController.create);
router.patch('/bookings/:id/check-in', authorize('appointments:write'), hotelController.checkIn);
router.patch('/bookings/:id/check-out', authorize('appointments:write'), hotelController.checkOut);

export default router;
