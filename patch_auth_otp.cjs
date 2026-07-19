const fs = require('fs');
let code = fs.readFileSync('src/pages/Auth.tsx', 'utf8');

// We will inject the Email OTP logic into sendSignupOTP
const newSendSignupOTP = `
  const sendSignupOTP = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!formData.phoneNumber && !formData.email) {
      setErrors({ form: 'Please provide an email or phone number to verify.' });
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    try {
      const isEmail = formData.email && formData.email.includes('@');
      
      if (isEmail) {
        // --- EMAIL OTP LOGIC (MAILTRAP) ---
        const response = await fetch('/api/auth/send-email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, type: 'signup' })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to send Email OTP');
        
        setIsPhoneVerifying(true);
        setResendTimer(60);
      } else {
        // --- PHONE OTP LOGIC (FIREBASE SMS) ---
        const cleaned = cleanPhone(formData.phoneNumber);
        const formattedPhone = \`+234\${cleaned}\`;
        
        if (window.recaptchaVerifier) {
          try { window.recaptchaVerifier.clear(); } catch (e) {}
          window.recaptchaVerifier = null;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const container = recaptchaContainerRef.current || document.getElementById('recaptcha-container-signup');
        if (!container) throw new Error("Verification container not ready.");
        
        window.recaptchaVerifier = new RecaptchaVerifier(auth, container, {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
            setErrors({ phoneNumber: 'reCAPTCHA expired. Please verify again.' });
            if (window.recaptchaVerifier) {
              try { window.recaptchaVerifier.clear(); } catch (e) {}
              window.recaptchaVerifier = null;
            }
          }
        });
        
        if (!navigator.onLine) throw new Error("You are offline.");
        
        const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
        setConfirmationObj(result);
        setIsPhoneVerifying(true);
        setResendTimer(60);
      }
    } catch (error: any) {
      console.error("Verification Error:", error);
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (e) {}
        window.recaptchaVerifier = null;
      }
      setErrors({ form: error.message || 'Failed to send verification code. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };
`;

code = code.replace(/const sendSignupOTP = async \(e\?: React\.MouseEvent\) => \{[\s\S]*?catch \(error: any\) \{[\s\S]*?finally \{[\s\S]*?setIsLoading\(false\);\n    \}\n  \};/, newSendSignupOTP.trim());

const newVerifySignupOTP = `
  const verifySignupOTP = async () => {
    if (!otpCode) return;
    setIsLoading(true);
    setErrors({});
    try {
      const isEmail = formData.email && formData.email.includes('@');
      
      if (isEmail) {
        // --- VERIFY EMAIL OTP ---
        const response = await fetch('/api/auth/verify-email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, otp: otpCode, type: 'signup' })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Invalid OTP');
      } else {
        // --- VERIFY PHONE OTP ---
        if (!confirmationObj) throw new Error("Session expired.");
        await confirmationObj.confirm(otpCode);
      }
      
      // Success: Clear OTP UI and mark as verified
      setPhoneVerified(true);
      setIsPhoneVerifying(false);
      setOtpCode('');
      setErrors(prev => {
        const next = { ...prev };
        delete next.phoneNumber;
        delete next.email;
        delete next.form;
        return next;
      });
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (e) {}
        window.recaptchaVerifier = null;
      }
      
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }, 100);
    } catch (err: any) {
      console.error("OTP Verification Error:", err);
      setErrors({ form: 'Invalid or expired verification code.' });
    } finally {
      setIsLoading(false);
    }
  };
`;

code = code.replace(/const verifySignupOTP = async \(\) => \{[\s\S]*?finally \{[\s\S]*?setIsLoading\(false\);\n    \}\n  \};/, newVerifySignupOTP.trim());

fs.writeFileSync('src/pages/Auth.tsx', code);
