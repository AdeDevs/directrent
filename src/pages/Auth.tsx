import React, { useState, useRef, useEffect } from 'react';
import { Home, X, Users, Handshake, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { UserRole, User } from '../types';
import { auth, db } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updatePassword,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

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
  const [smsStep, setSmsStep] = useState<'phone' | 'otp' | 'new-password' | 'done'>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmationObj, setConfirmationObj] = useState<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cleanup recaptcha if it exists when switching out of reset mode
    if (!isResetMode) {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  }, [isResetMode]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nin: '',
    city: '',
    password: '',
    confirmPassword: ''
  });

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
    } else if (name === 'name') {
      value = capitalize(value);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    
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
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    const uppercaseRegex = /[A-Z]/;
    const ninRegex = /^\d{11}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) newErrors.password = 'Password is required';

    if (authMode === 'signup') {
      if (!formData.name) newErrors.name = 'Full name is required';
      if (!formData.city) newErrors.city = 'Please select a city';
      
      if (!formData.nin) {
        newErrors.nin = 'NIN is required';
      } else if (!ninRegex.test(formData.nin)) {
        newErrors.nin = 'NIN must be 11 digits';
      }

      if (formData.password) {
        if (formData.password.length < 7) {
          newErrors.password = 'Min 7 characters';
        } else if (!uppercaseRegex.test(formData.password)) {
          newErrors.password = 'Need one uppercase letter';
        } else if (!specialCharRegex.test(formData.password)) {
          newErrors.password = 'Need one special character';
        }
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
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

    return !!(
      formData.name && 
      emailValid && 
      formData.city && 
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
    : isFormValid();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setErrors({});
    
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
          const formattedPhone = resetPhone.startsWith('+234') ? resetPhone : `+234${resetPhone.replace(/^0/, '')}`;
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where("phoneNumber", "==", formattedPhone));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            setErrors({ phone: 'No account registered with this phone number' });
            setIsLoading(false);
            return;
          }
          
          if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
              size: 'invisible'
            });
          }
          
          sessionStorage.setItem('sms_reset_flow', 'active');
          const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
          setConfirmationObj(result);
          setSmsStep('otp');
          setErrors({});
        } catch (error: any) {
          if (error.code === 'auth/invalid-phone-number') {
            setErrors({ phone: 'Invalid phone number format.' });
          } else {
            console.error("SMS Error:", error);
            setErrors({ form: 'Failed to send reset SMS. Please check your connection and try again.' });
          }
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }
        } finally {
          setIsLoading(false);
        }
      }
      return;
    }

    if (validate()) {
      setIsLoading(true);
      
      try {
        if (authMode === 'signup') {
          // Firebase Signup
          const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
          const uid = userCredential.user.uid;
          
          const userProfile: User = {
            id: uid,
            name: formData.name,
            email: formData.email,
            nin: formData.nin,
            city: formData.city,
            role: role,
            country: 'Nigeria'
          };
          
          // Store profile in Firestore
          await setDoc(doc(db, 'users', uid), userProfile);
          
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
            {isResetMode ? 'Reset password' : (authMode === 'login' ? 'Welcome back' : 'Create account')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isResetMode ? 'Enter your email to receive a password reset link' : (authMode === 'login' ? 'Sign in to access your listings' : 'Fast signup to start your housing journey')}
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

          {authMode === 'signup' && (
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

          {authMode === 'signup' && (
            <>
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Full Name</label>
                <input name="name" value={formData.name} onChange={handleChange} type="text" placeholder="John Doe" className={getInputClass('name')} />
                <ErrorMsg name="name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">NIN</label>
                  <input name="nin" value={formData.nin} onChange={handleChange} type="text" placeholder="11 digits" maxLength={11} className={getInputClass('nin')} />
                  <ErrorMsg name="nin" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">City</label>
                  <select name="city" value={formData.city} onChange={handleChange} className={getInputClass('city')}>
                    <option value="" className="dark:bg-slate-900">Select City</option>
                    {nigerianCities.map(city => <option key={city} value={city} className="dark:bg-slate-900">{city}</option>)}
                  </select>
                  <ErrorMsg name="city" />
                </div>
              </div>
            </>
          )}

          {!isResetMode ? (
            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Email Address</label>
              <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="user@example.com" className={getInputClass('email')} />
              <ErrorMsg name="email" />
            </div>
          ) : (
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
                          maxLength={11}
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
                      <input 
                        type="text" 
                        maxLength={6}
                        placeholder="------" 
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value.replace(/\D/g, ''));
                          if (errors.form) setErrors({});
                        }}
                        className={`w-full bg-slate-50 dark:bg-slate-900 border-2 px-4 py-4 rounded-xl outline-none transition-all text-2xl text-center font-black tracking-[0.5em] font-mono text-slate-900 dark:text-white ${errors.form ? 'border-red-500 dark:border-red-900 bg-red-50/10' : 'border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10'}`}
                      />
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

          <div className={`${authMode === 'signup' ? 'grid grid-cols-2 gap-4' : ''}`}>
            {!isResetMode && (
              <>
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Password</label>
                    {authMode === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => { setIsResetMode(true); setErrors({}); }} 
                        className="text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
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
                {authMode === 'signup' && (
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
                )}
              </>
            )}
          </div>

          {smsStep !== 'done' && (
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
                    : (authMode === 'login' ? 'Signing In...' : 'Creating Account...')) 
                : (isResetMode 
                    ? (smsStep === 'otp' ? 'Verify OTP' : (smsStep === 'new-password' ? 'Set New Password' : (resetMethod === 'email' ? 'Send Reset Link' : 'Send OTP')))
                    : (authMode === 'login' ? 'Sign In' : 'Create Account'))}
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
