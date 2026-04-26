import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, HelpCircle, ChevronDown, Search, ShieldCheck, Heart, UserSearch, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FAQ = () => {
  const { setActiveTab } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      category: "General",
      icon: <HelpCircle className="w-4 h-4" />,
      questions: [
        {
          q: "What is DirectRent?",
          a: "DirectRent is a secure platform for finding rentals in Nigeria. We prioritize user safety through verified identities and secure communication channels."
        },
        {
          q: "Is it free to use?",
          a: "Searching for rentals is free. Agents and landlords may pay a small fee to boost their listings or access premium features."
        }
      ]
    },
    {
      category: "Safety",
      icon: <ShieldCheck className="w-4 h-4" />,
      questions: [
        {
          q: "How do I know a listing is safe?",
          a: "Look for the 'Verified' badge on agent profiles and listings. We manually review high-risk listings and require identity verification for all posters."
        },
        {
          q: "Should I pay before inspection?",
          a: "NEVER pay for a property before seeing it physically. DirectRent will never ask you to transfer money to an escrow account outside the platform."
        }
      ]
    },
    {
      category: "Communication",
      icon: <MessageSquare className="w-4 h-4" />,
      questions: [
        {
          q: "How do I contact agents?",
          a: "Use the built-in chat feature. This keeps your communication secure and allows us to step in if there's a dispute."
        }
      ]
    }
  ];

  const allQuestions = faqs.flatMap(cat => cat.questions);
  const filteredQuestions = allQuestions.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 h-16 flex items-center gap-4">
        <button 
          onClick={() => setActiveTab('profile')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Help Center</h1>
      </header>

      <main className="w-full px-4 py-8">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary-500/30 focus:ring-4 focus:ring-primary-500/10 transition-all font-sans"
          />
        </div>

        {searchQuery ? (
          <div className="space-y-3">
            {filteredQuestions.map((faq, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{faq.a}</p>
              </div>
            ))}
            {filteredQuestions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No results found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {faqs.map((category, catIdx) => (
              <div key={catIdx}>
                <div className="flex items-center gap-2 mb-4 px-1">
                  <div className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 p-1.5 rounded-lg">
                    {category.icon}
                  </div>
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">{category.category}</h2>
                </div>
                <div className="space-y-3">
                  {category.questions.map((faq, idx) => {
                    const globalIdx = catIdx * 10 + idx;
                    const isOpen = openIdx === globalIdx;
                    return (
                      <div 
                        key={idx}
                        className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 ${isOpen ? 'border-primary-500/30 ring-4 ring-primary-500/5 shadow-md' : 'border-slate-100 dark:border-slate-800 shadow-sm'}`}
                      >
                        <button 
                          onClick={() => setOpenIdx(isOpen ? null : globalIdx)}
                          className="w-full flex items-center justify-between p-5 text-left"
                        >
                          <span className={`text-sm font-bold tracking-tight transition-colors ${isOpen ? 'text-primary-600 dark:text-primary-400' : 'text-slate-900 dark:text-white'}`}>
                            {faq.q}
                          </span>
                          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary-500' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-5 pt-0">
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                  {faq.a}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-center shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-500">
            <UserSearch className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Still have questions?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">Can't find the answer you're looking for? Please reach out to our friendly team.</p>
          <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black tracking-tight text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">
            Get in Touch
          </button>
        </div>
      </main>
    </div>
  );
};

export default FAQ;
