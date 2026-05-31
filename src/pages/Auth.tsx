import React, { useState, useRef, useEffect } from 'react';
import { Home, X, Users, Handshake, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Shield, FileText, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole, User } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updatePassword as fbUpdatePassword,
  ConfirmationResult,
  PhoneAuthProvider,
  linkWithCredential,
  signInWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

const Auth = () => {
  const { authMode, setAuthMode, preselectedRole, login, setView, signInWithGoogle, setIsSigningUp } = useAuth();
  const { theme } = useTheme();
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [modalContent, setModalContent] = useState<'terms' | 'privacy'>('terms');

  const nigerianCities = [
    "Lagos", "Abuja", "Ibadan", "Port Harcourt", "Kano", "Ogbomoso", 
    "Enugu", "Ilorin", "Abeokuta", "Kaduna", "Owerri", "Benin City"
  ];

  const cleanPhone = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('234') && clean.length > 10) {
      clean = clean.slice(3);
    }
    while (clean.startsWith('0')) {
      clean = clean.slice(1);
    }
    return clean;
  };

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
    const numberRegex = /[0-9]/;
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
        else if (!numberRegex.test(formData.password)) newErrors.password = 'Needs at least one number';
        else if (!specialCharRegex.test(formData.password)) newErrors.password = 'Need one special character';
        
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }

        // For Tenants, everything is on Step 1
        if (role === 'tenant') {
          if (!formData.phoneNumber) {
            newErrors.phoneNumber = 'Phone number is required';
          } else if (formData.phoneNumber.length < 10) {
            newErrors.phoneNumber = 'Invalid phone number';
          } else if (!phoneVerified) {
            newErrors.phoneNumber = 'Verify phone number';
          }
        }
      }

      if (signupStep === 2 && role === 'agent') {
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
    const numberRegex = /[0-9]/;
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;

    const emailValid = formData.email && emailRegex.test(formData.email);
    const passwordValid = formData.password && (authMode === 'login' || (
      formData.password.length >= 7 && 
      uppercaseRegex.test(formData.password) && 
      numberRegex.test(formData.password) && 
      specialCharRegex.test(formData.password)
    ));

    if (authMode === 'login') {
      return !!(emailValid && passwordValid);
    }

    if (signupStep === 1) {
      const basicFields = formData.firstName && formData.lastName && emailValid && passwordValid && formData.password === formData.confirmPassword;
      if (role === 'agent') return !!basicFields;
      // For tenant, we also need phone verified on step 1
      return !!(basicFields && formData.phoneNumber && formData.phoneNumber.length >= 10 && (ignoreVerification || phoneVerified));
    }

    // Role agent only reaches step 2
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

  let isReady = false;

  if (isResetMode) {
    if (resetMethod === 'email') {
      isReady = !!(formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email));
    } else {
      if (smsStep === 'phone') {
        isReady = !!(resetPhone && resetPhone.length >= 10);
      } else if (smsStep === 'otp') {
        isReady = isSmsOtpReady;
      } else if (smsStep === 'new-password') {
        isReady = isSmsNewPwdReady;
      }
    }
  } else if (authMode === 'login') {
    isReady = isFormValid(true);
  } else if (authMode === 'signup') {
    if (signupStep === 1) {
      if (role === 'agent') {
        // Agent Step 1: needs basic fields
        isReady = isFormValid(true) && agreedToTerms;
      } else {
        // Tenant: needs basic fields + phone
        const basicFieldsValid = !!(
          formData.firstName && 
          formData.lastName && 
          formData.email && 
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
          formData.password && 
          formData.password.length >= 7 && 
          /[A-Z]/.test(formData.password) && 
          /[0-9]/.test(formData.password) && 
          /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) &&
          formData.password === formData.confirmPassword
        );
        
        const phoneLengthValid = !!(formData.phoneNumber && formData.phoneNumber.replace(/\D/g, '').length >= 10);
        
        if (isPhoneVerifying) {
          isReady = otpCode.length === 6;
        } else if (!phoneVerified) {
          isReady = !!(basicFieldsValid && phoneLengthValid && agreedToTerms);
        } else {
          isReady = !!(basicFieldsValid && phoneLengthValid && phoneVerified && agreedToTerms);
        }
      }
    } else if (signupStep === 2) {
      // Agent step 2: needs city, dob, phone, nin
      const step2FieldsValid = !!(
        formData.city &&
        formData.dob &&
        formData.nin &&
        /^\d{11}$/.test(formData.nin) &&
        formData.phoneNumber &&
        formData.phoneNumber.replace(/\D/g, '').length >= 10
      );
      
      if (isPhoneVerifying) {
        isReady = otpCode.length === 6;
      } else if (!phoneVerified) {
        isReady = step2FieldsValid && agreedToTerms;
      } else {
        isReady = !!(step2FieldsValid && phoneVerified && agreedToTerms);
      }
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const success = await signInWithGoogle(role);
      if (success) {
        setView('app');
      } else {
        setErrors({ form: 'Google Sign-In failed. Please try another method.' });
      }
    } catch (error: any) {
       console.error("Google Sign-In caught error:", error);
       if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain')) {
         const currentHost = window.location.hostname;
         const devHost = 'ais-dev-mpy2isnashhtpq4ffda3vh-321230967880.europe-west2.run.app';
         const preHost = 'ais-pre-mpy2isnashhtpq4ffda3vh-321230967880.europe-west2.run.app';
         setErrors({ 
           form: `Google Login Error: This domain is not authorized in Firebase.
To authorize it, follow these steps:
1. Open your Firebase Console for the "maindirectrent" project.
2. Go to Authentication > Settings > Authorized domains.
3. Click "Add domain" and enter:
   • ${currentHost}
   • ${currentHost !== devHost ? devHost : preHost}
4. Wait 1-2 minutes for changes to propagate, then reload this page and try signing in again!` 
         });
       } else {
         setErrors({ form: `Google Sign-In failed: ${error.message || 'An error occurred.'}` });
       }
    }
  };

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
      await fbUpdatePassword(auth.currentUser, newResetPassword);
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
    
    // Check for existing identifiers
    setIsLoading(true);
    const check = await checkUserExists({ email: formData.email, phoneNumber: formData.phoneNumber });
    if (check.exists) {
      const newErrors: any = {};
      if (check.reasons?.email) {
        newErrors.email = 'This email address is already in use.';
      }
      if (check.reasons?.phoneNumber) {
        newErrors.phoneNumber = 'This phone number is already registered.';
      }
      newErrors.form = 'This email or phone number is already registered.';
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    setErrors({});
    try {
      const cleaned = cleanPhone(formData.phoneNumber);
      const formattedPhone = `+234${cleaned}`;

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
      
      if (!navigator.onLine) {
        throw new Error("You are offline. Please check your internet connection.");
      }

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
    if (fields.email) params.append('email', fields.email.trim().toLowerCase());
    if (fields.nin) params.append('nin', fields.nin);
    if (fields.phoneNumber) {
      const cleaned = cleanPhone(fields.phoneNumber);
      params.append('phoneNumber', `+234${cleaned}`);
    }
    
    try {
      const response = await fetch(`/api/users/exists?${params.toString()}`);
      const data = await response.json();
      return {
        exists: !!data.exists,
        reasons: data.reasons || { email: false, phoneNumber: false, nin: false }
      };
    } catch (error) {
      console.error("Error checking duplicates:", error);
      return { exists: false, reasons: { email: false, phoneNumber: false, nin: false } };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setErrors({});

    if (authMode === 'signup') {
      if (signupStep === 1) {
        if (isFormValid(true)) {
          setIsLoading(true);
          // Check email and phone number duplicates
          const existsField: any = { email: formData.email };
          if (formData.phoneNumber) {
             existsField.phoneNumber = formData.phoneNumber;
          }
          const check = await checkUserExists(existsField);
          setIsLoading(false);
          if (check.exists) {
            const newErrors: any = {};
            if (check.reasons?.email) {
              newErrors.email = 'This email address is already in use.';
            }
            if (check.reasons?.phoneNumber) {
              newErrors.phoneNumber = 'This phone number is already registered.';
            }
            newErrors.form = 'This email or phone number is already registered.';
            setErrors(newErrors);
            return;
          }
          
          if (role === 'tenant') {
            // For tenant, we need phone verified on Step 1
            if (!phoneVerified) {
              if (!isPhoneVerifying) {
                return sendSignupOTP();
              } else {
                return verifySignupOTP();
              }
            }
            // If phone is verified, we proceed to Firestore creation below
          } else {
            setSignupStep(2);
            return;
          }
        } else {
          validate();
          return;
        }
      }

      if (signupStep === 2) {
        // If we are currently in verification mode, the main button should verify the OTP
        if (isPhoneVerifying) {
          return verifySignupOTP();
        }

        // Before proceeding to OTP/Signup, check for NIN/Phone duplicates
        if (isFormValid(true)) {
           setIsLoading(true);
           const check = await checkUserExists({ nin: formData.nin, phoneNumber: formData.phoneNumber });
           setIsLoading(false);
           if (check.exists) {
              const newErrors: any = {};
              if (check.reasons?.nin) {
                newErrors.nin = 'This NIN is already registered with another account.';
              }
              if (check.reasons?.phoneNumber) {
                newErrors.phoneNumber = 'This phone number is already registered.';
              }
              newErrors.form = 'NIN or Phone number already registered';
              setErrors(newErrors);
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
          await sendPasswordResetEmail(auth, formData.email);
          setResetSent(true);
          setErrors({});
        } catch (error: any) {
          console.error("Password reset error code:", error.code);
          console.error("Password reset error message:", error.message);
          if (error.code === 'auth/user-not-found') {
            setErrors({ email: 'No account registered with this email address' });
          } else {
            setErrors({ form: `Failed to send reset email: ${error.message || 'Please try again.'}` });
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
          const cleaned = cleanPhone(resetPhone);
          const formattedPhonePrivate = `+234${cleaned}`;
          const formattedPhoneSpaced = `+234 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
          const formattedPhoneSimpleSpaced = `+234 ${cleaned}`;
          
          const formatsToCheck = Array.from(new Set([
            formattedPhonePrivate,
            formattedPhoneSpaced,
            formattedPhoneSimpleSpaced,
            `+234${resetPhone.replace(/^0/, '')}`
          ].filter(Boolean)));

          const usersRef = collection(db, 'users');
          const q = query(usersRef, where("phoneNumber", "in", formatsToCheck));
          const querySnapshot = await getDocs(q);
          const formattedPhone = formattedPhonePrivate;
          
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
      setIsSigningUp(true);
      sessionStorage.setItem('just_logged_in', 'true');
      
      try {
        if (authMode === 'signup') {
          // Check for existing identifiers (NIN, Phone)
          setIsLoading(true);
          try {
            const formattedPhone = `+234${cleanPhone(formData.phoneNumber)}`;
            const response = await fetch(`/api/users/exists?nin=${formData.nin}&phoneNumber=${encodeURIComponent(formattedPhone)}`);
            const data = await response.json();
            
            if (data.exists) {
                const newErrors: any = {};
                if (data.reasons?.nin) {
                  newErrors.nin = 'This NIN is already registered with another account.';
                }
                if (data.reasons?.phoneNumber) {
                  newErrors.phoneNumber = 'This phone number is already registered.';
                }
                newErrors.form = 'NIN or Phone number already registered with another account.';
                setErrors(newErrors);
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
          
          const userProfile = {
            id: uid || '',
            firstName: formData.firstName || '',
            lastName: formData.lastName || '',
            name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
            email: formData.email || '',
            phoneNumber: formData.phoneNumber ? `+234${cleanPhone(formData.phoneNumber)}` : '',
            phoneVerified: !!phoneVerified,
            verificationLevel: 'none',
            nin: (role === 'agent' && formData.nin) ? formData.nin : '',
            city: formData.city || (role === 'tenant' ? 'Lagos' : ''),
            dob: formData.dob || '',
            role: role || 'tenant',
            country: 'Nigeria',
            verificationStatus: 'none',
            listingsCount: 0,
            createdAt: serverTimestamp(),
            theme: theme || 'light'
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
    <div className="min-h-screen lg:h-screen bg-slate-950 text-white lg:grid lg:grid-cols-12 transition-colors duration-300 relative lg:overflow-hidden">
      {/* Brand Column left (Desktop Only - 5 columns) */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 relative overflow-hidden select-none lg:h-full">
        {/* Cinematic Background Image, Overlay and Grid */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" 
            alt="Premium Real Estate" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          {/* Layered luxury brand gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/85 to-slate-950/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950/20 to-indigo-950/20 mix-blend-multiply" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-15" />
          <div className="absolute top-[20%] left-[-10%] w-[350px] h-[350px] bg-primary-500/20 rounded-full blur-[100px] opacity-50 pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[110px] opacity-40 pointer-events-none" />
        </div>

        <div className="relative z-10 flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setView('landing')}>
          <div className="w-9 h-9 p-1.5 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Home className="text-white w-5 h-5" />
          </div>
          <span className="font-display font-black tracking-tight text-white text-lg leading-none">DirectRent</span>
        </div>

        {/* Dynamic Contextual Text & Interactive Card Overlay */}
        <div className="relative z-10 my-auto py-12 space-y-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase text-primary-400 tracking-wider">
              Verify • Search • Agree
            </span>
            <h2 className="font-display text-4xl font-extrabold text-white tracking-tight leading-[1.1]">
              Skip Shady Agents. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-450 via-indigo-350 to-indigo-250">Interact Directly.</span>
            </h2>
            <p className="text-slate-350 text-sm leading-relaxed font-light">
              Connect directly with verified landlords and trusted developers. Transparent contracts, real coordinates, zero surprise inspections fees.
            </p>
          </div>

          {/* Quick Stats Overlay Visual Card (Glassmorphic) */}
          <div className="bg-slate-950/35 backdrop-blur-xl border border-white/10 p-5 rounded-3xl space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800/30 pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Credibility Metrics</span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black">LIVE</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="block text-xl font-extrabold text-white font-mono">0%</span>
                <span className="text-[8px] text-slate-400 uppercase tracking-widest font-semibold">Inspection Tax</span>
              </div>
              <div>
                <span className="block text-xl font-extrabold text-primary-300 font-mono">2.5k+</span>
                <span className="text-[8px] text-slate-400 uppercase tracking-widest font-semibold">Satisfied Users</span>
              </div>
              <div>
                <span className="block text-xl font-extrabold text-indigo-350 font-mono">Pure</span>
                <span className="text-[8px] text-slate-400 uppercase tracking-widest font-semibold">Direct Deals</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] text-slate-400 font-mono">
            DirectRent Nigeria © 2026. All rights reserved. Registered landlord credentials strictly validated.
          </p>
        </div>
      </div>

      {/* Right Column (Form Panel) */}
      <div className="lg:col-span-7 flex flex-col justify-between min-h-screen lg:h-full lg:overflow-y-auto px-6 py-8 sm:px-12 sm:py-12 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
        <header className="flex items-center justify-between pb-4">
          <button onClick={() => setView('landing')} className="p-2 -ml-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 group">
            <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Back</span>
          </button>
          
          {/* Logo on Mobile/Tablet only */}
          <div className="flex items-center gap-1.5 lg:hidden cursor-pointer" onClick={() => setView('landing')}>
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <Home className="text-white w-4 h-4" />
            </div>
            <span className="font-display font-black text-sm text-slate-900 dark:text-white leading-none">DirectRent</span>
          </div>

          <div className="w-10 lg:hidden" />
        </header>

        <main className="max-w-md mx-auto w-full py-6 md:py-12 flex-1 flex flex-col justify-center">
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
          {!isResetMode && (
            <div className="space-y-4">
               <button 
                type="button" 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-5 h-5" alt="Google" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Continue with Google</span>
              </button>
              
              <div className="flex items-center gap-4 my-6">
                <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">or use email</span>
                <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          )}

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

              {role === 'tenant' && (
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
                  </div>
                  <div id="recaptcha-container-signup" ref={recaptchaContainerRef} className="mt-2 flex justify-center" />
                  <ErrorMsg name="phoneNumber" />
                  
                  {isPhoneVerifying && !phoneVerified && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-5 bg-white dark:bg-slate-900 border-2 border-primary-100 dark:border-primary-900 rounded-2xl shadow-xl space-y-4 overflow-hidden"
                    >
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
                                key={`tenant-otp-${index}`}
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
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

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
                  
                  {/* Password Criteria */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 px-1">
                    <div className="flex items-center gap-1.5">
                       <CheckCircle2 className={`w-3 h-3 ${formData.password.length >= 7 ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`} />
                       <span className={`text-[9px] font-bold uppercase tracking-tight ${formData.password.length >= 7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>Min 7 chars</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <CheckCircle2 className={`w-3 h-3 ${/[A-Z]/.test(formData.password) ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`} />
                       <span className={`text-[9px] font-bold uppercase tracking-tight ${/[A-Z]/.test(formData.password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>Uppercase</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <CheckCircle2 className={`w-3 h-3 ${/[0-9]/.test(formData.password) ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`} />
                       <span className={`text-[9px] font-bold uppercase tracking-tight ${/[0-9]/.test(formData.password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>Number</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <CheckCircle2 className={`w-3 h-3 ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`} />
                       <span className={`text-[9px] font-bold uppercase tracking-tight ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>Special Char</span>
                    </div>
                  </div>

                  {/* Terms and Privacy Agreements Selection */}
                  <div className="mt-5 flex items-start gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-850">
                    <input 
                      type="checkbox" 
                      id="agreedToTermsCheckbox" 
                      checked={agreedToTerms} 
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-705 cursor-pointer"
                    />
                    <label htmlFor="agreedToTermsCheckbox" className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed select-none">
                      I agree to the{' '}
                      <button 
                        type="button" 
                        onClick={() => { setModalContent('terms'); setShowTermsModal(true); }}
                        className="text-primary-600 dark:text-primary-400 font-extrabold hover:underline inline-block p-0 bg-transparent border-none cursor-pointer"
                      >
                        Terms of Use
                      </button>{' '}
                      and{' '}
                      <button 
                        type="button" 
                        onClick={() => { setModalContent('privacy'); setShowTermsModal(true); }}
                        className="text-primary-600 dark:text-primary-400 font-extrabold hover:underline inline-block p-0 bg-transparent border-none cursor-pointer"
                      >
                        Privacy Policy
                      </button>{' '}
                      of DirectRent. I acknowledge my details are protected and securely handled.
                    </label>
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
                                key={`agent-otp-${index}`}
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
                      <div id="recaptcha-container-reset" ref={recaptchaContainerRef} className="mt-2" />
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
                              key={`reset-otp-${index}`}
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
                      
                      {/* Password Criteria */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 px-1">
                        <div className="flex items-center gap-1.5">
                           <CheckCircle2 className={`w-3 h-3 ${newResetPassword.length >= 7 ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`} />
                           <span className={`text-[9px] font-bold uppercase tracking-tight ${newResetPassword.length >= 7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>Min 7 chars</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <CheckCircle2 className={`w-3 h-3 ${/[A-Z]/.test(newResetPassword) ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`} />
                           <span className={`text-[9px] font-bold uppercase tracking-tight ${/[A-Z]/.test(newResetPassword) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>Uppercase</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <CheckCircle2 className={`w-3 h-3 ${/[0-9]/.test(newResetPassword) ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`} />
                           <span className={`text-[9px] font-bold uppercase tracking-tight ${/[0-9]/.test(newResetPassword) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>Number</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <CheckCircle2 className={`w-3 h-3 ${/[!@#$%^&*(),.?":{}|<>]/.test(newResetPassword) ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`} />
                           <span className={`text-[9px] font-bold uppercase tracking-tight ${/[!@#$%^&*(),.?":{}|<>]/.test(newResetPassword) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>Special Char</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">Create a new secure password</p>
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

          {smsStep !== 'done' && (
            <button 
              type="submit" 
              disabled={isLoading || resetSent || !isReady}
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
                            ? (role === 'agent' ? 'Next: Identity' : (phoneVerified ? 'Sign Up' : (isPhoneVerifying ? 'Verify OTP Code' : 'Verify Phone')))
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
      
      {/* Dynamic desktop helper footer on form section */}
      <footer className="text-center pt-4 border-t border-slate-100 dark:border-slate-850">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          By signing up, you agree to our{' '}
          <button 
            type="button" 
            onClick={() => { setModalContent('terms'); setShowTermsModal(true); }}
            className="underline cursor-pointer hover:text-primary-500 font-bold bg-transparent border-none p-0"
          >
            Terms of Use
          </button>{' '}
          and{' '}
          <button 
            type="button" 
            onClick={() => { setModalContent('privacy'); setShowTermsModal(true); }}
            className="underline cursor-pointer hover:text-primary-500 font-bold bg-transparent border-none p-0"
          >
            Privacy Policy
          </button>.
        </p>
      </footer>
    </div>

    {/* Terms and Privacy Modal Overlay */}
    <AnimatePresence>
      {showTermsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTermsModal(false)}
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl overflow-hidden max-h-[85vh] flex flex-col font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100/40 dark:border-primary-900/10">
                  {modalContent === 'terms' ? <FileText className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    {modalContent === 'terms' ? 'Terms of Use' : 'Privacy Agreements'}
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase">
                    DirectRent Compliance Guidelines
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-5 pr-1 space-y-5 text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {modalContent === 'terms' ? (
                <>
                  <p>
                    Welcome to <strong>DirectRent</strong>. By requesting or publishing properties inside our workspace, you commit to these unified engagement rules.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 dark:text-white">
                        <Shield className="w-4 h-4 text-primary-500" />
                        <span>1. User Veracity & Profile Conduct</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        All tenants and agents must provide accurate and lawful information. Fraudulent listings, identity spoofing, duplicate profiles, or harassment will result in an immediate and permanent suspension from the network.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 dark:text-white">
                        <Lock className="w-4 h-4 text-primary-500" />
                        <span>2. Listing Verification Responsibility</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Property postings must maintain genuine pricing, precise locations, and active status updates. Suspended listings lose direct interactive capabilities immediately.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 dark:text-white">
                        <CheckCircle2 className="w-4 h-4 text-primary-500" />
                        <span>3. Independent Transaction Warnings</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        DirectRent is an interactive platform connecting tenants. We strongly encourage meeting in secure designated physical locations. Never send deposits or legal payments before satisfactory physical property tour inspections.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    At <strong>DirectRent</strong>, we prioritize the secure encryption and integrity of user verification profiles.
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 dark:text-white">
                        <Lock className="w-4 h-4 text-emerald-500" />
                        <span>Identity Lock & NIN Encryption</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        National Identification Numbers (NIN) and private contact details are processed securely during registration to establish real identity. These details are stored with military-grade standard key hashes and never shared with third parties.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 dark:text-white">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <span>Data Rights & Privacy Access</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Users maintain complete authority over their active listings and chats. Requesting account termination completely purges all sensitive personal keys, historic conversations, and active profiles permanently.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 dark:text-white">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span>Secure Messaging Archives</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Chat communications and support flags are archived under local, isolated sandboxes to protect negotiations and preserve rental contracts.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button 
                type="button"
                onClick={() => {
                  setAgreedToTerms(true);
                  setShowTermsModal(false);
                }}
                className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              >
                I understand & agree
              </button>
              <button 
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </div>
  );
};

export default Auth;
