import React, { useState, useRef, useEffect } from 'react';
import { Home, X, Users, Handshake, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { UserRole, User } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updatePassword,
  ConfirmationResult,
  PhoneAuthProvider,
  linkWithCredential,
  signInWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

const Auth = () => {
  const { authMode, setAuthMode, preselectedRole, login, setView } = useAuth();
  const [role, setRole] = useState<UserRole>(preselectedRole);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetMethod, setResetMethod] = useState<'email' | 'sms'>('email');
  const [resetPhone, setResetPhone] = useState('');
  const [resetSent, setResetSent] = useState(false);
  
  // Real SMS Flow Variables
  const [signupStep, setSignupStep] = useState(1);
  const [smsStep, setSmsStep] = useState<'phone' | 'otp' | 'new-password' | 'done'>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmationObj, setConfirmationObj] = useState<ConfirmationResult | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    // Cleanup recaptcha if it exists when switching out of reset mode or unmounting
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
    };
  }, [isResetMode]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    nin: '',
    city: '',
    dob: '',
    password: '',
    confirmPassword: ''
  });

  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isPhoneVerifying, setIsPhoneVerifying] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const nigerianCities = [
    "Lagos", "Abuja", "Ibadan", "Port Harcourt", "Kano", "Ogbomoso", 
    "Enugu", "Ilorin", "Abeokuta", "Kaduna", "Owerri", "Benin City"
  ];

  const capitalize = (str: string) => {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    
    if (name === 'nin') {
      value = value.replace(/\D/g, ''); 
    } else if (name === 'firstName' || name === 'lastName') {
      value = value.replace(/[^a-zA-Z\s]/g, '');
      value = capitalize(value);
    } else if (name === 'phoneNumber') {
      let clean = value.replace(/\D/g, '');
      if (clean.startsWith('234') && clean.length > 10) {
        clean = clean.slice(3);
      } else if (clean.startsWith('0') && clean.length > 10) {
        clean = clean.slice(1);
      }
      
      if (clean.length <= 10) {
        // Format as XXX XXX XXXX
        let formatted = clean;
        if (clean.length > 3 && clean.length <= 6) {
          formatted = `${clean.slice(0, 3)} ${clean.slice(3)}`;
        } else if (clean.length > 6) {
          formatted = `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
        }
        setFormData(prev => ({ ...prev, [name]: formatted }));
      }
      return; 
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'phoneNumber') setPhoneVerified(false);
    
    // Clear field-specific error AND the global form error when user types
    if (errors[name] || errors.form) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        delete newErrs.form;
        return newErrs;
      });
    }
  };

  const handleAuthModeChange = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setErrors({});
    setIsResetMode(false);
    setResetSent(false);
    setSmsStep('phone');
    setSignupStep(1);
    setIsPhoneVerifying(false);
    setPhoneVerified(false);
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
      window.recaptchaVerifier = null;
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    const uppercaseRegex = /[A-Z]/;
    const ninRegex = /^\d{11}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Common checks
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (authMode === 'signup') {
      if (signupStep === 1) {
        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 7) newErrors.password = 'Min 7 characters';
        else if (!uppercaseRegex.test(formData.password)) newErrors.password = 'Need one uppercase letter';
        else if (!specialCharRegex.test(formData.password)) newErrors.password = 'Need one special character';
        
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }

      if (signupStep === 2) {
        if (!formData.city) newErrors.city = 'Please select a city';
        if (!formData.dob) newErrors.dob = 'Birthday is required';
        
        if (!formData.phoneNumber) {
          newErrors.phoneNumber = 'Phone number is required';
        } else if (formData.phoneNumber.length < 10) {
          newErrors.phoneNumber = 'Invalid phone number';
        } else if (!phoneVerified) {
          newErrors.phoneNumber = 'Please verify your phone number first';
        }
        
        if (!formData.nin) {
          newErrors.nin = 'NIN is required';
        } else if (!ninRegex.test(formData.nin)) {
          newErrors.nin = 'NIN must be 11 digits';
        }
      }
    } else if (authMode === 'login') {
      if (!formData.password) newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = (ignoreVerification = false) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const ninRegex = /^\d{11}$/;
    const uppercaseRegex = /[A-Z]/;
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;

    const emailValid = formData.email && emailRegex.test(formData.email);
    const passwordValid = formData.password && (authMode === 'login' || (
      formData.password.length >= 7 && 
      uppercaseRegex.test(formData.password) && 
      specialCharRegex.test(formData.password)
    ));

    if (authMode === 'login') {
      return !!(emailValid && passwordValid);
    }

    if (signupStep === 1) {
      return !!(formData.firstName && formData.lastName && emailValid && passwordValid && formData.password === formData.confirmPassword);
    }

    return !!(
      formData.firstName && 
      formData.lastName && 
      emailValid && 
      formData.city && 
      formData.dob && 
      formData.phoneNumber && formData.phoneNumber.length >= 10 &&
      (ignoreVerification || phoneVerified) &&
      formData.nin && ninRegex.test(formData.nin) &&
      passwordValid &&
      formData.password === formData.confirmPassword
    );
  };

  const isSmsOtpReady = smsStep === 'otp' && otpCode.length === 6;
  const isSmsNewPwdReady = smsStep === 'new-password' && newResetPassword.length >= 7;

  const isReady = isResetMode 
    ? (resetMethod === 'email' 
       ? (formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) 
       : (smsStep === 'phone' ? (resetPhone && resetPhone.length >= 10) : (smsStep === 'otp' ? isSmsOtpReady : isSmsNewPwdReady))
      )
    : (authMode === 'signup' && signupStep === 2 
        ? (formData.phoneNumber?.length >= 10 && formData.nin?.length === 11 && formData.city && formData.dob)
        : isFormValid());

  const handleSmsOtpVerify = async () => {
    if (!confirmationObj || !otpCode) return;
    setIsLoading(true);
    setErrors({});
    try {
      await confirmationObj.confirm(otpCode);
      // Automatically logs them in securely
      setSmsStep('new-password');
    } catch (err: any) {
      setErrors({ form: 'Invalid or expired verification code.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmsUpdatePassword = async () => {
    if (!auth.currentUser || newResetPassword.length < 7) {
      setErrors({ form: 'Password must be at least 7 characters.' });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      await updatePassword(auth.currentUser, newResetPassword);
      sessionStorage.removeItem('sms_reset_flow'); // Re-enable normal flow navigation
      setSmsStep('done');
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } catch (err: any) {
      setErrors({ form: 'Failed to update password. Please try again later.' });
    } finally {
      setIsLoading(false);
    }
  };

  const sendSignupOTP = async () => {
    if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
      setErrors({ phoneNumber: 'Enter a valid phone number' });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const cleanPhone = formData.phoneNumber.replace(/^0/, '');
      const formattedPhone = `+234${cleanPhone}`;

      // Reset recaptcha if it exists
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn("Error clearing existing reCAPTCHA:", e);
        }
        window.recaptchaVerifier = null;
      }

      // Small delay to ensure DOM element is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use normal reCAPTCHA for better reliability on dynamic domains/iframes
      const container = document.getElementById('recaptcha-container-signup');
      if (!container) {
        throw new Error("Phone verification container not ready. Please try again.");
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, container, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          setErrors({ phoneNumber: 'reCAPTCHA expired. Please verify again.' });
          if (window.recaptchaVerifier) {
            try {
              window.recaptchaVerifier.clear();
            } catch (e) {}
            window.recaptchaVerifier = null;
          }
        }
      });
      
      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationObj(result);
      setIsPhoneVerifying(true);
      setResendTimer(60);
    } catch (error: any) {
      console.error("Signup SMS Error details:", error);
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
      let message = 'Failed to send verification SMS. Please try again.';
      
      if (error.code === 'auth/invalid-app-credential' || error.message?.toLowerCase().includes('captcha') || error.code?.includes('captcha')) {
        message = 'Verification Failed: Firebase could not verify this site. PRO TIP: You MUST add your current domain (e.g., your-site.vercel.app) to "Authorized Domains" in Firebase Console > Authentication > Settings. Propagation can take up to 10 minutes.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please try again later or use a different number.';
      } else if (error.message?.includes('recaptcha')) {
        message = 'reCAPTCHA verification failed. Please try again.';
      }
      
      setErrors({ phoneNumber: message });
    } finally {
      setIsLoading(false);
    }
  };

  const verifySignupOTP = async () => {
    if (!confirmationObj || !otpCode) return;
    setIsLoading(true);
    setErrors({});
    try {
      await confirmationObj.confirm(otpCode);
      
      // Success: Clear OTP UI and mark as verified
      setPhoneVerified(true);
      setIsPhoneVerifying(false);
      setOtpCode('');
      
      // Clear errors immediately
      setErrors(prev => {
        const next = { ...prev };
        delete next.phoneNumber;
        delete next.form;
        return next;
      });

      // Cleanup reCAPTCHA
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
      
      console.log("Phone verified successfully");
      
      // Automatically attempt to finalize registration now that we are verified
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }, 100);
    } catch (err: any) {
      console.error("OTP Verification Error:", err);
      setErrors({ form: 'Invalid or expired verification code.' });
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserExists = async (fields: Record<string, string>) => {
    const params = new URLSearchParams();
    if (fields.email) params.append('email', fields.email);
    if (fields.nin) params.append('nin', fields.nin);
    if (fields.phoneNumber) params.append('phoneNumber', `+234${fields.phoneNumber.replace(/^0/, '')}`);
    
    try {
      const response = await fetch(`/api/users/exists?${params.toString()}`);
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Error checking duplicates:", error);
      return false; // Fail open slightly, or should I fail hard?
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setErrors({});

    if (authMode === 'signup') {
      if (signupStep === 1) {
        if (isFormValid()) {
          setIsLoading(true);
          // Check email
          const exists = await checkUserExists({ email: formData.email });
          setIsLoading(false);
          if (exists) {
            setErrors({ email: 'Email already registered', form: 'Email already registered' });
            return;
          }
          setSignupStep(2);
        } else {
          validate();
        }
        return;
      }

      if (signupStep === 2) {
        // If we are currently in verification mode, the main button should verify the OTP
        if (isPhoneVerifying) {
          return verifySignupOTP();
        }

        // Before proceeding to OTP/Signup, check for NIN/Phone duplicates
        if (isFormValid(true)) {
           setIsLoading(true);
           const exists = await checkUserExists({ nin: formData.nin, phoneNumber: formData.phoneNumber });
           setIsLoading(false);
           if (exists) {
              const errorMsg = 'NIN or Phone number already registered';
              setErrors({ nin: errorMsg, phoneNumber: errorMsg, form: errorMsg });
              return;
           }
        } else {
           validate();
           return;
        }
      }

      if (!phoneVerified && formData.phoneNumber && !isPhoneVerifying) {
        return sendSignupOTP();
      }
    }
    
    if (isResetMode && resetMethod === 'sms') {
      if (smsStep === 'otp') {
        return handleSmsOtpVerify();
      }
      if (smsStep === 'new-password') {
        return handleSmsUpdatePassword();
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
          // Check if email actually exists in our DB to give exact error as requested
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where("email", "==", formData.email));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            setErrors({ email: 'No account registered with this email address' });
            setIsLoading(false);
            return;
          }
          
          await sendPasswordResetEmail(auth, formData.email);
          setResetSent(true);
          setErrors({});
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            setErrors({ email: 'No account registered with this email address' });
          } else {
            setErrors({ form: 'Failed to send reset email. Please try again.' });
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        if (!resetPhone || resetPhone.length < 10) {
          setErrors({ phone: 'Please enter a valid phone number' });
          return;
        }
        setIsLoading(true);
        try {
          const cleanPhone = resetPhone.replace(/\D/g, '').replace(/^0/, '');
          if (!cleanPhone || cleanPhone.length < 10) {
            setErrors({ phone: 'Please enter a valid 10-digit phone number' });
            setIsLoading(false);
            return;
          }

          const formattedPhone = `+234${cleanPhone}`;
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where("phoneNumber", "==", formattedPhone));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            setErrors({ phone: 'No account registered with this phone number' });
            setIsLoading(false);
            return;
          }
          
          if (window.recaptchaVerifier) {
            try {
              window.recaptchaVerifier.clear();
            } catch (e) {}
            window.recaptchaVerifier = null;
          }
          
          // Small delay to ensure DOM is ready
          await new Promise(resolve => setTimeout(resolve, 100));

          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'normal',
            callback: () => {},
            'expired-callback': () => {
              setErrors({ phone: 'reCAPTCHA expired. Please verify again.' });
              if (window.recaptchaVerifier) {
                try {
                  window.recaptchaVerifier.clear();
                } catch (e) {}
                window.recaptchaVerifier = null;
              }
            }
          });
          
          if (!window.recaptchaVerifier) throw new Error("Verification container not ready");
          
          sessionStorage.setItem('sms_reset_flow', 'active');
          const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
          setConfirmationObj(result);
          setSmsStep('otp');
          setResendTimer(60);
          setErrors({});
        } catch (error: any) {
          console.error("SMS Reset Error details:", error);
          if (window.recaptchaVerifier) {
            try {
              window.recaptchaVerifier.clear();
            } catch (e) {}
            window.recaptchaVerifier = null;
          }
          let message = 'Failed to send reset SMS. Please check your connection.';
          
          if (error.code === 'auth/invalid-app-credential' || error.message?.toLowerCase().includes('captcha') || error.code?.includes('captcha')) {
            message = 'Verification Failed: Firebase could not verify your domain. Ensure your current URL is added to "Authorized Domains" in the Firebase Console (Auth > Settings). If you just added it, wait 5-10 mins for propagation.';
          } else if (error.code === 'auth/too-many-requests') {
            message = 'Too many requests. Please try again later or use a different number.';
          } else if (error.code === 'auth/invalid-phone-number') {
            message = 'Invalid phone number format.';
          }
          
          setErrors({ form: `${message} (${error.code || 'error'})` });

          if (window.recaptchaVerifier) {
            try {
              window.recaptchaVerifier.clear();
            } catch (e) {}
            window.recaptchaVerifier = null;
          }
        } finally {
          setIsLoading(false);
        }
      }
      return;
    }

    if (!isResetMode && authMode === 'signup' && signupStep === 2) {
       if (isPhoneVerifying) {
         return verifySignupOTP();
       }
       if (!phoneVerified && formData.phoneNumber && !isPhoneVerifying) {
         return sendSignupOTP();
       }
    }

    if (validate()) {
      setIsLoading(true);
      sessionStorage.setItem('just_logged_in', 'true');
      
      try {
        if (authMode === 'signup') {
          // Check for existing identifiers (NIN, Phone)
          setIsLoading(true);
          try {
            // Re-format phone for check
            const formattedPhone = `+234${formData.phoneNumber.replace(/^0/, '')}`;
            
            const response = await fetch(`/api/users/exists?nin=${formData.nin}&phoneNumber=${encodeURIComponent(formattedPhone)}`);
            const data = await response.json();
            
            if (data.exists) {
                const errorMsg = 'NIN or Phone number already registered with another account';
                setErrors({ nin: errorMsg, phoneNumber: errorMsg, form: errorMsg });
                setIsLoading(false);
                return;
            }
          } catch (error) {
              console.error("Error checking duplicates:", error);
          }

          // Firebase Signup
          let user;
          
          if (auth.currentUser && phoneVerified) {
            // User has a phone session from OTP verification.
            // Link that existing UID with the new Email/Password credential.
            const emailCred = EmailAuthProvider.credential(formData.email, formData.password);
            try {
              const res = await linkWithCredential(auth.currentUser, emailCred);
              user = res.user;
            } catch (err: any) {
              // If linking fails (e.g. email already in use), we need to report it correctly
              if (err.code === 'auth/email-already-in-use') {
                setErrors({ email: 'This email is already registered.' });
                setIsLoading(false);
                return;
              }
              throw err;
            }
          } else {
            // Tenant or standard signup: Create new email user
            const res = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            user = res.user;
          }

          const uid = user.uid;
          
          const userProfile: any = {
            id: uid,
            firstName: formData.firstName,
            lastName: formData.lastName,
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            phoneNumber: `+234${formData.phoneNumber.replace(/^0/, '')}`,
            phoneVerified: phoneVerified,
            verificationLevel: 'none',
            nin: formData.nin,
            city: formData.city,
            dob: formData.dob || '',
            role: role,
            country: 'Nigeria',
            verificationStatus: 'none',
            listingsCount: 0,
            createdAt: serverTimestamp()
          };
          
          // Store profile in Firestore
          try {
            await setDoc(doc(db, 'users', uid), userProfile);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
          }
          
          // Context will pick up onAuthStateChanged and move to App
        } else {
          // Firebase Login
          await signInWithEmailAndPassword(auth, formData.email, formData.password);
        }
      } catch (error: any) {
        // Silencing this to fix the console error report, since we handle it in UI
        // console.error("Auth error detail:", error);
        const code = error.code;
        setIsLoading(false);
        
        // Handle specifically based on code
        if (code === 'auth/user-not-found') {
          setErrors({ email: 'No account found with this email' });
          return;
        }

        if (code === 'auth/wrong-password') {
          setErrors({ password: 'Password is incorrect' });
          return;
        }

        if (code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
          // Firebase combines these for security, but we want to honor user request for specific feedback
          // Perform a quick database check to see if account exists
          try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("email", "==", formData.email));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
              setErrors({ email: 'No account found with this email' });
            } else {
              setErrors({ password: 'Password is incorrect' });
            }
          } catch (dbError) {
            // If DB check fails, fallback to generic message
            setErrors({ 
              form: 'Invalid email or password. Please check your credentials.',
              email: ' ', 
              password: ' ' 
            });
          }
          return;
        }

        // Generic handlers
        switch (code) {
          case 'auth/email-already-in-use':
            setErrors({ email: 'This email address is already registered' });
            break;
          case 'auth/too-many-requests':
            setErrors({ form: 'Account temporarily locked. Please try again in a few minutes.' });
            break;
          case 'auth/network-request-failed':
            setErrors({ form: 'Network error. Please check your internet connection.' });
            break;
          case 'auth/weak-password':
            setErrors({ password: 'Password must be at least 6 characters' });
            break;
          case 'auth/invalid-email':
            setErrors({ email: 'Please enter a valid email address' });
            break;
          case 'auth/user-disabled':
            setErrors({ form: 'This account has been disabled. Contact support.' });
            break;
          default:
            setErrors({ form: 'Authentication failed. Please try again later.' });
        }
      }
      // Note: we don't set isLoading(false) in finally because 
      // if successful, the component unmounts as view switches to 'app'
    }
  };

  const getInputClass = (fieldName: string) => {
    const baseClass = "w-full bg-slate-50 dark:bg-slate-900 border px-4 py-3 rounded-xl outline-none transition-all text-sm";
    const errorClass = errors[fieldName] 
      ? "border-red-500 dark:border-red-900 bg-red-50/30 dark:bg-red-900/10 focus:border-red-600 dark:focus:border-red-500 text-red-900 dark:text-red-400 placeholder-red-300 dark:placeholder-red-800" 
      : "border-slate-100 dark:border-slate-800 focus:border-primary-300 dark:focus:border-primary-700 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600";
    return `${baseClass} ${errorClass}`;
  };

  const ErrorMsg = ({ name }: { name: string }) => errors[name] ? (
    <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 ml-1 font-medium">{errors[name]}</p>
  ) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col p-6 transition-colors duration-300">
      <header className="flex items-center mb-8">
        <button onClick={() => setView('landing')} className="p-2 -ml-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="mx-auto flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Home className="text-white w-5 h-5" />
            </div>
             <span className="font-semibold text-slate-900 dark:text-white tracking-tight">DirectRent</span>
        </div>
        <div className="w-10" />
      </header>

      <main className="max-w-md mx-auto w-full pb-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-2">
            {isResetMode ? 'Reset password' : (authMode === 'login' ? 'Welcome back' : (signupStep === 1 ? 'Create account' : 'Verify Identity'))}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isResetMode ? 'Enter your email to receive a password reset link' : (authMode === 'login' ? 'Sign in to access your listings' : (signupStep === 1 ? 'Fast signup to start your housing journey' : 'Provide your NIN and contact details'))}
          </p>
        </div>

        {!isResetMode && (
          <div className="bg-slate-50 dark:bg-slate-900 p-1 rounded-xl flex items-center gap-1 mb-8 border border-slate-100 dark:border-slate-800">
            <button onClick={() => handleAuthModeChange('login')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${authMode === 'login' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Login</button>
            <button onClick={() => handleAuthModeChange('signup')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${authMode === 'signup' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Sign Up</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {resetSent && (
             <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 rounded-xl flex items-start gap-3 mb-6"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-400 font-medium leading-relaxed">
                {resetMethod === 'email' 
                  ? 'Password reset link sent! Check your email inbox or spam folder.' 
                  : 'Password reset link sent! Check your phone for an SMS.'}
              </p>
            </motion.div>
          )}

          {errors.form && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl flex items-start gap-3 mb-6"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400 font-medium leading-relaxed">{errors.form}</p>
            </motion.div>
          )}

          {authMode === 'signup' && signupStep === 1 && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button 
                type="button" 
                onClick={() => setRole('tenant')} 
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  role === 'tenant' 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <Users className={`w-6 h-6 ${role === 'tenant' ? 'text-primary-600' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${role === 'tenant' ? 'text-primary-700 dark:text-primary-400' : 'text-slate-400 dark:text-slate-600'}`}>Tenant</span>
              </button>
              <button 
                type="button" 
                onClick={() => setRole('agent')} 
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  role === 'agent' 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <Handshake className={`w-6 h-6 ${role === 'agent' ? 'text-primary-600' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${role === 'agent' ? 'text-primary-700 dark:text-primary-400' : 'text-slate-400 dark:text-slate-600'}`}>Agent</span>
              </button>
            </div>
          )}

          {authMode === 'signup' && signupStep === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">First Name</label>
                  <input name="firstName" value={formData.firstName} onChange={handleChange} type="text" placeholder="John" className={getInputClass('firstName')} />
                  <ErrorMsg name="firstName" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Last Name</label>
                  <input name="lastName" value={formData.lastName} onChange={handleChange} type="text" placeholder="Doe" className={getInputClass('lastName')} />
                  <ErrorMsg name="lastName" />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Email Address</label>
                <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="user@example.com" className={getInputClass('email')} />
                <ErrorMsg name="email" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Password</label>
                  </div>
                  <div className="relative">
                    <input 
                      name="password" 
                      value={formData.password} 
                      onChange={handleChange} 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className={getInputClass('password')} 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <ErrorMsg name="password" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Confirm</label>
                  <div className="relative">
                    <input 
                      name="confirmPassword" 
                      value={formData.confirmPassword} 
                      onChange={handleChange} 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className={getInputClass('confirmPassword')} 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <ErrorMsg name="confirmPassword" />
                </div>
              </div>
            </>
          )}

          {authMode === 'signup' && signupStep === 2 && (
            <>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <button 
                  type="button" 
                  onClick={() => setSignupStep(1)}
                  className="text-xs font-bold text-slate-400 hover:text-primary-600 flex items-center gap-1 mb-2"
                >
                  <X className="w-3 h-3" /> Back to stats
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">NIN</label>
                    <input name="nin" value={formData.nin} onChange={handleChange} type="text" placeholder="11 digits" maxLength={11} className={getInputClass('nin')} />
                    <ErrorMsg name="nin" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Birthday</label>
                    <input name="dob" value={formData.dob} onChange={handleChange} type="date" className={getInputClass('dob')} />
                    <ErrorMsg name="dob" />
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">City</label>
                   <select name="city" value={formData.city} onChange={handleChange} className={getInputClass('city')}>
                      <option value="" className="dark:bg-slate-900">Select City</option>
                      {nigerianCities.map(city => <option key={city} value={city} className="dark:bg-slate-900">{city}</option>)}
                    </select>
                    <ErrorMsg name="city" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Phone Number</label>
                  <div className={`relative flex items-center bg-slate-50 dark:bg-slate-900 border rounded-xl overflow-hidden transition-all ${errors.phoneNumber ? 'border-red-500 bg-red-50/10' : 'border-slate-100 dark:border-slate-800 focus-within:border-primary-300 dark:focus-within:border-primary-700'}`}>
                    <div className="px-3 py-3 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 tracking-tight">
                      +234
                    </div>
                    <input 
                      name="phoneNumber" 
                      value={formData.phoneNumber} 
                      onChange={handleChange} 
                      type="tel" 
                      placeholder="801 234 5678" 
                      maxLength={15}
                      disabled={isPhoneVerifying || phoneVerified}
                      className="w-full bg-transparent px-3 py-3 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400" 
                    />
                    {phoneVerified && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                    {isLoading && !isPhoneVerifying && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                      </div>
                    )}
                  </div>
                  <div id="recaptcha-container-signup" ref={recaptchaContainerRef} className="mt-2 flex justify-center" />
                  <ErrorMsg name="phoneNumber" />
                  
                  {isPhoneVerifying && !phoneVerified && (
                    <div className="mt-4 p-5 bg-white dark:bg-slate-900 border-2 border-primary-100 dark:border-primary-900 rounded-2xl shadow-xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">Phone Verification</span>
                          <span className="text-[9px] text-slate-400 font-bold">Code sent to +234 {formData.phoneNumber.replace(/^0/, '')}</span>
                        </div>
                        <button type="button" onClick={() => setIsPhoneVerifying(false)} className="text-[10px] font-bold text-slate-300 hover:text-red-500 uppercase transition-colors">Cancel</button>
                      </div>
                      
                      <div className="space-y-4 relative">
                        <div className="relative">
                          <div className="flex justify-between gap-2 px-1">
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                              <div 
                                key={index}
                                className={`w-10 h-12 flex items-center justify-center text-xl font-black rounded-xl border-2 transition-all duration-200
                                  ${otpCode.length === index ? 'border-primary-500 ring-4 ring-primary-500/10 bg-white dark:bg-slate-800' : 
                                    otpCode[index] ? 'border-primary-500/30 bg-primary-50/30 dark:bg-primary-900/10 dark:border-primary-900/50' : 
                                    'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'} 
                                  ${otpCode[index] ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}
                              >
                                {otpCode[index] || '•'}
                              </div>
                            ))}
                          </div>
                          
                          <input 
                            type="tel" 
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="absolute opacity-0 inset-0 w-full h-full cursor-pointer z-10"
                            autoFocus
                          />
                        </div>
                        
                        <div className="flex flex-col gap-2 relative z-20">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              verifySignupOTP();
                            }}
                            disabled={isLoading || otpCode.length < 6}
                            className={`w-full font-bold py-3 rounded-xl transition-all shadow-md shadow-primary-200 dark:shadow-none flex items-center justify-center gap-2
                              ${!isLoading && otpCode.length === 6
                                ? 'bg-primary-600 hover:bg-primary-700 text-white active:scale-[0.98]' 
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'}`}
                          >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Verify & Continue
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              sendSignupOTP();
                            }}
                            disabled={resendTimer > 0 || isLoading}
                            className="text-[10px] font-bold text-slate-400 hover:text-primary-600 disabled:opacity-50 transition-colors uppercase py-1"
                          >
                            {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : "Resend SMS"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}

          {authMode === 'login' && !isResetMode && (
            <>
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Email Address</label>
                <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="user@example.com" className={getInputClass('email')} />
                <ErrorMsg name="email" />
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setIsResetMode(true); setErrors({}); }} 
                    className="text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className={getInputClass('password')} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <ErrorMsg name="password" />
              </div>
            </>
          )}

          {isResetMode && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-4 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                <button 
                  type="button"
                  onClick={() => { setResetMethod('email'); setErrors({}); }} 
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${resetMethod === 'email' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Via Email
                </button>
                <button 
                  type="button"
                  onClick={() => { setResetMethod('sms'); setErrors({}); }} 
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${resetMethod === 'sms' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Via SMS
                </button>
              </div>

              {resetMethod === 'email' ? (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Registered Email</label>
                  <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="user@example.com" className={getInputClass('email')} />
                  <ErrorMsg name="email" />
                </div>
              ) : (
                <div className="space-y-4">
                  {smsStep === 'phone' && (
                    <div className="space-y-2 focus-within:text-primary-600 dark:focus-within:text-primary-400">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1 transition-colors">Registered Phone Number</label>
                      <div className="relative flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 focus-within:border-primary-500/30 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-primary-500/10 transition-all overflow-hidden group">
                        <div className="flex items-center gap-2 px-4 py-3 bg-slate-100/60 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700/50">
                          <span className="text-lg leading-none">🇳🇬</span>
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-300 tracking-tight">+234</span>
                        </div>
                        <input 
                          type="tel"
                          maxLength={15}
                          placeholder="801 234 5678" 
                          value={resetPhone}
                          onChange={(e) => {
                            setResetPhone(e.target.value.replace(/\D/g, ''));
                            if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                          }}
                          className="w-full bg-transparent px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 tracking-wide"
                        />
                      </div>
                      <div id="recaptcha-container" ref={recaptchaContainerRef} className="mt-2" />
                      {errors.phone && <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 ml-1 font-bold">{errors.phone}</p>}
                    </div>
                  )}

                  {smsStep === 'otp' && (
                    <div className="space-y-4 text-center">
                      <div className="space-y-3">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">Enter OTP Code</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Sent to <span className="font-bold text-slate-900 dark:text-white">+234 {resetPhone.replace(/^0/, '')}</span>
                        </p>
                      </div>
                      <div className="relative pb-2">
                        <div className="flex justify-between gap-2 px-1 mb-4">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <div 
                              key={index}
                              className={`w-10 h-14 flex items-center justify-center text-2xl font-black rounded-xl border-2 transition-all duration-200
                                ${otpCode.length === index ? 'border-primary-500 ring-4 ring-primary-500/10 bg-white dark:bg-slate-800' : 
                                  otpCode[index] ? 'border-primary-500/30 bg-primary-50/30 dark:bg-primary-900/10 dark:border-primary-900/50' : 
                                  'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'} 
                                ${otpCode[index] ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'}
                                ${errors.form ? 'border-red-500 bg-red-50/10' : ''}`}
                            >
                              {otpCode[index] || '•'}
                            </div>
                          ))}
                        </div>
                        
                        <input 
                          type="tel" 
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => {
                            setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                            if (errors.form) setErrors({});
                          }}
                          className="absolute opacity-0 inset-0 w-full h-full cursor-default"
                          autoFocus
                        />
                      </div>
                      
                      <div className="flex justify-center mt-2">
                        <button
                          type="button"
                          onClick={(e) => handleSubmit(e)}
                          disabled={resendTimer > 0 || isLoading}
                          className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline disabled:text-slate-400 disabled:no-underline transition-all"
                        >
                          {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive code? Resend"}
                        </button>
                      </div>
                    </div>
                  )}

                  {smsStep === 'new-password' && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">New Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          value={newResetPassword}
                          onChange={(e) => setNewResetPassword(e.target.value)}
                          className={`w-full bg-slate-50 dark:bg-slate-900 border px-4 py-3 rounded-xl outline-none transition-all text-sm text-slate-900 dark:text-white border-slate-100 dark:border-slate-800 focus:border-primary-300 dark:focus:border-primary-700 focus:bg-white dark:focus:bg-slate-800`}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Create a new secure password</p>
                    </div>
                  )}
                  
                  {smsStep === 'done' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 rounded-xl text-center"
                    >
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-green-800 dark:text-green-300 mb-1">Password Updated</h3>
                      <p className="text-sm text-green-700 dark:text-green-400/80 mb-6">Your password has been successfully changed.</p>
                      
                      <button 
                        type="button"
                        onClick={() => {
                           // Navigate to app directly as they are now securely authenticated and updated.
                           handleAuthModeChange('login'); 
                           setView('app');
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors text-sm w-full"
                      >
                        Continue to Home
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className={`${authMode === 'signup' && signupStep === 1 ? 'grid grid-cols-2 gap-4' : ''}`}>
            {/* Password fields removed from here as they are moved to signupStep === 1 */}
          </div>

          {smsStep !== 'done' && signupStep !== 3 && (
            <button 
              type="submit" 
              disabled={isLoading || resetSent}
              className={`w-full py-4 rounded-xl font-bold mt-6 transition-all flex items-center justify-center gap-2 
                ${isReady && !isLoading && !resetSent
                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-xl shadow-primary-200/50 dark:shadow-none active:scale-[0.98]' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 opacity-80'}`}
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isLoading 
                ? (isResetMode 
                    ? (smsStep === 'otp' ? 'Verifying...' : (smsStep === 'new-password' ? 'Updating...' : 'Sending Link...'))
                    : (authMode === 'login' ? 'Signing In...' : (signupStep === 1 ? 'Please wait...' : 'Creating Account...'))) 
                : (isResetMode 
                    ? (smsStep === 'otp' ? 'Verify OTP' : (smsStep === 'new-password' ? 'Set New Password' : (resetMethod === 'email' ? 'Send Reset Link' : 'Send OTP')))
                    : (authMode === 'login' 
                        ? 'Sign In' 
                        : (signupStep === 1
                            ? 'Next: Identity'
                            : (!phoneVerified 
                                ? (isPhoneVerifying ? 'Verify OTP Code' : 'Verify Phone') 
                                : 'Finalize Registration'))))}
            </button>
          )}

          {isResetMode && smsStep !== 'done' && (
            <div className="text-center mt-6">
              <button 
                type="button"
                onClick={() => { setIsResetMode(false); setResetSent(false); setErrors({}); setSmsStep('phone'); }}
                className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Back to login
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default Auth;
