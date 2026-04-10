import { Router } from 'express';
import authRoutes from './auth.routes';
import branchRoutes from './branch.routes';
import userRoutes from './user.routes';
import customerRoutes from './customer.routes';
import petRoutes from './pet.routes';
import productRoutes from './product.routes';
import serviceRoutes from './service.routes';
import appointmentRoutes from './appointment.routes';
import medicalRoutes from './medical.routes';
import vaccinationRoutes from './vaccination.routes';
import hotelRoutes from './hotel.routes';
import invoiceRoutes from './invoice.routes';
import stockRoutes from './stock.routes';
import reportRoutes from './report.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/branches', branchRoutes);
router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/pets', petRoutes);
router.use('/products', productRoutes);
router.use('/services', serviceRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/medical-records', medicalRoutes);
router.use('/vaccinations', vaccinationRoutes);
router.use('/hotel', hotelRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/stock', stockRoutes);
router.use('/reports', reportRoutes);

export default router;
