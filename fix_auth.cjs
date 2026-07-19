const fs = require('fs');
let code = fs.readFileSync('src/pages/Auth.tsx', 'utf8');

// 1. Remove all instances of handleEmailOtpVerify and handleEmailUpdatePassword blocks
// The block starts with "const handleEmailOtpVerify = async () => {" and ends before "const handleSmsOtpVerify" or just matches the whole block.
// Let's use a regex that matches from "const handleEmailOtpVerify" up to and including the closing brace of handleEmailUpdatePassword.

code = code.replace(/const handleEmailOtpVerify = async \(\) => \{[\s\S]*?const handleEmailUpdatePassword = async \(\) => \{[\s\S]*?finally \{[\s\S]*?setIsLoading\(false\);\n    \}\n  \};\n\n/g, '');

// 2. Inject one clean version of handleEmailOtpVerify and handleEmailUpdatePassword just before handleSmsOtpVerify

const cleanHandlers = `
  const handleEmailOtpVerify = async () => {
    if (!otpCode) {
      setErrors({ form: 'Please enter the verification code' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: otpCode, type: 'reset' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid OTP');
      
      setSmsStep('new-password');
      setErrors({});
    } catch (error: any) {
      console.error("OTP verification error:", error);
      setErrors({ form: error.message || 'Invalid verification code' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailUpdatePassword = async () => {
    if (!newResetPassword || newResetPassword.length < 6) {
      setErrors({ form: 'Password must be at least 6 characters' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: otpCode, newPassword: newResetPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update password');
      
      // Success
      setIsResetMode(false);
      setResetSent(false);
      setSmsStep('phone');
      setOtpCode('');
      setNewResetPassword('');
      
      // Sign in automatically
      await signInWithEmailAndPassword(auth, formData.email, newResetPassword);
    } catch (error: any) {
      console.error("Password update error:", error);
      setErrors({ form: error.message || 'Failed to update password' });
    } finally {
      setIsLoading(false);
    }
  };

`;

code = code.replace(/const handleSmsOtpVerify = async \(\) => \{/, cleanHandlers + '  const handleSmsOtpVerify = async () => {');

// 3. Fix the state variables in the email reset UI block.
// Find the block for email reset UI which I added, which starts with `{smsStep === 'otp' && (` and has `resetOtp` and `newPassword`.
// We will just do global replacement of `resetOtp` to `otpCode` and `newPassword` to `newResetPassword` in the range of the JSX. But wait, replacing globally might break other things, but `resetOtp` doesn't exist anywhere else.
// And `newPassword` might exist? Wait, we used `newPassword` in `handleEmailUpdatePassword` which we just cleaned up. Is there any other `newPassword`? Let's check.
code = code.replace(/resetOtp/g, 'otpCode');
code = code.replace(/setNewPassword/g, 'setNewResetPassword');

// Wait, the variable in the input is `value={newPassword}`.
// Let's replace `value={newPassword}` with `value={newResetPassword}`
code = code.replace(/value=\{newPassword\}/g, 'value={newResetPassword}');

fs.writeFileSync('src/pages/Auth.tsx', code);
