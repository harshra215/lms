/**
 * Client-side BRE — for instant UI feedback only.
 * Server always re-validates before accepting the application.
 */

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export interface BREClientResult {
  passed: boolean;
  errors: string[];
}

export function runClientBRE(data: {
  dateOfBirth: string;
  monthlySalary: number;
  pan: string;
  employmentMode: string;
}): BREClientResult {
  const errors: string[] = [];

  const age = calculateAge(new Date(data.dateOfBirth));
  if (isNaN(age) || age < 23 || age > 50) {
    errors.push(`Age must be between 23 and 50 (yours: ${isNaN(age) ? '?' : age})`);
  }

  if (data.monthlySalary < 25000) {
    errors.push('Monthly salary must be at least ₹25,000');
  }

  if (!PAN_REGEX.test(data.pan.toUpperCase())) {
    errors.push('Invalid PAN format (e.g. ABCDE1234F)');
  }

  if (data.employmentMode === 'unemployed') {
    errors.push('Unemployed applicants are not eligible');
  }

  return { passed: errors.length === 0, errors };
}

export function calcLoan(principal: number, tenureDays: number) {
  const rate = 12;
  const si = (principal * rate * tenureDays) / (365 * 100);
  return {
    simpleInterest: Math.round(si * 100) / 100,
    totalRepayment: Math.round((principal + si) * 100) / 100,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}
