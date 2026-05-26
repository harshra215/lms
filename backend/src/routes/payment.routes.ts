import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { recordPayment, getPaymentsByLoan } from '../controllers/payment.controller';

const router = Router();

router.post('/', authenticate, authorize('collection', 'admin'), recordPayment);
router.get('/loan/:loanId', authenticate, authorize('collection', 'admin'), getPaymentsByLoan);

export default router;
