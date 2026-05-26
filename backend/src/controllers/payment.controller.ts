import { Request, Response } from 'express';
import Loan from '../models/Loan';
import Payment from '../models/Payment';

// Record a payment
export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { loanId, utrNumber, amount, paymentDate } = req.body;

    if (!loanId || !utrNumber || !amount || !paymentDate) {
      res.status(400).json({ message: 'Loan ID, UTR number, amount, and payment date are required' });
      return;
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }
    if (loan.status !== 'disbursed') {
      res.status(400).json({ message: 'Payments can only be recorded for disbursed loans' });
      return;
    }

    // Check UTR uniqueness
    const existingPayment = await Payment.findOne({ utrNumber: utrNumber.trim() });
    if (existingPayment) {
      res.status(409).json({ message: 'UTR number already exists. Each payment must have a unique UTR.' });
      return;
    }

    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) {
      res.status(400).json({ message: 'Payment amount must be greater than 0' });
      return;
    }

    // Don't allow overpayment
    if (paymentAmount > loan.outstandingBalance) {
      res.status(400).json({
        message: `Payment amount (₹${paymentAmount}) exceeds outstanding balance (₹${loan.outstandingBalance.toFixed(2)})`,
      });
      return;
    }

    const payment = await Payment.create({
      loanId,
      borrowerId: loan.borrowerId,
      recordedBy: req.user!._id,
      utrNumber: utrNumber.trim(),
      amount: paymentAmount,
      paymentDate: new Date(paymentDate),
    });

    // Update loan totals
    loan.totalPaid = Math.round((loan.totalPaid + paymentAmount) * 100) / 100;
    loan.outstandingBalance = Math.round((loan.outstandingBalance - paymentAmount) * 100) / 100;

    // Auto-close if fully paid
    if (loan.outstandingBalance <= 0) {
      loan.outstandingBalance = 0;
      loan.status = 'closed';
      loan.closedAt = new Date();
    }

    await loan.save();

    res.status(201).json({
      message: loan.status === 'closed' ? 'Payment recorded. Loan is now closed.' : 'Payment recorded successfully',
      payment,
      loan: {
        _id: loan._id,
        status: loan.status,
        totalPaid: loan.totalPaid,
        outstandingBalance: loan.outstandingBalance,
        totalRepayment: loan.totalRepayment,
        closedAt: loan.closedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get payments for a loan
export const getPaymentsByLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;
    const payments = await Payment.find({ loanId })
      .populate('recordedBy', 'fullName')
      .sort({ paymentDate: -1 });

    res.json({ payments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
