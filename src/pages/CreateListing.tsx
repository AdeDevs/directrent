import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  Camera, 
  Plus, 
  X, 
  Check,
  Info,
  Home as HomeIcon,
  Bed,
  Bath,
  Maximize2,
  Navigation,
  ArrowLeft,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";
import { createNotification } from '../lib/notifications';

const PROPERTY_TYPES = ["Self-Contain", "1 Bedroom Flat", "Shared"];
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

const SUGGESTED_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
  "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
  "https://images.pexels.com/photos/276528/pexels-photo-276528.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
];

export default function CreateListing() {
  const { user, setActiveTab, currentListing, setCurrentListing } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isEditMode = !!currentListing && currentListing.agent?.id === user?.id;

  const [formData, setFormData] = useState({
    title: currentListing?.title || '',
    priceValue: currentListing?.priceValue ? currentListing.priceValue.toLocaleString() : '',
    location: currentListing?.location || '',
    type: currentListing?.type || 'Self-Contain',
    landmark: currentListing?.landmark || '',
    description: currentListing?.description || '',
    beds: currentListing?.beds?.toString() || '1',
    baths: currentListing?.baths?.toString() || '1',
    area: currentListing?.area?.replace(' SQM', '') || '',
    image: currentListing?.image || SUGGESTED_IMAGES[0],
    amenities: currentListing?.amenities || [] as string[]
  });

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formattedValue = rawValue ? parseInt(rawValue).toLocaleString() : '';
    setFormData(prev => ({ ...prev, priceValue: formattedValue }));
  };

  const generateImage = async () => {
    if (!formData.title) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{
          parts: [{
            text: `A high-quality, professional real estate photograph of a ${formData.type} in ${formData.location || 'Nigeria'}. Title: ${formData.title}. The image should look like it's from a premium property listing site. Architectural photography style.`,
          }],
        }],
        config: {
          imageConfig: {
            aspectRatio: "4:3",
          },
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            const imageUrl = `data:image/png;base64,${base64Data}`;
            setFormData(prev => ({ ...prev, image: imageUrl }));
            break;
          }
        }
      }
    } catch (error) {
      console.error("AI Generation error:", error);
    } finally {
      setIsGenerating(false);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const listingId = isEditMode && currentListing ? currentListing.id : `listing_${Date.now()}`;
      const rawPrice = formData.priceValue.replace(/\D/g, '');
      const priceNum = parseInt(rawPrice) || 0;
      
      const listingData = {
        title: formData.title,
        price: `₦${priceNum.toLocaleString()}`,
        priceValue: priceNum,
        location: formData.location,
        type: formData.type,
        image: formData.image,
        images: [formData.image],
        landmark: formData.landmark,
        description: formData.description,
        beds: parseInt(formData.beds),
        baths: parseInt(formData.baths),
        area: formData.area ? `${formData.area} SQM` : '45 SQM',
        amenities: formData.amenities,
        verified: user.verificationLevel === 'verified',
        isApproved: true, // Default to true so user see their work immediately
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

      // Trigger notification
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-[110px] transition-colors">
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

      <main className="w-full px-[15px] pt-4 pb-[110px] space-y-8 lg:space-y-12">
        <form onSubmit={handleCreate} className="space-y-8">
          {/* Cover Image Selector */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Camera className="w-3 h-3" /> Property Cover Image
              </label>
              <button
                type="button"
                disabled={isGenerating || !formData.title}
                onClick={generateImage}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isGenerating ? 'bg-slate-100 text-slate-400' : formData.title ? 'bg-primary-50 text-primary-600 hover:bg-primary-100' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    Generate with AI
                  </>
                )}
              </button>
            </div>
            
            <div className="relative group">
              <div className="aspect-[4/3] w-full rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200/50 dark:border-white/5 relative">
                <img 
                  src={formData.image} 
                  alt="Listing" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none">
              {SUGGESTED_IMAGES.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, image: url }))}
                  className={`relative flex-shrink-0 w-32 h-32 rounded-2xl overflow-hidden border-2 transition-all ${formData.image === url ? 'border-primary-600 scale-95 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={url} alt="Option" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {formData.image === url && (
                    <div className="absolute inset-0 bg-primary-600/20 flex items-center justify-center">
                      <div className="bg-primary-600 text-white rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">Select one of our preset high-quality property images for now.</p>
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
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl py-4 pl-10 pr-4 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Property Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl py-4 px-4 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white appearance-none"
                  >
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Location & Details */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-[15px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Location / Area</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Bodija, Ibadan"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Nearest Landmark</label>
                <div className="relative">
                  <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="text" 
                    placeholder="e.g. Near UI Gate"
                    value={formData.landmark}
                    onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Beds</label>
                <div className="relative">
                  <Bed className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                  <input 
                    type="number"
                    value={formData.beds}
                    onChange={(e) => setFormData(prev => ({ ...prev, beds: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-xl py-3 pl-8 pr-2 text-xs font-medium focus:border-primary-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Baths</label>
                <div className="relative">
                  <Bath className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                  <input 
                    type="number"
                    value={formData.baths}
                    onChange={(e) => setFormData(prev => ({ ...prev, baths: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-xl py-3 pl-8 pr-2 text-xs font-medium focus:border-primary-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Area (SQM)</label>
                <div className="relative">
                  <Maximize2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                  <input 
                    type="number"
                    placeholder="45"
                    value={formData.area}
                    onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-xl py-3 pl-8 pr-2 text-xs font-medium focus:border-primary-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Amenities selection */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-[15px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Key Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${formData.amenities.includes(amenity) ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-white/5 hover:border-slate-300'}`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </section>

          {/* Additional details */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-[15px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Property Description</label>
            <textarea 
              rows={4}
              placeholder="Tell tenants what makes this place special..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
              <Info className="w-3 h-3" /> By publishing, you agree to property listing terms.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
