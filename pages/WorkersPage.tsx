import React, { useState, useRef, useEffect } from 'react';
import { Language, Worker, Role, WorkerTransaction } from '../types';
import GradientButton from '../components/GradientButton';
import { apiPost } from '../lib/api';

interface WorkersPageProps {
  lang: Language;
  onUpdate: () => void;
}

type ModalType = 'payment' | 'advance' | 'absences' | 'history' | 'delete' | 'details' | null;

const WORKER_TRANSLATIONS = {
  fr: {
    title: '👥 Gestion de l\'Équipe',
    addBtn: '➕ Ajouter un membre',
    search: 'Rechercher un membre...',
    fullName: 'Nom Complet',
    birthday: 'Date de naissance',
    phone: 'Téléphone',
    email: 'E-mail',
    address: 'Adresse',
    idCard: 'N° Carte d\'identité',
    workerType: 'Type de travailleur',
    paymentType: 'Type de paiement',
    amount: 'Montant du salaire',
    username: 'Nom d\'utilisateur',
    password: 'Mot de passe',
    day: 'Par jour',
    month: 'Par mois',
    absences: 'Absences',
    paid: 'Total Payé',
    payment: '💸 Paiement',
    advance: '💳 Avance',
    history: '📜 Historique',
    details: '🔎 Détails',
    edit: '✏️ Modifier',
    delete: '🗑️ Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    photo: 'Photo (optionnel)',
    currency: 'DZ',
    salaryBase: 'Salaire de base',
    deductions: 'Déductions (Avances/Absences)',
    finalPayment: 'Paiement Final',
    confirmDelete: 'Voulez-vous vraiment supprimer ce travailleur ?',
    note: 'Note / Commentaire',
    date: 'Date',
    admin: '👨‍💼 Admin',
    worker: '👷 Travailleur',
    driver: '🚗 Chauffeur',
    loading: 'Chargement...',
    errorLoading: 'Erreur lors du chargement des travailleurs',
    noWorkers: 'Aucun travailleur trouvé'
  },
  ar: {
    title: '👥 إدارة الفريق',
    addBtn: '➕ إضافة عضو',
    search: 'بحث عن عضو...',
    fullName: 'الاسم الكامل',
    birthday: 'تاريخ الميلاد',
    phone: 'رقم الهاتف',
    email: 'البريد الإلكتروني',
    address: 'العنوان',
    idCard: 'رقم بطاقة التعريف',
    workerType: 'نوع العامل',
    paymentType: 'نوع الدفع',
    amount: 'قيمة الراتب',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    day: 'يومياً',
    month: 'شهرياً',
    absences: 'الغيابات',
    paid: 'إجمالي المدفوع',
    payment: '💸 دفع',
    advance: '💳 تسبيق',
    history: '📜 السجل',
    details: '🔎 تفاصيل',
    edit: '✏️ تعديل',
    delete: '🗑️ حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    photo: 'الصورة (اختياري)',
    currency: 'دج',
    salaryBase: 'الراتب الأساسي',
    deductions: 'اقتطاعات (تسبيقات/غيابات)',
    finalPayment: 'الدفع النهائي',
    confirmDelete: 'هل أنت متأكد من حذف هذا العامل؟',
    note: 'ملاحظة',
    date: 'التاريخ',
    admin: '👨‍💼 مسؤول',
    worker: '👷 عامل',
    driver: '🚗 سائق',
    loading: 'جاري التحميل...',
    errorLoading: 'خطأ في تحميل العمال',
    noWorkers: 'لم يتم العثور على عمال'
  }
};

const ModalContainer: React.FC<{ children: React.ReactNode; title: string; onClose: () => void }> = ({ children, title, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-gradient-to-br from-white to-blue-50 w-full max-w-lg rounded-[2.5rem] shadow-2xl animate-scale-in p-10 overflow-y-auto max-h-[90vh] border border-blue-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors text-2xl">✕</button>
      </div>
      {children}
    </div>
  </div>
);

const WorkersPage: React.FC<WorkersPageProps> = ({ lang, onUpdate }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [activeModal, setActiveModal] = useState<{ type: ModalType; worker: Worker | null }>({ type: null, worker: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isRtl = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentT = WORKER_TRANSLATIONS[lang];

  // Utility: strip leading emoji/punctuation from translation labels so we can show a single icon
  const stripLeadingEmojis = (s: string) => {
    try {
      return s.replace(/^[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\uFE0F\s]+/u, '');
    } catch (e) {
      return s;
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Fetch workers from Neon database
  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiPost('/api/from/workers/select', { columns: '*' });

      const result = await response.json();

      if (result.error) {
        setError(currentT.errorLoading);
        setWorkers([]);
      } else {
        setWorkers(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching workers:', err);
      setError(currentT.errorLoading);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleOpenForm = (worker: Worker | null = null) => {
    setEditingWorker(worker);
    setPhotoPreview(worker?.photo || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingWorker(null);
    setPhotoPreview(null);
  };

  const handleCloseModal = () => setActiveModal({ type: null, worker: null });

  const handleDeleteWorker = async (id: string) => {
    try {
      setSaving(true);
      const response = await apiPost('/api/from/workers/delete', {
        where: { col: 'id', val: id }
      });

      const result = await response.json();
      if (!result.error) {
        fetchWorkers();
        onUpdate();
      }
    } catch (err) {
      console.error('Error deleting worker:', err);
    } finally {
      setSaving(false);
      handleCloseModal();
    }
  };

  const handleSaveWorker = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Only include photo if it's a valid data URL (not blob:)
      let photo = photoPreview;
      if (photo && !photo.startsWith('data:')) {
        photo = null;
      }
      
      const workerData = {
        full_name: formData.get('fullName') as string,
        birthday: formData.get('birthday') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        address: formData.get('address') as string,
        id_card_number: formData.get('idCard') as string,
        role: formData.get('role') as Role,
        payment_type: formData.get('paymentType') as 'day' | 'month',
        amount: parseFloat(formData.get('amount') as string),
        username: formData.get('username') as string,
        password: formData.get('password') as string,
        photo: photo,
        absences: editingWorker?.absences || 0,
        total_paid: editingWorker?.totalPaid || 0,
        created_at: editingWorker?.id ? undefined : new Date().toISOString()
      };

      let response;
      if (editingWorker?.id) {
        // Update existing worker
        response = await apiPost('/api/from/workers/update', {
          data: workerData,
          where: { col: 'id', val: editingWorker.id }
        });
      } else {
        // Insert new worker
        response = await apiPost('/api/from/workers/insert', {
          rows: [workerData]
        });
      }

      const result = await response.json();
      if (!result.error) {
        handleCloseForm();
        fetchWorkers();
        onUpdate();
      }
    } catch (err) {
      console.error('Error saving worker:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTransaction = async (workerId: string, type: 'payment' | 'advance' | 'absence', amount: number, date: string, note?: string) => {
      try {
      setSaving(true);
      // Update worker transaction in database
      const worker = workers.find(w => w.id === workerId);
      if (!worker) return;

      const updatedHistory = [
        ...(worker.history || []),
        {
          id: Math.random().toString(),
          type,
          amount,
          date,
          note
        }
      ];

      const updateData: any = {
        history: updatedHistory
      };

      if (type === 'payment') {
        updateData.total_paid = (worker.totalPaid || 0) + amount;
      } else if (type === 'absence') {
        updateData.absences = (worker.absences || 0) + 1;
      }

      const response = await apiPost('/api/from/workers/update', {
        data: updateData,
        where: { col: 'id', val: workerId }
      });

      const result = await response.json();
      if (!result.error) {
        fetchWorkers();
        onUpdate();
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
    } finally {
      setSaving(false);
      handleCloseModal();
    }
  };

  const calculateDeductions = (worker: Worker) => {
    return (worker.history || [])
      .filter(t => t.type === 'advance' || t.type === 'absence')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getRoleDisplay = (role: Role) => {
    if (role === 'admin') return currentT.admin;
    if (role === 'driver') return currentT.driver;
    return currentT.worker;
  };

  if (isFormOpen) {
    return (
      <div className={`p-8 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-white via-blue-50 to-white rounded-[3rem] shadow-2xl border border-blue-100 p-12">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {editingWorker ? '✏️ ' + currentT.edit : currentT.addBtn}
            </h2>
            <button onClick={handleCloseForm} className="text-gray-400 hover:text-red-500 transition-all text-2xl">✕</button>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={handleSaveWorker}>
            {/* Profile Photo Section */}
            <div className="md:col-span-2 flex flex-col items-center gap-4 bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-[2rem] border border-blue-100">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gradient-to-r from-blue-400 to-purple-400 shadow-lg bg-white">
                {photoPreview ? (
                  <img src={photoPreview} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <span className="text-6xl flex items-center justify-center h-full">📷</span>
                )}
              </div>
              <GradientButton type="button" onClick={() => fileInputRef.current?.click()} className="!py-2 text-sm">
                {currentT.photo}
              </GradientButton>
              <input
                type="file"
                ref={fileInputRef}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const dataUrl = await fileToDataUrl(file);
                      setPhotoPreview(dataUrl);
                    } catch (err) {
                      console.error('Failed to read image file:', err);
                      setPhotoPreview(URL.createObjectURL(file));
                    }
                  }
                }}
                className="hidden"
                accept="image/*"
              />
            </div>

            {/* Personal Info */}
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">👤 {currentT.fullName}</label>
              <input
                type="text"
                name="fullName"
                defaultValue={editingWorker?.fullName}
                className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-blue-100 outline-none font-bold focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">🎂 {currentT.birthday}</label>
              <input
                type="date"
                name="birthday"
                defaultValue={editingWorker?.birthday}
                className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-blue-100 outline-none font-bold focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">📱 {currentT.phone}</label>
              <input
                type="tel"
                name="phone"
                defaultValue={editingWorker?.phone}
                className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-blue-100 outline-none font-bold focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">📧 {currentT.email}</label>
              <input
                type="email"
                name="email"
                defaultValue={editingWorker?.email}
                className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-blue-100 outline-none font-bold focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">📍 {currentT.address}</label>
              <input
                type="text"
                name="address"
                defaultValue={editingWorker?.address}
                className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-blue-100 outline-none font-bold focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">🆔 {currentT.idCard}</label>
              <input
                type="text"
                name="idCard"
                defaultValue={editingWorker?.idCardNumber}
                className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-blue-100 outline-none font-bold focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Role and Payment */}
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">👨‍💼 {currentT.workerType}</label>
              <select
                name="role"
                defaultValue={editingWorker?.role || 'worker'}
                className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-blue-100 outline-none font-bold focus:border-blue-500 transition-colors"
              >
                <option value="admin">{currentT.admin}</option>
                <option value="worker">{currentT.worker}</option>
                <option value="driver">{currentT.driver}</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">💰 {currentT.paymentType}</label>
              <select
                name="paymentType"
                defaultValue={editingWorker?.paymentType || 'day'}
                className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-blue-100 outline-none font-bold focus:border-blue-500 transition-colors"
              >
                <option value="day">{currentT.day}</option>
                <option value="month">{currentT.month}</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">💵 {currentT.amount} ({currentT.currency})</label>
              <input
                type="number"
                name="amount"
                defaultValue={editingWorker?.amount}
                className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-blue-100 outline-none font-bold focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {/* Credentials Section */}
            <div className="md:col-span-2 border-t-2 border-blue-100 pt-8 mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">🔐 {currentT.username}</label>
                <input
                  type="text"
                  name="username"
                  defaultValue={editingWorker?.username}
                  className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-blue-100 outline-none font-bold focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">🔒 {currentT.password}</label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  defaultValue={editingWorker?.password}
                  className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-blue-100 outline-none font-bold focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="md:col-span-2 flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={handleCloseForm}
                disabled={saving}
                className="px-8 py-4 font-black text-gray-600 uppercase tracking-widest hover:bg-gray-100 rounded-2xl transition-all disabled:opacity-50"
              >
                {currentT.cancel}
              </button>
              <GradientButton type="submit" disabled={saving} className="!px-12 !py-4">
                {saving ? currentT.loading : currentT.save}
              </GradientButton>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-8 ${isRtl ? 'font-arabic text-right' : ''}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {currentT.title}
        </h1>
        <div className="flex gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder={currentT.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-6 py-4 bg-white border-2 border-blue-100 rounded-2xl outline-none shadow-sm font-bold focus:border-blue-500 transition-colors"
          />
          <GradientButton onClick={() => handleOpenForm()}>{currentT.addBtn}</GradientButton>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-bold">{currentT.loading}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl text-red-600 font-bold text-center mb-8">
          ⚠️ {error}
        </div>
      )}

      {/* Workers Grid */}
      {!loading && (
        <>
          {workers.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-3xl mb-4">👥</p>
              <p className="text-gray-600 font-bold text-lg">{currentT.noWorkers}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {workers
                .filter(w => {
                  const s = searchTerm.toLowerCase();
                  const full = (w.fullName || '').toLowerCase();
                  const username = (w.username || '').toLowerCase();
                  return full.includes(s) || username.includes(s);
                })
                .map(worker => (
                  <div
                    key={worker.id}
                    className="bg-gradient-to-br from-white to-blue-50 rounded-[2.5rem] shadow-md border-2 border-blue-100 p-8 hover:shadow-2xl hover:border-blue-300 transition-all duration-500 group"
                  >
                    {/* New centered header with top image */}
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-28 h-28 rounded-full overflow-hidden mb-4 shadow-lg border-4 border-white bg-white relative">
                        <img
                          src={(worker.photo && (worker.photo.startsWith('data:') || worker.photo.startsWith('http') || worker.photo.startsWith('blob:'))) ? worker.photo : ('https://via.placeholder.com/112?text=' + (worker.fullName ? worker.fullName.charAt(0) : ''))}
                          className="w-full h-full object-cover"
                          alt={worker.fullName || ''}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/112?text=' + (worker.fullName ? worker.fullName.charAt(0) : ''); }}
                        />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 text-center">{worker.fullName}</h3>
                      <p className="text-[12px] font-black bg-clip-text text-transparent uppercase tracking-widest text-center mt-1" style={{backgroundImage: 'linear-gradient(to right, #2563eb, #7c3aed)'}}>
                        {getRoleDisplay(worker.role)}
                      </p>
                      <p className="text-[10px] font-bold text-gray-500 mt-1 text-center">@{worker.username}</p>
                    </div>

                    {/* Stats centered */}
                    <div className="flex items-center justify-center gap-6 mb-6">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-green-700 uppercase mb-1">{currentT.paid}</p>
                        <p className="font-black text-green-600 text-lg">{(worker.totalPaid || 0).toLocaleString()} {currentT.currency}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-red-700 uppercase mb-1">{currentT.absences}</p>
                        <p className="font-black text-red-600 text-lg">{worker.absences || 0}</p>
                      </div>
                    </div>

                    {/* Action Buttons - reservation-style: primary row + small pill actions */}
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => setActiveModal({ type: 'details', worker })}
                          className="flex-1 py-3 px-4 rounded-full bg-white border border-blue-100 text-blue-600 font-black shadow-sm flex items-center justify-center gap-2"
                        >
                          <span className="text-lg">🔍</span>
                          <span>{stripLeadingEmojis(currentT.details)}</span>
                        </button>
                        <button
                          onClick={() => setActiveModal({ type: 'payment', worker })}
                          className="flex-1 py-3 px-4 rounded-full bg-gradient-to-r from-white to-emerald-50 border border-emerald-100 text-emerald-700 font-black shadow-sm flex items-center justify-center gap-2"
                        >
                          <span className="text-lg">💸</span>
                          <span>{stripLeadingEmojis(currentT.payment)}</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => setActiveModal({ type: 'advance', worker })}
                          className="px-4 py-2 rounded-full bg-purple-50 text-purple-700 font-bold shadow-sm text-sm flex items-center gap-2"
                        >
                          <span>💳</span>
                          <span>{stripLeadingEmojis(currentT.advance)}</span>
                        </button>

                        <button
                          onClick={() => setActiveModal({ type: 'absences', worker })}
                          className="px-4 py-2 rounded-full bg-rose-50 text-rose-700 font-bold shadow-sm text-sm flex items-center gap-2"
                        >
                          <span>⚠️</span>
                          <span>{stripLeadingEmojis(currentT.absences)}</span>
                        </button>

                        <button
                          onClick={() => setActiveModal({ type: 'history', worker })}
                          className="px-4 py-2 rounded-full bg-slate-50 text-slate-700 font-bold shadow-sm text-sm flex items-center gap-2"
                        >
                          <span>📜</span>
                          <span>{stripLeadingEmojis(currentT.history)}</span>
                        </button>

                        <button
                          onClick={() => handleOpenForm(worker)}
                          className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-bold shadow-sm text-sm flex items-center gap-2"
                        >
                          <span>✏️</span>
                          <span>{stripLeadingEmojis(currentT.edit)}</span>
                        </button>

                        <button
                          onClick={() => setActiveModal({ type: 'delete', worker })}
                          className="px-4 py-2 rounded-full bg-red-50 text-red-700 font-bold shadow-sm text-sm flex items-center gap-2"
                        >
                          <span>🗑️</span>
                          <span>{stripLeadingEmojis(currentT.delete)}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {/* Delete Modal */}
      {activeModal.type === 'delete' && activeModal.worker && (
        <ModalContainer title={currentT.delete} onClose={handleCloseModal}>
          <div className="text-center p-4">
            <div className="text-6xl mb-4">🗑️</div>
            <p className="text-lg font-bold mb-8 text-gray-700">
              {currentT.confirmDelete} <b className="text-red-600">{activeModal.worker.fullName}</b>?
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleCloseModal}
                disabled={saving}
                className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {currentT.cancel}
              </button>
              <button
                onClick={() => handleDeleteWorker(activeModal.worker!.id)}
                disabled={saving}
                className="flex-1 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:from-red-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50"
              >
                🗑️ {currentT.delete}
              </button>
            </div>
          </div>
        </ModalContainer>
      )}

        {/* Details Modal */}
        {activeModal.type === 'details' && activeModal.worker && (
          <ModalContainer title={stripLeadingEmojis(currentT.details)} onClose={handleCloseModal}>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2">
                  <img
                    src={(activeModal.worker.photo && (activeModal.worker.photo.startsWith('data:') || activeModal.worker.photo.startsWith('http') || activeModal.worker.photo.startsWith('blob:'))) ? activeModal.worker.photo : ('https://via.placeholder.com/96?text=' + (activeModal.worker.fullName ? activeModal.worker.fullName.charAt(0) : ''))}
                    alt={activeModal.worker.fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/96?text=' + (activeModal.worker.fullName ? activeModal.worker.fullName.charAt(0) : ''); }}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-black">{activeModal.worker.fullName}</h3>
                  <p className="text-sm text-gray-500">@{activeModal.worker.username}</p>
                  <p className="text-xs text-gray-400">{activeModal.worker.createdAt || activeModal.worker.created_at}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">{currentT.email}</p>
                  <p className="font-black">{activeModal.worker.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{currentT.phone}</p>
                  <p className="font-black">{activeModal.worker.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{currentT.address}</p>
                  <p className="font-black">{activeModal.worker.address || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{currentT.idCard}</p>
                  <p className="font-black">{activeModal.worker.idCardNumber || activeModal.worker.id_card_number || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{currentT.workerType}</p>
                  <p className="font-black">{getRoleDisplay(activeModal.worker.role)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{currentT.paymentType}</p>
                  <p className="font-black">{activeModal.worker.paymentType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{currentT.amount}</p>
                  <p className="font-black">{(activeModal.worker.amount || 0).toLocaleString()} {currentT.currency}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{currentT.absences}</p>
                  <p className="font-black">{activeModal.worker.absences || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{currentT.paid}</p>
                  <p className="font-black">{(activeModal.worker.totalPaid || 0).toLocaleString()} {currentT.currency}</p>
                </div>
              </div>
            </div>
          </ModalContainer>
        )}

      {/* Payment Modal */}
      {activeModal.type === 'payment' && activeModal.worker && (
        <ModalContainer title={currentT.payment} onClose={handleCloseModal}>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleAddTransaction(
                activeModal.worker!.id,
                'payment',
                Number(formData.get('amount')),
                formData.get('date') as string,
                formData.get('note') as string
              );
            }}
          >
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-100">
              <div className="flex justify-between mb-4 pb-4 border-b border-green-200">
                <span className="text-sm font-bold text-gray-700">{currentT.salaryBase}</span>
                <span className="font-black text-lg">{activeModal.worker.amount.toLocaleString()} {currentT.currency}</span>
              </div>
              <div className="flex justify-between mb-4 pb-4 border-b border-green-200">
                <span className="text-sm font-bold text-red-700">{currentT.deductions}</span>
                <span className="font-black text-lg text-red-600">
                  -{calculateDeductions(activeModal.worker).toLocaleString()} {currentT.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-black text-green-800">{currentT.finalPayment}</span>
                <span className="text-2xl font-black text-green-600">
                  {(activeModal.worker.amount - calculateDeductions(activeModal.worker)).toLocaleString()} {currentT.currency}
                </span>
              </div>
            </div>
            <input
              type="hidden"
              name="amount"
              value={activeModal.worker.amount - calculateDeductions(activeModal.worker)}
            />
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">📅 {currentT.date}</label>
              <input
                type="date"
                name="date"
                className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-green-100 font-bold outline-none focus:border-green-500"
                defaultValue={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">📝 {currentT.note}</label>
              <textarea
                name="note"
                className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-green-100 font-bold outline-none focus:border-green-500 h-24"
              ></textarea>
            </div>
            <GradientButton type="submit" disabled={saving} className="w-full !py-5">
              {saving ? currentT.loading : currentT.payment}
            </GradientButton>
          </form>
        </ModalContainer>
      )}

      {/* Advance & Absences Modal */}
      {(activeModal.type === 'advance' || activeModal.type === 'absences') && activeModal.worker && (
        <ModalContainer
          title={activeModal.type === 'advance' ? currentT.advance : currentT.absences}
          onClose={handleCloseModal}
        >
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleAddTransaction(
                activeModal.worker!.id,
                activeModal.type as any,
                Number(formData.get('amount')),
                formData.get('date') as string,
                formData.get('note') as string
              );
            }}
          >
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">
                💰 {currentT.amount} ({currentT.currency})
              </label>
              <input
                type="number"
                name="amount"
                defaultValue={editingWorker?.amount}
                className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-blue-100 font-bold outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">📅 {currentT.date}</label>
              <input
                type="date"
                name="date"
                className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-blue-100 font-bold outline-none focus:border-blue-500"
                defaultValue={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">📝 {currentT.note}</label>
              <textarea
                name="note"
                className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-blue-100 font-bold outline-none focus:border-blue-500 h-24"
              ></textarea>
            </div>
            <GradientButton type="submit" disabled={saving} className="w-full !py-5">
              {saving ? currentT.loading : (activeModal.type === 'advance' ? currentT.advance : currentT.absences)}
            </GradientButton>
          </form>
        </ModalContainer>
      )}

      {/* History Modal */}
      {activeModal.type === 'history' && activeModal.worker && (
        <ModalContainer title={currentT.history} onClose={handleCloseModal}>
          <div className="space-y-4">
            {!activeModal.worker.history || activeModal.worker.history.length === 0 ? (
              <p className="text-center text-gray-400 py-10 font-bold">📜 {lang === 'fr' ? 'Aucun historique disponible.' : 'لا يوجد سجل متاح.'}</p>
            ) : (
              activeModal.worker.history.slice().reverse().map(t => (
                <div
                  key={t.id}
                  className={`p-5 rounded-2xl border-l-4 border-2 ${
                    t.type === 'payment'
                      ? 'bg-green-50 border-green-500'
                      : t.type === 'advance'
                      ? 'bg-orange-50 border-orange-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black uppercase text-[10px] tracking-widest">{t.type}</span>
                    <span className="text-xs font-bold text-gray-500">{t.date}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-gray-900 font-black text-lg">{t.amount.toLocaleString()} {currentT.currency}</p>
                    <p className="text-[10px] font-bold text-gray-600 italic">{t.note || '—'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ModalContainer>
      )}
    </div>
  );
};

export default WorkersPage;
