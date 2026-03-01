
import React, { useState } from 'react';
import { Language, Agency } from '../types';
import { supabase } from '../lib/supabase';
import GradientButton from '../components/GradientButton';

interface AgenciesPageProps {
  lang: Language;
  initialAgencies: Agency[];
  onUpdate: () => void;
}

type ModalType = 'delete' | null;

const AgenciesPage: React.FC<AgenciesPageProps> = ({ lang, initialAgencies = [], onUpdate }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [activeModal, setActiveModal] = useState<{ type: ModalType; agency: Agency | null }>({ type: null, agency: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  const isRtl = lang === 'ar';

  const t = {
    fr: {
      title: 'Gestion des Agences',
      addBtn: 'Ajouter une agence',
      search: 'Rechercher une agence...',
      agencyName: 'Nom de l\'agence',
      address: 'Adresse complète',
      phone: 'Téléphone',
      edit: 'Modifier',
      delete: 'Supprimer',
      createTitle: 'Nouvelle Agence',
      editTitle: 'Modifier l\'Agence',
      save: 'Enregistrer',
      cancel: 'Annuler',
      confirmDelete: 'Voulez-vous vraiment supprimer cette agence ?',
      totalAgencies: 'agences dans votre réseau',
      noAgencies: 'Aucune agence trouvée.'
    },
    ar: {
      title: 'إدارة الوكالات',
      addBtn: 'إضافة وكالة',
      search: 'بحث عن وكالة...',
      agencyName: 'اسم الوكالة',
      address: 'العنوان الكامل',
      phone: 'رقم الهاتف',
      edit: 'تعديل',
      delete: 'حذف',
      createTitle: 'وكالة جديدة',
      editTitle: 'تعديل الوكالة',
      save: 'حفظ',
      cancel: 'إلغاء',
      confirmDelete: 'هل أنت متأكد من حذف هذه الوكالة؟',
      totalAgencies: 'وكالة في شبكتك',
      noAgencies: 'لم يتم العثور على وكالات.'
    }
  }[lang];

  const handleOpenForm = (agency: Agency | null = null) => {
    setEditingAgency(agency);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAgency(null);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const dbData = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string
    };

    try {
      if (editingAgency) {
        await supabase.from('agencies').update(dbData).eq('id', editingAgency.id);
      } else {
        await supabase.from('agencies').insert([dbData]);
      }
      onUpdate();
      handleCloseForm();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('agencies').delete().eq('id', id);
      onUpdate();
      setActiveModal({ type: null, agency: null });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAgencies = initialAgencies.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isFormOpen) {
    return (
      <div className={`p-4 md:p-8 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
        <div className="max-w-4xl mx-auto bg-white rounded-[3.5rem] shadow-[0_32px_120px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100">
          <div className="p-8 md:p-14">
            <div className="flex items-center justify-between mb-12 border-b border-gray-50 pb-12">
              <h2 className="text-5xl font-black text-gray-900 flex items-center gap-6">
                <span className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-700 text-white rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl shadow-blue-200">
                  🏢
                </span>
                {editingAgency ? t.editTitle : t.createTitle}
              </h2>
              <button onClick={handleCloseForm} className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all text-3xl shadow-inner">✕</button>
            </div>
            
            <form className="space-y-10" onSubmit={handleSave}>
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">{t.agencyName}</label>
                  <input name="name" type="text" defaultValue={editingAgency?.name} className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-[2.5rem] outline-none font-black text-xl transition-all shadow-inner" placeholder="Ex: DriveFlow Alger Centre" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">{t.address}</label>
                  <input name="address" type="text" defaultValue={editingAgency?.address} className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-[2.5rem] outline-none font-black transition-all shadow-inner" placeholder="Ex: 12 Rue Didouche Mourad, Alger" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">{t.phone}</label>
                  <input name="phone" type="tel" defaultValue={editingAgency?.phone} className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-[2.5rem] outline-none font-black transition-all shadow-inner" placeholder="Ex: 021 00 00 00" />
                </div>
              </div>

              <div className="flex justify-end gap-6 pt-12 border-t border-gray-100">
                <button type="button" onClick={handleCloseForm} className="px-14 py-5 text-sm font-black text-gray-400 uppercase tracking-widest hover:text-red-600 transition-all rounded-[1.5rem]">{t.cancel}</button>
                <GradientButton type="submit" disabled={loading} className="!px-20 !py-6 text-2xl rounded-[2.5rem] shadow-2xl shadow-blue-100">
                  {loading ? '...' : t.save}
                </GradientButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-8 ${isRtl ? 'font-arabic text-right' : ''}`}>
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-4">{t.title}</h1>
          <div className="flex items-center gap-3 text-gray-500 font-bold">
            <span className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></span>
            {filteredAgencies.length} {t.totalAgencies}
          </div>
        </div>
        
        <div className={`flex flex-col sm:flex-row items-center gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="relative group w-full sm:w-96">
            <span className={`absolute inset-y-0 ${isRtl ? 'right-6' : 'left-6'} flex items-center text-gray-400 group-focus-within:text-blue-600 transition-colors text-xl`}>🔍</span>
            <input type="text" placeholder={t.search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full ${isRtl ? 'pr-16 pl-6 text-right' : 'pl-16 pr-6'} py-5 bg-white border-2 border-gray-100 focus:border-blue-600 rounded-[2.2rem] text-lg font-bold transition-all outline-none shadow-sm hover:shadow-2xl`} />
          </div>
          <GradientButton onClick={() => handleOpenForm()} className="w-full sm:w-auto !py-5 !px-12 text-xl shadow-blue-200 hover:scale-105 transition-transform">
            <span className="text-2xl">+</span> {t.addBtn}
          </GradientButton>
        </div>
      </div>

      {filteredAgencies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredAgencies.map((agency) => (
            <div key={agency.id} className="group bg-white rounded-[4rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden hover:shadow-[0_40px_100px_-20px_rgba(59,130,246,0.15)] hover:-translate-y-4 transition-all duration-700 flex flex-col">
              <div className="p-10 flex flex-col h-full">
                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-4xl mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">🏢</div>
                <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-tight mb-4">{agency.name}</h3>
                <div className="space-y-4 mb-10 flex-1">
                  <div className="flex items-start gap-4"><span className="text-gray-400 mt-1">📍</span><p className="text-sm font-bold text-gray-500 leading-relaxed">{agency.address}</p></div>
                  {agency.phone && <div className="flex items-center gap-4"><span className="text-gray-400">📞</span><p className="text-sm font-bold text-gray-500">{agency.phone}</p></div>}
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleOpenForm(agency)} className="flex-1 py-4.5 bg-gray-50 hover:bg-blue-600 hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95">✏️ {t.edit}</button>
                  <button onClick={() => setActiveModal({ type: 'delete', agency })} className="flex-1 py-4.5 bg-gray-50 hover:bg-red-600 hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95">🗑️ {t.delete}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100">
          <span className="text-6xl mb-6 block">🏙️</span>
          <p className="text-xl font-black text-gray-400 uppercase tracking-widest">{t.noAgencies}</p>
        </div>
      )}

      {activeModal.type === 'delete' && activeModal.agency && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl animate-scale-in p-12 text-center">
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 animate-bounce">⚠️</div>
            <h3 className="text-2xl font-black text-gray-900 mb-4">{t.confirmDelete}</h3>
            <p className="text-gray-500 font-bold mb-10 leading-relaxed">{activeModal.agency.name}<br/><span className="text-xs uppercase tracking-widest opacity-60 font-black">{activeModal.agency.address}</span></p>
            <div className="flex gap-4">
              <button onClick={() => setActiveModal({ type: null, agency: null })} className="flex-1 py-5 bg-gray-100 rounded-[1.5rem] font-black text-gray-500 hover:bg-gray-200 transition-all uppercase text-xs tracking-widest">{t.cancel}</button>
              <button onClick={() => handleDelete(activeModal.agency!.id)} className="flex-1 py-5 bg-red-600 rounded-[1.5rem] font-black text-white hover:bg-red-700 transition-all shadow-xl shadow-red-100 uppercase text-xs tracking-widest">{t.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgenciesPage;
