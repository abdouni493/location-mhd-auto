
import React from 'react';
import { Language, User } from '../types';
import { TRANSLATIONS } from '../constants';
import GradientButton from './GradientButton';

interface NavbarProps {
  user: User;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ user, lang, onLanguageChange, onLogout, onToggleSidebar, sidebarOpen }) => {
  const isRtl = lang === 'ar';
  const t = TRANSLATIONS[lang];

  return (
    <header className={`h-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-40 ${isRtl ? 'flex-row-reverse' : ''}`}>
      <div className={`flex items-center gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
        {!sidebarOpen && (
          <button 
            onClick={onToggleSidebar}
            className="flex items-center justify-center p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-500 hover:text-blue-600 transition-all duration-300 group"
          >
            <div className="flex flex-col gap-1.5 items-center">
              <span className="w-6 h-0.5 bg-gray-400 group-hover:bg-blue-600 transition-colors rounded-full"></span>
              <span className="w-6 h-0.5 bg-gray-400 group-hover:bg-blue-600 transition-colors rounded-full"></span>
              <span className="w-6 h-0.5 bg-gray-400 group-hover:bg-blue-600 transition-colors rounded-full"></span>
            </div>
          </button>
        )}
        
        <h2 className={`text-xl font-bold text-gray-900 tracking-tight ${isRtl ? 'font-arabic' : ''}`}>
          {t.welcome}, <span className="text-blue-600 font-black">{user.username}</span>
        </h2>
      </div>

      <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
        {/* Search Bar */}
        <div className="hidden lg:flex items-center relative group">
          <span className={`absolute ${isRtl ? 'right-4' : 'left-4'} text-gray-400 group-focus-within:text-blue-500 transition-colors`}>🔍</span>
          <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            className={`pl-12 pr-6 py-3 w-64 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 focus:w-80 rounded-2xl text-sm font-bold transition-all outline-none shadow-inner ${isRtl ? 'text-right' : ''}`}
          />
        </div>

        {/* Language Toggle */}
        <button
          onClick={() => onLanguageChange(lang === 'fr' ? 'ar' : 'fr')}
          className="px-4 py-2.5 rounded-2xl border-2 border-gray-100 text-sm font-black text-gray-700 hover:bg-white hover:border-blue-500 transition-all flex items-center gap-2 shadow-sm"
        >
          <span className="text-xl">{lang === 'fr' ? '🇩🇿' : '🇫🇷'}</span>
          <span className="hidden sm:inline">{lang === 'fr' ? 'العربية' : 'Français'}</span>
        </button>

        <GradientButton onClick={onLogout} className="!py-2.5 !px-6 text-sm rounded-2xl shadow-red-100/50">
          {t.logout}
        </GradientButton>
      </div>
    </header>
  );
};

export default Navbar;
