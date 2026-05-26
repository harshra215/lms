import { Request, Response } from 'express';
import User from '../models/User';
import { runBRE } from '../utils/bre';

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, pan, dateOfBirth, monthlySalary, employmentMode } = req.body;
    const userId = req.user!._id;

    if (!fullName || !pan || !dateOfBirth || !monthlySalary || !employmentMode) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    // Run BRE on server
    const breResult = runBRE({
      dateOfBirth: new Date(dateOfBirth),
      monthlySalary: Number(monthlySalary),
      pan: pan.toUpperCase(),
      employmentMode,
    });

    if (!breResult.passed) {
      res.status(422).json({
        message: 'Eligibility check failed',
        errors: breResult.errors,
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        pan: pan.toUpperCase(),
        dateOfBirth: new Date(dateOfBirth),
        monthlySalary: Number(monthlySalary),
        employmentMode,
        isProfileComplete: true,
      },
      { new: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user!._id,
        email: user!.email,
        fullName: user!.fullName,
        role: user!.role,
        pan: user!.pan,
        dateOfBirth: user!.dateOfBirth,
        monthlySalary: user!.monthlySalary,
        employmentMode: user!.employmentMode,
        isProfileComplete: user!.isProfileComplete,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Sales module: get all borrowers who haven't applied yet
export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments({ role: 'borrower' });
    const users = await User.find({ role: 'borrower' })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
