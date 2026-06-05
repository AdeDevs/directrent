import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings,
  MapPin,
  LogOut,
  Bell,
  Shield,
  HelpCircle,
  CircleUserRound,
  CheckCircle2,
  KeyRound,
  ChevronRight,
  Loader2,
  Heart,
  ArrowRight,
  Camera,
  Smartphone,
  ShieldCheck,
  Fingerprint,
  XCircle,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  CreditCard,
  FileText,
  Trash2,
  Upload,
  Download,
  FilePlus,
  Briefcase,
  Lock
} from "lucide-react";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  linkWithPhoneNumber,
  ConfirmationResult,
  updatePassword as fbUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  linkWithCredential
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { safeDeleteStorageFile } from "../utils/storageCleanup";
import { doc, updateDoc, deleteField, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { auth, storage, db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Listing } from "../types";
import VerificationBadge from "../components/VerificationBadge";
import { calculateVerificationLevel, isProfileComplete as checkProfileComplete } from "../lib/verification";
import KYCVerification from "../components/KYCVerification";
import TrustVerification from "../components/TrustVerification";
import NotificationBadge from "../components/NotificationBadge";
import { createNotification } from "../lib/notifications";
import HeaderPortal from "../components/HeaderPortal";
import { toast } from 'react-hot-toast';

// Compact card for Interests section to reduce weight and fit viewport better
const Profile = () => {
  const { user, logout, updateProfile, favorites, setActiveTab, setPublishingProgress, setPublishingStatus } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    toggleTheme();
    if (user) {
      updateProfile({ theme: nextTheme });
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeletePhotoConfirm, setShowDeletePhotoConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Profile updated successfully!");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  const [phone, setPhone] = useState(user?.phoneNumber?.replace("+234", "") || "");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState<ConfirmationResult | null>(null);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [smsStep, setSmsStep] = useState<'phone' | 'otp'>('phone');
  const [phoneError, setPhoneError] = useState("");
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Nigerian phone numbers are 10 digits after +234
  const NIGERIAN_PHONE_LENGTH = 10;

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    // Cleanup verifier on unmount
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  const initRecaptcha = () => {
    // Clear existing verifier if any
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
      window.recaptchaVerifier = undefined;
    }
    
    if (recaptchaRef.current) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: 'invisible', // Invisible is more robust in nested modals
          callback: () => {
            // re-captcha solved
          },
          'expired-callback': () => {
            if (window.recaptchaVerifier) {
              window.recaptchaVerifier.clear();
              window.recaptchaVerifier = undefined;
            }
          }
        });
      } catch (err) {
        console.error("reCAPTCHA Init Error:", err);
      }
    }
  };

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    gender: user?.gender || "",
    dob: user?.dob || "",
    nin: user?.nin || "",
    city: user?.city || "",
    about: user?.about || "",
  });

  // Sync profile data with user changes when not editing
  useEffect(() => {
    if (!isEditing && user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        gender: user.gender || "",
        dob: user.dob || "",
        nin: user.nin || "",
        city: user.city || "",
        about: user.about || "",
      });
    }
  }, [user, isEditing]);

  const [isIdentityExpanded, setIsIdentityExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [showVault, setShowVault] = useState(false);
  const [vaultDocs, setVaultDocs] = useState<any[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const [showTransactions, setShowTransactions] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user || (!showTransactions && user.role !== 'tenant')) return;
    const docsRef = collection(db, 'transactions');
    // For tenant or agent based on user.role
    const qField = user.role === 'tenant' ? 'tenantId' : 'agentId';
    const q = query(docsRef, where(qField, '==', user.id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user, showTransactions]);

  useEffect(() => {
    if (!user || !showVault) return;
    const docsRef = collection(db, 'vault');
    const q = query(docsRef, where('userId', '==', user.id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVaultDocs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user, showVault]);

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setPublishingStatus("Encrypting & uploading document...");
    setPublishingProgress(20);
    
    // Close Vault to let user do other things, or they can stay if they want 
    // Actually we'll keep Vault open but let them know it's uploading in the background
    // setShowVault(false); 

    (async () => {
      try {
        const fileName = `vault/${user.id}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        
        // Progress tick simulation
        const timer = setInterval(() => {
          setPublishingProgress(prev => prev ? Math.min(prev + 5, 80) : 80);
        }, 500);

        await uploadBytes(storageRef, file);
        clearInterval(timer);
        setPublishingProgress(90);

        const url = await getDownloadURL(storageRef);
        await addDoc(collection(db, 'vault'), {
          userId: user.id,
          name: file.name,
          url,
          type: file.type,
          createdAt: serverTimestamp()
        });
        
        setPublishingProgress(100);
        setPublishingStatus("Document securely stored!");
        toast.success("Document added to Vault!");
        
        setTimeout(() => {
          setPublishingProgress(null);
          setPublishingStatus('');
        }, 1500);

      } catch (err) {
        console.error("Doc upload failed:", err);
        toast.error("Failed to upload document.");
        setPublishingProgress(null);
        setPublishingStatus('');
      }
    })();
  };

  const handleDeleteDoc = async (docId: string, url: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDoc(doc(db, 'vault', docId));
      if (url.includes("firebasestorage")) {
        await safeDeleteStorageFile(url);
      }
    } catch (err) {
      console.error("Delete doc failed:", err);
    }
  };

  if (!user) return null;

  const capitalize = (str: string) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ 
      ...prev, 
      [name]: capitalize(value.replace(/[^a-zA-Z\s]/g, "")) 
    }));
  };

  const handleAvatarDelete = async () => {
    if (!user.avatarUrl) return;
    
    setIsLoading(true);
    try {
      // Try to delete from Storage if it's a firebase storage URL
      if (user.avatarUrl.includes("firebasestorage")) {
        await safeDeleteStorageFile(user.avatarUrl);
      }
      
      await updateProfile({ avatarUrl: deleteField() });
      setPreviewUrl(null);
      setSelectedFile(null);
      setSuccessMessage("Photo deleted successfully");
      setShowSuccess(true);
      setShowDeletePhotoConfirm(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Delete photo profile update failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Image compression timed out (15s)"));
      }, 15000);

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          clearTimeout(timeout);
          
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Canvas context failed"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas toBlob failed"));
          }, 'image/jpeg', 0.7);
        };

        img.onerror = () => {
          clearTimeout(timeout);
          console.error("Image interpretation failed (onerror)");
          reject(new Error("Image load failed (onerror)"));
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = (err) => {
        clearTimeout(timeout);
        console.error("FileReader error:", err);
        reject(new Error("File read failed"));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Please select an image under 10MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const cleanupPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
  };

  const handleSendOTP = async () => {
    // Remove leading zero if present
    const cleanPhone = phone.startsWith('0') ? phone.slice(1) : phone;
    
    if (!cleanPhone || cleanPhone.length !== NIGERIAN_PHONE_LENGTH) {
      setPhoneError(`Please enter a valid ${NIGERIAN_PHONE_LENGTH}-digit phone number`);
      return;
    }

    try {
      setIsVerifyingPhone(true);
      setPhoneError("");
      
      // Basic network check
      if (!navigator.onLine) {
        throw { code: 'auth/network-request-failed' };
      }
      
      // Delay slightly for DOM readiness
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Always re-init to avoid stale containers
      initRecaptcha();
      
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) throw new Error("Recaptcha container not found");
      
      const fullPhone = `+234${cleanPhone}`;
      
      let result;
      if (auth.currentUser) {
        result = await linkWithPhoneNumber(auth.currentUser, fullPhone, appVerifier);
      } else {
        result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      }
      
      setVerificationId(result);
      setSmsStep('otp');
      setResendTimer(60); // 60 seconds timer
      setSuccessMessage("OTP sent to your phone");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error("SMS Error:", error);
      if (error.code === 'auth/network-request-failed') {
        setPhoneError("Network Error: Please check your internet connection and try again.");
      } else if (error.code === 'auth/invalid-app-credential') {
        setPhoneError("Verification Error: Site domain may not be authorized in Firebase.");
      } else if (error.code === 'auth/too-many-requests') {
        setPhoneError("Too many attempts. This number has been temporarily blocked.");
      } else if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/account-exists-with-different-credential') {
        setPhoneError("This phone number is already linked to another account.");
      } else {
        setPhoneError(`Verification failed: ${error.code || 'unknown'}. Please refresh and retry.`);
      }

      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch(e) {}
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) return;

    try {
      setIsVerifyingPhone(true);
      setPhoneError("");
      if (verificationId) {
        await verificationId.confirm(otp);
        // On success, update Firestore
        const fullPhone = `+234${phone}`;
        await updateProfile({
          phoneNumber: fullPhone,
          phoneVerified: true,
          verificationLevel: calculateVerificationLevel({ ...user, phoneVerified: true, phoneNumber: fullPhone })
        });

        // Trigger notification
        await createNotification(
          user.id,
          "Identity Verified",
          "Your phone number has been successfully verified. Your trust score has increased!",
          "verification",
          "profile"
        );

        setVerificationId(null);
        setShowPhoneInput(false);
        setSuccessMessage("Phone verified successfully!");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error: any) {
      console.error("OTP Error:", error);
      if (error.code === 'auth/invalid-verification-code') {
        setPhoneError("The code you entered is incorrect. If you are using a 'Test Number', make sure you enter the exact code you set in the Firebase Console.");
      } else if (error.code === 'auth/code-expired') {
        setPhoneError("This code has expired. Please request a new one.");
      } else if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/account-exists-with-different-credential') {
        setPhoneError("This phone number is already verified and linked to another DirectRent account.");
      } else {
        setPhoneError(`(${error.code}) ${error.message || "Failed to verify code."}`);
      }
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleUpdatePassword = async () => {
    const userObj = auth.currentUser;
    if (!userObj || !userObj.email) return;

    const hasPassword = userObj.providerData.some(p => p.providerId === 'password');
    const uppercaseRegex = /[A-Z]/;
    const numberRegex = /[0-9]/;
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;

    if ((hasPassword && !passwordData.currentPassword) || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 7) {
      setPasswordError("Password must be at least 7 characters");
      return;
    }

    if (!uppercaseRegex.test(passwordData.newPassword) || !numberRegex.test(passwordData.newPassword) || !specialCharRegex.test(passwordData.newPassword)) {
      setPasswordError("Password does not meet complexity requirements");
      return;
    }

    setIsLoading(true);
    setPasswordError("");

    try {
      const userObj = auth.currentUser;
      if (!userObj || !userObj.email) throw new Error("User not authenticated");

      const hasPassword = userObj.providerData.some(p => p.providerId === 'password');

      if (hasPassword) {
        // Re-authenticate
        const credential = EmailAuthProvider.credential(userObj.email, passwordData.currentPassword);
        await reauthenticateWithCredential(userObj, credential);
        // Update password
        await fbUpdatePassword(userObj, passwordData.newPassword);
      } else {
        // For Google/Phone users, they might not have a password. 
        // We use linkWithCredential to "add" email/password
        const credential = EmailAuthProvider.credential(userObj.email, passwordData.newPassword);
        await linkWithCredential(userObj, credential);
      }

      // Update Firestore flag
      await updateProfile({ hasPassword: true });

      setIsChangingPassword(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccessMessage("Password updated successfully!");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error("Password Update Error:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setPasswordError("The current password you entered is incorrect. Access denied.");
      } else if (error.code === 'auth/weak-password') {
        setPasswordError("New password is too weak");
      } else if (error.code === 'auth/too-many-requests') {
        setPasswordError("Too many attempts. Please try again later.");
      } else {
        setPasswordError(error.message || "Failed to update password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    // Validate National Identity Number (NIN)
    if (profileData.nin && profileData.nin.length > 0 && profileData.nin.length !== 11) {
      alert("National Identity Number (NIN) must be exactly 11 digits.");
      return;
    }
    if (user?.nin && profileData.nin !== user.nin) {
      alert("For security, your linked National Identity Number cannot be changed.");
      return;
    }

    // Spin off to background
    setPublishingStatus("Updating profile details...");
    setPublishingProgress(10);
    
    setIsEditing(false); // Release user immediately
    cleanupPreview();

    // Background process
    (async () => {
      try {
        let finalAvatarUrl = user?.avatarUrl || null;

        // 1. Handle Avatar Upload if selected
        if (selectedFile) {
          setPublishingStatus("Uploading new photo...");
          setPublishingProgress(40);
          console.log("Image selected, starting upload process...");
          
          if (user?.avatarUrl && user.avatarUrl.includes("firebasestorage")) {
            await safeDeleteStorageFile(user.avatarUrl);
          }
          
          try {
            console.log("Compressing image...");
            const compressedBlob = await compressImage(selectedFile);
            const fileName = `avatars/${user?.id || 'unknown'}_${Date.now()}.jpg`;
            const storageRef = ref(storage, fileName);
            
            const uploadPromise = uploadBytes(storageRef, compressedBlob);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Storage upload timed out (60s)")), 60000)
            );

            const snapshot: any = await Promise.race([uploadPromise, timeoutPromise]);
            finalAvatarUrl = await getDownloadURL(snapshot.ref);
          } catch (uploadError: any) {
            console.error("Avatar upload process failed:", uploadError);
            if (uploadError.message?.includes("timed out")) {
              try {
                 const compressedBlob = await compressImage(selectedFile);
                 const reader = new FileReader();
                 const base64: string = await new Promise((res, rej) => {
                   reader.onload = () => res(reader.result as string);
                   reader.onerror = rej;
                   reader.readAsDataURL(compressedBlob);
                 });
                 finalAvatarUrl = base64;
              } catch (fallbackError) {
                 console.error("Fallback failed:", fallbackError);
              }
            }
          }
        }

        setPublishingProgress(80);
        setPublishingStatus("Saving profile data...");
        // 2. Prepare Data
        const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
        const updatedData: any = {
          ...profileData,
          name: fullName,
          avatarUrl: finalAvatarUrl || null,
          verificationLevel: calculateVerificationLevel({ ...user || {}, ...profileData, name: fullName, avatarUrl: finalAvatarUrl || null })
        };

        // 3. Update Firestore
        try {
          const userRef = doc(db, 'users', user?.id || '');
          await updateDoc(userRef, {
            ...updatedData,
            avatarBase64: deleteField(),
            photo: deleteField()
          });
          
          await updateProfile(updatedData);
        } catch (updateError: any) {
          await updateProfile(updatedData);
        }
        
        setPublishingProgress(100);
        setPublishingStatus("Profile updated successfully!");
        toast.success("Profile updated successfully!");
        
        setTimeout(() => {
          setPublishingProgress(null);
          setPublishingStatus('');
        }, 1500);

      } catch (error: any) {
        console.error("Save failed:", error);
        toast.error(`Failed to save profile: ${error.message || "Unknown error"}.`);
        setPublishingProgress(null);
        setPublishingStatus('');
      }
    })();
  };

  interface ProfileMenuItem {
    icon: React.ReactNode;
    label: string;
    color: string;
    action?: () => void;
    badge?: number;
    description?: string;
  }

  const menuItems: ProfileMenuItem[] = [
    {
      icon: <Heart className="w-5 h-5 fill-current" />,
      label: "Saved Properties",
      color: "text-rose-500",
      action: () => setActiveTab("favorites"),
      badge: favorites.length > 0 ? favorites.length : undefined,
      description: "Your bookmarked interests",
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: "Notifications",
      color: "text-blue-500",
      description: "Alerts and updates",
      action: () => setActiveTab("notifications"),
    },
    {
      icon: <Lock className="w-5 h-5" />,
      label: "Privacy",
      color: "text-purple-500",
      description: "Account safety",
    },
    {
      icon: <HelpCircle className="w-5 h-5" />,
      label: "Help Support",
      color: "text-primary-500",
      description: "Get assistance",
    },
  ];

  const profileCompletionFields = ['name', 'gender', 'dob', 'city', 'nin', 'avatarUrl'];
  const completionPercentage = useMemo(() => {
    if (!user) return 0;
    const completedCount = profileCompletionFields.filter(field => {
      const val = user[field as keyof typeof user];
      return val && val.toString().trim() !== "";
    }).length;
    return Math.round((completedCount / profileCompletionFields.length) * 100);
  }, [user]);

  const isProfileComplete = checkProfileComplete(user);
  const currentLevel = calculateVerificationLevel(user);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-[0] transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 lg:hidden">
        <div className="w-full max-w-none px-4 h-16 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 leading-none">Your Space</span>
            <h1 className="text-lg font-display font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              Profile
            </h1>
          </div>
          <button 
            onClick={() => setActiveTab('notifications')}
            className="p-2.5 relative hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-full transition-colors group lg:hidden"
          >
            <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:text-primary-600 transition-colors" />
            <NotificationBadge />
          </button>
        </div>
      </header>

      <HeaderPortal>
        <div className="hidden lg:flex flex-1 items-center justify-between px-6 h-full">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 leading-none">Your Space</span>
            <h1 className="text-lg font-display font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              Profile
            </h1>
          </div>
        </div>
      </HeaderPortal>

      <main className="w-full max-w-none px-[15px] pt-[15px] pb-0 mb-0 space-y-6">
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/80 p-4 rounded-2xl flex items-center gap-3 shadow-sm mx-1"
          >
            <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300 tracking-tight">
              {successMessage}
            </p>
          </motion.div>
        )}

        {/* User Header Card */}
        <section className="bg-white dark:bg-slate-900 p-[15px] rounded-3xl border border-slate-150/80 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-center gap-5 transition-colors">
          <div 
            onClick={() => setIsEditing(true)}
            className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-md overflow-hidden flex-shrink-0 cursor-pointer relative group"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center text-primary-600 dark:text-primary-450 text-2xl font-black">
                {user.firstName ? user.firstName.charAt(0) : user.email.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <h2 className="text-lg font-display font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                {user.firstName ? `${user.firstName} ${user.lastName}` : "Guest User"}
              </h2>
              <VerificationBadge level={currentLevel} role={user.role} showText={true} className="scale-95" />
            </div>
            <p className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 truncate tracking-wide">
               {user.email || user.phoneNumber || "No contact info"}
            </p>
          </div>

          <button 
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-auto text-xs font-black text-primary-600 hover:text-primary-700 hover:bg-primary-100/30 dark:text-primary-400 dark:hover:bg-primary-900/20 transition-colors px-4.5 py-2.5 bg-primary-50 dark:bg-primary-900/10 rounded-xl"
          >
            Edit Profile
          </button>
        </section>

        {/* Bio Section */}
        {user.about && (
          <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-150/80 dark:border-slate-800/80 shadow-sm transition-colors">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">About</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic font-light">
              "{user.about.replace(/(^|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase())}"
            </p>
          </section>
        )}

        {/* General Settings */}
        <section className="space-y-3">
          <h3 className="text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase pl-2">General</h3>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150/80 dark:border-slate-800/80 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/50 transition-colors select-none">
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-100/75 dark:hover:bg-black/35 transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-955/40 rounded-2xl flex items-center justify-center text-blue-500 group-active:scale-95 transition-transform border border-blue-100/40 dark:border-blue-900/10">
                <CircleUserRound className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Edit Profile</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Change profile picture, email address, bio</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-350 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {user.role === 'agent' && (
              <>
                <KYCVerification />
                <TrustVerification onVerifyPhone={() => setShowPhoneInput(true)} />
              </>
            )}

            {user.role === 'tenant' && (
              <TrustVerification onVerifyPhone={() => setShowPhoneInput(true)} />
            )}

            {!user.phoneVerified && (
               <button 
                onClick={() => setShowPhoneInput(true)}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-100/75 dark:hover:bg-black/35 transition-colors group"
              >
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-955/40 rounded-2xl flex items-center justify-center text-orange-500 group-active:scale-95 transition-transform border border-orange-100/40 dark:border-orange-900/10">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Verify Identity</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium font-sans">Add phone number & national NIN credentials</p>
                </div>
                <div className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/35 text-rose-600 dark:text-rose-455 rounded-full text-[8.5px] font-black uppercase tracking-wider">Required</div>
                <ChevronRight className="w-4 h-4 text-slate-350 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            <button 
              onClick={() => {
                setPasswordError("");
                setIsChangingPassword(true);
              }}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-100/75 dark:hover:bg-black/35 transition-colors group"
            >
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-955/40 rounded-2xl flex items-center justify-center text-indigo-500 group-active:scale-95 transition-transform border border-indigo-100/40 dark:border-indigo-900/10">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {user.hasPassword ? 'Change Password' : 'Create Password'}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Update and strengthen account security</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-350 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button 
              onClick={() => setShowVault(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-100/75 dark:hover:bg-black/35 transition-colors group"
            >
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-955/40 rounded-2xl flex items-center justify-center text-amber-500 group-active:scale-95 transition-transform border border-amber-100/40 dark:border-amber-900/10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-white">DirectRent Vault</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Safe storage for contracts & rent receipts</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-350 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button 
              onClick={() => setShowTransactions(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-100/75 dark:hover:bg-black/35 transition-colors group"
            >
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-955/40 rounded-2xl flex items-center justify-center text-emerald-500 group-active:scale-95 transition-transform border border-emerald-100/40 dark:border-emerald-900/10">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Transaction History</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Verified escrow ledger settlements</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-350 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </section>

        {/* Preferences Settings */}
        <section className="space-y-3">
          <h3 className="text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase pl-2">Preferences</h3>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150/80 dark:border-slate-800/80 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/50 transition-colors select-none">
            
            {/* Theme Toggle Button */}
            <div 
              onClick={handleToggleTheme}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-100/75 dark:hover:bg-black/35 transition-colors group cursor-pointer"
            >
              <div className={`w-10 h-10 ${theme === 'dark' ? 'bg-amber-950/40 text-amber-500 border border-amber-900/25' : 'bg-slate-100 text-slate-600 border border-slate-200/55'} rounded-2xl flex items-center justify-center group-active:scale-95 transition-all duration-300`}>
                <AnimatePresence mode="wait">
                  {theme === 'dark' ? (
                    <motion.div
                      key="sun"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                    >
                      <Sun className="w-5 h-5 text-amber-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                    >
                      <Moon className="w-5 h-5 text-slate-600" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Dark Mode</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Switch between light and dark themes</p>
              </div>
              <div 
                className={`w-11 h-6 ${theme === 'dark' ? 'bg-primary-600' : 'bg-slate-200'} rounded-full flex items-center px-1 transition-all duration-300 relative`}
              >
                <motion.div 
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  animate={{ x: theme === 'dark' ? 20 : 0 }}
                  className="w-4 h-4 bg-white rounded-full shadow-sm z-10" 
                />
              </div>
            </div>

          </div>
        </section>

        {/* Support & Legal */}
        <section className="space-y-3">
          <h3 className="text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase pl-2">Support & Legal</h3>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150/80 dark:border-slate-800/80 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/50 transition-colors select-none">
            <button 
              onClick={() => setActiveTab('faq')}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-100/75 dark:hover:bg-black/35 transition-colors group"
            >
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-955/40 rounded-2xl flex items-center justify-center text-indigo-500 group-active:scale-95 transition-transform border border-indigo-100/40 dark:border-indigo-900/10">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-white">FAQ</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Find instant answers to common questions</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-350 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button 
              onClick={() => setActiveTab('terms')}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-100/75 dark:hover:bg-black/35 transition-colors group"
            >
              <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-955/40 rounded-2xl flex items-center justify-center text-cyan-500 group-active:scale-95 transition-transform border border-cyan-100/40 dark:border-cyan-900/10 font-sans">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Terms of Use</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">DirectRent rules of engagement</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-350 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors group"
            >
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-955/40 rounded-2xl flex items-center justify-center text-rose-500 group-active:scale-95 transition-transform border border-rose-100/40 dark:border-rose-900/10">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-rose-650 dark:text-rose-455 font-sans">Log Out</p>
                <p className="text-[10px] text-rose-400/80 dark:text-rose-500/50 font-medium font-sans">Securely end your active session</p>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-350 dark:text-rose-700 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </section>

        <AnimatePresence>
          {showPhoneInput && (
            <div 
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setShowPhoneInput(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-[2rem] shadow-2xl overflow-hidden w-full max-w-sm border border-slate-200 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 sm:p-8 space-y-4 sm:space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">Security</h3>
                      <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Verification</p>
                    </div>
                    <button 
                      onClick={() => setShowPhoneInput(false)} 
                      className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800/50 dark:hover:bg-rose-900/20 p-2 rounded-full transition-all"
                    >
                      <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>

                  {!verificationId ? (
                    <div className="space-y-4 sm:space-y-8">
                      <div className="text-center space-y-3">
                         <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mb-1 sm:mb-2 ring-4 sm:ring-8 ring-blue-50/50 dark:ring-blue-900/10">
                           <Smartphone className="w-6 h-6 sm:w-8 sm:h-8" />
                         </div>
                         <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Verify Phone Number</h4>
                         <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">We'll send a code to verify your phone number to secure your account and build trust.</p>
                      </div>
                      
                      <div className="space-y-2 focus-within:text-primary-600 dark:focus-within:text-primary-400">
                        <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-colors ml-1">
                          Mobile Number
                        </label>
                        <div className="relative flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl border-2 border-slate-100 dark:border-slate-800 focus-within:border-primary-500/30 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all overflow-hidden group">
                          <div className="flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-4 bg-slate-100/60 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700/50">
                            <span className="text-lg sm:text-xl leading-none">🇳🇬</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 tracking-tight">+234</span>
                          </div>
                          <input 
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              // Strip leading 0 or 234 if they typed it to keep only 10 digits in state
                              let clean = val;
                              if (clean.length > 10) {
                                if (clean.startsWith('234')) clean = clean.slice(3);
                                else if (clean.startsWith('0')) clean = clean.slice(1);
                              }
                              setPhone(clean.slice(0, 10));
                            }}
                            placeholder="803 000 0000"
                            className="w-full bg-transparent border-0 px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 tracking-wide"
                          />
                        </div>
                        {/* Hidden recaptcha container moved inside modal context */}
                        <div id="recaptcha-container-profile" ref={recaptchaRef} className="mt-2 flex justify-center"></div>
                        {phoneError && (
                          <motion.div 
                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-1.5 sm:gap-2 text-rose-500 mt-2 bg-rose-50 dark:bg-rose-900/20 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-rose-100 dark:border-rose-900/50"
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <p className="text-[10px] sm:text-[11px] font-bold leading-snug">{phoneError}</p>
                          </motion.div>
                        )}
                      </div>
                      <button 
                        onClick={handleSendOTP} 
                        disabled={isVerifyingPhone || phone.length !== NIGERIAN_PHONE_LENGTH} 
                        className="w-full bg-primary-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black shadow-xl shadow-primary-500/20 hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2"
                      >
                        {isVerifyingPhone ? (
                          <>
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Verification Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-8">
                      <div className="text-center space-y-3">
                         <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-1 sm:mb-2 ring-4 sm:ring-8 ring-emerald-50/50 dark:ring-emerald-900/10">
                           <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8" />
                         </div>
                         <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Enter OTP Code</h4>
                         <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                           We've sent a 6-digit code to <br/>
                           <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 sm:py-1 rounded-md ml-1 inline-block mt-1 tracking-wider text-[10px] sm:text-xs">+234 {phone}</span>
                         </p>
                      </div>
                      
                      <div className="space-y-2 relative">
                        <div className="flex justify-between gap-2 sm:gap-3">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <div 
                              key={`profile-otp-${index}`}
                              className={`w-10 h-12 sm:w-14 sm:h-16 flex items-center justify-center text-xl sm:text-2xl font-black rounded-xl border-2 transition-all duration-200
                                ${otp.length === index ? 'border-primary-500 ring-4 ring-primary-500/10 bg-white dark:bg-slate-900' : 
                                  otp[index] ? 'border-primary-500/30 bg-primary-50/30 dark:bg-primary-900/10 dark:border-primary-900/50' : 
                                  'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'} 
                                ${otp[index] ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-600'}`}
                            >
                              {otp[index] || '•'}
                            </div>
                          ))}
                        </div>
                        
                        <input 
                          type="tel"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="absolute opacity-0 inset-0 w-full h-full cursor-default"
                          autoFocus
                        />
                        
                        {phoneError && (
                          <motion.div 
                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-1.5 sm:gap-2 text-rose-500 mt-2 bg-rose-50 dark:bg-rose-900/20 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-rose-100 dark:border-rose-900/50"
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <p className="text-[10px] sm:text-[11px] font-bold leading-snug">{phoneError}</p>
                          </motion.div>
                        )}
                        
                        <div className="flex justify-center mt-2 sm:mt-4">
                          <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={resendTimer > 0 || isVerifyingPhone}
                            className="text-[10px] sm:text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline disabled:text-slate-400 disabled:no-underline transition-all"
                          >
                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Didn't receive code? Resend"}
                          </button>
                        </div>
                      </div>
                      
                      <button 
                        onClick={handleVerifyOTP} 
                        disabled={isVerifyingPhone || otp.length < 6} 
                        className="w-full bg-primary-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black shadow-xl shadow-primary-500/20 hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2"
                      >
                        {isVerifyingPhone ? (
                          <>
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <span>Confirm & Verify</span>
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Fullscreen Edit Profile Overlay */}
        <AnimatePresence>
          {isEditing && (
            <div className="fixed inset-0 z-[110] bg-slate-900/80 dark:bg-slate-950/85 backdrop-blur-xl flex items-center justify-center overflow-y-auto p-3 sm:p-6 cursor-default">
              <motion.div 
                initial={{ opacity: 0, scale: 0.96, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.18)] dark:shadow-black/80 border border-slate-100 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] relative my-auto select-none"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-slate-800/65 flex items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-10">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400">Settings</span>
                    <h3 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight mt-0.5">Edit Profile</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      cleanupPreview();
                    }}
                    className="p-2 sm:p-2.5 text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-300"
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                {/* Form Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-8 scrollbar-hide pb-12">
                  
                  {/* Photo Section with Beautiful Frame */}
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="relative group">
                      <div 
                        onClick={handleAvatarClick}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border-4 border-slate-100 dark:border-slate-850 shadow-md flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 group-hover:scale-103 group-hover:shadow-lg active:scale-97"
                      >
                        {previewUrl || user.avatarUrl ? (
                          <img 
                            src={previewUrl || user.avatarUrl || undefined} 
                            alt="Preview" 
                            className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-300" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary-50 dark:bg-primary-950/20 flex flex-col items-center justify-center text-primary-500 font-display font-black text-3xl">
                            {user.firstName ? user.firstName.charAt(0) : user.email.charAt(0)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white gap-1 backdrop-blur-[1px]">
                          <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Change</span>
                        </div>
                      </div>
                      
                      {/* Upload Badge */}
                      <button 
                        onClick={handleAvatarClick}
                        className="absolute -bottom-1.5 -right-1.5 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/20 border border-white dark:border-slate-900 transition-all active:scale-90"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 mt-1">
                      <button 
                        onClick={handleAvatarClick}
                        className="text-primary-600 dark:text-primary-400 text-xs font-bold hover:underline"
                      >
                        Upload Photo
                      </button>
                      {user.avatarUrl && (
                        <button 
                          onClick={() => setShowDeletePhotoConfirm(true)}
                          className="text-rose-500 text-xs font-bold hover:underline"
                        >
                          Delete Photo
                        </button>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-6">
                    
                    {/* General Information Header */}
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800/40 pb-2">
                      <div className="w-1.5 h-4 bg-primary-600 dark:bg-primary-500 rounded-full" />
                      <h4 className="text-xs font-black uppercase tracking-[0.15em] text-slate-450 dark:text-slate-500 font-sans">General Information</h4>
                    </div>

                    <div className="space-y-4">
                      {/* Resident City */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider ml-1">Resident City</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-450" />
                          <select
                            value={profileData.city}
                            onChange={(e) => setProfileData((prev) => ({ ...prev, city: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 focus:border-primary-500/30 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 py-3.5 sm:py-4 pl-11 sm:pl-12 pr-10 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none transition-all appearance-none cursor-pointer"
                          >
                            <option value="" className="dark:bg-slate-900">Select City</option>
                            {["Lagos", "Abuja", "Ibadan", "Port Harcourt", "Kano", "Ogbomoso", "Enugu", "Ilorin", "Abeokuta", "Kaduna", "Owerri", "Benin City"].map((city, cityIdx) => (
                              <option key={`profile-city-select-${city}-${cityIdx}`} value={city} className="dark:bg-slate-900">{city}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-400 dark:border-t-slate-550 w-0 h-0" />
                        </div>
                      </div>

                      {/* First & Last Name */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider ml-1">First Name</label>
                          <div className="relative">
                            <CircleUserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-455" />
                            <input
                              name="firstName"
                              type="text"
                              value={profileData.firstName}
                              onChange={handleNameChange}
                              placeholder="First Name"
                              className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 focus:border-primary-500/30 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 py-3.5 sm:py-4 pl-11 sm:pl-12 pr-5 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-350 dark:placeholder:text-slate-600"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider ml-1">Last Name</label>
                          <div className="relative">
                            <CircleUserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-455" />
                            <input
                              name="lastName"
                              type="text"
                              value={profileData.lastName}
                              onChange={handleNameChange}
                              placeholder="Last Name"
                              className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 focus:border-primary-500/30 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 py-3.5 sm:py-4 pl-11 sm:pl-12 pr-5 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-350 dark:placeholder:text-slate-600"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Date of Birth & Gender */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider ml-1">Date of Birth</label>
                          <input
                            type="date"
                            value={profileData.dob}
                            onChange={(e) => setProfileData((prev) => ({ ...prev, dob: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 focus:border-primary-500/30 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 py-3.5 sm:py-4 px-4 sm:px-5 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider ml-1">Gender</label>
                          <div className="relative">
                            <select
                              value={profileData.gender}
                              onChange={(e) => setProfileData((prev) => ({ ...prev, gender: e.target.value }))}
                              className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 focus:border-primary-500/30 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 py-3.5 sm:py-4 px-4 sm:px-5 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none transition-all appearance-none cursor-pointer"
                            >
                              <option value="" className="dark:bg-slate-900">Select Gender</option>
                              <option value="Male" className="dark:bg-slate-900">Male</option>
                              <option value="Female" className="dark:bg-slate-900">Female</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-400 dark:border-t-slate-550 w-0 h-0" />
                          </div>
                        </div>
                      </div>

                      {/* Bio Field */}
                      {user.role === 'agent' && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider ml-1">Professional Bio / About Me</label>
                          <textarea
                            value={profileData.about}
                            onChange={(e) => setProfileData((prev) => ({ ...prev, about: e.target.value }))}
                            placeholder="Tell tenants about your experience, specialty areas, and commitment to service..."
                            rows={4}
                            className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 focus:border-primary-500/30 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none transition-all resize-none placeholder:text-slate-350 dark:placeholder:text-slate-600 leading-relaxed font-sans"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Security Header (Locked/Verified Credentials Panel) */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800/40 pb-2">
                      <div className="w-1.5 h-4 bg-amber-500 dark:bg-amber-450 rounded-full" />
                      <h4 className="text-xs font-black uppercase tracking-[0.15em] text-slate-450 dark:text-slate-500 font-sans">Identity & Verified Credentials</h4>
                    </div>

                    <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 p-5 rounded-3xl space-y-4">
                      {/* Subnotice */}
                      <div className="flex gap-2.5 items-start">
                        <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed italic">
                          To protect the security of our rental ecosystem, verified government credentials and system identity fields are locked and cannot be edited.
                        </p>
                      </div>

                      {/* Locked fields */}
                      <div className="space-y-3.5">
                        
                        {/* Permanent Email */}
                        <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/60 shadow-sm transition-all duration-300">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-450">
                              <Shield className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sans">Registered Email</p>
                              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{user.email || 'Not set'}</p>
                            </div>
                          </div>
                          <span className="shrink-0 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-750 text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 rounded-lg">Permanent</span>
                        </div>

                        {/* Permanent Phone */}
                        <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/60 shadow-sm transition-all duration-300">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-450">
                              <Smartphone className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sans">Verified Phone</p>
                              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{user.phoneNumber || 'Not verified'}</p>
                            </div>
                          </div>
                          {user.phoneVerified ? (
                            <span className="shrink-0 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/40 dark:border-emerald-900/25 text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="shrink-0 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-750 text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 rounded-lg">Unverified</span>
                          )}
                        </div>

                        {/* Permanent NIN */}
                        {user.nin ? (
                          <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/60 shadow-sm transition-all duration-300">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-450">
                                <Fingerprint className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sans">National Identity (NIN)</p>
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">•••• •••• {user.nin.slice(-4)}</p>
                              </div>
                            </div>
                            <span className="shrink-0 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/40 dark:border-emerald-900/25 text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified ID
                            </span>
                          </div>
                        ) : (
                          <div className="p-4 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/60 shadow-sm space-y-3 transition-all duration-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-955/20 flex items-center justify-center text-rose-500">
                                  <Fingerprint className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sans">National Identity (NIN)</p>
                                  <p className="text-xs font-bold text-rose-500 leading-none">Unverified ID</p>
                                </div>
                              </div>
                              <span className="shrink-0 px-2.5 py-1 bg-rose-50 dark:bg-rose-955/20 border border-rose-100/40 dark:border-rose-900/25 text-[8px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 rounded-lg">
                                Unverified ID
                              </span>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-0.5">Link 11-digit National Identity Number</label>
                              <input
                                  type="text"
                                  maxLength={11}
                                  placeholder="Enter 11-digit NIN to Link"
                                  value={profileData.nin || ""}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                                    setProfileData((prev) => ({ ...prev, nin: val }));
                                  }}
                                  className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500/50 dark:focus:border-emerald-500/50 transition-all font-mono"
                              />
                            </div>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal font-medium font-sans">
                              {user?.role === 'agent'
                                ? "* Linking your 11-digit NIN verifies your identity as a professional rental agent. Once saved and submitted, it will become permanent and cannot be modified or removed."
                                : "* Linking your 11-digit NIN verifies your identity in our rental ecosystem. Once saved and submitted, it will become permanent and cannot be modified or removed."}
                            </p>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer Buttons Sticky */}
                <div className="px-6 py-5 sm:px-8 border-t border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center gap-3 sm:gap-4 justify-between sticky bottom-0 z-10 select-none pb-6 sm:pb-8">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      cleanupPreview();
                    }}
                    className="flex-1 py-3.5 sm:py-4 text-slate-500 hover:text-rose-500 hover:bg-rose-50/50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/15 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 bg-slate-50 dark:bg-slate-850/40"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading || isUploading}
                    className="flex-[2] bg-primary-600 hover:bg-primary-700 text-white py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span>{isUploading ? "Uploading..." : "Saving..."}</span>
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Change Password Modal */}
        <AnimatePresence>
          {isChangingPassword && (
            <motion.div 
              key="change-password-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-md"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="min-h-screen p-4 flex items-center justify-center"
                onClick={() => setIsChangingPassword(false)}
              >
                <div 
                  className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden border border-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                        {user.hasPassword ? 'Password Update' : 'Set Password'}
                      </h3>
                      <button 
                        onClick={() => setIsChangingPassword(false)}
                        className="text-rose-500 hover:text-rose-600 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-all"
                      >
                        <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      {user.hasPassword ? (
                        <div className="space-y-1.5 sm:space-y-2">
                          <label className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-slate-200 tracking-tight ml-1">Current Password</label>
                          <div className="relative group">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-focus-within:text-primary-500" />
                            <input
                              type={showPassword ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                              className="w-full bg-slate-50 dark:bg-slate-800/50 border-0 py-3 px-4 pl-10 sm:pl-12 pr-10 sm:pr-12 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-mono tracking-widest placeholder:tracking-normal"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-2xl flex items-start gap-3">
                           <ShieldCheck className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                           <div>
                              <p className="text-[10px] font-black text-primary-700 dark:text-primary-400 uppercase tracking-wider">Google Authentication</p>
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                                 Since you use Google, you don't have a password yet. Setting one allows you to sign in with your email directly.
                              </p>
                           </div>
                        </div>
                      )}

                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-slate-200 tracking-tight ml-1">New Password</label>
                        <div className="relative group">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-focus-within:text-primary-500" />
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-0 py-3 px-4 pl-10 sm:pl-12 pr-10 sm:pr-12 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-mono tracking-widest placeholder:tracking-normal"
                            placeholder="New password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-slate-200 tracking-tight ml-1">Confirm New Password</label>
                        <div className="relative group">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-focus-within:text-primary-500" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-0 py-3 px-4 pl-10 sm:pl-12 pr-10 sm:pr-12 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-mono tracking-widest placeholder:tracking-normal"
                            placeholder="Repeat password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Password Criteria */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-1">
                        <div className="flex items-center gap-1.5">
                           <CheckCircle2 className={`w-3 h-3 ${passwordData.newPassword.length >= 7 ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`} />
                           <span className={`text-[9px] font-bold uppercase tracking-tight ${passwordData.newPassword.length >= 7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>Min 7 chars</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <CheckCircle2 className={`w-3 h-3 ${/[A-Z]/.test(passwordData.newPassword) ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`} />
                           <span className={`text-[9px] font-bold uppercase tracking-tight ${/[A-Z]/.test(passwordData.newPassword) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>Uppercase</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <CheckCircle2 className={`w-3 h-3 ${/[0-9]/.test(passwordData.newPassword) ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`} />
                           <span className={`text-[9px] font-bold uppercase tracking-tight ${/[0-9]/.test(passwordData.newPassword) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>Number</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <CheckCircle2 className={`w-3 h-3 ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`} />
                           <span className={`text-[9px] font-bold uppercase tracking-tight ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>Special Char</span>
                        </div>
                      </div>

                      {passwordError && (
                        <div className="p-2 sm:p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-lg sm:rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[9px] sm:text-[10px] font-bold">{passwordError}</span>
                        </div>
                      )}

                      <div className="flex gap-2.5 sm:gap-3 pt-2.5 sm:pt-4">
                        <button
                          onClick={() => setIsChangingPassword(false)}
                          className="flex-1 py-3 sm:py-4 text-rose-500 text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl sm:rounded-2xl transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdatePassword}
                          disabled={isLoading}
                          className="flex-[2] bg-primary-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-primary-500/30 hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : "Update"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showVault && (
            <motion.div
              key="vault-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-500"
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="bg-white dark:bg-slate-900 w-full max-w-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] border border-slate-200 dark:border-slate-800"
              >
                <div className="p-5 sm:p-8 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">DirectRent Vault</h3>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">End-to-End Encrypted Storage</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowVault(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 sm:p-8 scrollbar-hide">
                  <div className="space-y-6">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 sm:p-6 rounded-2xl sm:rounded-3xl text-white shadow-lg shadow-amber-500/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Lock className="w-24 h-24" />
                      </div>
                      <h4 className="text-lg font-black tracking-tight mb-1 relative z-10">Private Documents</h4>
                      <p className="text-xs text-amber-50 font-medium leading-relaxed max-w-[80%] relative z-10 opacity-90">
                        Securely store your signed tenancy agreements, rental receipts, and government IDs. Only you can access these files.
                      </p>
                    </div>

                    {/* Upload Section */}
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Your Documents ({vaultDocs.length})</h5>
                      <label 
                        className={`inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-black cursor-pointer hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 ${isUploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingDoc ? 'Uploading...' : 'Upload New'}</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={handleDocUpload}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </label>
                    </div>

                    {/* Documents List */}
                    <div className="space-y-3">
                      {vaultDocs.length > 0 ? (
                        vaultDocs.map((doc) => (
                          <motion.div 
                            layout
                            key={doc.id}
                            className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:border-amber-200 dark:hover:border-amber-900/50 transition-all group"
                          >
                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors shadow-sm">
                              {doc.type.includes('pdf') ? <FileText className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h6 className="text-sm font-bold text-slate-900 dark:text-white truncate">{doc.name}</h6>
                              <p className="text-[10px] text-slate-400 font-medium">Added {doc.createdAt?.toDate ? doc.createdAt.toDate().toLocaleDateString() : 'Just now'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <a 
                                href={doc.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-2 hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-primary-600 rounded-lg transition-all shadow-sm"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button 
                                onClick={() => handleDeleteDoc(doc.id, doc.url)}
                                className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-300 hover:text-rose-500 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="py-12 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-200 dark:text-slate-700 shadow-sm">
                            <Lock className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="text-slate-900 dark:text-white font-bold">Your vault is empty</p>
                            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-medium max-w-[200px] mx-auto mt-1">Upload your rental documents for safe keeping and easy access.</p>
                          </div>
                          <label className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm">
                            Add First Document
                            <input 
                              type="file" 
                              className="hidden" 
                              onChange={handleDocUpload}
                              accept=".pdf,.jpg,.jpeg,.png"
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100/50 dark:border-amber-900/30 flex gap-3 items-start">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-800/70 dark:text-amber-400/60 font-medium leading-relaxed italic">
                        All files in the DirectRent Vault are encrypted. DirectRent agents or staff cannot view these files unless you explicitly share them during a dispute.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-8 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <button 
                    onClick={() => setShowVault(false)}
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
                  >
                    Close Vault
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTransactions && (
            <motion.div 
              key="transactions-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
              onClick={() => setShowTransactions(false)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-500">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">Transaction History</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Your dummy escrow payments and settlements</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowTransactions(false)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/20">
                  {transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors">
                          <div className="space-y-1 sm:max-w-[70%]">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Paid</span>
                              <span className="text-[10px] text-slate-400 font-mono font-bold">{tx.id}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white">{tx.propertyTitle}</h4>
                            <p className="text-[11px] text-slate-500">
                              {user.role === 'tenant' ? 'Agent: ' + tx.agentName : 'Tenant: ' + tx.tenantName}
                            </p>
                          </div>
                          <div className="flex justify-between sm:flex-col items-center sm:items-end gap-1">
                            <span className="text-sm font-black text-slate-900 dark:text-white">{tx.amount}</span>
                            <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium">Dummy Settlement</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/40 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No Transactions Found</p>
                        <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">You haven't completed any dummy transactions yet. They will appear here once settled.</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLogoutConfirm && (
            <motion.div 
              key="logout-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowLogoutConfirm(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-500 mb-4 mx-auto">
                    <LogOut className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Log Out</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm text-center">Are you sure you want to log out of your account?</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                  <button 
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setShowLogoutConfirm(false);
                      logout();
                    }}
                    className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showDeletePhotoConfirm && (
            <motion.div 
              key="delete-photo-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowDeletePhotoConfirm(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-500 mb-4 mx-auto">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Delete Photo</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm text-center">Are you sure you want to delete your profile photo?</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                  <button 
                    onClick={() => setShowDeletePhotoConfirm(false)}
                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleAvatarDelete()}
                    className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Profile;
