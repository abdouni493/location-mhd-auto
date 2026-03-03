
import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import GradientButton from '../components/GradientButton';
import { apiPost as centralApiPost } from '../lib/api';

interface ConfigPageProps {
  lang: Language;
}

type ConfigTab = 'general' | 'rules' | 'security' | 'database';

const ConfigPage: React.FC<ConfigPageProps> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Centralized configuration state to prevent data loss on tab switch
  const [configData, setConfigData] = useState({
    storeName: 'DriveFlow Management',
    slogan: "L'élégance au service de votre mobilité",
    address: '12 Rue Didouche Mourad, Alger Centre',
    facebook: 'facebook.com/driveflow',
    instagram: 'instagram.com/driveflow_dz',
    whatsapp: '+213 550 00 00 00',
    penaltyCalcType: 'daily',
    penaltyAmount: 1500,
    penaltyTolerance: 60,
    fuelMissingPrice: 500,
    dailyLimit: 250,
    toleranceKM: 20,
    excessPrice: 15,
    unlimitedPrice: 2000,
    phone: '',
    username: 'admin',
    email: 'contact@driveflow.dz',
    newPassword: '',
    confirmPassword: ''
  });

  const isRtl = lang === 'ar';

  const t = {
    fr: {
      title: 'Configuration du Système',
      tabs: {
        general: 'Général',
        rules: 'Règles & Tarifs',
        security: 'Sécurité',
        database: 'Base de données'
      },
      info: {
        title: 'Informations de l\'agence',
        storeName: 'Nom de l\'enseigne',
        slogan: 'Slogan commercial',
        address: 'Adresse du siège',
        socials: 'Réseaux Sociaux',
        facebook: 'Lien Facebook',
        instagram: 'Lien Instagram',
        whatsapp: 'Numéro WhatsApp'
      },
      security: {
        title: 'Informations de Connexion',
        username: 'Nom d\'utilisateur',
        email: 'E-mail de récupération',
        newPassword: 'Nouveau mot de passe',
        confirmPassword: 'Confirmer le mot de passe'
      },
      penalties: {
        title: 'Pénalités de Retard',
        calcType: 'Type de calcul',
        types: {
          daily: 'Tarif journalier',
          hourly_flat: 'Forfait par heure',
          daily_flat: 'Forfait par jour',
          percentage: 'Pourcentage du tarif'
        },
        amount: 'Montant / Valeur',
        tolerance: 'Temps de tolérance (Minutes)'
      },
      mileage: {
        title: 'Limites de Kilométrage',
        dailyLimit: 'Limite journalière (KM)',
        tolerance: 'Tolérance gratuite (KM)',
        excessPrice: 'Prix par KM excédentaire',
        unlimited: 'Supplément KM illimité / Jour'
      },
      fuel: {
        title: 'Carburant',
        missingPrice: 'Prix par unité de carburant manquante'
      },
      db: {
        title: 'Gestion des données',
        backup: 'Sauvegarder la base de données',
        restore: 'Restaurer une sauvegarde',
        lastBackup: 'Dernière sauvegarde : Aujourd\'hui à 10:45',
        backupDesc: 'Téléchargez une copie complète de vos données au format JSON/SQL.',
        restoreDesc: 'Importez un fichier de sauvegarde pour restaurer vos informations.'
      },
      save: 'Enregistrer les modifications',
      saving: 'Enregistrement...',
      saved: 'Modifications enregistrées !',
      currency: 'DZ'
    },
    ar: {
      title: 'إعدادات النظام',
      tabs: {
        general: 'عام',
        rules: 'القواعد والأسعار',
        security: 'الأمان',
        database: 'قاعدة البيانات'
      },
      info: {
        title: 'معلومات الوكالة',
        storeName: 'اسم المتجر',
        slogan: 'الشعار التجاري',
        address: 'عنوان المقر',
        socials: 'وسائل التواصل الاجتماعي',
        facebook: 'رابط فيسبوك',
        instagram: 'رابط إنستغرام',
        whatsapp: 'رقم واتساب'
      },
      security: {
        title: 'معلومات تسجيل الدخول',
        username: 'اسم المستخدم',
        email: 'البريد الإلكتروني للاسترداد',
        newPassword: 'كلمة مرور جديدة',
        confirmPassword: 'تأكيد كلمة المرور'
      },
      penalties: {
        title: 'غرامات التأخير',
        calcType: 'نوع الحساب',
        types: {
          daily: 'التعريفة اليومية',
          hourly_flat: 'سعر ثابت للساعة',
          daily_flat: 'سعر ثابت لليوم',
          percentage: 'نسبة مئوية من السعر'
        },
        amount: 'المبلغ / القيمة',
        tolerance: 'وقت السماح (بالدقائق)'
      },
      mileage: {
        title: 'حدود المسافة',
        dailyLimit: 'الحد اليومي (كم)',
        tolerance: 'السماح المجاني (كم)',
        excessPrice: 'سعر الكيلومتر الزائد',
        unlimited: 'إضافة كيلومتر غير محدود / يوم'
      },
      fuel: {
        title: 'الوقود',
        missingPrice: 'سعر وحدة الوقود المفقودة'
      },
      db: {
        title: 'إدارة البيانات',
        backup: 'نسخ احتياطي لقاعدة البيانات',
        restore: 'استعادة نسخة احتياطية',
        lastBackup: 'آخر نسخة احتياطية: اليوم الساعة 10:45',
        backupDesc: 'قم بتنزيل نسخة كاملة من بياناتك بتنسيق JSON/SQL.',
        restoreDesc: 'قم باستيراد ملف نسخة احتياطية لاستعادة معلوماتك.'
      },
      save: 'حفظ التغييرات',
      saving: 'جاري الحفظ...',
      saved: 'تم حفظ التغييرات بنجاح!',
      currency: 'دج'
    }
  }[lang];

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Use centralized API helper with environment-aware URL
  const apiPost = async (path: string, body: any) => {
    try {
      const res = await centralApiPost(path, body);
      const text = await res.text();
      if (!text) return { data: null };
      return JSON.parse(text);
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await apiPost('/api/from/system_config/select', { columns: '*', filters: { is_active: true }, limit: 1 });
      const cfg = Array.isArray(res.data) && res.data.length ? res.data[0] : null;
      if (cfg) {
        setConfigId(cfg.id);
        setConfigData(prev => ({
          ...prev,
          storeName: cfg.store_name || prev.storeName,
          slogan: cfg.slogan || prev.slogan,
          address: cfg.address || prev.address,
          facebook: cfg.facebook || prev.facebook,
          instagram: cfg.instagram || prev.instagram,
          whatsapp: cfg.whatsapp || prev.whatsapp,
          penaltyCalcType: cfg.penalty_calc_type || prev.penaltyCalcType,
          penaltyAmount: cfg.penalty_amount ?? prev.penaltyAmount,
          penaltyTolerance: cfg.penalty_tolerance ?? prev.penaltyTolerance,
          fuelMissingPrice: cfg.fuel_missing_price ?? prev.fuelMissingPrice,
          dailyLimit: cfg.daily_mileage_limit ?? prev.dailyLimit,
          toleranceKM: cfg.mileage_tolerance ?? prev.toleranceKM,
          excessPrice: cfg.excess_price ?? prev.excessPrice,
          unlimitedPrice: cfg.unlimited_price ?? prev.unlimitedPrice,
          logo: cfg.logo_url || prev.logo || ''
        } as any));
        if (cfg.logo_url) setLogoPreview(cfg.logo_url);
      }
      // fetch admin email optionally
      const adm = await apiPost('/api/from/admin_security/select', { columns: 'username,email', limit: 1 });
      const admin = Array.isArray(adm.data) && adm.data.length ? adm.data[0] : null;
      if (admin) setConfigData(prev => ({ ...prev, username: admin.username || prev.username, email: admin.email || prev.email }));
    } catch (err: any) {
      console.error('Error loading config:', err);
      setError('Failed to load configuration');
    } finally { setLoading(false); }
  };

  const handleInputChange = (field: keyof typeof configData, value: any) => {
    setConfigData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    (async () => {
      try {
        setIsSaving(true);
        setSaveSuccess(false);

        const configUpdateData = {
          store_name: configData.storeName,
          slogan: configData.slogan,
          address: configData.address,
          facebook: configData.facebook,
          instagram: configData.instagram,
          whatsapp: configData.whatsapp,
          penalty_calc_type: configData.penaltyCalcType,
          penalty_amount: configData.penaltyAmount,
          penalty_tolerance: configData.penaltyTolerance,
          fuel_missing_price: configData.fuelMissingPrice,
          daily_mileage_limit: configData.dailyLimit,
          mileage_tolerance: configData.toleranceKM,
          excess_price: configData.excessPrice,
          unlimited_price: configData.unlimitedPrice,
          logo_url: logoPreview || configData.logo
        };

        if (configId) {
          const upd = await apiPost('/api/from/system_config/update', { data: configUpdateData, where: { col: 'id', val: configId } });
          if (upd?.error) throw new Error(upd.error.message || 'Update failed');
        } else {
          const ins = await apiPost('/api/from/system_config/insert', { rows: [configUpdateData] });
          if (ins?.error) throw new Error(ins.error.message || 'Insert failed');
          // server returns inserted rows in ins.data (array)
          if (ins && Array.isArray(ins.data) && ins.data[0] && ins.data[0].id) setConfigId(ins.data[0].id);
        }

        // persist to localStorage and broadcast for sidebar
        try {
          const cfg = { storeName: configUpdateData.store_name, logo_url: configUpdateData.logo_url };
          window.localStorage.setItem('app.system_config', JSON.stringify(cfg));
          window.localStorage.setItem('app.system_config.update', String(Date.now()));
          window.dispatchEvent(new CustomEvent('app:config:update', { detail: cfg }));
        } catch (e) {}

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err: any) {
        console.error('Error saving config:', err);
        setError(err?.message || 'Failed to save configuration');
      } finally {
        setIsSaving(false);
      }
    })();
  };

  // Fix: safely handle file selection to avoid "unknown" to "Blob" error by narrowing the type
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Use FileReader to convert to base64 instead of blob URL (which expires)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const SectionTitle = ({ icon, text }: { icon: string, text: string }) => (
    <div className={`flex items-center gap-3 mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
      <span className="text-3xl">{icon}</span>
      <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">{text}</h3>
    </div>
  );

  return (
    <div className={`p-4 sm:p-8 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
      {/* Toast Notification */}
      {saveSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
          <div className="bg-green-600 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border-4 border-white/20">
            <span className="text-2xl">✅</span>
            <span className="font-black text-sm uppercase tracking-widest">{t.saved}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter">{t.title}</h1>
        <GradientButton 
          onClick={handleSave} 
          disabled={isSaving}
          className={`!px-10 !py-4 shadow-xl shadow-blue-100 min-w-[280px] transition-all duration-300 ${saveSuccess ? '!bg-green-600' : ''}`}
        >
          {isSaving ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>{t.saving}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {saveSuccess ? '✅' : '💾'} {saveSuccess ? t.saved : t.save}
            </div>
          )}
        </GradientButton>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto no-scrollbar gap-4 mb-10 pb-2">
        {(Object.keys(t.tabs) as ConfigTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest whitespace-nowrap transition-all
              ${activeTab === tab 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 scale-105' 
                : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
              }
            `}
          >
            {t.tabs[tab]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[4rem] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
        <div className="p-8 sm:p-14">
          
          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-12 animate-fade-in">
              <div>
                <SectionTitle icon="🏢" text={t.info.title} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">{t.info.storeName}</label>
                      <input 
                        type="text" 
                        value={configData.storeName}
                        onChange={(e) => handleInputChange('storeName', e.target.value)}
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all border-2 border-transparent focus:border-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">{t.info.slogan}</label>
                      <input 
                        type="text" 
                        value={configData.slogan}
                        onChange={(e) => handleInputChange('slogan', e.target.value)}
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all border-2 border-transparent focus:border-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">{t.info.address}</label>
                      <textarea 
                        value={configData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all h-32 border-2 border-transparent focus:border-blue-500 resize-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">📞 Téléphone</label>
                      <input 
                        type="text" 
                        value={configData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all border-2 border-transparent focus:border-blue-500" 
                        placeholder="+213 550 00 00 00"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                    <div className="w-40 h-40 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center overflow-hidden mb-8 border-4 border-white">
                      {logoPreview ? <img src={logoPreview} className="w-full h-full object-cover" /> : <span className="text-6xl">🖼️</span>}
                    </div>
                    <GradientButton onClick={() => logoInputRef.current?.click()} className="!py-3 !px-8 text-xs rounded-full">Modifier le Logo de l'agence</GradientButton>
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoChange} />
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-gray-50">
                <SectionTitle icon="🌐" text={t.info.socials} />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 px-2">{t.info.facebook}</label>
                    <input 
                      type="text" 
                      value={configData.facebook}
                      onChange={(e) => handleInputChange('facebook', e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all border-2 border-transparent focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 px-2">{t.info.instagram}</label>
                    <input 
                      type="text" 
                      value={configData.instagram}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all border-2 border-transparent focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 px-2">{t.info.whatsapp}</label>
                    <input 
                      type="text" 
                      value={configData.whatsapp}
                      onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all border-2 border-transparent focus:border-blue-500" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: RULES (Penalties, Mileage, Fuel) */}
          {activeTab === 'rules' && (
            <div className="space-y-16 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Penalties */}
                <div className="p-10 bg-orange-50/50 rounded-[3rem] border border-orange-100 shadow-inner">
                  <SectionTitle icon="⚠️" text={t.penalties.title} />
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 px-2">{t.penalties.calcType}</label>
                      <select 
                        value={configData.penaltyCalcType}
                        onChange={(e) => handleInputChange('penaltyCalcType', e.target.value)}
                        className="w-full px-6 py-4 bg-white rounded-2xl outline-none font-black shadow-sm border-2 border-transparent focus:border-orange-200 appearance-none cursor-pointer"
                      >
                        <option value="daily">{t.penalties.types.daily}</option>
                        <option value="hourly">{t.penalties.types.hourly_flat}</option>
                        <option value="daily_flat">{t.penalties.types.daily_flat}</option>
                        <option value="percentage">{t.penalties.types.percentage}</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 px-2">{t.penalties.amount}</label>
                        <input 
                          type="number" 
                          value={configData.penaltyAmount}
                          onChange={(e) => handleInputChange('penaltyAmount', Number(e.target.value))}
                          className="w-full px-6 py-4 bg-white rounded-2xl outline-none font-black shadow-sm border-2 border-transparent focus:border-orange-200" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 px-2">{t.penalties.tolerance}</label>
                        <input 
                          type="number" 
                          value={configData.penaltyTolerance}
                          onChange={(e) => handleInputChange('penaltyTolerance', Number(e.target.value))}
                          className="w-full px-6 py-4 bg-white rounded-2xl outline-none font-black shadow-sm border-2 border-transparent focus:border-orange-200" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fuel */}
                <div className="p-10 bg-blue-50/50 rounded-[3rem] border border-blue-100 shadow-inner">
                  <SectionTitle icon="⛽" text={t.fuel.title} />
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 px-2">{t.fuel.missingPrice} ({t.currency})</label>
                      <input 
                        type="number" 
                        value={configData.fuelMissingPrice}
                        onChange={(e) => handleInputChange('fuelMissingPrice', Number(e.target.value))}
                        className="w-full px-6 py-4 bg-white rounded-2xl outline-none font-black shadow-sm border-2 border-transparent focus:border-blue-200" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mileage */}
              <div className="p-10 bg-green-50/50 rounded-[4rem] border border-green-100 shadow-inner">
                <SectionTitle icon="🛣️" text={t.mileage.title} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 px-2">{t.mileage.dailyLimit}</label>
                    <input 
                      type="number" 
                      value={configData.dailyLimit}
                      onChange={(e) => handleInputChange('dailyLimit', Number(e.target.value))}
                      className="w-full px-6 py-4 bg-white rounded-2xl outline-none font-black shadow-sm border-2 border-transparent focus:border-green-200" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 px-2">{t.mileage.tolerance}</label>
                    <input 
                      type="number" 
                      value={configData.toleranceKM}
                      onChange={(e) => handleInputChange('toleranceKM', Number(e.target.value))}
                      className="w-full px-6 py-4 bg-white rounded-2xl outline-none font-black shadow-sm border-2 border-transparent focus:border-green-200" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 px-2">{t.mileage.excessPrice} ({t.currency})</label>
                    <input 
                      type="number" 
                      value={configData.excessPrice}
                      onChange={(e) => handleInputChange('excessPrice', Number(e.target.value))}
                      className="w-full px-6 py-4 bg-white rounded-2xl outline-none font-black shadow-sm border-2 border-transparent focus:border-green-200" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 px-2">{t.mileage.unlimited} ({t.currency})</label>
                    <input 
                      type="number" 
                      value={configData.unlimitedPrice}
                      onChange={(e) => handleInputChange('unlimitedPrice', Number(e.target.value))}
                      className="w-full px-6 py-4 bg-white rounded-2xl outline-none font-black shadow-sm border-2 border-transparent focus:border-green-200" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SECURITY */}
          {activeTab === 'security' && (
            <div className="max-w-2xl mx-auto space-y-12 animate-fade-in">
              <SectionTitle icon="🛡️" text={t.security.title} />
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">{t.security.username}</label>
                    <input 
                      type="text" 
                      value={configData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-blue-500 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">{t.security.email}</label>
                    <input 
                      type="email" 
                      value={configData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-blue-500 transition-all" 
                    />
                  </div>
                </div>
                <div className="h-px bg-gray-100 my-4"></div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">{t.security.newPassword}</label>
                  <input 
                    type="password" 
                    value={configData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    placeholder="••••••••" 
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-blue-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">{t.security.confirmPassword}</label>
                  <input 
                    type="password" 
                    value={configData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="••••••••" 
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-blue-500 transition-all" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: DATABASE */}
          {activeTab === 'database' && (
            <div className="space-y-12 animate-fade-in">
              <SectionTitle icon="💾" text={t.db.title} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 group hover:border-blue-200 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-4xl">📤</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.db.lastBackup}</span>
                  </div>
                  <h4 className="text-xl font-black text-gray-900 mb-3">{t.db.backup}</h4>
                  <p className="text-sm font-bold text-gray-500 mb-8 leading-relaxed">{t.db.backupDesc}</p>
                  <button className="w-full py-4 bg-white border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">
                    Lancer l'exportation
                  </button>
                </div>

                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 group hover:border-red-200 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-4xl">📥</span>
                  </div>
                  <h4 className="text-xl font-black text-gray-900 mb-3">{t.db.restore}</h4>
                  <p className="text-sm font-bold text-gray-500 mb-8 leading-relaxed">{t.db.restoreDesc}</p>
                  <button className="w-full py-4 bg-white border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95">
                    Choisir un fichier (.sql, .json)
                  </button>
                </div>
              </div>

              <div className="p-10 bg-blue-600 rounded-[3rem] text-white shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-10 text-9xl font-black pointer-events-none">SYNC</div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div>
                    <h4 className="text-2xl font-black mb-2">Synchronisation Cloud</h4>
                    <p className="font-bold opacity-80">Vos données sont automatiquement sauvegardées toutes les 24h sur nos serveurs sécurisés.</p>
                  </div>
                  <button className="px-10 py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl whitespace-nowrap active:scale-95 transition-transform">
                    Vérifier l'état
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ConfigPage;
