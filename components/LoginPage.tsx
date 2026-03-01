
import React, { useState, useEffect } from 'react';
import { User, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';
import GradientButton from './GradientButton';

interface LoginPageProps {
  onLogin: (user: User) => void;
  lang: Language;
  onLanguageToggle: (lang: Language) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, lang, onLanguageToggle }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const email = identifier.trim();
      const isAdmin = email.toLowerCase() === 'admin@admin.com';

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // SUCCESS: Force immediate adoption of user state to avoid getting "stuck"
      if (data.user) {
        onLogin({ 
          username: email.split('@')[0], 
          role: isAdmin ? 'admin' : 'worker' 
        });
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || (lang === 'fr' ? "Identifiants invalides" : "بيانات الدخول غير صحيحة"));
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-white relative overflow-hidden ${isRtl ? 'font-arabic' : ''}`}>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-50/50 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>
      
      <div className={`max-w-md w-full z-10 px-6 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
        <div className="flex justify-end mb-8">
          <button 
            onClick={() => onLanguageToggle(lang === 'fr' ? 'ar' : 'fr')}
            className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl text-sm font-black text-gray-800 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
          >
            <span>{lang === 'fr' ? '🇩🇿' : '🇫🇷'}</span>
            {lang === 'fr' ? 'العربية' : 'Français'}
          </button>
        </div>

        <div className="bg-white rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100">
          <div className="p-10 md:p-14">
            <div className="flex justify-center mb-12">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-red-600 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                <div className="relative w-28 h-28 bg-gradient-to-br from-blue-600 to-red-600 rounded-[2.5rem] flex items-center justify-center text-white text-6xl font-black shadow-2xl">
                  D
                </div>
              </div>
            </div>

            <div className="text-center mb-12">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">{t.loginTitle}</h1>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Accès Sécurisé</p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-black text-center animate-fade-in">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className={`block text-[10px] font-black text-gray-900 tracking-widest uppercase px-2 ${isRtl ? 'text-right' : ''}`}>
                  {lang === 'fr' ? "Email ou Utilisateur" : "البريد الإلكتروني"}
                </label>
                <div className="relative group">
                  <span className={`absolute inset-y-0 ${isRtl ? 'right-6' : 'left-6'} flex items-center text-gray-300 group-focus-within:text-blue-600 transition-colors text-xl`}>👤</span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className={`w-full ${isRtl ? 'pr-16 pl-6 text-right' : 'pl-16 pr-6'} py-5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-[2rem] text-gray-900 font-bold outline-none transition-all duration-300 placeholder-gray-300`}
                    placeholder="admin@admin.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className={`block text-[10px] font-black text-gray-900 tracking-widest uppercase px-2 ${isRtl ? 'text-right' : ''}`}>
                  {t.passwordLabel}
                </label>
                <div className="relative group">
                  <span className={`absolute inset-y-0 ${isRtl ? 'right-6' : 'left-6'} flex items-center text-gray-300 group-focus-within:text-red-600 transition-colors text-xl`}>�</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full ${isRtl ? 'pr-16 pl-6 text-right' : 'pl-16 pr-6'} py-5 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-red-500 rounded-[2rem] text-gray-900 font-bold outline-none transition-all duration-300 placeholder-gray-300`}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <GradientButton type="submit" disabled={loading} className="w-full !py-6 text-2xl mt-10 rounded-[2rem] shadow-xl">
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Chargement...</span>
                  </div>
                ) : t.loginButton}
              </GradientButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
