const fs = require('fs');
let code = fs.readFileSync('src/pages/Auth.tsx', 'utf8');

const handlers = `
  const handleEmailOtpVerify = async () => {
    if (!resetOtp) {
      setErrors({ form: 'Please enter the verification code' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: resetOtp, type: 'reset' })
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
    if (!newPassword || newPassword.length < 6) {
      setErrors({ form: 'Password must be at least 6 characters' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: resetOtp, newPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update password');
      
      // Success
      setIsResetMode(false);
      setResetSent(false);
      setSmsStep('phone');
      setResetOtp('');
      setNewPassword('');
      
      // Sign in automatically
      await signInWithEmailAndPassword(auth, formData.email, newPassword);
    } catch (error: any) {
      console.error("Password update error:", error);
      setErrors({ form: error.message || 'Failed to update password' });
    } finally {
      setIsLoading(false);
    }
  };
`;

code = code.replace(/const handleSmsOtpVerify = async \(\) => \{/, handlers + '\n  const handleSmsOtpVerify = async () => {');

fs.writeFileSync('src/pages/Auth.tsx', code);
