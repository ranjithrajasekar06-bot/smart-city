import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const currentLang = i18n.language.split('-')[0];

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  const languages = [
    { code: 'en', label: 'English', shortLabel: 'English' },
    { code: 'ta', label: 'தமிழ்', shortLabel: 'தமிழ்' }
  ];

  return (
    <div className="inline-flex items-center" id="language-switcher-container">
      <div 
        className="relative flex items-center p-1 bg-slate-150/80 rounded-2xl border border-slate-200 bg-slate-50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-slate-300"
        id="language-switcher-pill"
      >
        {/* Globe icon with subtle rotating animation */}
        <div className="pl-2.5 pr-1.5 flex items-center text-slate-400 hover:text-blue-500 transition-colors">
          <Globe className="h-4 w-4 animate-[spin_20s_linear_infinite] opacity-80" />
        </div>

        <div className="flex space-x-1 relative z-0">
          {languages.map((lang) => {
            const isActive = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                id={`lang-${lang.code}-btn`}
                className={`relative px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer ${
                  isActive 
                    ? 'text-blue-600 font-extrabold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {/* Active physical sliding background indicator */}
                {isActive && (
                  <motion.span
                    layoutId="activeLanguageIndicator"
                    className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-100"
                    transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                <span>{lang.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
