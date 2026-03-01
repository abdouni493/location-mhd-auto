
import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { getRentalAIAnalysis } from '../services/geminiService';
import GradientButton from '../components/GradientButton';

interface AIAnalysisPageProps {
  lang: Language;
  dataContext: any;
}

type AnalysisCategory = 'fleet' | 'crm' | 'finance' | 'global';

const AIAnalysisPage: React.FC<AIAnalysisPageProps> = ({ lang, dataContext }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AnalysisCategory>('global');
  
  const isRtl = lang === 'ar';
  const t = TRANSLATIONS[lang];

  const categories = [
    { id: 'global', labelFr: 'Stratégie Globale', labelAr: 'الاستراتيجية العامة', icon: '🌐', color: 'bg-indigo-50 text-indigo-600' },
    { id: 'fleet', labelFr: 'Gestion de Flotte', labelAr: 'إدارة الأسطول', icon: '🚗', color: 'bg-blue-50 text-blue-600' },
    { id: 'crm', labelFr: 'Analyse Clientèle', labelAr: 'تحليل الزبائن', icon: '👥', color: 'bg-purple-50 text-purple-600' },
    { id: 'finance', labelFr: 'Rentabilité & Frais', labelAr: 'الربحية والمصاريف', icon: '💰', color: 'bg-green-50 text-green-600' },
  ];

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysis(null);
    const categoryLabel = categories.find(c => c.id === selectedCategory)?.[lang === 'fr' ? 'labelFr' : 'labelAr'] || selectedCategory;
    const result = await getRentalAIAnalysis(categoryLabel, dataContext, lang);
    setAnalysis(result || null);
    setLoading(false);
  };

  const currentT = {
    fr: { header: "Consultant IA Stratégique", sub: "Sélectionnez un domaine d'analyse pour recevoir des conseils basés sur vos données réelles Supabase.", cta: "Lancer l'audit intelligent", analyzing: "Analyse en cours...", resultTitle: "Rapport d'Expertise Gemini" },
    ar: { header: "مستشار الذكاء الاصطناعي", sub: "اختر مجال التحليل للحصول على نصائح بناءً على بياناتك الحقيقية.", cta: "بدء التدقيق الذكي", analyzing: "جاري التحليل...", resultTitle: "تقرير خبرة Gemini" }
  }[lang];

  return (
    <div className={`p-4 sm:p-8 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
      <div className="max-w-5xl mx-auto mb-12">
        <div className={`flex items-center gap-6 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] shadow-2xl flex items-center justify-center text-4xl">🧠</div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">{currentT.header}</h1>
            <p className="text-gray-400 font-bold mt-2">{currentT.sub}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id as AnalysisCategory)} className={`relative p-8 rounded-[2.5rem] border-2 transition-all duration-500 text-left ${selectedCategory === cat.id ? 'bg-white border-blue-600 shadow-2xl scale-105' : 'bg-white border-gray-100 hover:border-blue-200 opacity-60'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner ${cat.color}`}>{cat.icon}</div>
              <h3 className="text-lg font-black text-gray-900">{lang === 'fr' ? cat.labelFr : cat.labelAr}</h3>
            </button>
          ))}
        </div>

        <div className="flex justify-center py-6">
          <GradientButton onClick={handleAnalyze} disabled={loading} className="!px-16 !py-6 text-2xl rounded-[2.5rem]">
            {loading ? currentT.analyzing : currentT.cta}
          </GradientButton>
        </div>

        {analysis && (
          <div className="bg-white rounded-[3.5rem] shadow-sm border border-gray-100 p-8 sm:p-14 animate-scale-in relative overflow-hidden">
            <h2 className="text-2xl font-black text-gray-900 uppercase mb-8">{currentT.resultTitle}</h2>
            <div className="whitespace-pre-wrap font-medium text-lg text-gray-700 bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100">{analysis}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisPage;
