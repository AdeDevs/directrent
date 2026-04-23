import { User, VerificationLevel } from '../types';

/**
 * Calculates the verification level of a user based on their data.
 * 
 * VERIFIED: phoneVerified = true
 * TRUSTED: phoneVerified = true + avatarUrl exists + nin exists
 * FULLY VERIFIED (FUTURE): NIN verified via external API (placeholder logic for now)
 */
export function calculateVerificationLevel(user: Partial<User>): VerificationLevel {
  const { phoneVerified, avatarUrl, nin } = user;

  // Potential future logic for Fully Verified (e.g., if we had a ninVerified flag)
  // For now, let's just stick to what was requested.
  
  const hasPhone = !!phoneVerified;
  const hasAvatar = !!avatarUrl;
  const hasNin = !!nin && nin.length >= 10;

  if (hasPhone && hasAvatar && hasNin) {
    // If we had an external API check, we'd check ninVerified here for "Fully Verified"
    // For now, return Trusted as the highest automatic level
    return 'Trusted';
  }

  if (hasPhone) {
    return 'Verified';
  }

  return 'Unverified';
}

/**
 * Checks if the profile is complete.
 * fullName, phoneVerified, gender, age, city, nin, avatarUrl
 */
export function isProfileComplete(user: Partial<User>): boolean {
  return !!(
    user.name &&
    user.phoneVerified &&
    user.gender &&
    user.age &&
    user.city &&
    user.nin &&
    user.avatarUrl
  );
}
