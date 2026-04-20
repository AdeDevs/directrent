import React from 'react';
import { Home } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Home className="text-white w-5 h-5" />
              </div>
              <span className="text-2xl font-semibold tracking-tight text-white leading-none">
                Direct<span className="text-primary-600">Rent</span>
              </span>
            </div>
            <p className="text-slate-400 max-w-sm mb-8">Empowering Nigerian tenants with a stress-free housing experience.</p>
          </div>
          <div><h6 className="font-bold mb-6 text-slate-200 uppercase tracking-widest text-xs">Help</h6><ul className="space-y-4 text-slate-400 text-sm"><li><a href="#" className="hover:text-primary-400">FAQs</a></li><li><a href="#" className="hover:text-primary-400">Support</a></li></ul></div>
        </div>
        <div className="pt-8 border-t border-white/5 flex justify-between items-center text-slate-500 text-xs">
          <p>© 2026 DirectRent Nigeria.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
