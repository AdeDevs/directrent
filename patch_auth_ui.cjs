const fs = require('fs');
let code = fs.readFileSync('src/pages/Auth.tsx', 'utf8');

code = code.replace(
  /{isResetMode \? 'Enter your email to receive a password reset link' : \(authMode === 'login' \? 'Sign in to access your listings' : \(signupStep === 1 \? 'Fast signup to start your housing journey' : 'Provide your NIN and contact details'\)\)}/,
  "{isResetMode ? 'Enter your email or phone to receive a password reset OTP' : (authMode === 'login' ? 'Sign in to access your listings' : (signupStep === 1 ? 'Fast signup to start your housing journey' : 'Provide your NIN and contact details'))}"
);

code = code.replace(
  /isResetMode\s*\?\s*\(smsStep === 'otp' \? 'Verify OTP' : \(smsStep === 'new-password' \? 'Set New Password' : \(resetMethod === 'email' \? 'Send Reset Link' : 'Send OTP'\)\)\)/,
  "isResetMode\n                    ? (smsStep === 'otp' ? 'Verify OTP' : (smsStep === 'new-password' ? 'Set New Password' : 'Send OTP'))"
);

code = code.replace(
  /isResetMode\s*\?\s*\(smsStep === 'otp' \? 'Verifying\.\.\.' : \(smsStep === 'new-password' \? 'Updating\.\.\.' : 'Sending Link\.\.\.'\)\)/,
  "isResetMode\n                    ? (smsStep === 'otp' ? 'Verifying...' : (smsStep === 'new-password' ? 'Updating...' : 'Sending OTP...'))"
);

fs.writeFileSync('src/pages/Auth.tsx', code);
