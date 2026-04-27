import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
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
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType, storage } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createNotification } from '../lib/notifications';
import { compressImage } from '../lib/storage';

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
  const { user, setActiveTab, currentListing, setCurrentListing } = useAuth();
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
    location: currentListing?.location || '',
    type: currentListing?.type || '',
    landmark: currentListing?.landmark || '',
    description: currentListing?.description || '',
    images: currentListing?.images || [] as string[],
    video: currentListing?.video || '',
    amenities: currentListing?.amenities || [] as string[]
  });

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
    try {
      const listingId = isEditMode && currentListing ? currentListing.id : `listing_${Date.now()}`;
      
      // 1. Upload Images
      const uploadedImageUrls: string[] = [];
      for (let i = 0; i < pendingImages.length; i++) {
        const item = pendingImages[i];
        if (item instanceof File) {
          try {
            const compressed = await compressImage(item);
            const fileName = `listings/${listingId}/image_${i}_${Date.now()}.jpg`;
            const storageRef = ref(storage, fileName);
            const snapshot = await uploadBytes(storageRef, compressed);
            const url = await getDownloadURL(snapshot.ref);
            uploadedImageUrls.push(url);
          } catch (uploadErr) {
            console.error("Image upload failed:", uploadErr);
            // Fallback to original preview URL if upload fails (though it won't be permanent)
            uploadedImageUrls.push(formData.images[i]);
          }
        } else {
          uploadedImageUrls.push(item);
        }
      }

      // 2. Upload Video
      let finalVideoUrl = "";
      if (pendingVideo instanceof File) {
        try {
          const fileName = `listings/${listingId}/video_${Date.now()}.mp4`;
          const storageRef = ref(storage, fileName);
          const snapshot = await uploadBytes(storageRef, pendingVideo);
          finalVideoUrl = await getDownloadURL(snapshot.ref);
        } catch (uploadErr) {
          console.error("Video upload failed:", uploadErr);
          finalVideoUrl = formData.video;
        }
      } else if (typeof pendingVideo === 'string') {
        finalVideoUrl = pendingVideo;
      }

      const rawPrice = formData.priceValue.replace(/\D/g, '');
      const priceNum = parseInt(rawPrice) || 0;
      
      const listingData = {
        title: formData.title,
        price: `₦${priceNum.toLocaleString()}`,
        priceValue: priceNum,
        location: formData.location,
        type: formData.type,
        image: uploadedImageUrls[0] || DEFAULT_IMAGE,
        images: uploadedImageUrls,
        video: finalVideoUrl,
        landmark: formData.landmark,
        description: formData.description,
        amenities: formData.amenities,
        verified: user.verificationLevel === 'verified',
        isApproved: true,
        noFee: true,
        agent: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          rating: isEditMode ? (currentListing?.agent?.rating ?? 5.0) : 5.0,
          isVerified: user.verificationLevel === 'verified'
        },
        updatedAt: serverTimestamp(),
        ...(isEditMode ? {} : { createdAt: serverTimestamp() })
      };

      if (isEditMode) {
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'listings', listingId), listingData);
      } else {
        await setDoc(doc(db, 'listings', listingId), listingData);
      }

      await createNotification(
        user.id,
        isEditMode ? "Listing Updated" : "Listing Published",
        `Your listing "${formData.title}" has been ${isEditMode ? 'updated' : 'published'} successfully.`,
        "listing",
        "mylistings",
        listingId.toString()
      );

      setCurrentListing(null);
      setActiveTab(isEditMode ? 'mylistings' : 'home');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'listings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-[0] transition-colors">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-2 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setCurrentListing(null);
              setActiveTab(isEditMode ? 'mylistings' : 'home');
            }}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {isEditMode ? 'Edit Listing' : 'Post Listing'}
          </h1>
        </div>
      </header>

      <main className="w-full px-[15px] pt-4 pb-[0] space-y-8 lg:space-y-12">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-600 dark:text-rose-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleCreate} className="space-y-8">
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
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group">
                    <img src={url} alt={`Listing ${idx}`} className="w-full h-full object-cover" />
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
                  <video src={formData.video} className="w-full h-full object-cover" controls />
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
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-[15px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Listing Title</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    required
                    maxLength={100}
                    type="text" 
                    placeholder="e.g. Luxury Studio Apartment"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    onBlur={() => handleBlur('title')}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Annual Rent (In Naira)</label>
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
                      className={`w-full border border-slate-100 dark:border-white/5 rounded-2xl py-4 pl-10 pr-4 text-sm font-medium outline-none transition-all dark:text-white ${isEditMode ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-800/50 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500'}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Property Type</label>
                  <div className="relative">
                    <input 
                      list="property-types"
                      placeholder="e.g. 1 Bedroom Flat"
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      onBlur={() => handleBlur('type')}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl py-4 px-4 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white"
                    />
                    <datalist id="property-types">
                      {SUGGESTED_PROPERTY_TYPES.map(t => <option key={t} value={t} />)}
                    </datalist>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Location & Details */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-[15px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between pr-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Location / Area</label>
                  <button 
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(async (pos) => {
                          const { latitude, longitude } = pos.coords;
                          handleInputChange('location', `Pinned Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
                        });
                      }
                    }}
                    className="text-[9px] font-black text-primary-600 uppercase tracking-tighter hover:underline"
                  >
                    Current Location
                  </button>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Bodija, Ibadan"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    onBlur={() => handleBlur('location')}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Nearest Landmark</label>
                <div className="relative">
                  <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Near UI Gate"
                    value={formData.landmark}
                    onChange={(e) => handleInputChange('landmark', e.target.value)}
                    onBlur={() => handleBlur('landmark')}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Amenities selection */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-[15px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Key Amenities</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AMENITIES_LIST.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-2xl text-[10px] font-bold transition-all border ${formData.amenities.includes(amenity) ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-white/5 hover:border-slate-300'}`}
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
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-[15px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Property Description</label>
            <textarea 
              required
              rows={6}
              placeholder="Provide a detailed description of the apartment. Mention specific features, condition, electricity, water situation etc..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white resize-none"
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
