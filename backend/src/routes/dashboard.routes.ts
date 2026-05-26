import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getAdminStats } from '../controllers/dashboard.controller';

const router = Router();

router.get('/stats', authenticate, authorize('admin'), getAdminStats);

export default router;
