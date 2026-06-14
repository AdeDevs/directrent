import React, { useState, useRef, useCallback } from 'react';
import HamburgerButton from '../components/HamburgerButton';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  Building2, 
  MapPin, 
  Camera, 
  Plus, 
  X, 
  Check,
  Info,
  Navigation,
  ArrowLeft,
  Video,
  Upload,
  AlertCircle,
  Sparkles,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType, storage } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createNotification } from '../lib/notifications';
import { compressImage } from '../lib/storage';
import { LocationPicker } from '../components/LocationPicker';
import { HeaderPortal } from '../components/HeaderPortal';

const SUGGESTED_PROPERTY_TYPES = [
  "Self-Contain", 
  "1 Bedroom Flat", 
  "2 Bedroom Flat", 
  "3 Bedroom Flat", 
  "Duplex",
  "Penthouse",
  "Shared Apartment",
  "Office Space",
  "Shop"
];

const AMENITIES_LIST = [
  "Running Water", 
  "Security", 
  "Prepaid Meter", 
  "Parking", 
  "Solar/Inverter", 
  "AC", 
  "Fenced", 
  "Generator",
  "Swimming Pool",
  "Gym"
];

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";


export default function CreateListing() {
  const { 
    user, 
    setActiveTab, 
    currentListing, 
    setCurrentListing,
    publishingProgress,
    setPublishingProgress,
    publishingStatus,
    setPublishingStatus 
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<(File | string)[]>(
    currentListing?.images || []
  );
  const [pendingVideo, setPendingVideo] = useState<File | string | null>(
    currentListing?.video || null
  );

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!currentListing && currentListing.agent?.id === user?.id;

  const [formData, setFormData] = useState({
    title: currentListing?.title || '',
    priceValue: currentListing?.priceValue ? currentListing.priceValue.toLocaleString() : '',
    paymentPeriod: currentListing?.paymentPeriod || 'annually' as 'monthly' | 'quarterly' | 'bi-annually' | 'annually' | 'custom',
    leaseDuration: currentListing?.leaseDuration || '1 Year',
    hasSplitPayment: !!currentListing?.initialPaymentValue,
    initialPaymentValue: currentListing?.initialPaymentValue ? currentListing.initialPaymentValue.toLocaleString() : '',
    subsequentPaymentValue: currentListing?.subsequentPaymentValue ? currentListing.subsequentPaymentValue.toLocaleString() : '',
    location: currentListing?.location || '',
    latitude: currentListing?.latitude || null,
    longitude: currentListing?.longitude || null,
    placeId: currentListing?.placeId || '',
    type: currentListing?.type || '',
    landmark: currentListing?.landmark || '',
    description: currentListing?.description || '',
    images: currentListing?.images || [] as string[],
    video: currentListing?.video || '',
    amenities: currentListing?.amenities || [] as string[]
  });

  const [atLimit, setAtLimit] = useState(false);
  
  // AI Landmark Assistant States
  const [isGeneratingLandmarks, setIsGeneratingLandmarks] = useState(false);
  const [suggestedLandmarks, setSuggestedLandmarks] = useState<{ name: string; distance: string; description: string; }[]>([]);

  const handleFetchLandmarkSuggestions = async () => {
    if (!formData.location) {
      toast.error("Please search/select a Property Address first!");
      return;
    }
    setIsGeneratingLandmarks(true);
    try {
      const response = await fetch("/api/suggest-landmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: formData.location }),
      });
      if (!response.ok) {
        let serverErrorMsg = "Failed to connect to assistant.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            serverErrorMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(serverErrorMsg);
      }
      const data = await response.json();
      if (data && Array.isArray(data.landmarks) && data.landmarks.length > 0) {
        setSuggestedLandmarks(data.landmarks);
        toast.success(`Generated ${data.landmarks.length} landmark options!`);
      } else {
        toast.error("No recognized landmarks found. Try filling in a more specific property address.");
      }
    } catch (err: any) {
      console.error("AI Landmark error:", err);
      toast.error(err.message || "Failed to generate landmarks. Please double check API keys or type one manually.");
    } finally {
      setIsGeneratingLandmarks(false);
    }
  };

  React.useEffect(() => {
    const checkLimit = async () => {
      if (!user || user.verificationLevel?.toLowerCase() === 'verified' || isEditMode) {
        setAtLimit(false);
        return;
      }
      
      const { getCountFromServer, query, collection, where } = await import('firebase/firestore');
      const q = query(collection(db, 'listings'), where('agent.id', '==', user.id));
      const snapshot = await getCountFromServer(q);
      if (snapshot.data().count >= 5) {
        setAtLimit(true);
      }
    };
    checkLimit();
  }, [user?.id, user?.verificationLevel, isEditMode]);

  const capitalize = (str: string) => {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: string) => {
    if (typeof (formData as any)[field] === 'string') {
      setFormData(prev => ({ ...prev, [field]: capitalize((prev as any)[field]) }));
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formattedValue = rawValue ? parseInt(rawValue).toLocaleString() : '';
    setFormData(prev => ({ ...prev, priceValue: formattedValue }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileList = Array.from(files) as File[];
      const newImagePreviews = fileList.map(file => URL.createObjectURL(file));
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImagePreviews].slice(0, 10) 
      }));

      setPendingImages(prev => [...prev, ...fileList].slice(0, 10));
    }
  };

  const removeImage = (index: number) => {
    // If it was a blob URL, revoke it
    if (formData.images[index].startsWith('blob:')) {
      URL.revokeObjectURL(formData.images[index]);
    }
    
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));

    setPendingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file instanceof File) {
      const preview = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, video: preview }));
      setPendingVideo(file);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const validateForm = () => {
    if (!formData.title) return "Property title is required";
    if (!formData.priceValue) return "Price is required";
    if (!formData.type) return "Property type is required";
    if (!formData.location) return "Location is required";
    if (!formData.landmark) return "Nearest landmark is required";
    if (!formData.description) return "Description is required";
    if (formData.images.length < 3) return "Minimum of 3 property images required";
    if (!formData.video) return "A property video is required";
    return null;
  };

  const handleLocationSelect = useCallback((loc: { address: string; lat: number; lng: number; placeId: string }) => {
    setFormData(prev => ({
      ...prev,
      location: loc.address,
      latitude: loc.lat,
      longitude: loc.lng,
      placeId: loc.placeId
    }));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setPublishingProgress(5);
    setPublishingStatus("Validating details...");
    
    // Proactively redirect to dashboard / mylistings so they can witness the dynamic progress bar live!
    setActiveTab(isEditMode ? 'mylistings' : 'home');

    const progressTimer = setInterval(() => {
      setPublishingProgress(prev => {
        if (prev === null) return null;
        if (prev >= 90) return prev;
        const incr = Math.floor(Math.random() * 8) + 3;
        return Math.min(90, prev + incr);
      });
    }, 400);

    try {
      // Check listing limit for unverified agents
      setPublishingStatus("Checking limitations...");
      setPublishingProgress(prev => prev !== null ? Math.max(12, prev) : 12);

      if (user.verificationLevel?.toLowerCase() !== 'verified') {
        const { getCountFromServer, query, collection, where } = await import('firebase/firestore');
        const q = query(collection(db, 'listings'), where('agent.id', '==', user.id));
        const snapshot = await getCountFromServer(q);
        const count = snapshot.data().count;
        
        if (count >= 5 && !isEditMode) {
          clearInterval(progressTimer);
          setPublishingProgress(null);
          setPublishingStatus('');
          setError("Unverified agents are limited to 5 listings. Please verify your account to post more.");
          setIsSubmitting(false);
          // If we had errors, switch them back to Create Listing tab to make corrections!
          setActiveTab('create');
          toast.error("Unverified agents limit reached. Returning to form.");
          return;
        }
      }

      const listingId = isEditMode && currentListing ? currentListing.id : `listing_${Date.now()}`;
      
      // 1. Upload Images
      setPublishingStatus("Compressing and preparing property photos...");
      setPublishingProgress(prev => prev !== null ? Math.max(25, prev) : 25);

      const uploadedImageUrls: string[] = [];
      for (let i = 0; i < pendingImages.length; i++) {
        const item = pendingImages[i];
        setPublishingStatus(`Uploading photo ${i + 1} of ${pendingImages.length}...`);
        setPublishingProgress(prev => prev !== null ? Math.min(60, prev + i * 3) : 30);
        
        if (item instanceof File) {
          try {
            const compressed = await compressImage(item);
            const fileName = `listings/${listingId}/image_${i}_${Date.now()}.jpg`;
            const storageRef = ref(storage, fileName);
            const uploadPromise = uploadBytes(storageRef, compressed);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Image upload timed out")), 30000));
            const snapshot = await Promise.race([uploadPromise, timeoutPromise]) as any;
            const url = await getDownloadURL(snapshot.ref);
            uploadedImageUrls.push(url);
          } catch (uploadErr) {
            console.error("Image upload failed:", uploadErr);
            if (formData.images && formData.images[i]) {
              uploadedImageUrls.push(formData.images[i]);
            }
            throw new Error("Failed to upload image. Please check your network and try again.");
          }
        } else {
          uploadedImageUrls.push(item);
        }
      }

      // 2. Upload Video
      setPublishingStatus("Processing walk-through video tour (this may take a few seconds)...");
      setPublishingProgress(70);

      let finalVideoUrl = "";
      if (pendingVideo instanceof File) {
        try {
          const fileName = `listings/${listingId}/video_${Date.now()}.mp4`;
          const storageRef = ref(storage, fileName);
          const uploadPromise = uploadBytes(storageRef, pendingVideo);
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Video upload timed out")), 60000));
          const snapshot = await Promise.race([uploadPromise, timeoutPromise]) as any;
          finalVideoUrl = await getDownloadURL(snapshot.ref);
        } catch (uploadErr) {
          console.error("Video upload failed:", uploadErr);
          finalVideoUrl = formData.video;
          throw new Error("Failed to upload video. Please check your network and try again.");
        }
      } else if (typeof pendingVideo === 'string') {
        finalVideoUrl = pendingVideo;
      }

      setPublishingStatus("Saving property details safely in workspace...");
      setPublishingProgress(85);

      const rawPrice = formData.priceValue.replace(/\D/g, '');
      const priceNum = parseInt(rawPrice) || 0;

      const rawInitialPrice = formData.initialPaymentValue.replace(/\D/g, '');
      const initialPriceNum = parseInt(rawInitialPrice) || 0;

      const rawSubsequentPrice = formData.subsequentPaymentValue.replace(/\D/g, '');
      const subsequentPriceNum = parseInt(rawSubsequentPrice) || 0;
      
      const listingData: any = {
        title: formData.title,
        price: `₦${priceNum.toLocaleString()}`,
        priceValue: priceNum,
        paymentPeriod: formData.paymentPeriod,
        leaseDuration: formData.leaseDuration || '1 Year',
        initialPayment: (formData.hasSplitPayment && initialPriceNum) ? `₦${initialPriceNum.toLocaleString()}` : null,
        initialPaymentValue: (formData.hasSplitPayment && initialPriceNum) ? initialPriceNum : null,
        subsequentPayment: (formData.hasSplitPayment && subsequentPriceNum) ? `₦${subsequentPriceNum.toLocaleString()}` : null,
        subsequentPaymentValue: (formData.hasSplitPayment && subsequentPriceNum) ? subsequentPriceNum : null,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        placeId: formData.placeId || "",
        type: formData.type,
        image: uploadedImageUrls[0] || DEFAULT_IMAGE,
        images: uploadedImageUrls,
        video: finalVideoUrl,
        landmark: formData.landmark,
        description: formData.description,
        amenities: formData.amenities,
        verified: user.verificationLevel?.toLowerCase() === 'verified',
        isApproved: isEditMode ? (currentListing?.isApproved ?? false) : false,
        status: isEditMode ? (currentListing?.status ?? 'pending') : 'pending',
        noFee: true,
        agent: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          avatarUrl: user.avatarUrl || null,
          rating: isEditMode ? (currentListing?.agent?.rating ?? 5.0) : 5.0,
          isVerified: user.verificationLevel?.toLowerCase() === 'verified'
        },
        updatedAt: serverTimestamp(),
        ...(isEditMode ? {} : { createdAt: serverTimestamp() })
      };

      const finalPayload = Object.fromEntries(
        Object.entries(listingData).filter(([_, val]) => val !== undefined)
      );

      if (isEditMode) {
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'listings', listingId.toString()), finalPayload);
      } else {
        const { writeBatch, increment } = await import('firebase/firestore');
        const batch = writeBatch(db);
        
        batch.set(doc(db, 'listings', listingId.toString()), finalPayload);
        batch.update(doc(db, 'users', user.id), {
          listingsCount: increment(1)
        });
        
        await batch.commit();
      }

      await createNotification(
        user.id,
        isEditMode ? "Listing Updated" : "Listing Published",
        `Your listing "${formData.title}" has been ${isEditMode ? 'updated' : 'published'} successfully.`,
        "listing",
        "mylistings",
        listingId.toString()
      );

      clearInterval(progressTimer);
      setPublishingProgress(100);
      setPublishingStatus(isEditMode ? "Changes saved successfully!" : "Property published successfully!");

      toast.success(isEditMode ? "Listing changes saved successfully!" : "Listing published successfully! Awaiting quick admin verification.", {
        duration: 4000
      });

      // Visual cushion for completion state
      await new Promise(resolve => setTimeout(resolve, 800));

      setPublishingProgress(null);
      setPublishingStatus('');
      setCurrentListing(null);
    } catch (err: any) {
      clearInterval(progressTimer);
      setPublishingProgress(null);
      setPublishingStatus('');
      setActiveTab('create');
      toast.error(err?.message || "Error posting property. Please check network and permissions.");
      handleFirestoreError(err, OperationType.WRITE, 'listings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditMode && currentListing?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center font-sans">
        <div className="max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-rose-100 dark:border-rose-950/40 relative">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-display font-black text-slate-900 dark:text-white mb-3 tracking-tight">Listing Suspended</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
            The listing "{currentListing.title}" is currently suspended due to safety or quality guidelines. Suspended listings cannot be edited or modified.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setCurrentListing(null);
                setActiveTab('mylistings');
              }}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs uppercase tracking-widest py-3.5 rounded-2xl shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
            >
              Go to My Listings
            </button>
            <button
              onClick={() => {
                setCurrentListing(null);
                setActiveTab('home');
              }}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-2xl transition-all cursor-pointer"
            >
              Back to Browse
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-0 transition-colors">
      {/* 1st part: mobile sticky header */}
      <header className={`sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between lg:hidden`}>
        <div className="flex items-center gap-3">
          <HamburgerButton />
          <div>
            <span className="text-[8px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 leading-none block">
              {isEditMode ? 'Listing Editor' : 'Publishing Workspace'}
            </span>
            <h1 className="text-base font-display font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              {isEditMode ? 'Edit Property' : 'Post Property'}
            </h1>
          </div>
        </div>
      </header>

      {/* 2nd part: desktop portaled header */}
      <HeaderPortal>
        <div className="hidden lg:flex flex-1 items-center justify-between px-6 h-full">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 leading-none">
                {isEditMode ? 'Listing Editor' : 'Publishing Workspace'}
              </span>
              <h1 className="text-lg font-display font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                {isEditMode ? 'Edit Property Listing' : 'Post New Listing'}
              </h1>
            </div>
          </div>
        </div>
      </HeaderPortal>

      <main className="w-full px-[15px] pt-4 pb-[15px] mb-0 space-y-8 lg:space-y-12">
        {atLimit && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-200 dark:border-amber-500/20 rounded-3xl p-6 text-center space-y-4"
          >
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Listing Limit Reached</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Unverified agents can only post up to 5 properties. <br className="hidden sm:block" />
                Please verify your profile to unlock unlimited listings.
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('profile')}
              className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              Verify Profile
            </button>
          </motion.div>
        )}

        {(error || (atLimit && !isEditMode)) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-600 dark:text-rose-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-bold">{error || "You have reached your listing limit."}</p>
          </motion.div>
        )}

        <form onSubmit={handleCreate} className={`space-y-8 ${atLimit && !isEditMode ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
          {/* Media Section */}
          <section className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pl-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Camera className="w-3 h-3" /> Property Photos (Min 3)
                </label>
                <span className="text-[10px] font-bold text-slate-500">{formData.images.length}/10</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {formData.images.map((url, idx) => (
                  <div key={`create-img-${idx}-${url.slice(-20)}`} className="relative aspect-square rounded-2xl overflow-hidden group">
                    <img src={url} alt={`Listing ${idx}`} className="w-full h-full object-cover"  referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {idx === 0 && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-primary-600 text-[8px] font-black text-white rounded uppercase tracking-wider">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
                
                {formData.images.length < 10 && (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary-600 hover:border-primary-600 transition-all bg-white dark:bg-slate-900 group"
                  >
                    <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Photo</span>
                  </button>
                )}
              </div>
              <input 
                ref={imageInputRef}
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload} 
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                <Video className="w-3 h-3" /> Property Video Tour (Required)
              </label>
              
              {formData.video ? (
                <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900">
                  <video src={formData.video || undefined} className="w-full h-full object-cover" controls />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, video: '' }))}
                    className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full aspect-video rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-primary-600 hover:border-primary-600 transition-all bg-white dark:bg-slate-900 group"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest">Upload Property Video</p>
                    <p className="text-[9px] text-slate-400 mt-1">MP4, MOV up to 50MB</p>
                  </div>
                </button>
              )}
              <input 
                ref={videoInputRef}
                type="file" 
                accept="video/*" 
                className="hidden" 
                onChange={handleVideoUpload} 
              />
            </div>
          </section>

          {/* Basic Info */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-[15px] border border-slate-205 dark:border-slate-800 shadow-sm space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Listing Title</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    required
                    maxLength={100}
                    type="text" 
                    placeholder="E.g. Luxury Studio Apartment"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    onBlur={() => handleBlur('title')}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2 font-sans">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Rent Amount (In Naira)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">₦</span>
                    <input 
                      required
                      type="text" 
                      inputMode="numeric"
                      placeholder="350,000"
                      value={formData.priceValue}
                      onChange={handlePriceChange}
                      disabled={isEditMode}
                      className={`w-full border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-10 pr-4 text-sm font-medium outline-none transition-all dark:text-white ${isEditMode ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-800/50 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500'}`}
                    />
                  </div>
                </div>

                <div className="space-y-2 font-sans">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Payment Period</label>
                  <div className="relative">
                    <select 
                      value={formData.paymentPeriod}
                      onChange={(e) => handleInputChange('paymentPeriod', e.target.value)}
                      disabled={isEditMode}
                      className={`w-full border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-4 pr-10 text-sm font-medium outline-none transition-all dark:text-white appearance-none ${isEditMode ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-800/50 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 cursor-pointer'}`}
                    >
                      <option value="annually">Annually (Yearly)</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="bi-annually">Semi-Annually (6 Months)</option>
                      <option value="custom">Custom Term / One-Time</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Lease / Minimum Stay Duration</label>
                  <input 
                    type="text" 
                    placeholder="E.g. 1 Year, 6 Months, Custom"
                    value={formData.leaseDuration}
                    onChange={(e) => handleInputChange('leaseDuration', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-4 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Property Type</label>
                  <div className="relative">
                    <input 
                      list="property-types"
                      placeholder="E.g. 1 Bedroom Flat"
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      onBlur={() => handleBlur('type')}
                      disabled={isEditMode}
                      className={`w-full border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-4 text-sm font-medium outline-none transition-all dark:text-white ${isEditMode ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-800/50 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500'}`}
                    />
                    <datalist id="property-types">
                      {SUGGESTED_PROPERTY_TYPES.map(t => <option key={`prop-type-${t}`} value={t} />)}
                    </datalist>
                  </div>
                </div>
              </div>

            {/* Split payments / Initial deposit difference */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5 w-full">
                <label className={`flex items-start gap-3 ${isEditMode ? 'cursor-not-allowed opacity-70' : 'cursor-pointer group'}`}>
                  <input 
                    type="checkbox" 
                    checked={formData.hasSplitPayment}
                    onChange={(e) => setFormData(prev => ({ ...prev, hasSplitPayment: e.target.checked }))}
                    disabled={isEditMode}
                    className={`mt-1 rounded border-slate-350 dark:border-slate-750 text-primary-600 focus:ring-primary-500/10 w-4 h-4 ${isEditMode ? 'cursor-not-allowed' : ''}`}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide group-hover:text-primary-600 transition-colors">Setup Initial / Subsequent Payment structure?</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium w-full max-w-none">Enable this if the direct first-time rent is different from ongoing recurring renewals (e.g. including caution deposits, upfront payments, agent fees, etc.).</span>
                  </div>
                </label>

                {formData.hasSplitPayment && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800/80 w-full animate-fadeIn">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Initial/1st Payment Total (₦)</label>
                      <div className="relative font-sans">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-350 font-bold">₦</span>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          placeholder="E.g. 500,000"
                          value={formData.initialPaymentValue}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, '');
                            const formattedValue = rawValue ? parseInt(rawValue).toLocaleString() : '';
                            setFormData(prev => ({ ...prev, initialPaymentValue: formattedValue }));
                          }}
                          disabled={isEditMode}
                          className={`w-full border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-10 pr-4 text-sm font-medium outline-none transition-all dark:text-white ${isEditMode ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500'}`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Subsequent Rent Amount (₦)</label>
                      <div className="relative font-sans">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-350 font-bold">₦</span>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          placeholder="E.g. 350,050"
                          value={formData.subsequentPaymentValue}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, '');
                            const formattedValue = rawValue ? parseInt(rawValue).toLocaleString() : '';
                            setFormData(prev => ({ ...prev, subsequentPaymentValue: formattedValue }));
                          }}
                          disabled={isEditMode}
                          className={`w-full border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-10 pr-4 text-sm font-medium outline-none transition-all dark:text-white ${isEditMode ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500'}`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
          </section>

          {/* Location & Details */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-[15px] border border-slate-205 dark:border-slate-800 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Search Property Address</label>
                <LocationPicker 
                  initialValue={formData.location}
                  onLocationSelect={handleLocationSelect}
                  disabled={isEditMode}
                />
              </div>

              <div className="space-y-2 col-span-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Nearest Landmark</label>
                  <button
                    type="button"
                    onClick={handleFetchLandmarkSuggestions}
                    disabled={isGeneratingLandmarks || !formData.location || isEditMode}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all select-none ${
                      (!formData.location || isEditMode)
                        ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 border border-primary-200/50 dark:border-primary-800/35'
                    }`}
                  >
                    {isGeneratingLandmarks ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-primary-600" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-2.5 h-2.5 text-primary-600" />
                        Get Landmark Aid
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-350" />
                  <input 
                    required
                    type="text" 
                    placeholder="E.g. Near UI Gate"
                    value={formData.landmark}
                    onChange={(e) => handleInputChange('landmark', e.target.value)}
                    onBlur={() => handleBlur('landmark')}
                    disabled={isEditMode}
                    className={`w-full border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none transition-all dark:text-white ${isEditMode ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-800/50 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500'}`}
                  />
                </div>

                {suggestedLandmarks.length > 0 && !isEditMode && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-primary-50/20 dark:bg-primary-950/10 border border-primary-100/30 dark:border-primary-900/20 space-y-1.5 animate-fadeIn">
                    <div className="text-[8px] font-black tracking-widest text-primary-600 dark:text-primary-450 uppercase flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Neighborhood landmarks generator:
                    </div>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {suggestedLandmarks.map((lm, idx) => (
                        <button
                          key={`lm-choice-${idx}-${lm.name}`}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, landmark: lm.name }));
                            toast.success(`Selected "${lm.name}"`);
                          }}
                          className="px-2.5 py-1.5 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 dark:hover:text-white border border-slate-150 dark:border-slate-800 shadow-sm flex items-center gap-1.5 transition-all"
                        >
                          <span className="font-bold">{lm.name}</span>
                          <span className="opacity-60 text-[10px] font-normal">({lm.distance})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Amenities selection */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-[15px] border border-slate-205 dark:border-slate-800 shadow-sm space-y-6">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Key Amenities</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AMENITIES_LIST.map(amenity => (
                <button
                  key={`amenity-toggle-${amenity}`}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-2xl text-[10px] font-bold transition-all border ${formData.amenities.includes(amenity) ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${formData.amenities.includes(amenity) ? 'border-white bg-white text-primary-600' : 'border-slate-200 dark:border-slate-700'}`}>
                    {formData.amenities.includes(amenity) && <Check className="w-2.5 h-2.5" />}
                  </div>
                  {amenity}
                </button>
              ))}
            </div>
          </section>

          {/* Additional details */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-[15px] border border-slate-205 dark:border-slate-800 shadow-sm space-y-4">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Property Description</label>
            <textarea 
              required
              rows={6}
              placeholder="Provide a detailed description of the apartment. Mention specific features, condition, electricity, water situation etc..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white resize-none"
            />
          </section>

          <div className="pt-4">
            <button
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl bg-primary-600 text-white font-bold text-sm shadow-xl shadow-primary-500/25 transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-700 active:scale-95 cursor-pointer'}`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEditMode ? 'Updating...' : 'Publishing...'}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {isEditMode ? 'Save Changes' : 'Publish Listing'}
                </>
              )}
            </button>
            <p className="text-center mt-4 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
              <Info className="w-3 h-3" /> All fields are required to ensure transparency for tenants.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
