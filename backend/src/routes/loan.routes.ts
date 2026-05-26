import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { uploadSalarySlip as uploadMiddleware } from '../middleware/upload.middleware';
import {
  uploadSalarySlip,
  applyLoan,
  getMyLoans,
  getMyLoanById,
  getAppliedLoans,
  sanctionLoan,
  rejectLoan,
  getSanctionedLoans,
  disburseLoan,
  getDisbursedLoans,
  getAllLoans,
  getLoanById,
} from '../controllers/loan.controller';

const router = Router();

// Borrower routes
router.post('/upload-salary-slip', authenticate, authorize('borrower'), uploadMiddleware, uploadSalarySlip);
router.post('/apply', authenticate, authorize('borrower'), applyLoan);
router.get('/my', authenticate, authorize('borrower'), getMyLoans);
router.get('/my/:id', authenticate, authorize('borrower'), getMyLoanById);

// Sanction routes
router.get('/applied', authenticate, authorize('sanction', 'admin'), getAppliedLoans);
router.patch('/:id/sanction', authenticate, authorize('sanction', 'admin'), sanctionLoan);
router.patch('/:id/reject', authenticate, authorize('sanction', 'admin'), rejectLoan);

// Disbursement routes
router.get('/sanctioned', authenticate, authorize('disbursement', 'admin'), getSanctionedLoans);
router.patch('/:id/disburse', authenticate, authorize('disbursement', 'admin'), disburseLoan);

// Collection routes
router.get('/disbursed', authenticate, authorize('collection', 'admin'), getDisbursedLoans);

// Admin: all loans
router.get('/', authenticate, authorize('admin'), getAllLoans);

// Any executive or admin: single loan detail
router.get('/:id', authenticate, authorize('sanction', 'disbursement', 'collection', 'admin'), getLoanById);

export default router;
