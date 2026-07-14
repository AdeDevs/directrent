import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { 
  Zap, 
  MapPin, 
  Search, 
  Home as HomeIcon, 
  Users, 
  CheckCircle2, 
  Handshake, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  MessageSquare, 
  ArrowRight,
  ChevronDown,
  Sparkles,
  TrendingDown,
  Key,
  Layers,
  Check,
  Building2,
  FileText,
  BadgeAlert,
  HelpCircle,
  Coins,
  Linkedin,
  Github
} from 'lucide-react';
import Navbar from '../components/Navbar';
import ListingCard from '../components/ListingCard';
import Footer from '../components/Footer';
import { collection, query, limit, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

import { Listing } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import SafeImage from '../components/SafeImage';

const XLogo = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as any } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
};

const Hero = () => {
  const { setView, user, setAuthMode } = useAuth();
  const [typedPlaceholder, setTypedPlaceholder] = useState('Yaba, Lagos');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('Self-contain');

  useEffect(() => {
    window.scrollTo(0, 0);
    const placeholders = ['Bodija, Ibadan', 'Yaba, Lagos', 'Gwarinpa, Abuja', 'Lekki Phase 1', 'Unilag Area'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % placeholders.length;
      setTypedPlaceholder(placeholders[idx]);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleFind = () => {
    if (user) {
      setView('app');
    } else {
      setAuthMode('login');
      setView('auth');
    }
  };

  return (
    <section className="relative min-h-[100vh] flex flex-col justify-center items-center pt-24 pb-16 overflow-hidden bg-slate-50/50 text-slate-900 transition-colors duration-300">
      {/* Editorial Mesh Grid & Radial Soft Glows */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] opacity-30" />
        <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-primary-500/10 to-transparent" />
        <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[600px] h-[400px] bg-indigo-500/5 rounded-full blur-[140px] opacity-60 pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary-600/5 rounded-full blur-[120px] opacity-40 pointer-events-none" />
      </div>

      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-10 pb-10 flex flex-col justify-center items-center">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.05] text-slate-900"
          >
            Find your next space,<br />
            <span className="text-primary-600 font-semibold">without the agent stress.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-600 font-sans text-base sm:text-xl max-w-2xl mx-auto leading-relaxed font-light"
          >
            Verified student hostels, off-campus accommodations, and apartments listed directly by landlords. We specialize in safe, scam-free renting.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-4"
          >
            <button 
              onClick={handleFind}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-full font-medium flex items-center justify-center gap-2 transition-all duration-300 shadow-md active:scale-95 text-base w-full sm:w-auto hover:shadow-lg hover:shadow-primary-500/10"
            >
              Get Started <span className="ml-1">→</span>
            </button>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

{/* Value Comparative Metrics - Eliminates Boring Info, Increases Trust */}
const CompareTraditional = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white text-slate-900 transition-colors duration-300 relative border-y border-slate-200">
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={staggerContainer}
        className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        
        <motion.div variants={fadeUpVariant} className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <span className="text-primary-600 text-xs font-black tracking-widest uppercase">The Honest Truth</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            The Old Way vs DirectRent
          </h2>
          <p className="text-slate-555 text-sm sm:text-base font-light">
            We're making house hunting simple. No tricks, no ridiculous middleman fees, just plain transparency.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {/* Traditional Old-school block */}
          <motion.div variants={fadeUpVariant} className="bg-slate-50/75 rounded-3xl p-4 md:p-8 border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-850 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 py-3 px-5 bg-rose-50 text-rose-600 border-l border-b border-rose-100 text-[10px] font-black uppercase tracking-wider rounded-bl-2xl">
              Broken System
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6 border border-rose-100">
              <BadgeAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-6 font-display text-slate-900">Traditional House Hunting</h3>
            
            <ul className="space-y-4 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-rose-100">✕</span>
                <div>
                  <strong className="text-slate-800">Paying Just to Look:</strong>
                  <p className="text-xs text-slate-450 mt-0.5">Agents charge you "inspection fees" just to show you places that might not even be available.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-rose-100">✕</span>
                <div>
                  <strong className="text-slate-800">Hidden Agency & Legal Fees:</strong>
                  <p className="text-xs text-slate-450 mt-0.5">Getting slapped with huge extra agency and legal fees that make the rent unaffordable.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-rose-100">✕</span>
                <div>
                  <strong className="text-slate-800">Fake Photos & Scams:</strong>
                  <p className="text-xs text-slate-450 mt-0.5">Seeing a nice picture online, but getting to the place and it's a disaster, or dealing with scammers.</p>
                </div>
              </li>
            </ul>
          </motion.div>

          {/* New Modern DirectRent block */}
          <motion.div variants={fadeUpVariant} className="bg-primary-50/50 rounded-3xl p-4 md:p-8 border-[0.5px] border-primary-200/60 dark:border-[#0f172b] hover:border-primary-300 dark:hover:border-slate-850 transition-all duration-300 relative overflow-hidden shadow-md shadow-primary-500/5">
            <div className="absolute top-0 right-0 py-3 px-5 bg-emerald-50 text-emerald-600 border-l border-b border-emerald-100 text-[10px] font-black uppercase tracking-wider rounded-bl-2xl">
              The Better Way
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white border border-primary-200 text-primary-600 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className="text-lg font-bold mb-6 font-display text-primary-950">The DirectRent Way</h3>
            
            <ul className="space-y-4 text-xs sm:text-sm text-slate-800">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-emerald-100">✓</span>
                <div>
                  <strong className="text-primary-950">Free to Browse & Inspect:</strong>
                  <p className="text-slate-600 text-xs mt-0.5">Look through real, verified photos and videos of properties online without paying a dime.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-emerald-100">✓</span>
                <div>
                  <strong className="text-primary-950">No Hidden Charges:</strong>
                  <p className="text-slate-600 text-xs mt-0.5">What you see is what you pay. All fees are clearly stated upfront so you can budget properly.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-emerald-100">✓</span>
                <div>
                  <strong className="text-primary-950">Strictly Verified Owners & Agents:</strong>
                  <p className="text-slate-600 text-xs mt-0.5">We physically verify the properties and the people renting them out so you don't get scammed.</p>
                </div>
              </li>
            </ul>
          </motion.div>
        </div>

      </motion.div>
    </section>
  );
};

const RoleSelection = () => {
  const { setView, setAuthMode, setPreselectedRole } = useAuth();
  
  const handleRoleSelection = (role: 'tenant' | 'agent') => {
    setAuthMode('signup');
    setPreselectedRole(role);
    setView('auth');
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-slate-50/50 transition-colors duration-300 relative">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <span className="text-indigo-600 text-xs font-black tracking-widest uppercase">Platform Portals</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Choose your path</h2>
          <p className="text-slate-500 text-sm sm:text-base font-light">Whether you are trying to nest or looking to host, get started with premium tools.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Tenant block */}
          <motion.div 
            whileHover={{ y: -6 }} 
            onClick={() => handleRoleSelection('tenant')}
            className="group relative bg-white p-4 md:p-8 rounded-[2rem] shadow-sm border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 cursor-pointer transition-all duration-300 hover:shadow-md"
          >
            <div className="absolute top-6 right-6">
              <span className="bg-primary-50 text-primary-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-primary-100">Tenant Portal</span>
            </div>
            <div className="w-14 h-14 bg-primary-50 text-primary-500 rounded-2xl flex items-center justify-center mb-8 border border-primary-100 group-hover:scale-105 transition-transform">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">I want an apartment</h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-8 leading-relaxed font-light">Looking for your next space? Find verified student hostels, flats, and rooms.</p>
            
            <ul className="space-y-4 mb-10 text-xs sm:text-sm text-slate-600">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary-500 w-4 h-4 flex-shrink-0" /> Search real verified properties, no fake pictures.
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary-500 w-4 h-4 flex-shrink-0" /> Zero fake spaces from unregistered roadside touts.
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary-500 w-4 h-4 flex-shrink-0" /> Clear upfront fees so you can budget accurately.
              </li>
            </ul>
            <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-primary-500/10">
              Create Tenant Profile
            </button>
          </motion.div>

          {/* Landlord / Dev block */}
          <motion.div 
            whileHover={{ y: -6 }} 
            onClick={() => handleRoleSelection('agent')}
            className="group relative bg-white p-4 md:p-8 rounded-[2rem] shadow-sm border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 cursor-pointer transition-all duration-300 hover:shadow-md"
          >
            <div className="absolute top-6 right-6">
              <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-100">Landlord Portal</span>
            </div>
            <div className="w-14 h-14 bg-indigo-50 text-indigo-505 rounded-2xl flex items-center justify-center mb-8 border border-indigo-100 group-hover:scale-105 transition-transform">
              <Handshake className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">I'm a landlord / verified agent</h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-8 leading-relaxed font-light">Upload real estate properties, connect with students, and manage your spaces.</p>
            
            <ul className="space-y-4 mb-10 text-xs sm:text-sm text-slate-600">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-indigo-500 w-4 h-4 flex-shrink-0" /> Identity verification to get your trusted badge.
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-indigo-500 w-4 h-4 flex-shrink-0" /> Only genuine inquiries from verified tenants.
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-indigo-500 w-4 h-4 flex-shrink-0" /> Manage properties directly on the platform.
              </li>
            </ul>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/10">
              Create Agent Profile
            </button>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

const demoListings: Listing[] = [
  {
    id: 'demo-1',
    title: 'Modern 2-Bedroom Studio',
    description: 'A well-furnished and fully serviced modern apartment.',
    price: '₦1,500,000',
    priceValue: 1500000,
    paymentPeriod: 'annually',
    location: 'Lekki Phase 1, Lagos',
    type: 'Apartment',
    beds: 2,
    baths: 2,
    area: '120 sqm',
    verified: true,
    noFee: true,
    amenities: ['Furnished', '24/7 Power', 'Security'],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    agent: { id: 'demo-agent-1', name: 'Ade Lawal', isVerified: true, avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80' },
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-2',
    title: 'Spacious Self-Contain',
    description: 'Clean space suitable for a young professional or student.',
    price: '₦600,000',
    priceValue: 600000,
    paymentPeriod: 'annually',
    location: 'Yaba, Lagos',
    type: 'Self-Contain',
    beds: 1,
    baths: 1,
    area: '45 sqm',
    verified: true,
    noFee: true,
    amenities: ['Water', 'Security Guard'],
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'],
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    agent: { id: 'demo-agent-2', name: 'Chioma Ndubusi', isVerified: true, avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80' },
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-3',
    title: 'Premium 3-Bedroom Flat',
    description: 'Luxury flat with top notch facilities, parking space, and security.',
    price: '₦3,500,000',
    priceValue: 3500000,
    paymentPeriod: 'annually',
    location: 'Gwarinpa, Abuja',
    type: 'Flat',
    beds: 3,
    baths: 3,
    area: '250 sqm',
    verified: true,
    noFee: true,
    amenities: ['Furnished', 'Swimming Pool', 'Gym', 'Parking'],
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'],
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    agent: { id: 'demo-agent-3', name: 'Femi Ojo', isVerified: true, avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80' },
    status: 'active',
    createdAt: new Date().toISOString()
  }
] as unknown as Listing[];

const FeaturedListings = () => {
  const { setView, user, setAuthMode } = useAuth();
  const [featured, setFeatured] = useState<Listing[]>(demoListings); // Pre-fill with demo

  useEffect(() => {
    const listingsRef = collection(db, 'listings');
    const q = query(listingsRef, orderBy('createdAt', 'desc'), limit(3));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realListings = snapshot.docs.map(d => ({...d.data(), id: d.id}) as Listing);
      // Merge with demo listings if there are less than 3
      if (realListings.length < 3) {
        setFeatured([...realListings, ...demoListings.slice(realListings.length)]);
      } else {
        setFeatured(realListings);
      }
    }, (error: any) => {
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) return;
      console.warn("Featured listings error:", error);
    });
    return () => unsubscribe();
  }, []);
  
  const handleAction = () => {
    if (user) {
      setView('app');
    } else {
      setAuthMode('login');
      setView('auth');
    }
  };

  return (
    <section id="listings" className="py-12 sm:py-16 lg:py-20 bg-white transition-colors duration-300">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="text-center md:text-left mx-auto md:mx-0 max-w-xl">
            <span className="text-primary-600 text-xs font-black tracking-widest uppercase">Verified Showcase</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-1">Hand-picked premium spaces</h2>
            <p className="text-slate-500 text-sm sm:text-base font-light mt-3">Ready-inspected standard properties with actual location details.</p>
          </div>
          <button 
            onClick={handleAction} 
            className="flex items-center gap-2 font-bold text-primary-600 hover:text-primary-700 transition-all text-sm group"
          >
            View More Properties <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {featured.length > 0 ? (
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-8"
          >
            {featured.map((listing) => (
              <motion.div key={`featured-listing-${listing.id}`} variants={fadeUpVariant} className="flex w-full flex-col">
                <ListingCard 
                  listing={listing} 
                  onViewDetails={handleAction} 
                  hideHeart 
                  hideAgent
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-200">
             <p className="text-slate-500 font-medium">No verified spaces available right now. Check back soon!</p>
          </div>
        )}

      </div>
    </section>
  );
};

const HowItWorks = () => (
  <section id="how-it-works" className="py-12 sm:py-16 lg:py-20 bg-slate-50/50 transition-colors duration-300 relative overflow-hidden">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[140px] pointer-events-none" />
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={staggerContainer}
      className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
    >
      
      <motion.div variants={fadeUpVariant} className="text-center max-w-2xl mx-auto mb-12 space-y-4">
        <span className="text-primary-600 text-xs font-black tracking-widest uppercase">How It Works</span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Three steps to your new home</h2>
        <p className="text-slate-500 text-sm sm:text-base font-light">Skip the agent stress and rent directly from verified owners.</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto">
        {[
          { 
            step: "01", 
            icon: <Search className="w-6 h-6 text-primary-500" />, 
            title: "Find Your Spot", 
            desc: "Search for rooms or apartments near your school or workplace. We verify every listing so what you see is what you get." 
          },
          { 
            step: "02", 
            icon: <MessageSquare className="w-6 h-6 text-indigo-550" />, 
            title: "Book a Viewing", 
            desc: "Found a place you like? Chat directly with the owner to schedule a physical inspection without paying any form fees." 
          },
          { 
            step: "03", 
            icon: <Key className="w-6 h-6 text-emerald-600" />, 
            title: "Pay & Move In", 
            desc: "Sign your agreement and pay securely through our platform. No hidden agency fees, no sudden extra charges." 
          }
        ].map((item, idx) => (
          <motion.div variants={fadeUpVariant} key={`how-step-${idx}`} className="bg-white p-4 md:p-8 rounded-3xl border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 transition-all duration-300 shadow-sm flex flex-col items-start relative h-full">
            <span className="font-mono text-[56px] font-black text-slate-101 leading-none absolute top-4 right-6 pointer-events-none select-none">
              {item.step}
            </span>
            <div className="w-12 h-12 rounded-xl bg-slate-50/80 flex items-center justify-center border border-slate-205 mb-6 relative">
              {item.icon}
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2 leading-tight font-display">{item.title}</h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-light">{item.desc}</p>
          </motion.div>
        ))}
      </div>

    </motion.div>
  </section>
);

const TrustSafety = () => (
  <section id="security" className="py-12 sm:py-16 md:py-20 bg-white text-slate-900 relative overflow-hidden transition-colors duration-500 border-t border-slate-200">
    {/* Glow Layout */}
    <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px]" />
    </div>

    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={staggerContainer}
      className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"
    >
      <motion.div variants={fadeUpVariant}>
        <span className="text-emerald-650 bg-emerald-50 border border-emerald-105/60 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">100% Safe</span>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mt-4 mb-6 max-w-3xl mx-auto">
          Rent without the worry
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto mb-16 text-sm sm:text-base leading-relaxed font-light">
          We do the hard work of verifying properties and owners so you don't have to. DirectRent filters out fraud from the start.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
        {[
          { 
            icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />, 
            title: "Verified Owners Only", 
            desc: "Every landlord and agent goes through strict identity checks. No scammers, just real people with real properties." 
          },
          { 
            icon: <Clock className="w-6 h-6 text-primary-600" />, 
            title: "Real Properties", 
            desc: "We double-check every listing to make sure the apartment actually exists and looks exactly like the photos." 
          },
          { 
            icon: <MessageSquare className="w-6 h-6 text-indigo-600" />, 
            title: "Safe Payments", 
            desc: "All payments and chat messages happen safely on our platform, keeping your money and personal details fully protected." 
          }
        ].map((feature, i) => (
          <motion.div variants={fadeUpVariant} key={`trust-${i}`} className="bg-slate-50/80 border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 p-4 md:p-8 rounded-3xl hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 border border-slate-150">
              {feature.icon}
            </div>
            <h4 className="text-base font-bold mb-3 font-display text-slate-900">{feature.title}</h4>
            <p className="text-xs sm:text-sm text-slate-555 leading-relaxed font-light">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </section>
);

const Testimonials = () => (
  <section className="py-12 sm:py-16 md:py-20 bg-slate-50/35 text-slate-900 transition-colors duration-300 relative border-t border-slate-200">
    <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-[100px] pointer-events-none" />
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={staggerContainer}
      className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
    >
      
      <motion.div variants={fadeUpVariant} className="text-center max-w-2xl mx-auto mb-12 space-y-4">
        <span className="text-indigo-600 text-xs font-black tracking-widest uppercase">Verified Voices</span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">Our Community</h2>
        <p className="text-slate-500 text-sm sm:text-base font-light">From students hunting for campus flats to landlords securing great tenants.</p>
      </motion.div>

      <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-12 gap-4 md:gap-6 max-w-6xl mx-auto pb-8 md:pb-0 px-4 md:px-0 -mx-4 md:mx-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Large Review Card */}
        <motion.div variants={fadeUpVariant} className="w-[85vw] md:w-auto flex-shrink-0 snap-center md:col-span-8 bg-white p-4 lg:p-10 rounded-[2rem] border-[0.5px] border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="flex gap-1 mb-4 sm:mb-6 text-amber-400">
              {[1,2,3,4,5].map(star => <Sparkles key={star} className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />)}
            </div>
            <h3 className="text-lg sm:text-2xl font-display font-medium text-slate-800 leading-tight mb-4">
              "Finding a student apartment used to mean fighting with multiple agents and losing money on 'form fees'. DirectRent gave me direct contact with the owner. The photos actually matched reality."
            </h3>
          </div>
          <div className="flex items-center gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100">
            <div>
              <h5 className="font-bold text-slate-900 text-sm sm:text-base leading-none mb-1">Pelumi Adeyemi</h5>
              <p className="text-[10px] sm:text-xs text-primary-600 font-semibold tracking-wide">Final Year Student</p>
            </div>
          </div>
        </motion.div>

        {/* Square Right Card */}
        <motion.div variants={fadeUpVariant} className="w-[85vw] md:w-auto flex-shrink-0 snap-center md:col-span-4 bg-primary-600 p-4 md:p-8 rounded-[2rem] border border-primary-500 shadow-md hover:shadow-xl hover:scale-[1.02] transform transition-all duration-300 flex flex-col text-white">
          <div className="bg-primary-500/50 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h3 className="text-base sm:text-lg font-display text-primary-50 mb-auto leading-relaxed italic">
            "As a landlord, I was tired of agents hiking my rent prices to collect extra cuts, which chased good tenants away. Now I list my flats directly."
          </h3>
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-primary-500/50">
            <h5 className="font-bold text-white text-sm sm:text-base leading-none mb-1">Chief Okafor</h5>
            <p className="text-[10px] sm:text-xs text-primary-200 font-semibold tracking-wide">Property Owner</p>
          </div>
        </motion.div>

        {/* Bottom Left Card */}
        <motion.div variants={fadeUpVariant} className="w-[85vw] md:w-auto flex-shrink-0 snap-center md:col-span-4 bg-slate-900 p-4 md:p-8 rounded-[2rem] border border-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 flex flex-col text-slate-100">
          <div className="bg-slate-800 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
            <Handshake className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
          </div>
          <h3 className="text-base sm:text-lg font-display text-slate-300 mb-auto leading-relaxed">
            "I manage multiple hostels. Using the custom dashboard on DirectRent lets me verify a student's ID digitally before they even come for inspection."
          </h3>
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-800">
            <h5 className="font-bold text-white text-sm sm:text-base leading-none mb-1">Mrs. Bola</h5>
            <p className="text-[10px] sm:text-xs text-slate-400 font-semibold tracking-wide">Hostel Manager, LAUTECH Area</p>
          </div>
        </motion.div>

        {/* Bottom Right Card */}
        <motion.div variants={fadeUpVariant} className="w-[85vw] md:w-auto flex-shrink-0 snap-center md:col-span-8 bg-white p-4 lg:p-10 rounded-[2rem] border-[0.5px] border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex gap-1 mb-4 sm:mb-6 text-amber-400">
              {[1,2,3,4,5].map(star => <Sparkles key={star} className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />)}
            </div>
            <h3 className="text-lg sm:text-xl font-display font-medium text-slate-800 leading-relaxed mb-4">
              "We resumed for a new semester and had no idea how to get a place safely. A friend recommended DirectRent. Found an affordable self-contain online and paid the landlord straight. No drama."
            </h3>
          </div>
          <div className="flex items-center gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100">
            <div>
              <h5 className="font-bold text-slate-900 text-sm sm:text-base leading-none mb-1">Chidinma N.</h5>
              <p className="text-[10px] sm:text-xs text-primary-600 font-semibold tracking-wide">Student</p>
            </div>
          </div>
        </motion.div>
      </div>

    </motion.div>
  </section>
);

const FAQ = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    { 
      q: "I'm a student on a budget, are there affordable rooms?", 
      a: "Yes. DirectRent is specially designed for students and young professionals. You can filter for self-contains or hostels near your campus without paying any exorbitant 20% agency fees." 
    },
    { 
      q: "As a landlord, how am I protected from difficult tenants?", 
      a: "All tenants must pass our strict KYC (Know Your Customer) process, providing their government ID and BVN-verified details before they can message you. We verify them so you don't have to guess." 
    },
    { 
      q: "Do I have to pay an agent viewing form fee before seeing a property?", 
      a: "Absolutely not. DirectRent strictly prohibits viewing fees. You browse accurate properties with verified photos for free, and only spend money when you are ready to secure your space." 
    },
    { 
      q: "How does the rental payment structure work?", 
      a: "Once you inspect a property and approve it, you draft a digital agreement directly with the landlord on our app. Payments can be routed safely through our integrated escrow wallet until you confidently receive the keys." 
    },
    { 
      q: "Are the property images actually real or fake?", 
      a: "DirectRent enforces a stern visual policy. Landlords take live photos that are location-stamped by our system. If you spot a disparity during your physical visit, flag it, and we will take down the space." 
    }
  ];

  return (
    <section id="faq" className="py-12 sm:py-16 md:py-20 bg-slate-50/50 transition-colors duration-300">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="text-center mb-12 space-y-4">
          <span className="text-primary-600 text-xs font-black tracking-widest uppercase">FAQ Guides</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Got questions?</h2>
          <p className="text-slate-500 text-sm sm:text-base font-light">Transparent details about DirectRent's operations.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={`faq-${idx}`} className="bg-white rounded-2xl border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 overflow-hidden shadow-sm transition-all duration-300">
              <button 
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
              >
                <span className="font-bold text-xs sm:text-sm text-slate-900 pr-6 font-display hover:text-primary-600 transition-colors">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${openIdx === idx ? 'rotate-180 text-primary-500' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {openIdx === idx && (
                  <motion.div
                    key={`faq-ans-${idx}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-5 text-xs sm:text-sm text-slate-500 leading-relaxed font-light border-t border-slate-200 pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

const Founders = () => {
  return (
    <section className="py-16 md:py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-xs font-black tracking-widest uppercase mb-4"
          >
            <Users className="w-3.5 h-3.5" />
            <span>The Founders</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl md:text-5xl font-black text-slate-900 tracking-tight"
          >
            Built by <span className="text-primary-600">Engineers</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-slate-500 max-w-2xl mx-auto"
          >
            We got tired of the Nigerian housing crisis, exorbitant agent fees, and rampant scams. So we built DirectRent.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto border-t border-slate-100 pt-16">
          {/* Founder 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="group"
          >
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
              <div className="w-32 h-32 rounded-full bg-primary-100 shadow-[0_0_0_4px_white,0_10px_20px_-10px_rgba(0,0,0,0.15)] overflow-hidden shrink-0 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300">
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Ajala&backgroundColor=eef2ff`} alt="Ajala Peace" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-3 mt-2">
                <div>
                  <h3 className="font-display font-black text-2xl text-slate-900">Ajala Peace Olaoluwa</h3>
                  <p className="text-sm font-bold text-primary-600 uppercase tracking-wider mt-1">Co-Founder & Tech Lead</p>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                  Built the DirectRent mobile app from the ground up. Passionate about scalable systems and delightful user experiences.
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-4 pt-3">
                  <a href="#" className="text-slate-400 hover:text-primary-600 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href="#" className="text-slate-400 hover:text-primary-600 transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                  <a href="#" className="text-slate-400 hover:text-primary-600 transition-colors">
                    <XLogo className="w-[18px] h-[18px] ml-0.5" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Founder 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="group"
          >
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
              <div className="w-32 h-32 rounded-full bg-primary-100 shadow-[0_0_0_4px_white,0_10px_20px_-10px_rgba(0,0,0,0.15)] overflow-hidden shrink-0 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300">
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Adeyemi&backgroundColor=eef2ff`} alt="Adeyemi Akinyemi" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-3 mt-2">
                <div>
                  <h3 className="font-display font-black text-2xl text-slate-900">Adeyemi Akinyemi</h3>
                  <p className="text-sm font-bold text-primary-600 uppercase tracking-wider mt-1">Co-Founder & Product Lead</p>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                  Built the DirectRent web app. Bridging the gap between real estate pain points and elegant technical solutions.
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-4 pt-3">
                  <a href="#" className="text-slate-400 hover:text-primary-600 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href="#" className="text-slate-400 hover:text-primary-600 transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                  <a href="#" className="text-slate-400 hover:text-primary-600 transition-colors">
                    <XLogo className="w-[18px] h-[18px] ml-0.5" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Landing = () => {
  const { user, setView, setAuthMode } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    // Force light-mode state on the document element for the Landing page
    const root = window.document.documentElement;
    const wasDark = root.classList.contains('dark');
    if (wasDark) {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    return () => {
      // Re-apply correct user selected dark theme on unmount if it was dark
      if (theme === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        root.style.colorScheme = 'dark';
      }
    };
  }, [theme]);
  
  const handleAction = () => {
    if (user) {
      setView('app');
    } else {
      setAuthMode('login');
      setView('auth');
    }
  };

  return (
    <div className="min-h-screen selection:bg-primary-550/20 bg-white text-slate-900">
      <Helmet>
        <title>DirectRent | Premium Zero-Commission Rental Platform in Nigeria</title>
        <meta name="description" content="DirectRent connects tenants directly with verified landlords and developers in Nigeria. Real coordinates, zero agent tax, digital lease logs, and safe viewings." />
        <meta name="keywords" content="rent apartments Nigeria, student hostels Lagos, DirectRent, verified house rent Abuja, rent space Lagos, real estate Nigeria, find hostels UNILAG, UNILORIN, UI accommodation, fraud free rental portal" />
        <link rel="canonical" href="https://directrent.space" />
        <meta name="robots" content="index, follow" />
        <meta name="google-site-verification" content="gfloaJV0vGsUlpBVTMEETTTlkQm_bM2CK_Wg7yeuqzU" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://directrent.space" />
        <meta property="og:title" content="DirectRent | Premium Zero-Commission Rental Platform in Nigeria" />
        <meta property="og:description" content="Eliminating housing scams in Nigeria. Connect directly with thoroughly verified owners, view safe real estate listings, and secure your next home or host space without agent fees." />
        <meta property="og:image" content="https://directrent.space/og-cover.png" />
        <meta property="og:site_name" content="DirectRent" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://directrent.space" />
        <meta name="twitter:title" content="DirectRent | Verified Housing & Hostels in Nigeria" />
        <meta name="twitter:description" content="Ditch the bait-and-switch. DirectRent offers double-verified agent identities and AI-screened listings across major cities. Rent with confidence." />
        <meta name="twitter:image" content="https://directrent.space/og-cover.png" />

        {/* Google Structured Schema for Rich Snippets */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateAgent",
            "name": "DirectRent",
            "url": "https://directrent.space",
            "logo": "https://directrent.space/logo-light.png",
            "image": "https://directrent.space/og-cover.png",
            "description": "Premium rental marketplace in Nigeria featuring facial-recognition agent KYC, AI-audited property listings, and secure rent settlement.",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Lagos",
              "addressCountry": "NG"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": "6.5244",
              "longitude": "3.3792"
            },
            "sameAs": [
              "https://twitter.com/DirectRent",
              "https://github.com/DirectRent-Space"
            ]
          })}
        </script>
      </Helmet>
      
      <Navbar />
      
      <main className="overflow-hidden">
        <Hero />
        <CompareTraditional />
        <RoleSelection />
        <FeaturedListings />
        <HowItWorks />
        <TrustSafety />
        <Testimonials />
        <Founders />
        <FAQ />
        
        {/* Call to action section with highly stylistic visuals -- LIGHT DESIGN */}
        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="w-full max-w-6xl mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }} 
              whileInView={{ opacity: 1, scale: 1 }} 
              viewport={{ once: true }}
              transition={{ duration: 0.6 }} 
              className="bg-slate-50 border-[0.5px] border-slate-200 dark:border-[#0f172b] rounded-[2.5rem] p-4 md:p-8 lg:p-14 text-center relative overflow-hidden shadow-sm"
            >
              {/* Subtle back reflection glows */}
              <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-primary-500/5 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[90px] pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <span className="text-primary-600 bg-primary-50 border border-primary-100 px-3 py-1 rounded-full text-xs font-black tracking-widest font-mono">The Smart Choice</span>
                
                <h2 className="font-display text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-2xl mx-auto leading-tight">
                  Ready to secure your next home or student apartment?
                </h2>
                
                <p className="text-slate-555 text-sm sm:text-base max-w-md mx-auto leading-relaxed font-light">
                  Skip the fraud. Connect with verified landlords and trusted agents directly.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                  <button 
                    onClick={() => { setAuthMode('signup'); setView('auth'); }} 
                    className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-primary-500/15"
                  >
                    Create Free Account
                  </button>
                  <button 
                    onClick={handleAction} 
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-md"
                  >
                    Browse Properties
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Landing;
