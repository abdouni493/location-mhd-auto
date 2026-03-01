
import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface EmptyPageProps {
  title: string;
  lang: Language;
}

const EmptyPage: React.FC<EmptyPageProps> = ({ title, lang }) => {
  const isRtl = lang === 'ar';
  const t = TRANSLATIONS[lang];

  return (
    <div className={`flex flex-col items-center justify-center h-full p-8 text-center ${isRtl ? 'font-arabic' : ''}`}>
      <div className="w-24 h-24 mb-6 bg-blue-50 rounded-full flex items-center justify-center text-4xl">
        📁
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
      <p className="text-gray-500 max-w-md">
        {t.emptyState}
      </p>
    </div>
  );
};

export default EmptyPage;
