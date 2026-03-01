
import React, { useState, useMemo } from 'react';
import { Language, Expense, Maintenance, Vehicle } from '../types';
import { supabase } from '../lib/supabase';
import GradientButton from '../components/GradientButton';

interface ExpensesPageProps { 
  lang: Language; 
  initialExpenses: Expense[];
  initialMaintenances: Maintenance[];
  initialVehicles: Vehicle[];
  onUpdate: () => void;
}

const ExpensesPage: React.FC<ExpensesPageProps> = ({ lang, initialExpenses, initialMaintenances, initialVehicles, onUpdate }) => {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [maintenances, setMaintenances] = useState<Maintenance[]>(initialMaintenances);
  const [activeTab, setActiveTab] = useState<'store' | 'vehicle'>('store');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [maintenanceType, setMaintenanceType] = useState<string>('vidange');
  const [vehicleFilter, setVehicleFilter] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [nextVidangeKm, setNextVidangeKm] = useState<number>(0);

  const isRtl = lang === 'ar';

  const t = {
    fr: {
      storeTitle: 'Dépenses du Magasin',
      vehicleTitle: 'Entretien & Frais Véhicules',
      addExpense: 'Nouvelle Dépense',
      addMaintenance: 'Nouvel Entretien',
      expenseName: 'Nom de la dépense',
      cost: 'Coût',
      date: 'Date',
      expiryDate: 'Date d\'expiration',
      vehicle: 'Véhicule',
      type: 'Type',
      note: 'Note (optionnel)',
      save: 'Enregistrer',
      cancel: 'Annuler',
      edit: 'Modifier',
      delete: 'Supprimer',
      currency: 'DZ',
      vidange: 'Vidange',
      assurance: 'Assurance',
      ct: 'Contrôle Technique',
      other: 'Autre',
      confirmDelete: 'Voulez-vous supprimer cette entrée ?'
    },
    ar: {
      storeTitle: 'مصاريف المحل',
      vehicleTitle: 'صيانة ومصاريف السيارات',
      addExpense: 'مصروف جديد',
      addMaintenance: 'صيانة جديدة',
      expenseName: 'اسم المصروف',
      cost: 'التكلفة',
      date: 'التاريخ',
      expiryDate: 'تاريخ الانتهاء',
      vehicle: 'المركبة',
      type: 'النوع',
      note: 'ملاحظة (اختياري)',
      save: 'حفظ',
      cancel: 'إلغاء',
      edit: 'تعديل',
      delete: 'حذف',
      currency: 'دج',
      vidange: 'تغيير الزيت',
      assurance: 'التأمين',
      ct: 'الفحص التقني',
      other: 'أخرى',
      confirmDelete: 'هل أنت متأكد من الحذف؟'
    }
  };

  const currentT = t[lang];

  const handleOpenForm = (item: any = null) => {
    setEditingItem(item);
    setMaintenanceType(item?.type || 'vidange');
    setSelectedVehicleId(item?.vehicle_id || item?.vehicleId || '');
    setNextVidangeKm(item?.next_vidange_km || 0);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: string, tab: 'store' | 'vehicle') => {
    if (confirm(currentT.confirmDelete)) {
      try {
        const tableName = tab === 'store' ? 'expenses' : 'maintenance';
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        
        if (!error) {
          if (tab === 'store') {
            setExpenses(expenses.filter(e => e.id !== id));
          } else {
            setMaintenances(maintenances.filter(m => m.id !== id));
          }
          onUpdate();
        } else {
          console.error('Error deleting:', error);
        }
      } catch (err) {
        console.error('Error deleting item:', err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      if (activeTab === 'store') {
        const dateValue = data.date as string;
        // Ensure date is in YYYY-MM-DD format
        const formattedDate = dateValue && dateValue.includes('T') ? dateValue.split('T')[0] : dateValue;
        
        const expenseData = {
          name: data.name as string,
          cost: Number(data.cost),
          date: formattedDate
        };

        if (editingItem?.id) {
          const { error } = await supabase
            .from('expenses')
            .update(expenseData)
            .eq('id', editingItem.id);
          
          if (!error) {
            setExpenses(expenses.map(exp => exp.id === editingItem.id ? { ...exp, ...expenseData, id: editingItem.id } : exp));
            handleCloseForm();
            onUpdate();
          } else {
            console.error('Error updating:', error);
            alert('Erreur lors de la mise à jour');
          }
        } else {
          const newId = crypto.randomUUID();
          const { error } = await supabase
            .from('expenses')
            .insert([{ ...expenseData, id: newId }]);
          
          if (!error) {
            setExpenses([...expenses, { ...expenseData, id: newId } as any]);
            handleCloseForm();
            onUpdate();
          } else {
            console.error('Error inserting:', error);
            alert('Erreur lors de l\'ajout');
          }
        }
      } else {
        const type = data.type as any;
        const selectedVehicle = initialVehicles.find(v => v.id === (data.vehicleId as string));
        const currentMileage = selectedVehicle?.mileage || 0;
        
        const dateValue = data.date as string;
        const formattedDate = dateValue && dateValue.includes('T') ? dateValue.split('T')[0] : dateValue;
        const expiryDateValue = data.expiryDate as string;
        const formattedExpiryDate = expiryDateValue && expiryDateValue.includes('T') ? expiryDateValue.split('T')[0] : expiryDateValue;
        
        const maintenanceData: any = {
          vehicle_id: data.vehicleId as string,
          type: type,
          name: type === 'other' ? (data.name as string) : (currentT[type as keyof typeof currentT] as string),
          cost: Number(data.cost),
          date: formattedDate,
          note: data.note as string
        };

        // Add expiry date only for non-vidange items
        if (type !== 'vidange' && type !== 'other') {
          maintenanceData.expiry_date = formattedExpiryDate;
        }

        // Add next vidange kilometers only for vidange
        if (type === 'vidange') {
          maintenanceData.next_vidange_km = currentMileage + Number(data.nextVidangeKm || 0);
        }

        if (editingItem?.id) {
          const { error } = await supabase
            .from('maintenance')
            .update(maintenanceData)
            .eq('id', editingItem.id);
          
          if (!error) {
            setMaintenances(maintenances.map(m => m.id === editingItem.id ? { ...m, ...maintenanceData } : m));
            handleCloseForm();
            onUpdate();
          } else {
            console.error('Error updating:', error);
            alert('Erreur lors de la mise à jour');
          }
        } else {
          const newId = crypto.randomUUID();
          const { error } = await supabase
            .from('maintenance')
            .insert([{ ...maintenanceData, id: newId }]);
          
          if (!error) {
            setMaintenances([...maintenances, { ...maintenanceData, id: newId } as any]);
            handleCloseForm();
            onUpdate();
          } else {
            console.error('Error inserting:', error);
            alert('Erreur lors de l\'ajout');
          }
        }
      }
      
      handleCloseForm();
    } catch (err) {
      console.error('Error saving:', err);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const filteredMaintenances = useMemo(() => {
    if (!vehicleFilter || vehicleFilter.trim() === '') return maintenances;
    const q = vehicleFilter.toLowerCase();
    const matchedVehicleIds = initialVehicles
      .filter(v => {
        const name = `${v.brand} ${v.model}`.toLowerCase();
        const plate = (v.immatriculation || '').toLowerCase();
        const chassis = ((v as any).chassisNumber || '').toLowerCase();
        return name.includes(q) || plate.includes(q) || chassis.includes(q);
      })
      .map(v => v.id);
    return maintenances.filter(m => matchedVehicleIds.includes(m.vehicleId));
  }, [vehicleFilter, maintenances, initialVehicles]);

  const totalForVehicle = useMemo(() => filteredMaintenances.reduce((s, m) => s + (m.cost || 0), 0), [filteredMaintenances]);

  return (
    <div className={`p-8 ${isRtl ? 'font-arabic text-right' : ''}`}>
      <div className="flex gap-4 mb-12">
        <button onClick={() => setActiveTab('store')} className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'store' ? 'bg-blue-600 text-white shadow-xl' : 'bg-white text-gray-400 border border-gray-100'}`}>
          🏪 {currentT.storeTitle}
        </button>
        <button onClick={() => setActiveTab('vehicle')} className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'vehicle' ? 'bg-blue-600 text-white shadow-xl' : 'bg-white text-gray-400 border border-gray-100'}`}>
          🚗 {currentT.vehicleTitle}
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-black text-gray-900">{activeTab === 'store' ? currentT.storeTitle : currentT.vehicleTitle}</h1>
        <GradientButton onClick={() => handleOpenForm()}>
          {activeTab === 'store' ? currentT.addExpense : currentT.addMaintenance}
        </GradientButton>
      </div>

      {activeTab === 'vehicle' && (
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Rechercher véhicule (marque, modèle ou immatriculation)"
            value={vehicleFilter}
            onChange={e => setVehicleFilter(e.target.value)}
            className="w-full md:w-2/3 px-6 py-4 rounded-2xl bg-white border border-gray-100 outline-none font-bold"
          />

          <div className="w-full md:w-auto bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Dépenses</p>
            <p className="text-2xl font-black text-gray-900">{totalForVehicle.toLocaleString()} <span className="text-sm font-bold opacity-40">{currentT.currency}</span></p>
            <p className="text-xs text-gray-500 mt-1">Affiché: {filteredMaintenances.length} entrée(s)</p>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 overflow-y-auto max-h-[95vh]">
            <div className={`flex items-center gap-3 mb-8 pb-6 border-b-4 ${activeTab === 'store' ? 'border-blue-400' : 'border-orange-400'}`}>
              <div className={`p-3 rounded-2xl text-3xl ${activeTab === 'store' ? 'bg-blue-100' : 'bg-orange-100'}`}>{activeTab === 'store' ? '🏪' : '🚗'}</div>
              <h2 className={`text-2xl font-black ${activeTab === 'store' ? 'text-blue-900' : 'text-orange-900'}`}>{editingItem ? currentT.edit : (activeTab === 'store' ? `💳 ${currentT.addExpense}` : `🔧 ${currentT.addMaintenance}`)}</h2>
            </div>
            <form className="space-y-6" onSubmit={handleSave}>
              {activeTab === 'store' ? (
                <>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border-2 border-blue-200">
                    <label className="block text-[10px] font-black text-blue-700 uppercase tracking-widest mb-3">📝 {currentT.expenseName}</label>
                    <input name="name" type="text" defaultValue={editingItem?.name} required className="w-full px-6 py-4 bg-white rounded-xl outline-none font-bold border-2 border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border-2 border-green-200">
                      <label className="block text-[10px] font-black text-green-700 uppercase tracking-widest mb-3">💵 {currentT.cost}</label>
                      <input name="cost" type="number" defaultValue={editingItem?.cost} required className="w-full px-6 py-4 bg-white rounded-xl outline-none font-bold border-2 border-green-300 focus:border-green-600 focus:ring-2 focus:ring-green-200" />
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border-2 border-purple-200">
                      <label className="block text-[10px] font-black text-purple-700 uppercase tracking-widest mb-3">📅 {currentT.date}</label>
                      <input name="date" type="date" defaultValue={editingItem?.date} required className="w-full px-6 py-4 bg-white rounded-xl outline-none font-bold border-2 border-purple-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-200" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border-2 border-red-200">
                    <label className="block text-[10px] font-black text-red-700 uppercase tracking-widest mb-3">🚗 {currentT.vehicle}</label>
                    <select name="vehicleId" value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)} required className="w-full px-6 py-4 bg-white rounded-xl outline-none font-bold border-2 border-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-200">
                      <option value="">-- Sélectionner un véhicule --</option>
                      {initialVehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.immatriculation})</option>)}
                    </select>
                    {selectedVehicleId && (
                      <div className="mt-4 p-5 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-xl border-2 border-indigo-300 shadow-sm">
                        <p className="text-[10px] font-black text-indigo-700 uppercase mb-2">⏱️ Kilométrage Actuel</p>
                        <p className="text-3xl font-black text-indigo-900">{initialVehicles.find(v => v.id === selectedVehicleId)?.mileage || 0} <span className="text-sm font-bold text-indigo-600">KM</span></p>
                      </div>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border-2 border-orange-200">
                    <label className="block text-[10px] font-black text-orange-700 uppercase tracking-widest mb-3">🔧 {currentT.type}</label>
                    <select name="type" value={maintenanceType} onChange={(e) => setMaintenanceType(e.target.value)} className="w-full px-6 py-4 bg-white rounded-xl outline-none font-bold border-2 border-orange-300 focus:border-orange-600 focus:ring-2 focus:ring-orange-200">
                      <option value="vidange">🛢️ {currentT.vidange}</option>
                      <option value="assurance">🛡️ {currentT.assurance}</option>
                      <option value="ct">🛠️ {currentT.ct}</option>
                      <option value="other">❓ {currentT.other}</option>
                    </select>
                  </div>
                  {maintenanceType === 'other' ? (
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border-2 border-yellow-200">
                      <label className="block text-[10px] font-black text-yellow-700 uppercase tracking-widest mb-3">📝 {currentT.expenseName}</label>
                      <input name="name" type="text" defaultValue={editingItem?.name} required className="w-full px-6 py-4 bg-white rounded-xl outline-none font-bold border-2 border-yellow-300 focus:border-yellow-600 focus:ring-2 focus:ring-yellow-200" />
                    </div>
                  ) : null}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border-2 border-green-200">
                      <label className="block text-[10px] font-black text-green-700 uppercase tracking-widest mb-3">💵 {currentT.cost}</label>
                      <input name="cost" type="number" defaultValue={editingItem?.cost} required className="w-full px-6 py-4 bg-white rounded-xl outline-none font-bold border-2 border-green-300 focus:border-green-600 focus:ring-2 focus:ring-green-200" />
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border-2 border-purple-200">
                      <label className="block text-[10px] font-black text-purple-700 uppercase tracking-widest mb-3">📅 {currentT.date}</label>
                      <input name="date" type="date" defaultValue={editingItem?.date} required className="w-full px-6 py-4 bg-white rounded-xl outline-none font-bold border-2 border-purple-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-200" />
                    </div>
                  </div>
                  {maintenanceType === 'vidange' && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border-2 border-orange-300">
                      <label className="block text-[10px] font-black text-orange-700 uppercase tracking-widest mb-3">↩️ Km pour Prochaine Vidange</label>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <input name="nextVidangeKm" type="number" value={nextVidangeKm} onChange={(e) => setNextVidangeKm(Number(e.target.value))} placeholder="Ajouter km" className="w-full px-6 py-4 bg-white rounded-xl outline-none font-bold border-2 border-orange-300 focus:border-orange-600 focus:ring-2 focus:ring-orange-200" />
                        </div>
                        <div className="flex-1 p-4 bg-gradient-to-br from-orange-200 to-amber-100 rounded-2xl border-3 border-orange-400 text-center shadow-lg">
                          <p className="text-[8px] font-black text-orange-800 uppercase">🏁 Prochain</p>
                          <p className="text-2xl font-black text-orange-900">{selectedVehicleId ? (initialVehicles.find(v => v.id === selectedVehicleId)?.mileage || 0) + nextVidangeKm : 0} <span className="text-xs font-bold">KM</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                  {(maintenanceType === 'assurance' || maintenanceType === 'ct') && (
                    <div className={`bg-gradient-to-br ${maintenanceType === 'assurance' ? 'from-blue-50 to-cyan-100 border-blue-200 text-blue-700' : 'from-red-50 to-rose-100 border-red-200 text-red-700'} p-6 rounded-2xl border-2`}>
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${maintenanceType === 'assurance' ? 'text-blue-700' : 'text-red-700'}`}>{maintenanceType === 'assurance' ? '🛡️' : '🛠️'} {currentT.expiryDate}</label>
                      <input name="expiryDate" type="date" defaultValue={editingItem?.expiry_date} required className={`w-full px-6 py-4 bg-white rounded-xl outline-none font-bold border-2 ${maintenanceType === 'assurance' ? 'border-blue-300 focus:border-blue-600 focus:ring-blue-200' : 'border-red-300 focus:border-red-600 focus:ring-red-200'} focus:ring-2`} />
                    </div>
                  )}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border-2 border-slate-200">
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-3">📄 {currentT.note}</label>
                    <textarea name="note" defaultValue={editingItem?.note} className="w-full px-6 py-4 bg-white rounded-xl outline-none font-bold h-24 border-2 border-slate-300 focus:border-slate-600 focus:ring-2 focus:ring-slate-200"></textarea>
                  </div>
                </>
              )}
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={handleCloseForm} className="px-8 py-4 font-black text-gray-400 uppercase tracking-widest">{currentT.cancel}</button>
                <GradientButton type="submit">{currentT.save}</GradientButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activeTab === 'store' ? (
          expenses.map(exp => (
            <div key={exp.id} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[2.5rem] p-8 border-3 border-blue-300 shadow-lg hover:shadow-2xl transition-all group hover:scale-105 transform">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl flex items-center justify-center text-4xl shadow-lg">💳</div>
                <div className="text-right">
                  <p className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{exp.cost.toLocaleString()} <span className="text-sm font-bold opacity-60 text-gray-600">{currentT.currency}</span></p>
                  <p className="text-xs font-bold text-blue-600 mt-1">📅 {exp.date}</p>
                </div>
              </div>
              <h3 className="text-lg font-black text-blue-900 mb-6 line-clamp-2">💰 {exp.name}</h3>
              <div className="flex gap-3">
                <button onClick={() => handleOpenForm(exp)} className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:shadow-lg transition-all transform hover:scale-105">✏️ {currentT.edit}</button>
                <button onClick={() => handleDelete(exp.id, 'store')} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:shadow-lg transition-all transform hover:scale-105">🗑️ {currentT.delete}</button>
              </div>
            </div>
          ))
        ) : (
          filteredMaintenances.map(m => {
            const v = initialVehicles.find(veh => veh.id === m.vehicleId || veh.id === m.vehicle_id);
            const cardConfig = {
              vidange: { bg: 'from-orange-50 to-amber-100', border: 'border-orange-400', titleColor: 'text-orange-900', emoji: '🛢️', colorClass: 'from-orange-400 to-orange-600' },
              assurance: { bg: 'from-blue-50 to-cyan-100', border: 'border-blue-400', titleColor: 'text-blue-900', emoji: '🛡️', colorClass: 'from-blue-400 to-blue-600' },
              ct: { bg: 'from-red-50 to-rose-100', border: 'border-red-400', titleColor: 'text-red-900', emoji: '🛠️', colorClass: 'from-red-400 to-red-600' },
              other: { bg: 'from-purple-50 to-purple-100', border: 'border-purple-400', titleColor: 'text-purple-900', emoji: '❓', colorClass: 'from-purple-400 to-purple-600' }
            };
            const config = cardConfig[m.type as keyof typeof cardConfig] || cardConfig.other;
            return (
              <div key={m.id} className={`bg-gradient-to-br ${config.bg} rounded-[2.5rem] p-8 border-3 ${config.border} shadow-lg hover:shadow-2xl transition-all group hover:scale-105 transform`}>
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${config.colorClass} text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg`}>
                    {config.emoji}
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-black bg-gradient-to-r ${config.colorClass} bg-clip-text text-transparent`}>{m.cost.toLocaleString()} <span className="text-sm font-bold opacity-60 text-gray-600">{currentT.currency}</span></p>
                    <p className={`text-xs font-bold mt-1 ${config.titleColor}`}>
                      📅 {m.date}
                    </p>
                  </div>
                </div>
                <h3 className={`text-lg font-black ${config.titleColor} mb-3`}>{m.name}</h3>
                <p className={`${config.titleColor} font-bold uppercase text-[10px] tracking-widest mb-4 bg-white bg-opacity-60 px-3 py-2 rounded-lg inline-block`}>🚗 {v?.brand} {v?.model}</p>
                {m.type === 'vidange' && m.next_vidange_km && (
                  <div className="bg-gradient-to-r from-orange-200 to-amber-200 border-3 border-orange-500 rounded-2xl p-5 mb-4 shadow-md">
                    <p className="text-[10px] font-black text-orange-800 uppercase mb-2">🏁 Prochaine Vidange</p>
                    <p className="text-2xl font-black text-orange-900">{m.next_vidange_km} <span className="text-sm font-bold">KM</span></p>
                  </div>
                )}
                {m.expiry_date && m.type !== 'vidange' && (
                  <div className="bg-white bg-opacity-70 rounded-lg px-3 py-2 mb-4 inline-block">
                    <p className={`text-[10px] font-black uppercase ${config.titleColor}`}>⏳ Exp: {m.expiry_date}</p>
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <button onClick={() => handleOpenForm(m)} className={`flex-1 py-3 bg-gradient-to-br ${config.colorClass} text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:shadow-lg transition-all transform hover:scale-105`}>✏️ {currentT.edit}</button>
                  <button onClick={() => handleDelete(m.id, 'vehicle')} className="flex-1 py-3 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:shadow-lg transition-all transform hover:scale-105">🗑️ {currentT.delete}</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExpensesPage;
