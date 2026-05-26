import { Request, Response } from 'express';
import User from '../models/User';
import Loan from '../models/Loan';
import Payment from '../models/Payment';

export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalBorrowers,
      totalLoans,
      appliedLoans,
      sanctionedLoans,
      disbursedLoans,
      closedLoans,
      rejectedLoans,
    ] = await Promise.all([
      User.countDocuments({ role: 'borrower' }),
      Loan.countDocuments(),
      Loan.countDocuments({ status: 'applied' }),
      Loan.countDocuments({ status: 'sanctioned' }),
      Loan.countDocuments({ status: 'disbursed' }),
      Loan.countDocuments({ status: 'closed' }),
      Loan.countDocuments({ status: 'rejected' }),
    ]);

    const totalDisbursedAmount = await Loan.aggregate([
      { $match: { status: { $in: ['disbursed', 'closed'] } } },
      { $group: { _id: null, total: { $sum: '$principalAmount' } } },
    ]);

    const totalCollected = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      totalBorrowers,
      totalLoans,
      appliedLoans,
      sanctionedLoans,
      disbursedLoans,
      closedLoans,
      rejectedLoans,
      totalDisbursedAmount: totalDisbursedAmount[0]?.total || 0,
      totalCollected: totalCollected[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
