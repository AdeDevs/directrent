import React from 'react';
import { motion } from 'motion/react';
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
  ArrowRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import ListingCard from '../components/ListingCard';
import Footer from '../components/Footer';
import { FEATURED_LISTINGS } from '../data';
import { useAuth } from '../context/AuthContext';

const Hero = () => {
  const { setView, user, setAuthMode } = useAuth();
  
  const handleFind = () => {
    if (user) {
      setView('app');
    } else {
      setAuthMode('login');
      setView('auth');
    }
  };

  return (
    <section className="relative pt-24 pb-16 lg:pt-40 lg:pb-32 overflow-hidden bg-white">
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-10 left-0 -translate-x-1/2 w-[300px] h-[300px] bg-primary-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl text-center md:text-left mx-auto md:mx-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-[10px] font-semibold uppercase tracking-wider mb-6">
              <Zap className="w-3 h-3 mr-1" /> Built for Nigerian Tenants
            </span>
            <h1 className="text-3xl lg:text-5xl font-semibold text-slate-900 tracking-tight leading-[1.2] mb-6">
              Find rental housing across Nigeria <span className="text-primary-600 underline decoration-primary-100 underline-offset-8">without agent stress.</span>
            </h1>
            <p className="text-base lg:text-lg text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto md:mx-0">
              Verified premium listings in top student and residential hubs. Skip the multiple fees and fake agents. 
              Connect directly with trusted property owners and verified agents.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-2 p-2 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 max-w-2xl mx-auto md:mx-0"
          >
            <div className="flex-1 flex items-center px-4 py-3 gap-3 border-b sm:border-b-0 sm:border-r border-slate-100">
              <MapPin className="text-slate-400 w-5 h-5 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Where? (Yaba, Bodija, Gwarinpa...)" 
                className="bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 w-full font-medium"
              />
            </div>
            <div className="flex-1 flex items-center px-4 py-3 gap-3">
              <HomeIcon className="text-slate-400 w-5 h-5 flex-shrink-0" />
              <select className="bg-transparent border-none outline-none text-slate-900 font-medium w-full appearance-none">
                <option>Self-contain</option>
                <option>1 Bedroom</option>
                <option>Shared</option>
              </select>
            </div>
            <button 
              onClick={handleFind}
              className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Find a Place</span>
            </button>
          </motion.div>
          
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center md:justify-start">
            <div className="flex -space-x-3">
              {[
                "https://picsum.photos/seed/tenant1/100/100",
                "https://picsum.photos/seed/tenant2/100/100",
                "https://picsum.photos/seed/tenant3/100/100"
              ].map((src, i) => (
                <img key={i} src={src} alt="Tenant" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" referrerPolicy="no-referrer" />
              ))}
            </div>
            <p className="text-sm text-slate-500 text-center sm:text-left">
              <span className="text-slate-900 font-bold">2,400+ tenants</span> <br className="sm:hidden" /> already found housing this semester.
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
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold text-slate-900 mb-4 tracking-tight">Choose your journey</h2>
          <p className="text-slate-600 max-w-xl mx-auto text-sm lg:text-base">Get started with DirectRent today. Select how you want to interact with our platform.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div 
            whileHover={{ y: -10 }} 
            onClick={() => handleRoleSelection('tenant')}
            className="relative bg-white p-8 rounded-3xl shadow-2xl shadow-primary-200/20 border-2 border-primary-500 overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-primary-100 text-primary-700 text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded">Recommended</span>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-6"><Users className="text-primary-600 w-6 h-6" /></div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">I'm a Tenant</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">Looking for a safe, verified apartment close to campus without the agent headache.</p>
            <ul className="space-y-4 mb-10">
              {["Find verified apartments", "Avoid scams & fake agents", "Direct contact with owners", "Quick search filters"].map((item, id) => (
                <li key={id} className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="text-primary-600 w-4 h-4 flex-shrink-0" />{item}</li>
              ))}
            </ul>
            <button onClick={() => handleRoleSelection('tenant')} className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-primary-700 transition-all shadow-xl shadow-primary-200">Start Searching</button>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5 }} 
            onClick={() => handleRoleSelection('agent')}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 cursor-pointer"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6"><Handshake className="text-slate-600 w-6 h-6" /></div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">I'm an Agent</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">Ready to list rental-friendly properties and reach thousands of verified tenant leads.</p>
            <ul className="space-y-4 mb-10">
              {["List properties quickly", "Reach verified tenants", "Faster deals & closings", "Identity verification"].map((item, id) => (
                <li key={id} className="flex items-center gap-3 text-sm text-slate-600"><CheckCircle2 className="text-slate-400 w-4 h-4 flex-shrink-0" />{item}</li>
              ))}
            </ul>
            <button onClick={() => handleRoleSelection('agent')} className="w-full text-slate-900 font-semibold py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all">Become an Agent</button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ProblemSolution = () => (
  <section className="py-24 bg-white overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-12">
          <h2 className="text-3xl lg:text-4xl font-semibold text-slate-900 leading-tight tracking-tight">Tired of the typical <br className="hidden md:block" /> Nigerian housing stress?</h2>
          <div className="space-y-10">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><AlertCircle className="w-5 h-5" /></div>
              <div>
                <h4 className="text-base font-semibold text-slate-900 mb-1">Fake Listings & Scams</h4>
                <p className="text-sm text-slate-500 leading-relaxed italic">"Pay first to see the house" is a red flag we help you avoid forever.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><AlertCircle className="w-5 h-5" /></div>
              <div>
                <h4 className="text-base font-semibold text-slate-900 mb-1">Aggressive Agent Fees</h4>
                <p className="text-sm text-slate-500 leading-relaxed italic">Paying for form, inspection, and high commissions sucks your pockets dry.</p>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100">
            <div className="bg-primary-50 p-5 rounded-xl relative overflow-hidden">
              <div className="relative z-10 flex items-center gap-4">
                <ShieldCheck className="w-8 h-8 text-primary-600 flex-shrink-0" />
                <div><h5 className="font-semibold text-primary-900 text-sm">The DirectRent Difference</h5><p className="text-primary-700 text-xs">We verify every property and agent before they appear on your screen.</p></div>
              </div>
              <div className="absolute top-0 right-0 scale-150 translate-x-12 -translate-y-12 opacity-10"><ShieldCheck className="w-20 h-20 text-primary-600" /></div>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="z-10 grid grid-cols-2 gap-4">
            <div className="space-y-4 mt-12">
              <img src="https://picsum.photos/seed/modernhouse/400/500" className="rounded-2xl shadow-lg border-4 border-white" alt="Modern House" referrerPolicy="no-referrer" />
              <div className="bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 border border-slate-100"><CheckCircle2 className="w-6 h-6 text-primary-500" /><span className="font-bold text-sm">Verified Agents</span></div>
            </div>
            <div className="space-y-4">
              <div className="bg-primary-600 p-6 rounded-2xl text-white shadow-2xl shadow-primary-300"><p className="text-2xl font-bold mb-1">100%</p><p className="text-xs font-medium uppercase tracking-widest opacity-80">Transparent Fees</p></div>
              <img src="https://picsum.photos/seed/rentalapart/400/500" className="rounded-2xl shadow-lg border-4 border-white" alt="Rental Apartment" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
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
    <section id="listings" className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white -z-10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-xl text-center md:text-left mx-auto md:mx-0">
            <span className="inline-block text-primary-600 font-semibold text-xs uppercase tracking-widest mb-3">Verified Listings</span>
            <h2 className="text-3xl lg:text-4xl font-semibold text-slate-900 mb-6 tracking-tight">Hand-picked for you</h2>
            <p className="text-slate-600 text-base lg:text-lg leading-relaxed">We've curated the most reliable rental apartments in Nigeria's top areas.</p>
          </div>
          <button onClick={handleAction} className="flex items-center gap-2 font-semibold text-primary-600 hover:text-primary-700 transition-all group text-sm mx-auto md:mx-0">
            See all listings <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {FEATURED_LISTINGS.slice(0, 3).map((listing) => (
            <ListingCard 
              key={listing.id} 
              listing={listing} 
              onViewDetails={handleAction} 
              hideHeart 
              hideAgent
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 lg:py-32 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl lg:text-4xl font-semibold text-slate-900 mb-4 tracking-tight">How it works</h2>
        <p className="text-slate-500 text-sm lg:text-base">Simpler than the traditional, stressful way.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="bg-primary-50 p-8 lg:p-10 rounded-2xl border border-primary-100">
          <h3 className="text-xl font-semibold text-primary-950 mb-8 flex items-center gap-3"><Users className="w-5 h-5 text-primary-600" /> For Tenants</h3>
          <div className="space-y-10">
            {[
              { step: "01", title: "Search nearby apartments", desc: "Use filters to find housing near your desired location." },
              { step: "02", title: "View verified listings", desc: "No more guesswork. Photos and descriptions are verified." },
              { step: "03", title: "Contact agent directly", desc: "Zero middleman drama. Pay securely and move in." }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="text-3xl font-bold text-primary-200 leading-none">{item.step}</div>
                <div>
                  <h4 className="font-semibold text-primary-950 mb-1">{item.title}</h4>
                  <p className="text-primary-800/70 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-50 p-8 lg:p-10 rounded-2xl border border-slate-100">
          <h3 className="text-xl font-semibold text-slate-900 mb-8 flex items-center gap-3"><Handshake className="w-5 h-5 text-slate-400" /> For Agents</h3>
          <div className="space-y-10">
            {[
              { step: "01", title: "List your property", desc: "Upload photos and property details in less than 2 minutes." },
              { step: "02", title: "Get tenant leads", desc: "Get notified when verified tenants show interest." },
              { step: "03", title: "Close deals faster", desc: "Finalize paper work and get paid quicker than ever." }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="text-3xl font-bold text-slate-200 leading-none">{item.step}</div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

const TrustSafety = () => (
  <section id="security" className="py-24 bg-primary-600 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-20 opacity-10"><ShieldCheck className="w-64 h-64 text-white" /></div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-white text-center">
      <h2 className="text-3xl lg:text-4xl font-semibold mb-6 tracking-tight">Your safety is our #1 priority</h2>
      <p className="text-primary-100 max-w-xl mx-auto mb-16 text-base lg:text-lg opacity-90 leading-relaxed">We've built DirectRent to eliminate the risks of finding housing in Nigeria.</p>
      <div className="grid md:grid-cols-3 gap-8 text-left">
        {[
          { icon: <ShieldCheck className="w-6 h-6" />, title: "Verified Agents", desc: "Every agent must provide valid ID and proof of listed properties." },
          { icon: <Clock className="w-6 h-6" />, title: "Physical Inspection", desc: "Our team physically inspects random top-tier properties to ensure accuracy." },
          { icon: <MessageSquare className="w-6 h-6" />, title: "Secure Communication", desc: "Chat with agents directly within the platform to keep your details safe." }
        ].map((feature, idx) => (
          <div key={idx} className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">{feature.icon}</div>
            <h4 className="text-lg font-semibold mb-3">{feature.title}</h4>
            <p className="text-primary-50 text-xs leading-relaxed opacity-80">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Testimonials = () => (
  <section className="py-24 lg:py-32 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl lg:text-4xl font-semibold text-slate-900 mb-4 tracking-tight">Loved by tenants</h2>
        <p className="text-slate-500 text-sm lg:text-base">Real stories from tenants who skipped the stress.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { name: "Tunde A.", dept: "Lagos", text: "I found a neat self-contain in Yaba the next day. The process was surprisingly smooth compared to what I expected.", avatar: "https://picsum.photos/seed/tunde/100/100" },
          { name: "Bisi O.", dept: "Ibadan", text: "DirectRent helped me find a landlord listing directly. Saved me nearly 80k in random agent fees!", avatar: "https://picsum.photos/seed/bisi/100/100" },
          { name: "Sola W.", dept: "Abuja", text: "The verified badge gave me confidence. Moving in next week and I didn't have to chase any shady agents.", avatar: "https://picsum.photos/seed/sola/100/100" }
        ].map((test, idx) => (
          <div key={idx} className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <p className="text-slate-600 text-sm italic leading-relaxed mb-8">"{test.text}"</p>
            <div className="flex items-center gap-4">
              <img src={test.avatar} className="w-10 h-10 rounded-full border-2 border-primary-100" alt={test.name} referrerPolicy="no-referrer" />
              <div>
                <h5 className="font-semibold text-slate-900 text-sm">{test.name}</h5>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{test.dept}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

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
    <div className="min-h-screen selection:bg-primary-100 selection:text-primary-900">
      <Navbar />
      <main>
        <Hero />
        <RoleSelection />
        <ProblemSolution />
        <FeaturedListings />
        <HowItWorks />
        <TrustSafety />
        <Testimonials />
        
        <section className="py-24 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              whileInView={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.6 }} 
              className="bg-slate-900 rounded-[32px] p-12 lg:p-24 text-center relative overflow-hidden shadow-2xl shadow-slate-950/20"
            >
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10">
                <h2 className="text-3xl lg:text-5xl font-semibold text-white mb-6 tracking-tight">Ready to find your <br className="hidden md:block" /> next rental home?</h2>
                <p className="text-slate-400 text-base lg:text-lg mb-10 max-w-xl mx-auto opacity-80 leading-relaxed">Join thousands of Nigerian tenants today and secure your housing with peace of mind.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button onClick={() => { setAuthMode('signup'); setView('auth'); }} className="bg-primary-600 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20">Get Started for Free</button>
                  <button onClick={handleAction} className="bg-white/10 text-white backdrop-blur-md px-8 py-4 rounded-xl font-bold text-sm hover:bg-white/20 transition-all border border-white/20">Browse All Listings</button>
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
