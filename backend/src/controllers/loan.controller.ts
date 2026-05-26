import { Request, Response } from 'express';
import path from 'path';
import Loan from '../models/Loan';
import User from '../models/User';
import { runBRE, calculateLoanDetails } from '../utils/bre';

// Step 3: Upload salary slip (returns file URL)
export const uploadSalarySlip = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      message: 'File uploaded successfully',
      fileUrl,
      originalName: req.file.originalname,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Step 4: Apply for loan
export const applyLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const borrower = req.user!;
    const { principalAmount, tenureDays, salarySlipUrl, salarySlipOriginalName } = req.body;

    if (!principalAmount || !tenureDays || !salarySlipUrl) {
      res.status(400).json({ message: 'Principal amount, tenure, and salary slip are required' });
      return;
    }

    // Ensure profile is complete
    if (!borrower.isProfileComplete) {
      res.status(400).json({ message: 'Please complete your profile before applying' });
      return;
    }

    // Re-run BRE on server for security
    const breResult = runBRE({
      dateOfBirth: borrower.dateOfBirth!,
      monthlySalary: borrower.monthlySalary!,
      pan: borrower.pan!,
      employmentMode: borrower.employmentMode!,
    });

    if (!breResult.passed) {
      res.status(422).json({ message: 'Eligibility check failed', errors: breResult.errors });
      return;
    }

    // Validate loan config
    const amount = Number(principalAmount);
    const tenure = Number(tenureDays);

    if (amount < 50000 || amount > 500000) {
      res.status(400).json({ message: 'Loan amount must be between ₹50,000 and ₹5,00,000' });
      return;
    }
    if (tenure < 30 || tenure > 365) {
      res.status(400).json({ message: 'Tenure must be between 30 and 365 days' });
      return;
    }

    // Check for existing active loan
    const existingLoan = await Loan.findOne({
      borrowerId: borrower._id,
      status: { $in: ['applied', 'sanctioned', 'disbursed'] },
    });
    if (existingLoan) {
      res.status(409).json({ message: 'You already have an active loan application' });
      return;
    }

    const { interestRate, simpleInterest, totalRepayment } = calculateLoanDetails(amount, tenure);

    const loan = await Loan.create({
      borrowerId: borrower._id,
      fullName: borrower.fullName,
      pan: borrower.pan,
      dateOfBirth: borrower.dateOfBirth,
      monthlySalary: borrower.monthlySalary,
      employmentMode: borrower.employmentMode,
      salarySlipUrl,
      salarySlipOriginalName: salarySlipOriginalName || 'salary-slip',
      principalAmount: amount,
      tenureDays: tenure,
      interestRate,
      simpleInterest,
      totalRepayment,
      status: 'applied',
      totalPaid: 0,
      outstandingBalance: totalRepayment,
    });

    res.status(201).json({ message: 'Loan application submitted', loan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Borrower: get their own loans
export const getMyLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ borrowerId: req.user!._id }).sort({ createdAt: -1 });
    res.json({ loans });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Borrower: get single loan
export const getMyLoanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, borrowerId: req.user!._id });
    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }
    res.json({ loan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Sanction: get all applied loans
export const getAppliedLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const total = await Loan.countDocuments({ status: 'applied' });
    const loans = await Loan.find({ status: 'applied' })
      .populate('borrowerId', 'email fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ loans, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Sanction: approve a loan
export const sanctionLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }
    if (loan.status !== 'applied') {
      res.status(400).json({ message: `Cannot sanction a loan with status: ${loan.status}` });
      return;
    }

    loan.status = 'sanctioned';
    loan.sanctionedBy = req.user!._id;
    loan.sanctionedAt = new Date();
    await loan.save();

    res.json({ message: 'Loan sanctioned successfully', loan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Sanction: reject a loan
export const rejectLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      res.status(400).json({ message: 'Rejection reason is required' });
      return;
    }

    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }
    if (loan.status !== 'applied') {
      res.status(400).json({ message: `Cannot reject a loan with status: ${loan.status}` });
      return;
    }

    loan.status = 'rejected';
    loan.rejectionReason = rejectionReason;
    loan.rejectedBy = req.user!._id;
    loan.rejectedAt = new Date();
    await loan.save();

    res.json({ message: 'Loan rejected', loan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Disbursement: get sanctioned loans
export const getSanctionedLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const total = await Loan.countDocuments({ status: 'sanctioned' });
    const loans = await Loan.find({ status: 'sanctioned' })
      .populate('borrowerId', 'email fullName')
      .populate('sanctionedBy', 'fullName')
      .sort({ sanctionedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ loans, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Disbursement: disburse a loan
export const disburseLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }
    if (loan.status !== 'sanctioned') {
      res.status(400).json({ message: `Cannot disburse a loan with status: ${loan.status}` });
      return;
    }

    loan.status = 'disbursed';
    loan.disbursedBy = req.user!._id;
    loan.disbursedAt = new Date();
    await loan.save();

    res.json({ message: 'Loan disbursed successfully', loan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Collection: get disbursed loans
export const getDisbursedLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const total = await Loan.countDocuments({ status: { $in: ['disbursed', 'closed'] } });
    const loans = await Loan.find({ status: { $in: ['disbursed', 'closed'] } })
      .populate('borrowerId', 'email fullName')
      .populate('disbursedBy', 'fullName')
      .sort({ disbursedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ loans, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Admin: get all loans
export const getAllLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const filter = status ? { status } : {};
    const total = await Loan.countDocuments(filter);
    const loans = await Loan.find(filter)
      .populate('borrowerId', 'email fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ loans, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get single loan by ID (for executives)
export const getLoanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('borrowerId', 'email fullName')
      .populate('sanctionedBy', 'fullName')
      .populate('rejectedBy', 'fullName')
      .populate('disbursedBy', 'fullName');

    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }
    res.json({ loan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
