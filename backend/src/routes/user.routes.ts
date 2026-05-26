import { Router } from 'express';
import { updateProfile, getLeads } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Borrower updates their own profile
router.put('/profile', authenticate, authorize('borrower'), updateProfile);

// Sales / Admin: get all borrower leads
router.get('/leads', authenticate, authorize('sales', 'admin'), getLeads);

export default router;
