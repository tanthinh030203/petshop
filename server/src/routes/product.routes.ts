import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import {
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  productQuerySchema,
} from '../validators/product.validator';
import * as productController from '../controllers/product.controller';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(productQuerySchema), productController.getAll);
router.post('/', validate(createProductSchema), productController.create);
router.get('/categories', productController.getCategories);
router.post('/categories', validate(createCategorySchema), productController.createCategory);
router.get('/:id', productController.getById);
router.put('/:id', validate(updateProductSchema), productController.update);

export default router;
