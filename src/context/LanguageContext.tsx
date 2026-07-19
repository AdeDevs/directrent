import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type Language = 'en' | 'pidgin' | 'hausa' | 'igbo' | 'yoruba';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.howItWorks': 'How it Works',
    'nav.spaces': 'Spaces',
    'nav.faqs': 'FAQs',
    'btn.login': 'Sign In',
    'btn.signup': 'Sign Up',
    'btn.listProperty': 'List Property',
    'app.title': 'DirectRent',
    'lockdown.title': 'Launch Private Access Only',
    'lockdown.desc': 'DirectRent is currently in Private Landlord & Agent Onboarding mode. Tenant access, property discovery, and real-time messaging are temporarily locked while our premier listing inventory is populated.',
    'lockdown.days': 'Days',
    'lockdown.hours': 'Hours',
    'lockdown.mins': 'Mins',
    'lockdown.secs': 'Secs',
    'lockdown.notify': 'Notify Me',
    'lockdown.placeholder': 'Enter email to get early access',
    'lockdown.tenant': 'Logged in as tenant',
    'lockdown.disconnect': 'Disconnect Account',
    'lockdown.authorized': 'Are you an authorized landlord or agent?',
    'lockdown.loginNow': 'Log in now',
  },
  pidgin: {
    'nav.home': 'House',
    'nav.howItWorks': 'How e dey work',
    'nav.spaces': 'Houses',
    'nav.faqs': 'Question wey dem dey ask',
    'btn.login': 'Enter',
    'btn.signup': 'Join Us',
    'btn.listProperty': 'Put House',
    'app.title': 'DirectRent',
    'lockdown.title': 'Na Only Private Access We Open Now',
    'lockdown.desc': 'DirectRent dey on Private Landlord & Agent Onboarding mode right now. Tenant access, property search, and chat don block temporarily make we fit load beta houses put.',
    'lockdown.days': 'Days',
    'lockdown.hours': 'Hours',
    'lockdown.mins': 'Mins',
    'lockdown.secs': 'Secs',
    'lockdown.notify': 'Tell Me',
    'lockdown.placeholder': 'Put your email make we tell you when we open',
    'lockdown.tenant': 'You don log in as tenant',
    'lockdown.disconnect': 'Commot Account',
    'lockdown.authorized': 'You be landlord or agent?',
    'lockdown.loginNow': 'Enter now',
  },
  hausa: {
    'nav.home': 'Gida',
    'nav.howItWorks': 'Yadda Yake Aiki',
    'nav.spaces': 'Gidaje',
    'nav.faqs': 'Tambayoyi',
    'btn.login': 'Shiga',
    'btn.signup': 'Yi Rijista',
    'btn.listProperty': 'Saka Gida',
    'app.title': 'DirectRent',
    'lockdown.title': 'Shiga na Musamman Kawai',
    'lockdown.desc': 'DirectRent yana kan tsarin kawo masu gida da wakilai a yanzu. An rufe shiga na masu haya da neman gida na dan wani lokaci don mu saka gidaje masu kyau.',
    'lockdown.days': 'Kwana',
    'lockdown.hours': 'Awa',
    'lockdown.mins': 'Minti',
    'lockdown.secs': 'Dakiqa',
    'lockdown.notify': 'Sanar Da Ni',
    'lockdown.placeholder': 'Saka imel don samun damar shiga',
    'lockdown.tenant': 'Ka shiga a matsayin mai haya',
    'lockdown.disconnect': 'Fita Daga Asusu',
    'lockdown.authorized': 'Kai mai gida ne ko wakili?',
    'lockdown.loginNow': 'Shiga yanzu',
  },
  igbo: {
    'nav.home': 'Ụlọ',
    'nav.howItWorks': 'Otu o si arụ ọrụ',
    'nav.spaces': 'Ụlọ',
    'nav.faqs': 'Ajụjụ Ndị A Na-ajụkarị',
    'btn.login': 'Banye',
    'btn.signup': 'Debanye Aha',
    'btn.listProperty': 'Tinye Ụlọ',
    'app.title': 'DirectRent',
    'lockdown.title': 'Sọọsọ Ndị E Nyere Ikike Nwere Ike Ịbanye',
    'lockdown.desc': 'DirectRent nọ ugbu a n\'ụdị nnabata ndị nwe ụlọ na ndị nnọchi anya. Ịbanye nke ndị nwe ụlọ, ịchọta ụlọ, agbachiela ugbu a iji tinye ụlọ ndị mara mma.',
    'lockdown.days': 'Ụbọchị',
    'lockdown.hours': 'Elekere',
    'lockdown.mins': 'Nkeji',
    'lockdown.secs': 'Sịkọnd',
    'lockdown.notify': 'Gwa M',
    'lockdown.placeholder': 'Tinye imel ka ị nweta ohere',
    'lockdown.tenant': 'Ị banyela dị ka onye na-akwụ ụgwọ',
    'lockdown.disconnect': 'Kwụpụ Akaụntụ',
    'lockdown.authorized': 'Ị bụ onye nwe ụlọ ka ị bụ onye nnọchi anya?',
    'lockdown.loginNow': 'Banye ugbu a',
  },
  yoruba: {
    'nav.home': 'Ile',
    'nav.howItWorks': 'Bi o se n sise',
    'nav.spaces': 'Awon Ile',
    'nav.faqs': 'Awon Ibeere',
    'btn.login': 'Wole',
    'btn.signup': 'Forukosile',
    'btn.listProperty': 'Fi Ile Si',
    'app.title': 'DirectRent',
    'lockdown.title': 'Ibugbe Fun Awon Eniyan Pato Nikan',
    'lockdown.desc': 'DirectRent wa lori eto kikojopo awon onile ati asoju lowolowo. A ti ti oju opo fun awon ayagbe fun igba die ki a le fi awon ile to daa si.',
    'lockdown.days': 'Ojo',
    'lockdown.hours': 'Wakati',
    'lockdown.mins': 'Iseju',
    'lockdown.secs': 'Iseju aaya',
    'lockdown.notify': 'Fi To Mi Leti',
    'lockdown.placeholder': 'Fi imeeli re si lati wole ni kete',
    'lockdown.tenant': 'O ti wole gege bi ayagbe',
    'lockdown.disconnect': 'Yọ Kuro',
    'lockdown.authorized': 'Se onile tabi asoju ni e?',
    'lockdown.loginNow': 'Wole bayi',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (['en', 'pidgin', 'hausa', 'igbo', 'yoruba'].includes(savedLang))) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
