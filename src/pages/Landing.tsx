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
  ChevronDown
} from 'lucide-react';
import Navbar from '../components/Navbar';
import ListingCard from '../components/ListingCard';
import Footer from '../components/Footer';
import { FEATURED_LISTINGS } from '../data';
import { useAuth } from '../context/AuthContext';
import SafeImage from '../components/SafeImage';
import CustomCursor from '../components/CustomCursor';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const Hero = () => {
  const { setView, user, setAuthMode } = useAuth();
  
  useEffect(() => {
    window.scrollTo(0, 0);
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
    <section className="relative pt-[64px] pb-16 lg:pt-24 lg:pb-32 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300" style={{paddingTop:100}}>
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-10 left-0 -translate-x-1/2 w-[300px] h-[300px] bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="w-full px-[15px] relative">
        <div className="max-w-3xl text-center md:text-left mx-auto md:mx-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-[10px] font-semibold uppercase tracking-wider mb-6 border border-primary-100/50 dark:border-primary-800/50">
              <Zap className="w-3 h-3 mr-1" /> Built for Nigerian Tenants
            </span>
            <h1 className="text-3xl lg:text-5xl font-display font-semibold text-slate-900 dark:text-white tracking-tight leading-[1.2] mb-6">
              Find rental housing across Nigeria <span className="text-primary-600 dark:text-primary-400 underline decoration-primary-100 dark:decoration-primary-900 underline-offset-8">without agent stress.</span>
            </h1>
            <p className="text-base lg:text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto md:mx-0">
              Verified premium listings in top student and residential hubs. Skip the multiple fees and fake agents. 
              Connect directly with trusted property owners and verified agents.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-2 p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none max-w-2xl mx-auto md:mx-0"
          >
            <div className="flex-1 flex items-center px-4 py-3 gap-3 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-800">
              <MapPin className="text-slate-400 dark:text-slate-600 w-5 h-5 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Where? (Yaba, Bodija, Gwarinpa...)" 
                className="bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 w-full font-medium"
              />
            </div>
            <div className="flex-1 flex items-center px-4 py-3 gap-3">
              <HomeIcon className="text-slate-400 dark:text-slate-600 w-5 h-5 flex-shrink-0" />
              <select className="bg-transparent border-none outline-none text-slate-900 dark:text-white font-medium w-full appearance-none">
                <option className="dark:bg-slate-900">Self-contain</option>
                <option className="dark:bg-slate-900">1 Bedroom</option>
                <option className="dark:bg-slate-900">Shared</option>
              </select>
            </div>
            <button 
              onClick={handleFind}
              className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-700 transition-all shadow-lg shadow-primary-200/50 dark:shadow-none"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Find a Place</span>
            </button>
          </motion.div>
          
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center md:justify-start">
            <div className="flex -space-x-3">
              {[
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
                "https://images.unsplash.com/photo-1567532939803-f4a1801c8763?auto=format&fit=crop&w=100&h=100&q=80",
                "https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&w=100&h=100&q=80"
              ].map((src, i) => (
                <SafeImage key={`img-${i}`} src={src} alt="Tenant" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 object-cover shadow-sm" />
              ))}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center sm:text-left">
              <span className="text-slate-900 dark:text-white font-bold">2,400+ tenants</span> <br className="sm:hidden" /> already found housing this semester.
            </p>
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
    <section className="py-24 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="w-full px-[15px]">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-display font-semibold text-slate-900 dark:text-white mb-4 tracking-tight">Choose your journey</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm lg:text-base">Get started with DirectRent today. Select how you want to interact with our platform.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div 
            whileHover={{ y: -10 }} 
            onClick={() => handleRoleSelection('tenant')}
            className="relative bg-white dark:bg-slate-950 p-8 rounded-3xl shadow-2xl shadow-primary-200/10 dark:shadow-none border-2 border-primary-500 overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded">Recommended</span>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-6"><Users className="text-primary-600 dark:text-primary-400 w-6 h-6" /></div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">I'm a Tenant</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Looking for a safe, verified apartment close to campus without the agent headache.</p>
            <ul className="space-y-4 mb-10">
              {["Find verified apartments", "Avoid scams & fake agents", "Direct contact with owners", "Quick search filters"].map((item, id) => (
                <li key={`tenant-${id}`} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="text-primary-600 dark:text-primary-500 w-4 h-4 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <button onClick={() => handleRoleSelection('tenant')} className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-primary-700 transition-all shadow-xl shadow-primary-200/50 dark:shadow-none">Start Searching</button>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5 }} 
            onClick={() => handleRoleSelection('agent')}
            className="bg-white dark:bg-slate-950 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-100/5 dark:shadow-none cursor-pointer"
          >
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center mb-6"><Handshake className="text-slate-600 dark:text-slate-400 w-6 h-6" /></div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">I'm an Agent</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Ready to list rental-friendly properties and reach thousands of verified tenant leads.</p>
            <ul className="space-y-4 mb-10">
              {["List properties quickly", "Reach verified tenants", "Faster deals & closings", "Identity verification"].map((item, id) => (
                <li key={`agent-${id}`} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="text-slate-400 dark:text-slate-600 w-4 h-4 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <button onClick={() => handleRoleSelection('agent')} className="w-full text-slate-900 dark:text-white font-semibold py-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">Become an Agent</button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ProblemSolution = () => (
  <section className="py-24 bg-white dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
    <div className="w-full px-[15px]">
      <div className="grid lg:grid-cols-2 gap-20 items-center">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="space-y-12"
        >
          <motion.h2 variants={fadeUpVariant} className="text-3xl lg:text-4xl font-display font-semibold text-slate-900 dark:text-white leading-tight tracking-tight">Tired of the typical <br className="hidden md:block" /> Nigerian housing stress?</motion.h2>
          <div className="space-y-10">
            <motion.div variants={fadeUpVariant} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-50 dark:bg-rose-900/20 text-red-500 dark:text-rose-400 flex items-center justify-center border border-red-100 dark:border-rose-900/50"><AlertCircle className="w-5 h-5" /></div>
              <div>
                <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Fake Listings & Scams</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic">"Pay first to see the house" is a red flag we help you avoid forever.</p>
              </div>
            </motion.div>
            <motion.div variants={fadeUpVariant} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-50 dark:bg-rose-900/20 text-red-500 dark:text-rose-400 flex items-center justify-center border border-red-100 dark:border-rose-900/50"><AlertCircle className="w-5 h-5" /></div>
              <div>
                <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Aggressive Agent Fees</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic">Paying for form, inspection, and high commissions sucks your pockets dry.</p>
              </div>
            </motion.div>
          </div>
          <motion.div variants={fadeUpVariant} className="pt-8 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-primary-50 dark:bg-primary-900/10 p-5 rounded-xl relative overflow-hidden border border-primary-100 dark:border-primary-900/30">
              <div className="relative z-10 flex items-center gap-4">
                <ShieldCheck className="w-8 h-8 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                <div>
                  <h5 className="font-semibold text-primary-900 dark:text-primary-100 text-sm">The DirectRent Difference</h5>
                  <p className="text-primary-700 dark:text-primary-400 text-xs">We verify every property and agent before they appear on your screen.</p>
                </div>
              </div>
              <div className="absolute top-0 right-0 scale-150 translate-x-12 -translate-y-12 opacity-10"><ShieldCheck className="w-20 h-20 text-primary-600 dark:text-primary-400" /></div>
            </div>
          </motion.div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <div className="z-10 grid grid-cols-2 gap-4">
            <div className="space-y-4 mt-12">
              <SafeImage src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&h=500&q=80" className="rounded-2xl shadow-lg border-4 border-white dark:border-slate-900" alt="Modern House" />
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xl flex items-center gap-3 border border-slate-100 dark:border-slate-800 transition-colors"><CheckCircle2 className="w-6 h-6 text-primary-600 dark:text-primary-500" /><span className="font-bold text-sm text-slate-900 dark:text-white">Verified Agents</span></div>
            </div>
            <div className="space-y-4">
              <div className="bg-primary-600 p-6 rounded-2xl text-white shadow-2xl shadow-primary-600/30 dark:shadow-none"><p className="text-2xl font-bold mb-1">100%</p><p className="text-xs font-medium uppercase tracking-widest opacity-80">Transparent Fees</p></div>
              <SafeImage src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&h=500&q=80" className="rounded-2xl shadow-lg border-4 border-white dark:border-slate-900" alt="Rental Apartment" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

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
    <section id="listings" className="py-24 lg:py-32 relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 -z-10" />
      <div className="w-full px-[15px]">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-xl text-center md:text-left mx-auto md:mx-0">
            <span className="inline-block text-primary-600 dark:text-primary-400 font-semibold text-xs uppercase tracking-widest mb-3">Verified Listings</span>
            <h2 className="text-3xl lg:text-4xl font-display font-semibold text-slate-900 dark:text-white mb-6 tracking-tight">Hand-picked for you</h2>
            <p className="text-slate-600 dark:text-slate-400 text-base lg:text-lg leading-relaxed">We've curated the most reliable rental apartments in Nigeria's top areas.</p>
          </div>
          <button onClick={handleAction} className="flex items-center gap-2 font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-all group text-sm mx-auto md:mx-0">
            See all listings <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <motion.div 
          initial="visible"
          whileInView="visible"
          viewport={{ once: true, margin: "0px" }}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {FEATURED_LISTINGS.slice(0, 3).map((listing, idx) => (
            <motion.div key={`featured-${listing.id}-${idx}`} variants={fadeUpVariant}>
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
  <section id="how-it-works" className="py-24 lg:py-32 bg-white dark:bg-slate-950 transition-colors duration-300">
    <div className="w-full px-[15px]">
      <div className="text-center mb-16">
        <h2 className="text-3xl lg:text-4xl font-display font-semibold text-slate-900 dark:text-white mb-4 tracking-tight">How it works</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-base">Simpler than the traditional, stressful way.</p>
      </div>
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="grid lg:grid-cols-2 gap-10 lg:gap-16"
      >
        <motion.div variants={fadeUpVariant} className="bg-primary-50 dark:bg-primary-900/10 p-8 lg:p-10 rounded-2xl border border-primary-100 dark:border-primary-900/30">
          <h3 className="text-xl font-semibold text-primary-950 dark:text-primary-100 mb-8 flex items-center gap-3"><Users className="w-5 h-5 text-primary-600 dark:text-primary-400" /> For Tenants</h3>
          <div className="space-y-10">
            {[
              { step: "01", title: "Search nearby apartments", desc: "Use filters to find housing near your desired location." },
              { step: "02", title: "View verified listings", desc: "No more guesswork. Photos and descriptions are verified." },
              { step: "03", title: "Contact agent directly", desc: "Zero middleman drama. Pay securely and move in." }
            ].map((item, idx) => (
              <div key={`tenant-step-${idx}`} className="flex gap-6">
                <div className="text-3xl font-bold text-primary-200 dark:text-primary-800/20 leading-none">{item.step}</div>
                <div>
                  <h4 className="font-semibold text-primary-950 dark:text-primary-100 mb-1">{item.title}</h4>
                  <p className="text-primary-800/70 dark:text-primary-400/80 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div variants={fadeUpVariant} className="bg-slate-50 dark:bg-slate-900 p-8 lg:p-10 rounded-2xl border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-8 flex items-center gap-3"><Handshake className="w-5 h-5 text-slate-400 dark:text-slate-600" /> For Agents</h3>
          <div className="space-y-10">
            {[
              { step: "01", title: "List your property", desc: "Upload photos and property details in less than 2 minutes." },
              { step: "02", title: "Get tenant leads", desc: "Get notified when verified tenants show interest." },
              { step: "03", title: "Close deals faster", desc: "Finalize paper work and get paid quicker than ever." }
            ].map((item, idx) => (
              <div key={`agent-step-${idx}`} className="flex gap-6">
                <div className="text-3xl font-bold text-slate-200 dark:text-slate-800/20 leading-none">{item.step}</div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{item.title}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

const TrustSafety = () => (
  <section id="security" className="py-24 bg-primary-600 dark:bg-primary-900 relative overflow-hidden transition-colors duration-500">
    <div className="absolute top-0 right-0 p-20 opacity-10"><ShieldCheck className="w-64 h-64 text-white" /></div>
    <div className="w-full px-[15px] relative z-10 text-white text-center">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-3xl lg:text-4xl font-display font-semibold mb-6 tracking-tight"
      >
        Your safety is our #1 priority
      </motion.h2>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-primary-100 dark:text-primary-200 max-w-xl mx-auto mb-16 text-base lg:text-lg opacity-90 leading-relaxed"
      >
        We've built DirectRent to eliminate the risks of finding housing in Nigeria.
      </motion.p>
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="grid md:grid-cols-3 gap-8 text-left"
      >
        {[
          { icon: <ShieldCheck className="w-6 h-6" />, title: "Verified Agents", desc: "Every agent must provide valid ID and proof of listed properties." },
          { icon: <Clock className="w-6 h-6" />, title: "Physical Inspection", desc: "Our team physically inspects random top-tier properties to ensure accuracy." },
          { icon: <MessageSquare className="w-6 h-6" />, title: "Secure Communication", desc: "Chat with agents directly within the platform to keep your details safe." }
        ].map((feature, idx) => (
          <motion.div key={`feature-${idx}`} variants={fadeUpVariant} className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 hover:bg-white/15 transition-colors">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">{feature.icon}</div>
            <h4 className="text-lg font-semibold mb-3">{feature.title}</h4>
            <p className="text-primary-50 text-xs leading-relaxed opacity-80">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

const Testimonials = () => (
  <section className="py-24 lg:py-32 bg-white dark:bg-slate-950 transition-colors duration-300">
    <div className="w-full px-[15px]">
      <div className="text-center mb-16">
        <h2 className="text-3xl lg:text-4xl font-display font-semibold text-slate-900 dark:text-white mb-4 tracking-tight">Loved by tenants</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-base">Real stories from tenants who skipped the stress.</p>
      </div>
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="grid md:grid-cols-3 gap-8"
      >
        {[
          { name: "Tunde A.", dept: "Lagos", text: "I found a neat self-contain in Yaba the next day. The process was surprisingly smooth compared to what I expected.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80" },
          { name: "Bisi O.", dept: "Ibadan", text: "DirectRent helped me find a landlord listing directly. Saved me nearly 80k in random agent fees!", avatar: "https://images.unsplash.com/photo-1567532939803-f4a1801c8763?auto=format&fit=crop&w=100&h=100&q=80" },
          { name: "Sola W.", dept: "Abuja", text: "The verified badge gave me confidence. Moving in next week and I didn't have to chase any shady agents.", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&w=100&h=100&q=80" }
        ].map((test, idx) => (
          <motion.div key={`test-${idx}`} variants={fadeUpVariant} className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-lg dark:hover:shadow-none transition-all">
            <p className="text-slate-600 dark:text-slate-300 text-sm italic leading-relaxed mb-8">"{test.text}"</p>
            <div className="flex items-center gap-4">
              <SafeImage src={test.avatar} className="w-10 h-10 rounded-full border-2 border-primary-100 dark:border-primary-900" alt={test.name} />
              <div>
                <h5 className="font-semibold text-slate-900 dark:text-white text-sm">{test.name}</h5>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">{test.dept}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

const FAQ = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    { 
      q: "Are the properties really verified?", 
      a: "Yes. Every property listed by an agent undergoes our verification process. We ensure agents have valid ID and proof of authorized listing before they can post." 
    },
    { 
      q: "Do I pay agent or inspection fees?", 
      a: "It depends on the property. We encourage 'Direct' listings with no arbitrary inspection fees. Any required agency or legal fees are clearly displayed upfront before you contact the agent." 
    },
    { 
      q: "How do I secure an apartment I like?", 
      a: "Once you find a place, you can chat with the verified agent directly on DirectRent to schedule a viewing and securely finalize the paperwork." 
    },
    { 
      q: "Can I list my own property if I'm not an agent?", 
      a: "Absolutely! Property owners can sign up as an 'Agent' (Landlord) to list their apartments directly to tenants." 
    },
    { 
      q: "Is DirectRent available in my city?", 
      a: "We are rapidly expanding across major Nigerian cities including Lagos, Abuja, Ibadan, and Port Harcourt. Our listings are updated daily as more agents join." 
    }
  ];

  return (
    <section className="py-24 lg:py-32 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="w-full px-[15px]">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-display font-semibold text-slate-900 dark:text-white mb-4 tracking-tight">Got questions?</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-base">We've got answers to help you understand how DirectRent works.</p>
        </div>
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="space-y-4"
        >
          {faqs.map((faq, idx) => (
            <motion.div key={`faq-${idx}`} variants={fadeUpVariant} className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <button 
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full text-left px-6 py-6 flex items-center justify-between focus:outline-none"
              >
                <span className="font-semibold text-slate-900 dark:text-white pr-8">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-300 flex-shrink-0 ${openIdx === idx ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openIdx === idx && (
                  <motion.div
                    key={`faq-ans-${idx}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 pt-0 text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-50 dark:border-slate-800/50 mt-2">
                      <div className="pt-4">{faq.a}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const Landing = () => {
  const { user, setView, setAuthMode } = useAuth();
  
  const handleAction = () => {
    if (user) {
      setView('app');
    } else {
      setAuthMode('login');
      setView('auth');
    }
  };

  return (
    <div className="min-h-screen selection:bg-primary-100 dark:selection:bg-primary-900 selection:text-primary-900 dark:selection:text-primary-100 transition-colors duration-300 custom-cursor-area">
      <Helmet>
        <title>DirectRent | Find Verified Apartments & Student Hostels in Nigeria</title>
        <meta name="description" content="DirectRent is Nigeria's most trusted real estate platform for students and professionals. Find verified self-contains, flats, and office spaces without agent stress." />
        <link rel="canonical" href="https://directrent.com.ng/" />
      </Helmet>
      <CustomCursor />
      <Navbar />
      <main>
        <Hero />
        <RoleSelection />
        <ProblemSolution />
        <FeaturedListings />
        <HowItWorks />
        <TrustSafety />
        <Testimonials />
        <FAQ />
        
        <section className="py-24 bg-white dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
          <div className="w-full px-[15px]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              whileInView={{ opacity: 1, scale: 1 }} 
              viewport={{ once: true }}
              transition={{ duration: 0.6 }} 
              className="bg-slate-900 dark:bg-slate-925 rounded-[32px] p-12 lg:p-24 text-center relative overflow-hidden shadow-2xl shadow-slate-950/20 dark:shadow-none border border-slate-800"
            >
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10">
                <h2 className="text-3xl lg:text-5xl font-display font-semibold text-white mb-6 tracking-tight">Ready to find your <br className="hidden md:block" /> next rental home?</h2>
                <p className="text-slate-400 text-base lg:text-lg mb-10 max-w-xl mx-auto opacity-80 leading-relaxed">Join thousands of Nigerian tenants today and secure your housing with peace of mind.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button onClick={() => { setAuthMode('signup'); setView('auth'); }} className="bg-primary-600 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20 active:scale-95">Get Started for Free</button>
                  <button onClick={handleAction} className="bg-white/10 text-white backdrop-blur-md px-8 py-4 rounded-xl font-bold text-sm hover:bg-white/20 transition-all border border-white/20 active:scale-95">Browse All Listings</button>
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
