const fs = require('fs');
let code = fs.readFileSync('src/pages/Auth.tsx', 'utf8');

const newResetLogic = `
    if (isResetMode && resetMethod === 'sms') {
      if (smsStep === 'otp') {
        return handleSmsOtpVerify();
      }
      if (smsStep === 'new-password') {
        return handleSmsUpdatePassword();
      }
    }
    
    if (isResetMode && resetMethod === 'email') {
      if (smsStep === 'otp') {
        return handleEmailOtpVerify();
      }
      if (smsStep === 'new-password') {
        return handleEmailUpdatePassword();
      }
    }

    if (isResetMode) {
      if (resetMethod === 'email') {
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setErrors({ email: 'Please enter a valid email address' });
          return;
        }
        setIsLoading(true);
        try {
          const response = await fetch('/api/auth/send-email-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, type: 'reset' })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Failed to send Email OTP');
          
          setResetSent(true);
          setSmsStep('otp');
          setErrors({});
          setResendTimer(60);
        } catch (error: any) {
          console.error("Password reset error:", error);
          setErrors({ form: \`Failed to send reset email: \${error.message || 'Please try again.'}\` });
        } finally {
          setIsLoading(false);
        }
      } else {
`;

code = code.replace(/if \(isResetMode && resetMethod === 'sms'\) \{[\s\S]*?if \(smsStep === 'new-password'\) \{[\s\S]*?return handleSmsUpdatePassword\(\);\n      \}\n    \}\n    \n    if \(isResetMode\) \{\n      if \(resetMethod === 'email'\) \{[\s\S]*?\} finally \{\n          setIsLoading\(false\);\n        \}\n      \} else \{/, newResetLogic.trim() + ' {\n');

fs.writeFileSync('src/pages/Auth.tsx', code);
