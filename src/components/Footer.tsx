import React, { useState } from 'react';
import { Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Footer = () => {
  const { setView } = useAuth();
  const [logoFailed, setLogoFailed] = useState(false);
  return (
    <footer className="bg-slate-950 text-white py-10 md:py-16">
      <div className="w-full px-[15px]">
        <div className="grid md:grid-cols-4 gap-12 mb-10 md:mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              {!logoFailed ? (
                <img 
                  src="/logo-dark.png" 
                  onError={() => setLogoFailed(true)}
                  className="h-11 w-auto object-contain max-w-[150px]"
                  alt="DirectRent"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <>
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <Home className="text-white w-5 h-5" />
                  </div>
                  <span className="text-2xl font-semibold tracking-tight text-white leading-none">
                    Direct<span className="text-primary-600">Rent</span>
                  </span>
                </>
              )}
            </div>
            <p className="text-slate-400 max-w-sm mb-8">Empowering Nigerian tenants and landowners with a stress-free housing experience.</p>
          </div>
          <div>
            <h6 className="font-bold mb-6 text-slate-200 uppercase tracking-widest text-xs">Help & Legal</h6>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><a href="#faq" className="hover:text-primary-400">FAQs</a></li>
              <li><button onClick={() => setView('legal')} className="hover:text-primary-400 text-left">Terms of Use</button></li>
              <li><button onClick={() => setView('legal')} className="hover:text-primary-400 text-left">Privacy Policy</button></li>
              <li><a href="mailto:support@directrent.com" className="hover:text-primary-400 transition-colors">Support</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex justify-between items-center text-slate-500 text-xs">
          <p>© 2026 DirectRent Nigeria.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
