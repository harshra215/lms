import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'borrower' | 'sales' | 'sanction' | 'disbursement' | 'collection' | 'admin';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  pan?: string;
  dateOfBirth?: Date;
  monthlySalary?: number;
  employmentMode?: 'salaried' | 'self-employed' | 'unemployed';
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['borrower', 'sales', 'sanction', 'disbursement', 'collection', 'admin'],
      default: 'borrower',
    },
    fullName: { type: String, required: true, trim: true },
    pan: { type: String, uppercase: true, trim: true },
    dateOfBirth: { type: Date },
    monthlySalary: { type: Number },
    employmentMode: {
      type: String,
      enum: ['salaried', 'self-employed', 'unemployed'],
    },
    isProfileComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Don't return password in JSON
UserSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: unknown, ret: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete ret.password;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return ret;
  },
});

export default mongoose.model<IUser>('User', UserSchema);
