
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Language, Vehicle, Agency } from '../types';
import { supabase } from '../lib/supabase';
import { apiPost } from '../lib/api';
import GradientButton from '../components/GradientButton';

interface VehiclesPageProps {
  lang: Language;
  initialVehicles: Vehicle[];
  agencies: Agency[];
  onUpdate: () => void;
}

type ModalType = 'details' | 'history' | 'delete' | null;

interface ImageItem {
  id: string;
  url: string;
  isPrincipal: boolean;
}

const VehiclesPage: React.FC<VehiclesPageProps> = ({ lang, initialVehicles = [], agencies = [], onUpdate }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [activeModal, setActiveModal] = useState<{ type: ModalType; vehicle: Vehicle | null }>({ type: null, vehicle: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [formImages, setFormImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  
  const isRtl = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // 🚀 Fetch vehicles data efficiently on mount
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await apiPost('/api/from/vehicles/select', { columns: '*' });
        
        if (result?.data) {
          const formatted = result.data.map((v: any) => ({
            id: v.id,
            brand: v.brand,
            model: v.model,
            year: v.year,
            immatriculation: v.immatriculation,
            color: v.color,
            chassisNumber: v.chassis_number,
            fuelType: v.fuel_type,
            transmission: v.transmission,
            seats: v.seats,
            doors: v.doors,
            dailyRate: v.daily_rate,
            weeklyRate: v.weekly_rate,
            monthlyRate: v.monthly_rate,
            deposit: v.deposit,
            status: v.status,
            currentLocation: v.current_location,
            mileage: v.mileage,
            insuranceExpiry: v.insurance_expiry,
            techControlDate: v.tech_control_date,
            insuranceInfo: v.insurance_info,
            mainImage: v.main_image,
            secondaryImages: v.secondary_images || [],
            purchasePrice: v.purchase_price
          }));
          setVehicles(formatted);
        } else {
          setVehicles([]);
        }
      } catch (err) {
        console.error('Failed to load vehicles:', err);
        setError('Erreur lors du chargement des véhicules');
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, []); // ✅ Fetch once on mount only

  const t = {
    fr: {
      title: 'Gestion de Flotte',
      addBtn: 'Ajouter un véhicule',
      search: 'Rechercher par marque, modèle ou plaque...',
      edit: 'Modifier', delete: 'Supprimer', history: 'Historique', details: 'Détails',
      createTitle: 'Nouveau Véhicule', editTitle: 'Modifier le Véhicule',
      save: 'Enregistrer le véhicule', cancel: 'Annuler',
      confirmDelete: 'Voulez-vous vraiment supprimer ce véhicule ?',
      currency: 'DZ',
      generalInfo: 'Informations Générales',
      technicalInfo: 'Fiche Technique',
      pricing: 'Tarification & Caution',
      fleetStatus: 'État de la Flotte',
      adminDocs: 'Documents & Alertes',
      media: 'Media & Photos'
    },
    ar: {
      title: 'إدارة الأسطول',
      addBtn: 'إضافة مركبة',
      search: 'بحث...',
      edit: 'تعديل', delete: 'حذف', history: 'السجل', details: 'التفاصيل',
      createTitle: 'مركبة جديدة', editTitle: 'تعديل المركبة',
      save: 'حفظ المركبة', cancel: 'إلغاء',
      confirmDelete: 'هل أنت متأكد من حذف هذه المركبة؟',
      currency: 'دج',
      generalInfo: 'معلومات عامة',
      technicalInfo: 'البطاقة التقنية',
      pricing: 'الأسعار والضمان',
      fleetStatus: 'حالة الأسطول',
      adminDocs: 'الوثائق والتنبيهات',
      media: 'الصور والوسائط'
    }
  }[lang];

  const handleOpenForm = (vehicle: Vehicle | null = null) => {
    setEditingVehicle(vehicle);
    if (vehicle) {
      const imgs: ImageItem[] = [
        { id: 'main', url: vehicle.mainImage, isPrincipal: true },
        ...(vehicle.secondaryImages || []).map((url, i) => ({ id: `sec-${i}`, url, isPrincipal: false }))
      ];
      setFormImages(imgs);
    } else {
      setFormImages([]);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingVehicle(null);
    setFormImages([]);
    setError(null);
    setSuccess(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Fix: Added explicit type (file: File) to prevent 'unknown' type error in readAsDataURL
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormImages(prev => [
            ...prev,
            { id: Math.random().toString(36).substr(2, 9), url: reader.result as string, isPrincipal: prev.length === 0 }
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);

    const fd = new FormData(formRef.current);
    const mainImg = formImages.find(img => img.isPrincipal)?.url || '';
    const secondaryImgs = formImages.filter(img => !img.isPrincipal).map(img => img.url);

    const dbData = {
      brand: fd.get('brand') as string,
      model: fd.get('model') as string,
      year: parseInt(fd.get('year') as string),
      immatriculation: fd.get('immatriculation') as string,
      color: fd.get('color') as string,
      chassis_number: fd.get('chassis') as string,
      fuel_type: fd.get('fuel') as string,
      transmission: fd.get('transmission') as string,
      seats: parseInt(fd.get('seats') as string),
      doors: parseInt(fd.get('doors') as string),
      daily_rate: parseFloat(fd.get('dailyRate') as string),
      weekly_rate: parseFloat(fd.get('weeklyRate') as string),
      monthly_rate: parseFloat(fd.get('monthlyRate') as string),
      deposit: parseFloat(fd.get('deposit') as string),
      status: editingVehicle ? (fd.get('status') as string) : 'disponible',
      current_location: fd.get('location') as string,
      mileage: parseInt(fd.get('mileage') as string),
      insurance_expiry: fd.get('expiry') as string,
      tech_control_date: fd.get('techControl') as string,
      insurance_info: fd.get('insuranceInfo') as string,
      main_image: mainImg,
      secondary_images: secondaryImgs.length > 0 ? secondaryImgs : null
    };

    try {
      setError(null);
      setSuccess(null);
      if (editingVehicle) {
        const result = await supabase.from('vehicles').update(dbData).eq('id', editingVehicle.id);
        console.log('[UPDATE Vehicle]', result);
        if (result.error) {
          setError(`Update failed: ${JSON.stringify(result.error)}`);
          return;
        }
        setSuccess('Vehicle updated successfully!');
      } else {
        const result = await supabase.from('vehicles').insert([dbData]);
        console.log('[INSERT Vehicle]', result);
        if (result.error) {
          setError(`Insert failed: ${JSON.stringify(result.error)}`);
          return;
        }
        setSuccess('Vehicle created successfully!');
      }
      setTimeout(() => {
        onUpdate();
        handleCloseForm();
      }, 1000);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(`Error saving vehicle: ${errMsg}`);
      console.error('[SAVE ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('vehicles').delete().eq('id', id);
      onUpdate();
      setActiveModal({ type: null, vehicle: null });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (vehicleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'disponible' ? 'louer' : 'disponible';
    setStatusChangeLoading(vehicleId);
    try {
      const result = await supabase.from('vehicles').update({ status: newStatus }).eq('id', vehicleId);
      if (result.error) {
        console.error('Status update failed:', result.error);
      } else {
        onUpdate();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    } finally {
      setStatusChangeLoading(null);
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.immatriculation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 📊 Show loading state
  if (loading && vehicles.length === 0) {
    return (
      <div className={`p-4 md:p-12 flex items-center justify-center min-h-screen ${isRtl ? 'font-arabic text-right' : ''}`}>
        <div className="text-center">
          <div className="mb-6 inline-block">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-xl font-black text-gray-600">Chargement des véhicules...</p>
        </div>
      </div>
    );
  }

  // ⚠️ Show error state
  if (error && vehicles.length === 0) {
    return (
      <div className={`p-4 md:p-12 flex items-center justify-center min-h-screen ${isRtl ? 'font-arabic text-right' : ''}`}>
        <div className="text-center bg-red-50 p-8 rounded-[2rem] border border-red-200">
          <p className="text-xl font-black text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const SectionHeader = ({ title, icon, color }: { title: string; icon: string; color: string }) => (
    <div className={`flex items-center gap-4 border-b border-gray-100 pb-4 mb-8 ${color}`}>
      <span className="text-3xl">{icon}</span>
      <h3 className="text-xl font-black uppercase tracking-widest">{title}</h3>
    </div>
  );

  if (isFormOpen) {
    return (
      <div className={`p-4 md:p-8 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
        <div className="max-w-6xl mx-auto bg-white rounded-[4rem] shadow-2xl border border-gray-100">
           <div className="p-8 md:p-16">
             <div className="flex items-center justify-between mb-16 border-b border-gray-50 pb-12">
               <h2 className="text-6xl font-black text-gray-900 tracking-tighter">
                {editingVehicle ? t.editTitle : t.createTitle}
               </h2>
               <button onClick={handleCloseForm} className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all text-3xl shadow-inner">✕</button>
             </div>

             {/* Error Notification */}
             {error && (
               <div className="mb-6 p-4 md:p-6 bg-red-50 border-l-4 border-red-500 rounded-lg">
                 <div className="flex items-start justify-between">
                   <div className="flex-1">
                     <h3 className="text-red-800 font-bold text-lg mb-2">❌ Error</h3>
                     <p className="text-red-700 text-sm font-mono break-all">{error}</p>
                   </div>
                   <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700 text-xl">✕</button>
                 </div>
               </div>
             )}

             {/* Success Notification */}
             {success && (
               <div className="mb-6 p-4 md:p-6 bg-green-50 border-l-4 border-green-500 rounded-lg">
                 <div className="flex items-start justify-between">
                   <div className="flex-1">
                     <h3 className="text-green-800 font-bold text-lg mb-2">✅ Success</h3>
                     <p className="text-green-700 text-sm">{success}</p>
                   </div>
                   <button onClick={() => setSuccess(null)} className="ml-4 text-green-500 hover:text-green-700 text-xl">✕</button>
                 </div>
               </div>
             )}
             
             <form ref={formRef} className="space-y-16" onSubmit={handleSave}>
                <section>
                   <SectionHeader title={t.generalInfo} icon="🏷️" color="text-blue-600" />
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase px-4">Marque</label>
                        <input name="brand" defaultValue={editingVehicle?.brand} className="w-full px-8 py-5 bg-gray-50 rounded-3xl outline-none font-black text-lg focus:bg-white border-2 border-transparent focus:border-blue-600 transition-all" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase px-4">Modèle</label>
                        <input name="model" defaultValue={editingVehicle?.model} className="w-full px-8 py-5 bg-gray-50 rounded-3xl outline-none font-black text-lg" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase px-4">Immatriculation</label>
                        <input name="immatriculation" defaultValue={editingVehicle?.immatriculation} className="w-full px-8 py-5 bg-gray-50 rounded-3xl font-black text-lg" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase px-4">Année</label>
                        <input name="year" type="number" defaultValue={editingVehicle?.year} className="w-full px-8 py-5 bg-gray-50 rounded-3xl font-black text-lg" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase px-4">Couleur</label>
                        <input name="color" defaultValue={editingVehicle?.color} className="w-full px-8 py-5 bg-gray-50 rounded-3xl font-black text-lg" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase px-4">VIN</label>
                        <input name="chassis" defaultValue={editingVehicle?.chassisNumber} className="w-full px-8 py-5 bg-gray-50 rounded-3xl font-black text-lg" />
                      </div>
                   </div>
                </section>

                <section>
                   <SectionHeader title={t.technicalInfo} icon="⚙️" color="text-indigo-600" />
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase px-4">Énergie</label>
                        <select name="fuel" defaultValue={editingVehicle?.fuelType} className="w-full px-8 py-5 bg-gray-50 rounded-3xl font-black">
                          <option value="essence">Essence</option><option value="diesel">Diesel</option><option value="gpl">GPL</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase px-4">Boîte</label>
                        <select name="transmission" defaultValue={editingVehicle?.transmission} className="w-full px-8 py-5 bg-gray-50 rounded-3xl font-black">
                          <option value="manuelle">Manuelle</option><option value="automatique">Automatique</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase px-4">Places</label>
                        <input name="seats" type="number" defaultValue={editingVehicle?.seats} className="w-full px-8 py-5 bg-gray-50 rounded-3xl font-black" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase px-4">Portes</label>
                        <input name="doors" type="number" defaultValue={editingVehicle?.doors} className="w-full px-8 py-5 bg-gray-50 rounded-3xl font-black" />
                      </div>
                   </div>
                </section>

                <section>
                   <SectionHeader title={t.pricing} icon="💰" color="text-green-600" />
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-green-600 uppercase px-4">Prix/Jour</label>
                        <input name="dailyRate" type="number" defaultValue={editingVehicle?.dailyRate} className="w-full px-8 py-5 bg-green-50 rounded-3xl font-black border-2 border-transparent focus:border-green-600 outline-none" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase px-4">Prix/Semaine</label>
                        <input name="weeklyRate" type="number" defaultValue={editingVehicle?.weeklyRate} className="w-full px-8 py-5 bg-gray-50 rounded-3xl font-black" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase px-4">Prix/Mois</label>
                        <input name="monthlyRate" type="number" defaultValue={editingVehicle?.monthlyRate} className="w-full px-8 py-5 bg-gray-50 rounded-3xl font-black" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase px-4">Caution</label>
                        <input name="deposit" type="number" defaultValue={editingVehicle?.deposit} className="w-full px-8 py-5 bg-gray-900 text-white rounded-3xl font-black" />
                      </div>
                   </div>
                </section>

                <section>
                   <SectionHeader title={t.media} icon="📸" color="text-purple-600" />
                   <div className="bg-gray-50 p-12 rounded-[3.5rem] border-4 border-dashed border-gray-100 flex flex-col items-center text-center">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 w-full">
                         {formImages.map(img => (
                           <div key={img.id} className="relative group aspect-video rounded-[2rem] overflow-hidden border-4 border-white shadow-lg">
                              <img src={img.url} className="w-full h-full object-cover" />
                              {img.isPrincipal && <div className="absolute top-2 left-2 bg-blue-600 text-white text-[8px] px-2 py-1 rounded-lg uppercase font-black">Principale</div>}
                              <button type="button" onClick={() => setFormImages(formImages.filter(i => i.id !== img.id))} className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-black">Supprimer</button>
                           </div>
                         ))}
                      </div>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="px-10 py-4 bg-white text-blue-600 rounded-2xl font-black uppercase text-xs shadow-xl">+ Ajouter des photos</button>
                      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleImageUpload} />
                   </div>
                </section>

                <div className="flex justify-end gap-6 pt-12 border-t border-gray-100">
                  <button type="button" onClick={handleCloseForm} className="px-14 py-5 text-sm font-black text-gray-400 uppercase tracking-widest hover:text-red-600 transition-all">Annuler</button>
                  <GradientButton type="submit" disabled={loading} className="!px-24 !py-7 text-3xl rounded-[2.5rem] shadow-2xl">
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
    <div className={`p-4 md:p-8 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-10 mb-20 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-6xl font-black text-gray-900 tracking-tighter mb-4">{t.title}</h1>
          <div className="flex items-center gap-3 text-gray-500 font-bold uppercase text-xs tracking-widest">
            <span className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></span>
            {filteredVehicles.length} Véhicules en stock
          </div>
        </div>
        <div className={`flex flex-col sm:flex-row items-center gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <input type="text" placeholder={t.search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-[450px] py-6 px-8 bg-white border-2 border-gray-100 focus:border-blue-600 rounded-[3rem] text-lg font-bold shadow-sm outline-none" />
          <GradientButton onClick={() => handleOpenForm()} className="w-full sm:w-auto !py-6 !px-14 text-2xl shadow-xl">+ {t.addBtn}</GradientButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 md:gap-12">
        {filteredVehicles.map((v) => (
          <div key={v.id} className="group bg-white rounded-[3rem] md:rounded-[4rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden hover:shadow-[0_50px_120px_-30px_rgba(59,130,246,0.15)] hover:-translate-y-4 transition-all duration-700 flex flex-col h-full">
            <div className="relative h-56 md:h-72 overflow-hidden">
               <img src={v.mainImage} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="Car" />
               <button onClick={() => handleToggleStatus(v.id, v.status)} disabled={statusChangeLoading === v.id} className={`absolute top-4 md:top-6 left-4 md:left-6 px-4 md:px-5 py-2 rounded-2xl text-[8px] md:text-[9px] font-black uppercase text-white shadow-xl transition-all ${
                 statusChangeLoading === v.id ? 'opacity-50' : 'hover:scale-110 cursor-pointer'
               } ${
                 v.status === 'disponible' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
               }`}>
                 {statusChangeLoading === v.id ? '⏳' : (v.status === 'disponible' ? '✅ Disponible' : '❌ Loué')}
               </button>
            </div>
            <div className="p-6 md:p-10 flex flex-col flex-1">
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight truncate mb-6 md:mb-8">{v.brand} {v.model}</h3>
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-10">
                <div className="p-4 md:p-5 bg-gray-50 rounded-[1.5rem] md:rounded-[2rem] text-center"><p className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase">Kilométrage</p><p className="font-black text-sm md:text-base">{v.mileage} KM</p></div>
                <div className="p-4 md:p-5 bg-blue-50 rounded-[1.5rem] md:rounded-[2rem] text-center"><p className="text-[7px] md:text-[8px] font-black text-blue-600 uppercase">Prix/Jour</p><p className="font-black text-blue-600 text-sm md:text-base">{v.dailyRate} DZ</p></div>
              </div>
              <div className="mt-auto space-y-3 md:space-y-4 pt-4 md:pt-4 border-t border-gray-50">
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <button onClick={() => setActiveModal({ type: 'details', vehicle: v })} className="py-3 md:py-4 rounded-xl md:rounded-2xl bg-blue-50 text-blue-600 font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-blue-600 hover:text-white transition-all">🔍 {t.details}</button>
                  <button onClick={() => handleOpenForm(v)} className="py-3 md:py-4 rounded-xl md:rounded-2xl bg-gray-50 text-gray-500 font-black uppercase text-[9px] md:text-[10px] hover:bg-indigo-600 hover:text-white transition-all">✏️ {t.edit}</button>
                </div>
                <button onClick={() => setActiveModal({ type: 'delete', vehicle: v })} className="w-full py-3 md:py-4 bg-red-50 text-red-600 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] hover:bg-red-600 hover:text-white transition-all">🗑️ {t.delete}</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeModal.type === 'delete' && activeModal.vehicle && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-12 text-center">
              <h3 className="text-2xl font-black text-gray-900 mb-4">{t.confirmDelete}</h3>
              <div className="flex gap-4">
                <button onClick={() => setActiveModal({ type: null, vehicle: null })} className="flex-1 py-5 bg-gray-100 rounded-[1.5rem] font-black uppercase text-[10px]">Annuler</button>
                <button onClick={() => handleDelete(activeModal.vehicle!.id)} className="flex-1 py-5 bg-red-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] shadow-xl">Supprimer</button>
              </div>
           </div>
        </div>
      )}

      {activeModal.type === 'details' && activeModal.vehicle && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
           <div className="bg-white w-full max-w-7xl rounded-[2.5rem] md:rounded-[4rem] shadow-2xl p-4 md:p-8 my-6 animate-scale-in">
              {/* Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                <div className="flex-1">
                  <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-1">{activeModal.vehicle.brand} {activeModal.vehicle.model}</h2>
                  <p className="text-sm md:text-base text-gray-500 font-bold">🆔 {activeModal.vehicle.immatriculation} • 📅 {activeModal.vehicle.year}</p>
                </div>
                <button onClick={() => setActiveModal({ type: null, vehicle: null })} className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all text-2xl">✕</button>
              </div>

              {/* Main Content - Two Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                
                {/* LEFT SIDE - IMAGES */}
                <div className="space-y-4">
                  {/* Main Image */}
                  {activeModal.vehicle.mainImage && (
                    <div className="rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                      <img src={activeModal.vehicle.mainImage} alt="Main" className="w-full aspect-video object-cover" />
                    </div>
                  )}

                  {/* Gallery */}
                  {activeModal.vehicle.secondaryImages && activeModal.vehicle.secondaryImages.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📸</span>
                        <h3 className="text-sm font-black text-gray-600 uppercase tracking-wider">Gallery</h3>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {activeModal.vehicle.secondaryImages.map((img, i) => (
                          <div key={i} className="rounded-[1.2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all border-2 border-white">
                            <img src={img} alt={`Gallery ${i}`} className="w-full aspect-square object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT SIDE - INFORMATION */}
                <div className="space-y-6 overflow-y-auto max-h-[600px] md:max-h-[700px] pr-2">
                  
                  {/* General Info Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[1.5rem] p-5 border-l-4 border-blue-600">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">🏷️</span>
                      <h3 className="text-sm font-black text-blue-900 uppercase">General Info</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="text-[8px] text-blue-600 font-black uppercase mb-1">📅 Year</p><p className="text-lg font-black text-gray-900">{activeModal.vehicle.year}</p></div>
                      <div><p className="text-[8px] text-blue-600 font-black uppercase mb-1">🎨 Color</p><p className="text-lg font-black text-gray-900 capitalize">{activeModal.vehicle.color}</p></div>
                      <div><p className="text-[8px] text-blue-600 font-black uppercase mb-1">🛞 Mileage</p><p className="text-lg font-black text-gray-900">{activeModal.vehicle.mileage} KM</p></div>
                      <div><p className="text-[8px] text-blue-600 font-black uppercase mb-1">📍 Location</p><p className="text-base font-black text-gray-900">{activeModal.vehicle.currentLocation}</p></div>
                    </div>
                  </div>

                  {/* Technical Card */}
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-[1.5rem] p-5 border-l-4 border-indigo-600">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">⚙️</span>
                      <h3 className="text-sm font-black text-indigo-900 uppercase">Technical</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="text-[8px] text-indigo-600 font-black uppercase mb-1">🔖 Registration</p><p className="text-sm font-black text-gray-900">{activeModal.vehicle.immatriculation}</p></div>
                      <div><p className="text-[8px] text-indigo-600 font-black uppercase mb-1">🪪 VIN</p><p className="text-xs font-black text-gray-900 break-all">{activeModal.vehicle.chassisNumber || 'N/A'}</p></div>
                      <div><p className="text-[8px] text-indigo-600 font-black uppercase mb-1">⛽ Fuel</p><p className="text-sm font-black text-gray-900 uppercase">{activeModal.vehicle.fuelType}</p></div>
                      <div><p className="text-[8px] text-indigo-600 font-black uppercase mb-1">🔄 Transmission</p><p className="text-sm font-black text-gray-900 uppercase">{activeModal.vehicle.transmission}</p></div>
                      <div><p className="text-[8px] text-indigo-600 font-black uppercase mb-1">👥 Seats</p><p className="text-sm font-black text-gray-900">{activeModal.vehicle.seats}</p></div>
                      <div><p className="text-[8px] text-indigo-600 font-black uppercase mb-1">🚪 Doors</p><p className="text-sm font-black text-gray-900">{activeModal.vehicle.doors}</p></div>
                    </div>
                  </div>

                  {/* Pricing Card */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-[1.5rem] p-5 border-l-4 border-green-600">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">💰</span>
                      <h3 className="text-sm font-black text-green-900 uppercase">Pricing</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-3"><p className="text-[7px] text-green-600 font-black uppercase mb-1">💵 Daily</p><p className="text-lg font-black text-green-600">{activeModal.vehicle.dailyRate} DZ</p></div>
                      <div className="bg-white rounded-xl p-3"><p className="text-[7px] text-gray-500 font-black uppercase mb-1">📅 Weekly</p><p className="text-lg font-black text-gray-900">{activeModal.vehicle.weeklyRate} DZ</p></div>
                      <div className="bg-white rounded-xl p-3"><p className="text-[7px] text-gray-500 font-black uppercase mb-1">📆 Monthly</p><p className="text-lg font-black text-gray-900">{activeModal.vehicle.monthlyRate} DZ</p></div>
                      <div className="bg-gray-900 text-white rounded-xl p-3"><p className="text-[7px] font-black uppercase opacity-70 mb-1">🔐 Deposit</p><p className="text-lg font-black">{activeModal.vehicle.deposit} DZ</p></div>
                    </div>
                  </div>

                  {/* Status Card */}
                  <div className={`rounded-[1.5rem] p-5 border-l-4 ${
                    activeModal.vehicle.status === 'disponible' 
                      ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-600' 
                      : 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-600'
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">{activeModal.vehicle.status === 'disponible' ? '✅' : '❌'}</span>
                      <h3 className={`text-sm font-black uppercase ${activeModal.vehicle.status === 'disponible' ? 'text-emerald-900' : 'text-rose-900'}`}>Status</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className={`text-[8px] font-black uppercase mb-1 ${activeModal.vehicle.status === 'disponible' ? 'text-emerald-600' : 'text-rose-600'}`}>🚗 Fleet</p><p className={`text-lg font-black ${activeModal.vehicle.status === 'disponible' ? 'text-emerald-700' : 'text-rose-700'}`}>{activeModal.vehicle.status.toUpperCase()}</p></div>
                      <div><p className="text-[8px] text-gray-500 font-black uppercase mb-1">🛡️ Insurance</p><p className="text-sm font-black text-gray-900">{activeModal.vehicle.insuranceExpiry || 'N/A'}</p></div>
                    </div>
                    {activeModal.vehicle.techControlDate && <div className="mt-3"><p className="text-[8px] text-gray-500 font-black uppercase mb-1">🔧 Tech Control</p><p className="text-sm font-black text-gray-900">{activeModal.vehicle.techControlDate}</p></div>}
                  </div>

                  {/* Insurance Info */}
                  {activeModal.vehicle.insuranceInfo && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-[1.5rem] p-5 border-l-4 border-purple-600">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🛡️</span>
                        <h3 className="text-sm font-black text-purple-900 uppercase">Insurance Info</h3>
                      </div>
                      <p className="text-xs text-gray-700 font-bold leading-relaxed break-words">{activeModal.vehicle.insuranceInfo}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
                <button onClick={() => setActiveModal({ type: null, vehicle: null })} className="px-8 py-3 text-sm font-black text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-all">
                  Close
                </button>
                <button onClick={() => { handleOpenForm(activeModal.vehicle); setActiveModal({ type: null, vehicle: null }); }} className="px-10 py-3 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-sm hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl">
                  ✏️ Edit Vehicle
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default VehiclesPage;
