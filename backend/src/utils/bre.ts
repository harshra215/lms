/**
 * Business Rule Engine (BRE)
 * Runs on the server — authoritative source of truth for eligibility.
 */

export interface BREInput {
  dateOfBirth: Date;
  monthlySalary: number;
  pan: string;
  employmentMode: string;
}

export interface BREResult {
  passed: boolean;
  errors: string[];
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function runBRE(input: BREInput): BREResult {
  const errors: string[] = [];

  // Rule 1: Age must be between 23 and 50
  const age = calculateAge(new Date(input.dateOfBirth));
  if (age < 23 || age > 50) {
    errors.push(`Age must be between 23 and 50 years. Your age: ${age}`);
  }

  // Rule 2: Monthly salary must be >= 25,000
  if (input.monthlySalary < 25000) {
    errors.push(`Monthly salary must be at least ₹25,000. Provided: ₹${input.monthlySalary}`);
  }

  // Rule 3: PAN must match valid format (AAAAA9999A)
  if (!PAN_REGEX.test(input.pan.toUpperCase())) {
    errors.push('PAN number is invalid. Expected format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)');
  }

  // Rule 4: Applicant must not be unemployed
  if (input.employmentMode === 'unemployed') {
    errors.push('Unemployed applicants are not eligible for a loan');
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

/**
 * Simple Interest calculation
 * SI = (P × R × T) / (365 × 100)
 */
export function calculateLoanDetails(principal: number, tenureDays: number) {
  const rate = 12; // fixed 12% p.a.
  const si = (principal * rate * tenureDays) / (365 * 100);
  const totalRepayment = principal + si;
  return {
    interestRate: rate,
    simpleInterest: Math.round(si * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
  };
}
