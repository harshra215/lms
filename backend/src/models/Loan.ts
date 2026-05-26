import mongoose, { Document, Schema } from 'mongoose';

export type LoanStatus = 'applied' | 'sanctioned' | 'rejected' | 'disbursed' | 'closed';

export interface ILoan extends Document {
  _id: mongoose.Types.ObjectId;
  borrowerId: mongoose.Types.ObjectId;
  // Personal snapshot at time of application
  fullName: string;
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: string;
  // Salary slip
  salarySlipUrl: string;
  salarySlipOriginalName: string;
  // Loan config
  principalAmount: number;
  tenureDays: number;
  interestRate: number; // fixed 12% p.a.
  simpleInterest: number;
  totalRepayment: number;
  // Status
  status: LoanStatus;
  // Sanction
  sanctionedBy?: mongoose.Types.ObjectId;
  sanctionedAt?: Date;
  rejectionReason?: string;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  // Disbursement
  disbursedBy?: mongoose.Types.ObjectId;
  disbursedAt?: Date;
  // Collection
  totalPaid: number;
  outstandingBalance: number;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    borrowerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    pan: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    monthlySalary: { type: Number, required: true },
    employmentMode: { type: String, required: true },
    salarySlipUrl: { type: String, required: true },
    salarySlipOriginalName: { type: String, required: true },
    principalAmount: { type: Number, required: true, min: 50000, max: 500000 },
    tenureDays: { type: Number, required: true, min: 30, max: 365 },
    interestRate: { type: Number, default: 12 },
    simpleInterest: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
    status: {
      type: String,
      enum: ['applied', 'sanctioned', 'rejected', 'disbursed', 'closed'],
      default: 'applied',
    },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt: { type: Date },
    rejectionReason: { type: String },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },
    totalPaid: { type: Number, default: 0 },
    outstandingBalance: { type: Number, required: true },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ILoan>('Loan', LoanSchema);
