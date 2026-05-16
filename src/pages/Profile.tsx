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
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
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
import NotificationBadge from "../components/NotificationBadge";
import { createNotification } from "../lib/notifications";

// Compact card for Interests section to reduce weight and fit viewport better
const Profile = () => {
  const { user, logout, updateProfile, favorites, setActiveTab } = useAuth();
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
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
    }
    
    if (recaptchaRef.current) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: 'normal',
          callback: () => {
            // re-captcha solved
          },
          'expired-callback': () => {
            // Response expired. Ask user to solve reCAPTCHA again.
            if (window.recaptchaVerifier) {
              try {
                window.recaptchaVerifier.clear();
              } catch (e) {}
              window.recaptchaVerifier = undefined;
            }
          }
        });
      } catch (err) {
        console.error("Recaptcha Init Error:", err);
      }
    }
  };

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    middleName: user?.middleName || "",
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
        middleName: user.middleName || "",
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

  useEffect(() => {
    if (!user || !showVault) return;
    const docsRef = collection(db, 'vault');
    const q = query(docsRef, where('userId', '==', user.id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVaultDocs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user, showVault]);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploadingDoc(true);
    try {
      const fileName = `vault/${user.id}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, 'vault'), {
        userId: user.id,
        name: file.name,
        url,
        type: file.type,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Doc upload failed:", err);
      alert("Failed to upload document.");
    } finally {
      setIsUploadingDoc(false);
    }
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
      await safeDeleteStorageFile(user.avatarUrl);
      
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
      
      // Give the DOM a tiny bit of time to ensure container is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Always re-init to avoid stale containers
      initRecaptcha();
      
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) throw new Error("Recaptcha container not found");
      
      const widgetId = await appVerifier.render(); 
      
      const fullPhone = `+234${cleanPhone}`;
      
      let result;
      if (auth.currentUser) {
        result = await linkWithPhoneNumber(auth.currentUser, fullPhone, appVerifier);
      } else {
        result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      }
      
      setVerificationId(result);
      setResendTimer(60); // 60 seconds timer
      setSuccessMessage("OTP sent to your phone");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error("SMS Error:", error);
      if (error.code === 'auth/invalid-app-credential') {
        setPhoneError("App Verification Failed: Firebase could not verify this site's domain. Ensure your current URL is added to 'Authorized Domains' in your Firebase Authentication settings.");
      } else if (error.code === 'auth/operation-not-allowed') {
        setPhoneError("SMS is not enabled for your project region. Please check your Firebase Console Authentication settings.");
      } else if (error.code === 'auth/billing-not-enabled') {
        setPhoneError("SMS quotas may be exceeded or billing is required for this region. Use a 'Test Number' in Firebase Console (Settings > Phone) to bypass this during testing.");
      } else if (error.code === 'auth/too-many-requests') {
        setPhoneError("Too many attempts. Firebase has blocked this number temporarily. Use a 'Test Number' in your Firebase Console to continue immediately.");
      } else if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/account-exists-with-different-credential') {
        setPhoneError("This phone number is already linked to another account.");
      } else {
        setPhoneError(`Verification Error: ${error.code}. Ensure your domain is authorized in Firebase Console (Auth > Settings).`);
      }

      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
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
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Passwords do not match. Please re-enter your new password.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setPasswordError("");

    try {
      const userObj = auth.currentUser;
      if (!userObj || !userObj.email) throw new Error("User not authenticated");

      // Re-authenticate
      const credential = EmailAuthProvider.credential(userObj.email, passwordData.currentPassword);
      await reauthenticateWithCredential(userObj, credential);

      // Update password
      await updatePassword(userObj, passwordData.newPassword);

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

  const handleSave = async () => {
    setIsLoading(true);
    console.log("Starting profile update...");

    try {
      let finalAvatarUrl = user.avatarUrl || null;

      // 1. Handle Avatar Upload if selected
      if (selectedFile) {
        setIsUploading(true);
        console.log("Image selected, starting upload process...");
        
        // CLEANUP PREVIOUS IMAGE FROM STORAGE IF IT EXISTS
        await safeDeleteStorageFile(user.avatarUrl);
        
        try {
          // Compress the image (using a slightly smaller size for even better reliability)
          console.log("Compressing image...");
          const compressedBlob = await compressImage(selectedFile);
          console.log(`Compression complete. Blob size: ${(compressedBlob.size / 1024).toFixed(2)}KB. Uploading to Firebase Storage...`);
          
          // Create Storage Reference
          const fileName = `avatars/${user?.id || 'unknown'}_${Date.now()}.jpg`;
          const storageRef = ref(storage, fileName);
          
          // Use a promise race to handle potential hanging with a longer timeout
          console.log("Initiating uploadBytes...");
          const uploadPromise = uploadBytes(storageRef, compressedBlob);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Storage upload timed out (60s)")), 60000)
          );

          const snapshot: any = await Promise.race([uploadPromise, timeoutPromise]);
          console.log("Upload successful.");
          
          // Get Download URL
          console.log("Retrieving download URL...");
          finalAvatarUrl = await getDownloadURL(snapshot.ref);
          console.log("Download URL retrieved successfully:", finalAvatarUrl);
        } catch (uploadError: any) {
          console.error("Avatar upload process failed:", uploadError);
          
          if (uploadError.message?.includes("timed out")) {
            console.warn("Storage timed out. Attempting fallback to compressed Base64...");
            try {
               // CRITICAL FIX: Use the COMPRESSED blob for fallback, NOT the original file
               const compressedBlob = await compressImage(selectedFile);
               const reader = new FileReader();
               const base64: string = await new Promise((res, rej) => {
                 reader.onload = () => res(reader.result as string);
                 reader.onerror = rej;
                 reader.readAsDataURL(compressedBlob);
               });
               finalAvatarUrl = base64;
               console.log(`Fallback to compressed Base64 successful. Size: ${(base64.length / 1024).toFixed(2)}KB`);
            } catch (fallbackError) {
               console.error("Fallback failed:", fallbackError);
            }
          }

          let errorMsg = uploadError.message || "Unknown storage error";
          if (uploadError.code === 'storage/unauthorized') {
            errorMsg = "Permission denied. Please ensure 'Firebase Storage' is enabled in your Firebase Console and rules are set to public for development.";
          }
          
          if (!finalAvatarUrl || !finalAvatarUrl.startsWith('data:')) {
            alert(`Storage Error: ${errorMsg}. Your profile changes will be saved, but the photo might not update. Please verify Storage is enabled in your Firebase Console.`);
          }
        }
        setIsUploading(false);
      }

      // 2. Prepare Data
      console.log("Updating Firestore document...");
      const fullName = `${profileData.firstName} ${profileData.middleName ? profileData.middleName + ' ' : ''}${profileData.lastName}`.trim();
      const updatedData: any = {
        ...profileData,
        name: fullName,
        avatarUrl: finalAvatarUrl || null,
        verificationLevel: calculateVerificationLevel({ ...user || {}, ...profileData, name: fullName, avatarUrl: finalAvatarUrl || null })
      };

      // 3. Update Firestore using explicit updateDoc + deleteField cleanup
      // This is the ONLY way to recover if the document is currently bloated (e.g. 1.4MB)
      try {
        const userRef = doc(db, 'users', user?.id || '');
        await updateDoc(userRef, {
          ...updatedData,
          // Properly PURGE legacy fields to shrink document size
          avatarBase64: deleteField(),
          photo: deleteField()
        });
        
        // Sync context state
        await updateProfile(updatedData);
        console.log("Firestore update and debloating successful.");
      } catch (updateError: any) {
        console.warn("Standard update failed, trying backup merge...");
        await updateProfile(updatedData);
      }
      
      cleanupPreview();
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
      setShowSuccess(true);
      setIsIdentityExpanded(false);

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error("Save failed:", error);
      alert(`Failed to save profile: ${error.message || "Unknown error"}. Please try again.`);
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
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
      icon: <Shield className="w-5 h-5" />,
      label: "Privacy & Security",
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
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="w-full max-w-full px-2 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight ml-2">
            Profile
          </h1>
          <button 
            onClick={() => setActiveTab('notifications')}
            className="p-2 relative hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors group mr-1"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-primary-600 transition-colors" />
            <NotificationBadge />
          </button>
        </div>
      </header>

      <main className="w-full pt-4 px-[15px] space-y-8 lg:space-y-12 pb-[14px] mb-0">
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm mx-1"
          >
            <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-emerald-500 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 tracking-tight">
              {successMessage}
            </p>
          </motion.div>
        )}

        {/* User Header Card */}
        <section className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors" style={{paddingLeft: 12, paddingRight: 12}}>
          <div 
            onClick={() => setIsEditing(true)}
            className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden flex-shrink-0 cursor-pointer relative group"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xl font-black">
                {user.firstName ? user.firstName.charAt(0) : user.email.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                {user.firstName ? `${user.firstName} ${user.lastName}` : "Guest User"}
              </h2>
              <VerificationBadge level={currentLevel} showText={false} />
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium truncate">
               {user.email || user.phoneNumber || "No contact info"}
            </p>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="hidden sm:block text-xs font-black text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors px-3 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl"
          >
            Edit Profile
          </button>
        </section>

        {/* Bio Section */}
        {user.about && (
          <section className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">About</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
              {user.about.replace(/(^|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase())}
            </p>
          </section>
        )}

        {/* General Settings */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500 pl-2">General</h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-800 transition-colors">
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500 group-active:scale-95 transition-transform">
                <CircleUserRound className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Edit Profile</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Change profile picture, number, E-mail</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-700" />
            </button>

            {user.role === 'agent' && (
              <KYCVerification />
            )}

            {!user.phoneVerified && (
               <button 
                onClick={() => setShowPhoneInput(true)}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-500 group-active:scale-95 transition-transform">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Verify Identity</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Add phone number & NIN for trust</p>
                </div>
                <div className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-lg text-[9px] font-black uppercase border border-orange-200 dark:border-orange-800">Urgent</div>
                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-700" />
              </button>
            )}

            <button 
              onClick={() => {
                setPasswordError("");
                setIsChangingPassword(true);
              }}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-500 group-active:scale-95 transition-transform">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Change Password</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Update and strengthen account security</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-700" />
            </button>

            <button 
              onClick={() => setActiveTab('terms')}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl flex items-center justify-center text-cyan-500 group-active:scale-95 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Terms of Use</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Platform rules and guidelines</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-700" />
            </button>

            <button 
              onClick={() => setShowVault(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500 group-active:scale-95 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">DirectRent Vault</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Safe storage for contracts & receipts</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-700" />
            </button>

            <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500 group-active:scale-95 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Card</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Securely add payment method</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-700" />
            </button>
          </div>
        </section>

        {/* Preferences Settings */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500 pl-2">Preferences</h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-800 transition-colors">
            {/* Theme Toggle */}
            <div 
              onClick={() => {
                console.log("Toggle row clicked");
                handleToggleTheme();
              }}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
            >
              <div className={`w-10 h-10 ${theme === 'dark' ? 'bg-amber-900/20 text-amber-500' : 'bg-slate-100 text-slate-600'} rounded-xl flex items-center justify-center group-active:scale-95 transition-all duration-300`}>
                <AnimatePresence mode="wait">
                  {theme === 'dark' ? (
                    <motion.div
                      key="sun"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                    >
                      <Sun className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                    >
                      <Moon className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Dark Mode</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Switch between light and dark themes</p>
              </div>
              <div 
                className={`w-12 h-6 ${theme === 'dark' ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'} rounded-full flex items-center px-1 transition-all duration-300 relative`}
              >
                <motion.div 
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  animate={{ x: theme === 'dark' ? 24 : 0 }}
                  className="w-4 h-4 bg-white rounded-full shadow-sm z-10" 
                />
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 group">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500 group-active:scale-95 transition-transform">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Notification</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Customize your notification preferences</p>
              </div>
              <div className="w-12 h-6 bg-blue-600 rounded-full flex items-center px-1">
                <div className="w-4 h-4 bg-white rounded-full ml-auto" />
              </div>
            </div>

            <button 
              onClick={() => setActiveTab('faq')}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-500 group-active:scale-95 transition-transform">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">FAQ</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Find answers to common questions</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-700" />
            </button>

            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-rose-50/50 dark:hover:bg-rose-900/20 transition-colors group"
            >
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center text-rose-500 group-active:scale-95 transition-transform">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Log Out</p>
                <p className="text-[10px] text-rose-400/70 dark:text-rose-500/50 font-medium">Securely log out of Account</p>
              </div>
              <ChevronRight className="w-5 h-5 text-rose-300 dark:text-rose-800" />
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
                        <div id="recaptcha-container" ref={recaptchaRef} className="mt-2 flex justify-center"></div>
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
                              key={index}
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
            <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="min-h-screen p-4 flex items-center justify-center"
                onClick={() => {
                  setIsEditing(false);
                  cleanupPreview();
                }}
              >
                <div 
                  className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 sm:p-8 space-y-4 sm:space-y-8">
                      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3 sm:pb-6">
                        <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Edit Profile</h3>
                        <button 
                          onClick={() => {
                            setIsEditing(false);
                            cleanupPreview();
                          }}
                          className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                        >
                          <X className="w-6 h-6 sm:w-8 sm:h-8" />
                        </button>
                      </div>

                    <div className="space-y-6 sm:space-y-10 py-2 sm:py-4 max-h-[70vh] overflow-y-auto px-1 scrollbar-hide">
                      {/* Avatar Management in Edit Form */}
                      <div className="flex flex-col items-center gap-2 sm:gap-4">
                         <div 
                          onClick={handleAvatarClick}
                          className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-slate-50 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition-transform active:scale-95"
                         >
                            {previewUrl || user.avatarUrl ? (
                              <img 
                                src={previewUrl || user.avatarUrl || ''} 
                                alt="Preview" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <CircleUserRound className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 dark:text-slate-700" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all text-white gap-1 backdrop-blur-[2px]">
                               <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                               <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Change</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                           <button 
                            onClick={handleAvatarClick}
                            className="text-primary-600 dark:text-primary-400 text-[10px] sm:text-xs font-bold hover:underline"
                           >
                             Change Photo
                           </button>
                           {user.avatarUrl && (
                             <button 
                              onClick={() => setShowDeletePhotoConfirm(true)}
                              className="text-rose-500 text-[10px] sm:text-xs font-bold hover:underline"
                             >
                               Delete Photo
                             </button>
                           )}
                         </div>
                         <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                      </div>

                      <div className="space-y-6 sm:space-y-8">
                        <div className="space-y-4 sm:space-y-6">
                          <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 border-l-2 border-primary-500 pl-3">General Information</h4>
                          <div className="grid grid-cols-1 gap-4 sm:gap-6">
                            <div className="space-y-1.5 sm:space-y-2">
                              <label className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-slate-200 tracking-tight ml-1">Resident City</label>
                              <div className="relative group">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                <select
                                  value={profileData.city}
                                  onChange={(e) => setProfileData((prev) => ({ ...prev, city: e.target.value }))}
                                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent py-3 sm:py-4 pl-10 sm:pl-12 pr-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500/20 focus:ring-4 focus:ring-primary-500/5 transition-all appearance-none"
                                >
                                  <option value="">Select City</option>
                                  {["Lagos", "Abuja", "Ibadan", "Port Harcourt", "Kano", "Ogbomoso", "Enugu", "Ilorin", "Abeokuta", "Kaduna", "Owerri", "Benin City"].map(city => (
                                    <option key={city} value={city}>{city}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-slate-200 tracking-tight ml-1">First Name</label>
                                <div className="relative group">
                                  <CircleUserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                  <input
                                    name="firstName"
                                    type="text"
                                    value={profileData.firstName}
                                    onChange={handleNameChange}
                                    placeholder="First Name"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent py-3 sm:py-4 pl-10 sm:pl-12 pr-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500/20 focus:ring-4 focus:ring-primary-500/5 transition-all"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-slate-200 tracking-tight ml-1">Middle Name</label>
                                <div className="relative group">
                                  <CircleUserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                  <input
                                    name="middleName"
                                    type="text"
                                    value={profileData.middleName}
                                    onChange={handleNameChange}
                                    placeholder="Middle Name (Optional)"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent py-3 sm:py-4 pl-10 sm:pl-12 pr-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500/20 focus:ring-4 focus:ring-primary-500/5 transition-all"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-slate-200 tracking-tight ml-1">Last Name</label>
                                <div className="relative group">
                                  <CircleUserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                  <input
                                    name="lastName"
                                    type="text"
                                    value={profileData.lastName}
                                    onChange={handleNameChange}
                                    placeholder="Last Name"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent py-3 sm:py-4 pl-10 sm:pl-12 pr-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500/20 focus:ring-4 focus:ring-primary-500/5 transition-all"
                                  />
                                </div>
                              </div>
                            </div>
                            
                             <div className="grid grid-cols-2 gap-3 sm:gap-4">
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-slate-200 tracking-tight ml-1">Date of Birth</label>
                                <input
                                  type="date"
                                  value={profileData.dob}
                                  onChange={(e) => setProfileData((prev) => ({ ...prev, dob: e.target.value }))}
                                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500/20 focus:ring-4 focus:ring-primary-500/5 transition-all"
                                />
                              </div>
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-slate-200 tracking-tight ml-1">Gender</label>
                                <select
                                  value={profileData.gender}
                                  onChange={(e) => setProfileData((prev) => ({ ...prev, gender: e.target.value }))}
                                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500/20 focus:ring-4 focus:ring-primary-500/5 transition-all appearance-none"
                                >
                                  <option value="">Select Gender</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                </select>
                              </div>
                            </div>

                            {user.role === 'agent' && (
                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-slate-200 tracking-tight ml-1">About Me / Professional Bio</label>
                                <textarea
                                  value={profileData.about}
                                  onChange={(e) => setProfileData((prev) => ({ ...prev, about: e.target.value }))}
                                  placeholder="Tell tenants about your experience, specialty areas, and commitment to service..."
                                  rows={4}
                                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent py-3 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500/20 focus:ring-4 focus:ring-primary-500/5 transition-all resize-none"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4 sm:space-y-6 pt-2 sm:pt-4">
                           <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 border-l-2 border-primary-500 pl-3">Identity & Account</h4>
                           <div className="grid grid-cols-1 gap-4 sm:gap-6">
                            <div className="space-y-1.5 sm:space-y-2">
                              <label className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 tracking-tight ml-1">Account Email (Permanent)</label>
                              <div className="relative group grayscale">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-300 dark:text-slate-700" />
                                <input
                                  type="email"
                                  value={user.email || ""}
                                  disabled
                                  className="w-full bg-slate-100/50 dark:bg-slate-800/40 border-2 border-transparent py-3 sm:py-4 pl-10 sm:pl-12 pr-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-600 cursor-not-allowed"
                                />
                                <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 dark:text-slate-700" />
                              </div>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                              <label className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 tracking-tight ml-1">Phone Number</label>
                              <div className="relative group grayscale">
                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-300 dark:text-slate-700" />
                                <input
                                  type="text"
                                  value={user.phoneNumber || "Not set"}
                                  disabled
                                  className="w-full bg-slate-100/50 dark:bg-slate-800/40 border-2 border-transparent py-3 sm:py-4 pl-10 sm:pl-12 pr-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-600 cursor-not-allowed"
                                />
                                {user.phoneVerified ? (
                                  <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/20">
                                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </div>
                                ) : (
                                  <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 dark:text-slate-700" />
                                )}
                              </div>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                              <label className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 tracking-tight ml-1">NIN (Verified ID - Permanent)</label>
                              <div className="relative group grayscale">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-300 dark:text-slate-700" />
                                <input
                                  type="text"
                                  value={profileData.nin ? `****-****-${profileData.nin.slice(-4)}` : "Verified Identity"}
                                  disabled
                                  placeholder="NIN Verified"
                                  className="w-full bg-slate-100/50 dark:bg-slate-800/40 border-2 border-transparent py-3 sm:py-4 pl-10 sm:pl-12 pr-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-600 cursor-not-allowed"
                                />
                                <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 dark:text-slate-700" />
                              </div>
                              <p className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-600 font-bold ml-1 italic opacity-60">Verified identity documents cannot be changed.</p>
                            </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 sm:gap-4">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        cleanupPreview();
                      }}
                      className="flex-1 py-3 sm:py-4 text-rose-500 text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl sm:rounded-2xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isLoading || isUploading}
                      className="flex-[2] bg-primary-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black shadow-xl shadow-primary-500/30 hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          <span>{isUploading ? "Uploading..." : "Saving..."}</span>
                        </>
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Change Password Modal */}
        <AnimatePresence>
          {isChangingPassword && (
            <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="min-h-screen p-4 flex items-center justify-center"
                onClick={() => setIsChangingPassword(false)}
              >
                <div 
                  className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden border border-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tighter">Password Update</h3>
                      <button 
                        onClick={() => setIsChangingPassword(false)}
                        className="text-rose-500 hover:text-rose-600 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-all"
                      >
                        <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
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
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-slate-200 tracking-tight ml-1">New Password</label>
                        <div className="relative group">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-focus-within:text-primary-500" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-0 py-3 px-4 pl-10 sm:pl-12 pr-10 sm:pr-12 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-mono tracking-widest placeholder:tracking-normal"
                            placeholder="New password"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-slate-200 tracking-tight ml-1">Confirm New Password</label>
                        <div className="relative group">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-focus-within:text-primary-500" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-0 py-3 px-4 pl-10 sm:pl-12 pr-10 sm:pr-12 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-mono tracking-widest placeholder:tracking-normal"
                            placeholder="Repeat password"
                          />
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
            </div>
          )}

        <AnimatePresence>
          {showVault && (
            <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-500">
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="bg-white dark:bg-slate-900 w-full max-w-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] border border-white/10"
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
            </div>
          )}
        </AnimatePresence>

        {showLogoutConfirm && (
            <div 
              className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowLogoutConfirm(false)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
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
            </div>
          )}

          {showDeletePhotoConfirm && (
            <div 
              className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowDeletePhotoConfirm(false)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
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
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Profile;
