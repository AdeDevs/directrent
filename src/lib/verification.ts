import { User, VerificationLevel } from '../types';

/**
 * Calculates the verification level of a user based on their data.
 * 
 * Tenants:
 * - NONE: No verification
 * - TRUSTED: Phone verified
 * - VERIFIED: Phone verified + NIN added
 * 
 * Agents:
 * - NONE: Not verified by admin
 * - VERIFIED: ID and Selfie approved by admin
 */
export function calculateVerificationLevel(user: Partial<User>): VerificationLevel {
  const { role, verificationStatus, phoneVerified, nin } = user;

  if (role === 'agent') {
    if (verificationStatus === 'verified') return 'verified';
    return 'none';
  }

  // Tenant logic
  if (phoneVerified) {
    if (nin && nin.length === 11) return 'verified';
    return 'trusted';
  }

  return 'none';
}

/**
 * Checks if the profile is complete.
 * firstName, lastName, phoneVerified, gender, age, city, nin, avatarUrl
 */
export function isProfileComplete(user: Partial<User>): boolean {
  const common = !!(
    user.firstName &&
    user.lastName &&
    user.phoneVerified &&
    user.dob &&
    user.city
  );

  if (user.role === 'agent') {
      return common && !!user.nin;
  }

  return common;
}
