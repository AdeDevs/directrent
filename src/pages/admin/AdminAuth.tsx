import React, { useState } from 'react';
import { ShieldAlert, Eye, EyeOff, Loader2, AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const AdminAuth = () => {
  const { authMode, setAuthMode, setView } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [internalPhone, setInternalPhone] = useState('');
  const [adminTier] = useState<'Moderator' | 'Super Admin'>('Moderator'); // Default to Moderator
  const [masterKey, setMasterKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    const uppercaseRegex = /[A-Z]/;
    const numberRegex = /[0-9]/;

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (authMode === 'signup') {
      if (password.length < 6) {
        newErrors.password = 'Minimum 6 characters required';
      } else if (!uppercaseRegex.test(password)) {
        newErrors.password = 'At least one uppercase letter required';
      } else if (!numberRegex.test(password)) {
        newErrors.password = 'At least one number required';
      } else if (!specialCharRegex.test(password)) {
        newErrors.password = 'At least one special character required';
      }
    }

    if (authMode === 'signup') {
      if (!firstName) newErrors.firstName = 'First name is required';
      if (!lastName) newErrors.lastName = 'Last name is required';
      if (!masterKey) newErrors.masterKey = 'Master level key is required';
      
      if (!internalPhone) {
        newErrors.internalPhone = 'Phone number is required';
      } else {
        const cleanPhone = internalPhone.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
          newErrors.internalPhone = 'Phone number must be exactly 10 digits';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Only numbers
    
    // Handle Nigerian prefixes if pasted (234 or leading 0)
    if (value.startsWith('234') && value.length > 10) {
      value = value.slice(3);
    } else if (value.startsWith('0')) {
      value = value.slice(1);
    }
    
    // Limit to 10 digits (since we prefix with +234)
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    
    // Add spacing: 803 123 4567
    let formatted = value;
    if (value.length > 3 && value.length <= 6) {
      formatted = `${value.slice(0, 3)} ${value.slice(3)}`;
    } else if (value.length > 6) {
      formatted = `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
    }
    
    setInternalPhone(formatted);
    if (errors.internalPhone) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.internalPhone;
        return next;
      });
    }
  };

  const handleChange = (setter: (val: string) => void, fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (errors[fieldName] || errors.form) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        delete next.form;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (!validate()) return;
    
    if (authMode === 'signup') {
      const correctMasterKey = (import.meta as any).env.VITE_ADMIN_MASTER_KEY;
      if (masterKey !== correctMasterKey) {
        setErrors({ masterKey: 'Invalid Master Access Key. Unauthorized.' });
        return;
      }
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      if (authMode === 'signup') {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const uid = res.user.uid;
        
        const cleanPhone = internalPhone.replace(/\s/g, '');
        const formattedPhone = `+234${cleanPhone}`;

        // Create admin profile
        await setDoc(doc(db, 'users', uid), {
          id: uid,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim(),
          email,
          internalPhone: formattedPhone,
          role: 'admin',
          adminTier,
          createdAt: serverTimestamp(),
          verificationStatus: 'verified' // Admins are auto-verified for prototype
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      // Set session flag for AuthContext redirection
      sessionStorage.setItem("just_logged_in", "true");
      
      // Auth state listener in AuthContext will handle redirect to 'admin' view
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErrors({ email: 'This email is already in use.' });
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setErrors({ form: 'Invalid email or password.' });
      } else if (err.code === 'auth/weak-password') {
        setErrors({ password: 'Password is too weak.' });
      } else {
        setErrors({ form: 'Authentication failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClass = (fieldName: string, isMasterKey = false) => {
    const baseClass = "w-full bg-slate-50 dark:bg-slate-900 border px-4 py-3 rounded-none outline-none text-sm transition-all shadow-sm";
    const normalBorder = isMasterKey ? "border-rose-200 dark:border-rose-900/30 focus:border-rose-500" : "border-slate-200 dark:border-slate-800 focus:border-primary-500";
    const errorBorder = "border-red-500 dark:border-red-900 bg-red-50/10 dark:bg-red-950/10";
    
    return `${baseClass} ${errors[fieldName] ? errorBorder : normalBorder} focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600`;
  };

  const ErrorMsg = ({ name }: { name: string }) => errors[name] ? (
    <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 ml-1 font-medium">{errors[name]}</p>
  ) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col p-6 transition-colors duration-300">
      <header className="flex items-center mb-8">
        <button onClick={() => setView('landing')} className="p-2 -ml-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="mx-auto flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-none flex items-center justify-center">
              <ShieldAlert className="text-white w-4 h-4" />
            </div>
             <span className="font-bold text-slate-900 dark:text-white tracking-tight">Admin Portal</span>
        </div>
        <div className="w-10" />
      </header>

      <main className="max-w-md mx-auto w-full pb-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {authMode === 'login' ? 'Admin Login' : 'Create Admin'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {authMode === 'login' ? 'Access the management dashboard' : 'Register a new administrator account'}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 p-1 rounded-none flex items-center gap-1 mb-8 border border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => { setAuthMode('login'); setErrors({}); }} 
            className={`flex-1 py-2 rounded-none text-sm font-semibold transition-all ${authMode === 'login' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Login
          </button>
          <button 
            onClick={() => { setAuthMode('signup'); setErrors({}); }} 
            className={`flex-1 py-2 rounded-none text-sm font-semibold transition-all ${authMode === 'signup' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errors.form && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-none flex items-start gap-3 mb-6"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400 font-medium leading-relaxed">{errors.form}</p>
            </motion.div>
          )}

          {authMode === 'signup' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5 ml-1">First Name</label>
                <input 
                  type="text" 
                  value={firstName}
                  onChange={handleChange(setFirstName, 'firstName')}
                  placeholder="John"
                  className={getInputClass('firstName')}
                />
                <ErrorMsg name="firstName" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5 ml-1">Last Name</label>
                <input 
                  type="text" 
                  value={lastName}
                  onChange={handleChange(setLastName, 'lastName')}
                  placeholder="Doe"
                  className={getInputClass('lastName')}
                />
                <ErrorMsg name="lastName" />
              </div>
            </div>
          )}

          {authMode === 'signup' && (
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5 ml-1">Internal Phone Number (Nigeria)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold border-r border-slate-200 dark:border-slate-800 pr-3">+234</span>
                <input 
                  type="tel" 
                  value={internalPhone}
                  onChange={handlePhoneChange}
                  placeholder="803 123 4567"
                  className={`${getInputClass('internalPhone')} pl-[4.5rem]`}
                />
              </div>
              <ErrorMsg name="internalPhone" />
            </div>
          )}

          {authMode === 'signup' && (
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5 ml-1">Admin Tier</label>
              <select 
                value={adminTier}
                disabled
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-none outline-none text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed"
              >
                <option value="Moderator">Moderator (Public Operations)</option>
                <option value="Super Admin" disabled>Super Admin (Infrastructure Level)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1 ml-1 leading-tight">Advanced tiers require internal governance approval.</p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5 ml-1">Admin Email</label>
            <input 
              type="email" 
              value={email}
              onChange={handleChange(setEmail, 'email')}
              placeholder="admin@directrent.com"
              className={getInputClass('email')}
            />
            <ErrorMsg name="email" />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handleChange(setPassword, 'password')}
                placeholder="••••••••"
                className={getInputClass('password')}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <ErrorMsg name="password" />
            {authMode === 'signup' && (
              <p className="text-[10px] text-slate-400 mt-1 ml-1">6+ chars, uppercase, number, special char.</p>
            )}
          </div>

          {authMode === 'signup' && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <label className="text-xs font-black text-rose-500 block mb-1.5 ml-1 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3" />
                Master Access Key
              </label>
              <input 
                type="password" 
                value={masterKey}
                onChange={handleChange(setMasterKey, 'masterKey')}
                placeholder="ENTER KEY"
                className={getInputClass('masterKey', true) + " font-mono"}
              />
              <ErrorMsg name="masterKey" />
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-semibold py-3.5 rounded-none transition-all active:scale-[0.98] mt-6 flex items-center justify-center gap-2 shadow-sm"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? 'Sign In' : 'Create Admin Account')}
          </button>
        </form>

        <div className="mt-12 flex items-center justify-center gap-2">
           <ShieldAlert className="text-slate-300 dark:text-slate-700 w-4 h-4" />
           <span className="text-[10px] font-medium text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Secure Systems Active</span>
        </div>
      </main>
    </div>
  );
};

export default AdminAuth;
