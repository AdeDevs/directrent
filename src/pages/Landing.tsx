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
  Coins
} from 'lucide-react';
import Navbar from '../components/Navbar';
import ListingCard from '../components/ListingCard';
import Footer from '../components/Footer';
import { FEATURED_LISTINGS } from '../data';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import SafeImage from '../components/SafeImage';
import CustomCursor from '../components/CustomCursor';

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
    <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 overflow-hidden bg-slate-50/50 text-slate-900 transition-colors duration-300">
      {/* Editorial Mesh Grid & Radial Soft Glows */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] opacity-30" />
        <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-primary-500/10 to-transparent" />
        <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[600px] h-[400px] bg-indigo-500/5 rounded-full blur-[140px] opacity-60 pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary-600/5 rounded-full blur-[120px] opacity-40 pointer-events-none" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-medium text-slate-700"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              <span>DirectRent is LIVE across Nigeria</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-slate-900"
            >
              Find rental homes <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-indigo-600 to-indigo-500">
                without agent stress.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-slate-600 font-sans text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-light"
            >
              Verified properties listed directly by landlords and trusted developers. Take a walk through virtual maps, escape ridiculous double fees, and secure tenancy in minutes.
            </motion.p>

            {/* Premium Floated Light search bar */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="p-2.5 bg-white border border-slate-200/80 shadow-xl shadow-slate-150/40 rounded-2xl sm:rounded-3xl max-w-2xl mx-auto lg:mx-0 flex flex-col sm:flex-row gap-2"
            >
              <div className="flex-1 flex items-center px-4 py-3 gap-3 border-b sm:border-b-0 sm:border-r border-slate-150">
                <MapPin className="text-primary-500 w-5 h-5 flex-shrink-0" />
                <div className="w-full text-left">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Location</label>
                  <input 
                    type="text"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    placeholder={`e.g. ${typedPlaceholder}`} 
                    className="bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 w-full font-semibold text-sm focus:ring-0 p-0 mt-0.5"
                  />
                </div>
              </div>

              <div className="flex-1 flex items-center px-4 py-3 gap-3">
                <HomeIcon className="text-indigo-500 w-5 h-5 flex-shrink-0" />
                <div className="w-full text-left">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Housing Type</label>
                  <select 
                    value={selectedType} 
                    onChange={(e) => setSelectedType(e.target.value)} 
                    className="bg-transparent border-none outline-none text-slate-900 font-semibold text-sm w-full appearance-none focus:ring-0 p-0 mt-0.5 cursor-pointer"
                  >
                    <option className="bg-white text-slate-900" value="Self-contain">Self-contain</option>
                    <option className="bg-white text-slate-900" value="1 Bedroom Flat">1 Bedroom Flat</option>
                    <option className="bg-white text-slate-900" value="Studio">Studio / Flatlet</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleFind}
                className="bg-primary-600 hover:bg-primary-700 text-white px-7 py-3.5 sm:py-0 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/10 hover:scale-[1.02] active:scale-95 duration-205 shrink-0"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span className="text-sm">Explore Map</span>
              </button>
            </motion.div>

            {/* Tenant social validation icons */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="pt-6 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start"
            >
              <div className="flex -space-x-3">
                {[
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80"
                ].map((src, i) => (
                  <SafeImage key={`val-avatar-${i}`} src={src} alt="Verified User" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-md" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 text-center lg:text-left">
                Join <span className="text-slate-905 font-bold">2,500+ satisfied young professionals</span> who skipped shady commissions.
              </p>
            </motion.div>
          </div>

          {/* Hero Right Visuals: Premium Light Dashboard Preview */}
          <div className="lg:col-span-5 relative hidden lg:block select-none pointer-events-none">
            {/* Ambient Highlight */}
            <div className="absolute inset-0 bg-primary-500/5 rounded-[32px] blur-3xl transform rotate-3" />
            
            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative bg-white border border-slate-250 rounded-3xl p-6 shadow-xl skew-y-1 transform hover:skew-y-0 transition-transform duration-500"
            >
              {/* Header bar */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-450" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-450" />
                  <span className="text-[10px] text-slate-400 font-mono ml-2">directrent.nig/app_preview</span>
                </div>
                <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Verified Data
                </span>
              </div>

              {/* Fake Interactive map widget */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 relative overflow-hidden h-[240px] flex flex-col justify-end">
                {/* Background mini-mesh simulating map styling */}
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:1rem_1rem] opacity-50" />
                
                {/* Simulated Floating Markers */}
                <div className="absolute top-[25%] left-[30%] bg-primary-600 text-white px-2 py-1 rounded-lg text-[10px] font-black border border-white shadow-md flex items-center gap-1">
                  <Building2 className="w-2.5 h-2.5" /> ₦850k/yr
                </div>
                <div className="absolute top-[45%] right-[20%] bg-indigo-600 text-white px-2 py-1 rounded-lg text-[10px] font-black border border-white shadow-md flex items-center gap-1">
                  <HomeIcon className="w-2.5 h-2.5" /> ₦1.2M/yr
                </div>
                
                {/* Map HUD Control Mock */}
                <div className="absolute top-2 right-2 bg-white border border-slate-300 p-1.5 rounded-lg flex flex-col gap-1 shadow-sm">
                  <div className="w-4 h-4 rounded bg-slate-100 text-[10px] font-extrabold flex items-center justify-center text-slate-700">+</div>
                  <div className="w-4 h-4 rounded bg-slate-100 text-[10px] font-extrabold flex items-center justify-center text-slate-700">-</div>
                  <div className="w-4 h-4 rounded bg-slate-50 text-[9px] font-extrabold flex items-center justify-center text-primary-600">3D</div>
                </div>

                {/* Listing quick snapshot card inside preview */}
                <div className="relative z-10 bg-white border border-slate-250 p-3 rounded-xl flex items-center gap-3 shadow-lg">
                  <SafeImage 
                    src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=120&h=120&q=80" 
                    alt="Property Preview" 
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Yaba, Lagos</p>
                    <h5 className="text-xs font-bold text-slate-900 truncate">Premium Cozy Studio</h5>
                    <p className="text-xs text-primary-600 font-extrabold mt-1">₦850,000 / year</p>
                  </div>
                  <div className="p-1 px-2 rounded-md bg-emerald-50 text-emerald-600 text-[9px] font-bold border border-emerald-100">
                    No Fee
                  </div>
                </div>
              </div>

              {/* Metrics strip beneath panel */}
              <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-205">
                  <span className="block text-xl font-black text-slate-900 font-mono">0%</span>
                  <span className="text-[9px] text-slate-550 uppercase tracking-wider font-semibold">Agent Fee</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-205">
                  <span className="block text-xl font-black text-primary-600 font-mono">100%</span>
                  <span className="text-[9px] text-slate-550 uppercase tracking-wider font-semibold">Verified</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-205">
                  <span className="block text-xl font-black text-indigo-600 font-mono">Direct</span>
                  <span className="text-[9px] text-slate-550 uppercase tracking-wider font-semibold">Contract</span>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

{/* Value Comparative Metrics - Eliminates Boring Info, Increases Trust */}
const CompareTraditional = () => {
  return (
    <section className="py-24 bg-white text-slate-900 transition-colors duration-300 relative border-y border-slate-200">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-primary-600 text-xs font-black tracking-widest uppercase">The Honest Reality</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Traditional Housing vs DirectRent
          </h2>
          <p className="text-slate-555 text-sm sm:text-base font-light">
            We put the power back in your hands. No tricks, no ridiculous middleman tax, just plain transparency.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {/* Traditional Old-school block */}
          <div className="bg-slate-50/75 rounded-3xl p-8 border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-850 transition-all duration-300 relative overflow-hidden">
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
                  <strong className="text-slate-800">Payment for Inspections:</strong>
                  <p className="text-xs text-slate-450 mt-0.5">Shady agents ask for "inspections form charges" just to show you locked gates.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-rose-100">✕</span>
                <div>
                  <strong className="text-slate-800">10% Agency & 10% Legal Tax:</strong>
                  <p className="text-xs text-slate-450 mt-0.5">Paying separate 20%+ commission on top of listed rent value directly to middle-men.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-rose-100">✕</span>
                <div>
                  <strong className="text-slate-800">Fake photos & Double-Letting:</strong>
                  <p className="text-xs text-slate-450 mt-0.5">Scanners advertising buildings they don't own, collecting multiple deposits and disappearing.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* New Modern DirectRent block */}
          <div className="bg-primary-50/50 rounded-3xl p-8 border-[0.5px] border-primary-200/60 dark:border-[#0f172b] hover:border-primary-300 dark:hover:border-slate-850 transition-all duration-300 relative overflow-hidden shadow-md shadow-primary-500/5">
            <div className="absolute top-0 right-0 py-3 px-5 bg-emerald-50 text-emerald-600 border-l border-b border-emerald-100 text-[10px] font-black uppercase tracking-wider rounded-bl-2xl">
              Frictionless Path
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white border border-primary-200 text-primary-600 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className="text-lg font-bold mb-6 font-display text-primary-950">The DirectRent Standard</h3>
            
            <ul className="space-y-4 text-xs sm:text-sm text-slate-800">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-emerald-100">✓</span>
                <div>
                  <strong className="text-primary-950">Zero Inspection Form Fees:</strong>
                  <p className="text-slate-600 text-xs mt-0.5">Browse through actual maps, coordinates, and clear 3D photo listings completely free.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-emerald-100">✓</span>
                <div>
                  <strong className="text-primary-950">Upfront Standard Fees only:</strong>
                  <p className="text-slate-600 text-xs mt-0.5">Any necessary charges are explicitly documented so you calculate total expenses before moving.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs border border-emerald-100">✓</span>
                <div>
                  <strong className="text-primary-950">Landlord & Dev Verification logs:</strong>
                  <p className="text-slate-600 text-xs mt-0.5">Every account lists properties checking coordinates, building papers, and owner credentials first.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

      </div>
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
    <section className="py-24 bg-slate-50/50 transition-colors duration-300 relative">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-indigo-600 text-xs font-black tracking-widest uppercase">Platform Portals</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Choose your path</h2>
          <p className="text-slate-500 text-sm sm:text-base font-light">Whether you are trying to nest or looking to host, get started with premium tools.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Tenant block */}
          <motion.div 
            whileHover={{ y: -6 }} 
            onClick={() => handleRoleSelection('tenant')}
            className="group relative bg-white p-8 rounded-[2rem] shadow-sm border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 cursor-pointer transition-all duration-300 hover:shadow-md"
          >
            <div className="absolute top-6 right-6">
              <span className="bg-primary-50 text-primary-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-primary-100">Tenant Portal</span>
            </div>
            <div className="w-14 h-14 bg-primary-50 text-primary-500 rounded-2xl flex items-center justify-center mb-8 border border-primary-100 group-hover:scale-105 transition-transform">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">I want a rental home</h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-8 leading-relaxed font-light">Looking for a verified flat of studio-apartment with straightforward contracts.</p>
            
            <ul className="space-y-4 mb-10 text-xs sm:text-sm text-slate-600">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary-500 w-4 h-4 flex-shrink-0" /> Search using custom geographic interactive maps.
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary-500 w-4 h-4 flex-shrink-0" /> Zero fake listings from unregistered roadside touts.
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-primary-500 w-4 h-4 flex-shrink-0" /> Direct landlord contract terms and simple payment rules.
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
            className="group relative bg-white p-8 rounded-[2rem] shadow-sm border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 cursor-pointer transition-all duration-300 hover:shadow-md"
          >
            <div className="absolute top-6 right-6">
              <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-100">Listing Portal</span>
            </div>
            <div className="w-14 h-14 bg-indigo-50 text-indigo-505 rounded-2xl flex items-center justify-center mb-8 border border-indigo-100 group-hover:scale-105 transition-transform">
              <Handshake className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">I'm a landlord / developer</h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-8 leading-relaxed font-light">Upload real estate listings, filter tenant leads, and draft instant digitized paperwork.</p>
            
            <ul className="space-y-4 mb-10 text-xs sm:text-sm text-slate-600">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-indigo-505 w-4 h-4 flex-shrink-0" /> Instant verification to get your custom badge.
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-indigo-520 w-4 h-4 flex-shrink-0" /> Safe identity validation to shield deals from scammers.
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-indigo-520 w-4 h-4 flex-shrink-0" /> Receive qualified leads ready to view and pay.
              </li>
            </ul>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/10">
              Register Portfolio
            </button>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

const FeaturedListings = () => {
  const { setView, user, setAuthMode } = useAuth();
  
  const handleAction = () => {
    if (user) {
      setView('app');
    } else {
      setAuthMode('login');
      setView('auth');
    }
  };

  return (
    <section id="listings" className="py-24 lg:py-32 bg-white transition-colors duration-300">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="text-center md:text-left mx-auto md:mx-0 max-w-xl">
            <span className="text-primary-600 text-xs font-black tracking-widest uppercase">Verified Showcase</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-1">Hand-picked premium listings</h2>
            <p className="text-slate-500 text-sm sm:text-base font-light mt-3">Ready-inspected standard properties with actual map reference markers.</p>
          </div>
          <button 
            onClick={handleAction} 
            className="flex items-center gap-2 font-bold text-primary-600 hover:text-primary-700 transition-all text-sm group"
          >
            Explore live interactive map <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-8"
        >
          {FEATURED_LISTINGS.slice(0, 3).map((listing) => (
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

      </div>
    </section>
  );
};

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 lg:py-32 bg-slate-50/50 transition-colors duration-300 relative overflow-hidden">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[140px] pointer-events-none" />
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <span className="text-primary-600 text-xs font-black tracking-widest uppercase">Process Engine</span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Three steps to your keys</h2>
        <p className="text-slate-500 text-sm sm:text-base font-light">Eradicating inspections taxes and long protocols.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto">
        {[
          { 
            step: "01", 
            icon: <Search className="w-6 h-6 text-primary-500" />, 
            title: "Simulate & Locate", 
            desc: "Browse through verified geographical lists using real interactive map parameters filtered by location or budget." 
          },
          { 
            step: "02", 
            icon: <MessageSquare className="w-6 h-6 text-indigo-550" />, 
            title: "Verify & Converse", 
            desc: "View clear verified structural documents, click to initiate secured messaging requests, and chat directly with property hosts." 
          },
          { 
            step: "03", 
            icon: <Key className="w-6 h-6 text-emerald-600" />, 
            title: "Approve & Nest", 
            desc: "Review clear in-app lease drafts with flat rates, proceed to close the contract safely, and grab your residential keys." 
          }
        ].map((item, idx) => (
          <div key={`how-step-${idx}`} className="bg-white p-8 rounded-3xl border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 transition-all duration-300 shadow-sm flex flex-col items-start relative h-full">
            <span className="font-mono text-[56px] font-black text-slate-101 leading-none absolute top-4 right-6 pointer-events-none select-none">
              {item.step}
            </span>
            <div className="w-12 h-12 rounded-xl bg-slate-50/80 flex items-center justify-center border border-slate-205 mb-6 relative">
              {item.icon}
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2 leading-tight font-display">{item.title}</h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-light">{item.desc}</p>
          </div>
        ))}
      </div>

    </div>
  </section>
);

const TrustSafety = () => (
  <section id="security" className="py-24 bg-white text-slate-900 relative overflow-hidden transition-colors duration-500 border-t border-slate-200">
    {/* Glow Layout */}
    <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px]" />
    </div>

    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
      <span className="text-emerald-650 bg-emerald-50 border border-emerald-105/60 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">High Credential Checks</span>
      <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mt-4 mb-6 max-w-3xl mx-auto">
        Your security is our absolute blueprint
      </h2>
      <p className="text-slate-500 max-w-xl mx-auto mb-16 text-sm sm:text-base leading-relaxed font-light">
        We understand the dynamic risks underlying Nigerian housing. DirectRent filters out fraud from the baseline up.
      </p>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
        {[
          { 
            icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />, 
            title: "KYC Registered Landlords", 
            desc: "Property managers and hosts must provide official government identity data and verified coordinates to curb fraud." 
          },
          { 
            icon: <Clock className="w-6 h-6 text-primary-600" />, 
            title: "Physical Auditing Teams", 
            desc: "DirectRent team members inspect real conditions of listings consistently to guarantee precise match representations." 
          },
          { 
            icon: <MessageSquare className="w-6 h-6 text-indigo-600" />, 
            title: "Encrypted Deal Logs", 
            desc: "Conversations and contract logs are recorded directly in-platform to protect users from unsafe physical protocols." 
          }
        ].map((feature, i) => (
          <div key={`trust-${i}`} className="bg-slate-50/80 border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 p-8 rounded-3xl hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 border border-slate-150">
              {feature.icon}
            </div>
            <h4 className="text-base font-bold mb-3 font-display text-slate-900">{feature.title}</h4>
            <p className="text-xs sm:text-sm text-slate-555 leading-relaxed font-light">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Testimonials = () => (
  <section className="py-24 bg-slate-50/35 text-slate-900 transition-colors duration-300 relative border-t border-slate-200">
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <span className="text-indigo-600 text-xs font-black tracking-widest uppercase">Verified Backings</span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">Stories from DirectRent tenants</h2>
        <p className="text-slate-500 text-sm sm:text-base font-light">Zero agent inspections, actual real-world experiences.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {[
          { 
            name: "Tunde Akinyemi", 
            dept: "Lagos, Nigeria", 
            text: "Searching for student hosting around Yaba of Unilag can drive you crazy. DirectRent map views saved me. Clicked a listing, verified credentials, and got in. Simple.", 
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80" 
          },
          { 
            name: "Bisi Olaseinde", 
            dept: "Ibadan, Oyo", 
            text: "Skipped random form fees completely. I saved nearly ₦120k on administrative agent commissions for my flat near Bodija. Highly recommended platform.", 
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80" 
          },
          { 
            name: "Sola W.", 
            dept: "Gwarinpa, Abuja", 
            text: "No shady agency agents chasing your pockets. Flat details are listed upfront, and communication with owners is completely transparent. Verified seals actually mean business.", 
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80" 
          }
        ].map((test, index) => (
          <div key={`testimonial-${index}`} className="bg-white p-8 rounded-3xl border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 flex flex-col justify-between h-full hover:shadow-md transition-all duration-300">
            <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed mb-6 font-light">
              "{test.text}"
            </p>
            <div className="flex items-center gap-4 border-t border-slate-200 pt-4 mt-auto">
              <SafeImage src={test.avatar} className="w-11 h-11 rounded-full border border-slate-200 object-cover shadow-sm" alt={test.name} />
              <div>
                <h5 className="font-bold text-slate-900 text-xs sm:text-sm font-display leading-none mb-1">{test.name}</h5>
                <p className="text-[10px] text-slate-450 font-mono tracking-wider font-semibold uppercase">{test.dept}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  </section>
);

const FAQ = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    { 
      q: "Are the properties really verified?", 
      a: "Yes. Every listing represented on the DirectRent map undergoes severe verification procedures. Hosts must pass automated identity checks and must produce accurate lease documents or verified building parameters." 
    },
    { 
      q: "Do I have to pay agent viewing fees?", 
      a: "Absolutely not. One of our structural rules is zero inspection viewing charges. You browse coordinate parameters for free and coordinate open listings cleanly in real-time." 
    },
    { 
      q: "How do I secure dynamic properties?", 
      a: "Simply browse through our interface details, select verified options, click to initiate secured messaging chat requests, and draft real coordinate viewing plans or lease contracts directly with landlords." 
    },
    { 
      q: "Can I manage real estate assets directly as a listing owner?", 
      a: "Yes. DirectRent offers robust portals. You register as an Agent specifying landlord credentials, upload structural assets quickly, and manage qualified client requests comfortably." 
    }
  ];

  return (
    <section className="py-24 bg-slate-50/50 transition-colors duration-300">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="text-center mb-16 space-y-4">
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
    <div className="min-h-screen selection:bg-primary-550/20 bg-white text-slate-900 custom-cursor-area">
      <Helmet>
        <title>DirectRent | Premium Zero-Commission Rental Platform in Nigeria</title>
        <meta name="description" content="DirectRent connects tenants directly with verified landlords and developers in Nigeria. Real coordinates, zero agent tax, digital lease logs, and safe viewings." />
      </Helmet>
      
      <CustomCursor />
      <Navbar />
      
      <main className="overflow-hidden">
        <Hero />
        <CompareTraditional />
        <RoleSelection />
        <FeaturedListings />
        <HowItWorks />
        <TrustSafety />
        <Testimonials />
        <FAQ />
        
        {/* Call to action section with highly stylistic visuals -- LIGHT DESIGN */}
        <section className="py-24 bg-white">
          <div className="w-full max-w-6xl mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }} 
              whileInView={{ opacity: 1, scale: 1 }} 
              viewport={{ once: true }}
              transition={{ duration: 0.6 }} 
              className="bg-slate-50 border-[0.5px] border-slate-200 dark:border-[#0f172b] rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-sm"
            >
              {/* Subtle back reflection glows */}
              <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-primary-500/5 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[90px] pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <span className="text-primary-600 bg-primary-50 border border-primary-100 px-3 py-1 rounded-full text-xs font-black tracking-widest font-mono">Instant Search App</span>
                
                <h2 className="font-display text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-2xl mx-auto leading-tight">
                  Ready to secure your next premium rental place?
                </h2>
                
                <p className="text-slate-555 text-sm sm:text-base max-w-md mx-auto leading-relaxed font-light">
                  Skip the middleman. Engage verified landlords and move with supreme authority.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                  <button 
                    onClick={() => { setAuthMode('signup'); setView('auth'); }} 
                    className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-primary-500/15"
                  >
                    Register Free Account
                  </button>
                  <button 
                    onClick={handleAction} 
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-md"
                  >
                    Launch Interactive Map
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
