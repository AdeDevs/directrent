import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-slate-500" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'en' | 'pidgin' | 'hausa' | 'igbo' | 'yoruba')}
        className="bg-transparent border-none text-xs font-semibold text-slate-600 focus:ring-0 cursor-pointer outline-none uppercase tracking-wider"
      >
        <option value="en">ENG</option>
        <option value="pidgin">PIDGIN</option>
        <option value="hausa">HAUSA</option>
        <option value="igbo">IGBO</option>
        <option value="yoruba">YORUBA</option>
      </select>
    </div>
  );
}
