import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';

dotenv.config();

const seedUsers = [
  { email: 'admin@lms.com',        password: 'Admin@123',        fullName: 'Admin User',         role: 'admin' },
  { email: 'sales@lms.com',        password: 'Sales@123',        fullName: 'Sales Executive',    role: 'sales' },
  { email: 'sanction@lms.com',     password: 'Sanction@123',     fullName: 'Sanction Executive', role: 'sanction' },
  { email: 'disbursement@lms.com', password: 'Disburse@123',     fullName: 'Disburse Executive', role: 'disbursement' },
  { email: 'collection@lms.com',   password: 'Collect@123',      fullName: 'Collection Executive', role: 'collection' },
  { email: 'borrower@lms.com',     password: 'Borrower@123',     fullName: 'Test Borrower',      role: 'borrower' },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  for (const userData of seedUsers) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`User already exists: ${userData.email}`);
      continue;
    }
    await User.create(userData);
    console.log(`Created user: ${userData.email} (${userData.role})`);
  }

  console.log('\n=== Seed Complete ===');
  console.log('Login credentials:');
  seedUsers.forEach(u => {
    console.log(`  ${u.role.padEnd(14)} | ${u.email.padEnd(28)} | ${u.password}`);
  });

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
