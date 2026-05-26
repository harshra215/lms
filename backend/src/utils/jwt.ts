import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User';

export function generateToken(userId: string, role: UserRole): string {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
}
