
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Language, Customer, Reservation, Vehicle } from '../types';
import { ALGERIAN_WILAYAS } from '../constants';
import { supabase } from '../lib/supabase';
import { apiPost } from '../lib/api';
import GradientButton from '../components/GradientButton';

interface CustomersPageProps {
  lang: Language;
  customers: Customer[];
  reservations: Reservation[];
  vehicles: Vehicle[];
  onRefresh: () => void;
}

type ModalType = 'details' | 'history' | 'delete' | null;

const CustomersPage: React.FC<CustomersPageProps> = ({ lang, customers: initialCustomers, reservations: initialReservations, vehicles, onRefresh }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [activeModal, setActiveModal] = useState<{ type: ModalType; customer: Customer | null }>({ type: null, customer: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🚀 Fresh data state
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  
  // Form State for UI previews (Base64 strings)
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [docPreviews, setDocPreviews] = useState<string[]>([]);
  
  const isRtl = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // ⚡ Fetch customer data efficiently on mount
  useEffect(() => {
    const loadCustomersData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch customers and reservations in parallel
        const [customersRes, reservationsRes] = await Promise.all([
          apiPost('/api/from/customers/select', { columns: '*' }),
          apiPost('/api/from/reservations/select', { columns: '*' })
        ]);

        // Process customers
        if (customersRes?.data) {
          const formatted = customersRes.data.map((c: any) => ({
            id: c.id,
            firstName: c.first_name,
            lastName: c.last_name,
            phone: c.phone,
            email: c.email,
            idCardNumber: c.id_card_number,
            documentNumber: c.document_number,
            wilaya: c.wilaya,
            address: c.address,
            licenseNumber: c.license_number,
            licenseExpiry: c.license_expiry,
            licenseIssueDate: c.license_issue_date,
            licenseIssuePlace: c.license_issue_place,
            profilePicture: c.profile_picture,
            birthday: c.birthday,
            birthPlace: c.birth_place,
            documentType: c.document_type,
            documentDeliveryDate: c.document_delivery_date,
            documentDeliveryAddress: c.document_delivery_address,
            documentExpiryDate: c.document_expiry_date,
            documentImages: c.document_images || [],
            documentLeftAtStore: c.document_left_at_store,
            totalReservations: c.total_reservations || 0,
            totalSpent: c.total_spent || 0
          }));
          setCustomers(formatted);
        }

        // Process reservations
        if (reservationsRes?.data) {
          const formatted = reservationsRes.data.map((r: any) => ({
            id: r.id,
            reservationNumber: r.reservation_number,
            customerId: r.customer_id,
            vehicleId: r.vehicle_id,
            startDate: r.start_date,
            endDate: r.end_date,
            status: r.status,
            totalAmount: r.total_amount || 0,
            paidAmount: r.paid_amount || 0,
            pickupAgencyId: r.pickup_agency_id || '',
            returnAgencyId: r.return_agency_id || '',
            driverId: r.driver_id,
            cautionAmount: r.caution_amount || 0,
            discount: r.discount || 0,
            withTVA: r.with_tva || false,
            options: r.options || [],
            activationLog: r.activation_log,
            terminationLog: r.termination_log
          }));
          setReservations(formatted);
        }
      } catch (err) {
        console.error('Failed to load customers data:', err);
        setError('Erreur lors du chargement des clients');
      } finally {
        setLoading(false);
      }
    };

    loadCustomersData();
  }, []); // ✅ Fetch once on mount only

  const t = {
    fr: {
      title: 'Répertoire Clients',
      addBtn: 'Nouveau Client',
      search: 'Rechercher par nom, téléphone...',
      firstName: 'Prénom',
      lastName: 'Nom',
      phone: 'Numéro de téléphone',
      email: 'E-mail (optionnel)',
      idCard: 'N° Carte d\'identité',
      wilaya: 'Wilaya',
      address: 'Adresse',
      license: 'N° Permis de conduire',
      licenseExp: 'Expiration Permis',
      reservations: 'Réservations',
      spending: 'Total Dépensé',
      details: 'Fiche Détails',
      edit: 'Modifier',
      delete: 'Supprimer',
      history: 'Historique',
      createTitle: 'Fiche Nouveau Client',
      editTitle: 'Modifier le Client',
      profilePic: 'Photo de profil',
      docs: 'Documents numérisés',
      docLeft: 'Document déposé à l\'agence',
      save: 'Enregistrer le client',
      cancel: 'Annuler',
      confirmDelete: 'Voulez-vous vraiment supprimer ce client ?',
      currency: 'DZ',
      personalInfo: 'Informations Personnelles',
      officialDocs: 'Documents Officiels',
      media: 'Photos & Scans',
      docOptions: ['Aucun', 'Passeport', 'Carte d\'identité', 'Permis de conduire', 'Chèque de garantie', 'Autre']
    },
    ar: {
      title: 'قائمة الزبائن',
      addBtn: 'زبون جديد',
      search: 'بحث بالاسم، الهاتف...',
      firstName: 'الاسم الأول',
      lastName: 'اللقب',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      idCard: 'رقم بطاقة التعريف',
      wilaya: 'الولاية',
      address: 'العنوان',
      license: 'رقم رخصة السياقة',
      licenseExp: 'انتهاء الرخصة',
      reservations: 'الحجوزات',
      spending: 'إجمالي الإنفاق',
      details: 'تفاصيل الزبون',
      edit: 'تعديل',
      delete: 'حذف',
      history: 'السجل',
      createTitle: 'بطاقة زبون جديد',
      editTitle: 'تعديل الزبون',
      profilePic: 'صورة الملف',
      docs: 'المستندات الممسوحة',
      docLeft: 'الوثيقة المتروكة في الوكالة',
      save: 'حفظ الزبون',
      cancel: 'إلغاء',
      confirmDelete: 'هل أنت متأكد من حذف هذا الزبون؟',
      currency: 'دج',
      personalInfo: 'المعلومات الشخصية',
      officialDocs: 'الوثائق الرسمية',
      media: 'الصور والوثائق',
      docOptions: ['لا شيء', 'جواز سفر', 'بطاقة تعريف', 'رخصة سياقة', 'صك ضمان', 'أخرى']
    }
  }[lang];

  const handleOpenForm = (customer: Customer | null = null) => {
    if (!customer) {
      setEditingCustomer(null);
      setProfilePreview(null);
      setDocPreviews([]);
      setIsFormOpen(true);
      return;
    }

    // Open the form immediately with the provided object for responsive UX,
    // then fetch a fresh DB row in background and patch values when available.
    setEditingCustomer(customer);
    setProfilePreview((customer as any).profilePicture || (customer as any).profile_picture || null);
    setDocPreviews((customer as any).documentImages || (customer as any).document_images || []);
    setIsFormOpen(true);

    (async () => {
      try {
        const result = await supabase.from('customers').select('*').eq('id', customer.id);
        if ((result as any).error) {
          console.warn('Failed to fetch fresh customer for edit', (result as any).error);
          return;
        }
        const data = Array.isArray((result as any).data) && (result as any).data.length > 0 ? (result as any).data[0] : (result as any).data;
        if (!data) return;
        setEditingCustomer(data as Customer);
        setProfilePreview((data as any).profile_picture || (data as any).profilePicture || null);
        setDocPreviews((data as any).document_images || (data as any).documentImages || []);
      } catch (e) {
        console.warn('Error fetching fresh customer for edit', e);
      }
    })();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'profile' | 'docs') => {
    const files = e.target.files;
    if (files) {
      // Fix: Added explicit type (file: File) to prevent 'unknown' type error in readAsDataURL
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          if (target === 'profile') setProfilePreview(base64);
          else setDocPreviews(prev => [...prev, base64]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // gather form values first
    const backupEditing = editingCustomer;
    const backupProfile = profilePreview;
    const backupDocs = docPreviews.slice();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    
    const dbData = {
      first_name: (fd.get('first_name') as string) || null,
      last_name: (fd.get('last_name') as string) || null,
      phone: (fd.get('phone') as string) || null,
      email: (fd.get('email') as string) || null,
      birthday: (fd.get('date_of_birth') as string) || null,
      birth_place: (fd.get('place_of_birth') as string) || null,
      id_card_number: (fd.get('id_card_number') as string) || null,
      document_type: (fd.get('doc_type') as string) || null,
      document_number: (fd.get('doc_number') as string) || null,
      document_delivery_date: (fd.get('doc_issue_date') as string) || null,
      document_delivery_address: (fd.get('doc_issue_place') as string) || null,
      document_expiry_date: (fd.get('doc_expiry_date') as string) || null,
      wilaya: (fd.get('wilaya') as string) || null,
      address: (fd.get('address') as string) || null,
      license_number: (fd.get('license_number') as string) || null,
      license_expiry: (fd.get('license_expiry') as string) || null,
      license_issue_date: (fd.get('license_issue_date') as string) || null,
      license_issue_place: (fd.get('license_issue_place') as string) || null,
      profile_picture: profilePreview,
      document_images: docPreviews,
      document_left_at_store: (fd.get('document_left') as string) || null
    };

    // Optimistic UX: close the form immediately while saving in background
    setIsFormOpen(false);
    setEditingCustomer(null);
    try {
      if (backupEditing) {
        const result = await supabase.from('customers').update(dbData).eq('id', backupEditing.id);
        if ((result as any).error) throw (result as any).error;
        window.alert('✅ Client mis à jour');
      } else {
        const result = await supabase.from('customers').insert([dbData]);
        if ((result as any).error) throw (result as any).error;
        window.alert('✅ Client créé');
      }
      // refresh list in background
      try { onRefresh(); } catch (e) { console.warn('onRefresh failed', e); }
    } catch (err: any) {
      console.error('Save failed, reopening form', err);
      // restore UI so user can retry
      setEditingCustomer(backupEditing);
      setProfilePreview(backupProfile);
      setDocPreviews(backupDocs);
      setIsFormOpen(true);
      window.alert('❌ Erreur lors de l\'enregistrement: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      const res = await apiPost('/api/from/customers/delete', { where: { col: 'id', val: id } });
      const result = await res.json();
      if (result.error) {
        throw new Error(result.error.message || 'Delete failed');
      }
      onRefresh();
      setActiveModal({ type: null, customer: null });
    } catch (err: any) {
      console.error('Delete failed:', err);
      window.alert('❌ Erreur lors de la suppression: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const filteredCustomers = useMemo(() => {
    const q = (debouncedSearch || '').toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(c => {
      const full = `${(c.firstName||'').toString()} ${(c.lastName||'').toString()}`.toLowerCase();
      return full.includes(q) || (c.phone||'').toString().includes(q) || (c.email||'').toString().toLowerCase().includes(q);
    });
  }, [customers, debouncedSearch]);

  const displayedCustomers = filteredCustomers.slice(0, displayCount);

  const customerHistory = activeModal.customer ? reservations.filter(r => r.customerId === activeModal.customer!.id) : [];
  const historyTotalAmount = customerHistory.reduce((s, r) => s + (r.totalAmount || 0), 0);
  const historyPaidAmount = customerHistory.reduce((s, r) => s + (r.paidAmount || 0), 0);

  const SectionHeader = ({ title, icon, color }: { title: string; icon: string; color: string }) => (
    <div className={`flex items-center gap-4 border-b border-gray-100 pb-4 mb-8 ${color}`}>
      <span className="text-3xl">{icon}</span>
      <h3 className="text-xl font-black uppercase tracking-widest">{title}</h3>
    </div>
  );

  // Helpers for safe field access and date formatting in the details modal
  const getField = (c: any, camel: string, snake?: string) => {
    if (!c) return undefined;
    const s = snake || camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
    // try multiple variants: camel, snake, lowerCamel
    const lowerCamel = camel.charAt(0).toLowerCase() + camel.slice(1);
    if (Object.prototype.hasOwnProperty.call(c, camel) && c[camel] !== null && c[camel] !== undefined) return c[camel];
    if (Object.prototype.hasOwnProperty.call(c, s) && c[s] !== null && c[s] !== undefined) return c[s];
    if (Object.prototype.hasOwnProperty.call(c, lowerCamel) && c[lowerCamel] !== null && c[lowerCamel] !== undefined) return c[lowerCamel];
    return undefined;
  };

  const formatDate = (val: any) => {
    if (!val) return 'N/A';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString();
    } catch (e) { return String(val); }
  };

  // Helper function to normalize customer data from database
  const normalizeCustomer = (dbCustomer: any): Customer => ({
    id: dbCustomer.id,
    firstName: dbCustomer.first_name || '',
    lastName: dbCustomer.last_name || '',
    phone: dbCustomer.phone || '',
    email: dbCustomer.email,
    idCardNumber: dbCustomer.id_card_number || '',
    documentNumber: dbCustomer.document_number,
    wilaya: dbCustomer.wilaya || '',
    address: dbCustomer.address || '',
    licenseNumber: dbCustomer.license_number || '',
    licenseExpiry: dbCustomer.license_expiry,
    licenseIssueDate: dbCustomer.license_issue_date,
    licenseIssuePlace: dbCustomer.license_issue_place,
    profilePicture: dbCustomer.profile_picture,
    birthday: dbCustomer.birthday,
    birthPlace: dbCustomer.birth_place,
    documentType: dbCustomer.document_type,
    documentDeliveryDate: dbCustomer.document_delivery_date,
    documentDeliveryAddress: dbCustomer.document_delivery_address,
    documentExpiryDate: dbCustomer.document_expiry_date,
    documentImages: dbCustomer.document_images || [],
    documentLeftAtStore: dbCustomer.document_left_at_store,
    totalReservations: dbCustomer.total_reservations || 0,
    totalSpent: dbCustomer.total_spent || 0,
  });

  // When opening details modal, fetch fresh customer from DB to ensure latest fields
  useEffect(() => {
    if (activeModal.type !== 'details' || !activeModal.customer?.id) return;
    let mounted = true;
    (async () => {
      try {
        const result = await supabase.from('customers').select('*').eq('id', activeModal.customer!.id);
        if ((result as any).error) {
          console.warn('Failed to refresh customer details', (result as any).error);
          return;
        }
        const data = Array.isArray((result as any).data) && (result as any).data.length > 0 ? (result as any).data[0] : (result as any).data;
        if (!mounted || !data) return;
        setActiveModal(prev => ({ ...(prev || { type: null, customer: null }), type: 'details', customer: normalizeCustomer(data) }));
      } catch (e) {
        console.warn('Error fetching customer details', e);
      }
    })();
    return () => { mounted = false; };
  }, [activeModal.type, activeModal.customer?.id]);

  const toInputDate = (val: any) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      // YYYY-MM-DD
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch (e) { return '' }
  };

  const getFormValue = (c: any, camel: string, snake?: string, isDate = false) => {
    const raw = c ? (c[camel] ?? c[snake || camel.replace(/[A-Z]/g, m => '_' + m.toLowerCase())] ?? c[camel.charAt(0).toLowerCase() + camel.slice(1)]) : null;
    if (!raw) return '';
    return isDate ? toInputDate(raw) : String(raw);
  };

  // 📊 Show loading state for initial page load
  if (loading && customers.length === 0) {
    return (
      <div className={`p-4 md:p-12 flex items-center justify-center min-h-screen ${isRtl ? 'font-arabic text-right' : ''}`}>
        <div className="text-center">
          <div className="mb-6 inline-block">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-xl font-black text-gray-600">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  // ⚠️ Show error state
  if (error && customers.length === 0) {
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

  if (isFormOpen) {
    return (
      <div className={`p-4 md:p-8 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-[4rem] shadow-2xl overflow-hidden border-2 border-blue-200">
          <div className="p-8 md:p-16">
            <div className="flex items-center justify-between mb-16 border-b-2 border-blue-300 pb-12">
              <div className="flex items-center gap-4">
                <span className="text-5xl">👤</span>
                <h2 className="text-5xl font-black text-blue-700 tracking-tighter uppercase">
                  {editingCustomer ? '✏️ Modifier Client' : '✨ Nouveau Client'}
                </h2>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-all text-3xl shadow-lg font-black">✕</button>
            </div>
            
            <form className="space-y-16" onSubmit={handleSave}>
              {/* SECTION 1: PERSONAL INFO */}
              <section>
                <div className="flex items-center gap-4 border-b-2 border-blue-300 pb-6 mb-10">
                  <span className="text-4xl">👤</span>
                  <h3 className="text-2xl font-black text-blue-700 uppercase tracking-widest">Informations Personnelles</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-blue-700 uppercase px-2 flex items-center gap-2">✍️ Prénom *</label>
                    <input name="first_name" defaultValue={getFormValue(editingCustomer as any, 'firstName', 'first_name')} className="w-full px-8 py-6 bg-white rounded-3xl outline-none font-black text-lg border-2 border-blue-200 focus:bg-blue-50 focus:border-blue-600 focus:ring-2 ring-blue-300 transition-all shadow-md" required />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-blue-700 uppercase px-2 flex items-center gap-2">✍️ Nom de Famille *</label>
                    <input name="last_name" defaultValue={getFormValue(editingCustomer as any, 'lastName', 'last_name')} className="w-full px-8 py-6 bg-white rounded-3xl outline-none font-black text-lg border-2 border-blue-200 focus:bg-blue-50 focus:border-blue-600 focus:ring-2 ring-blue-300 transition-all shadow-md" required />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-green-700 uppercase px-2 flex items-center gap-2">📱 Téléphone *</label>
                    <input name="phone" defaultValue={getFormValue(editingCustomer as any, 'phone', 'phone')} className="w-full px-8 py-6 bg-white rounded-3xl outline-none font-black text-lg border-2 border-green-200 focus:bg-green-50 focus:border-green-600 focus:ring-2 ring-green-300 transition-all shadow-md" required />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-purple-700 uppercase px-2 flex items-center gap-2">📧 Email (optionnel)</label>
                    <input name="email" defaultValue={getFormValue(editingCustomer as any, 'email', 'email')} className="w-full px-8 py-6 bg-white rounded-3xl outline-none font-black text-lg border-2 border-purple-200 focus:bg-purple-50 focus:border-purple-600 focus:ring-2 ring-purple-300 transition-all shadow-md" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-pink-700 uppercase px-2 flex items-center gap-2">🎂 Date Naissance</label>
                    <input name="date_of_birth" type="date" defaultValue={getFormValue(editingCustomer as any, 'birthday', 'birthday', true)} className="w-full px-8 py-6 bg-white rounded-3xl outline-none font-black text-lg border-2 border-pink-200 focus:bg-pink-50 focus:border-pink-600 focus:ring-2 ring-pink-300 transition-all shadow-md" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-pink-700 uppercase px-2 flex items-center gap-2">📍 Lieu Naissance</label>
                    <input name="place_of_birth" defaultValue={getFormValue(editingCustomer as any, 'birthPlace', 'birth_place')} className="w-full px-8 py-6 bg-white rounded-3xl outline-none font-black text-lg border-2 border-pink-200 focus:bg-pink-50 focus:border-pink-600 focus:ring-2 ring-pink-300 transition-all shadow-md" />
                  </div>
                </div>
              </section>

              {/* SECTION 2: OFFICIAL DOCUMENTS */}
              <section>
                <div className="flex items-center gap-4 border-b-2 border-red-300 pb-6 mb-10">
                  <span className="text-4xl">🆔</span>
                  <h3 className="text-2xl font-black text-red-700 uppercase tracking-widest">Documents Officiels</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-red-700 uppercase px-2 flex items-center gap-2">🆔 N° Carte d'Identité *</label>
                    <input name="id_card_number" defaultValue={getFormValue(editingCustomer as any, 'idCardNumber', 'id_card_number')} className="w-full px-8 py-6 bg-white rounded-3xl outline-none font-black text-lg border-2 border-red-200 focus:bg-red-50 focus:border-red-600 focus:ring-2 ring-red-300 transition-all shadow-md" required />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-red-700 uppercase px-2 flex items-center gap-2">🚗 N° Permis *</label>
                    <input name="license_number" defaultValue={getFormValue(editingCustomer as any, 'licenseNumber', 'license_number')} className="w-full px-8 py-6 bg-white rounded-3xl outline-none font-black text-lg border-2 border-red-200 focus:bg-red-50 focus:border-red-600 focus:ring-2 ring-red-300 transition-all shadow-md" required />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-red-700 uppercase px-2 flex items-center gap-2">⏱️ Expiration Permis</label>
                    <input name="license_expiry" type="date" defaultValue={getFormValue(editingCustomer as any, 'licenseExpiry', 'license_expiry', true)} className="w-full px-8 py-6 bg-white rounded-3xl outline-none font-black text-lg border-2 border-red-200 focus:bg-red-50 focus:border-red-600 focus:ring-2 ring-red-300 transition-all shadow-md" required />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-red-700 uppercase px-2 flex items-center gap-2">📅 Délivrance Permis</label>
                    <input name="license_issue_date" type="date" defaultValue={getFormValue(editingCustomer as any, 'licenseIssueDate', 'license_issue_date', true)} className="w-full px-8 py-6 bg-white rounded-3xl outline-none font-black text-lg border-2 border-red-200 focus:bg-red-50 focus:border-red-600 focus:ring-2 ring-red-300 transition-all shadow-md" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-red-700 uppercase px-2 flex items-center gap-2">📍 Lieu Délivrance Permis</label>
                    <input name="license_issue_place" defaultValue={getFormValue(editingCustomer as any, 'licenseIssuePlace', 'license_issue_place')} className="w-full px-8 py-6 bg-white rounded-3xl outline-none font-black text-lg border-2 border-red-200 focus:bg-red-50 focus:border-red-600 focus:ring-2 ring-red-300 transition-all shadow-md" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-red-700 uppercase px-2 flex items-center gap-2">🎫 Type Doc</label>
                    <select name="doc_type" defaultValue={getFormValue(editingCustomer as any, 'documentType', 'document_type') || 'Aucun'} className="w-full px-8 py-6 bg-white rounded-3xl font-black text-lg border-2 border-red-200 focus:bg-red-50 focus:border-red-600 focus:ring-2 ring-red-300 cursor-pointer appearance-none transition-all shadow-md">
                      {t.docOptions.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-red-700 uppercase px-2 flex items-center gap-2">🔢 N° Doc</label>
                    <input name="doc_number" defaultValue={getFormValue(editingCustomer as any, 'documentNumber', 'document_number')} className="w-full px-8 py-6 bg-white rounded-3xl outline-none font-black text-lg border-2 border-red-200 focus:bg-red-50 focus:border-red-600 focus:ring-2 ring-red-300 transition-all shadow-md" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-red-700 uppercase px-2 flex items-center gap-2">📅 Délivrance</label>
                    <input name="doc_issue_date" type="date" defaultValue={getFormValue(editingCustomer as any, 'documentDeliveryDate', 'document_delivery_date', true)} className="w-full px-8 py-6 bg-white rounded-3xl outline-none font-black text-lg border-2 border-red-200 focus:bg-red-50 focus:border-red-600 focus:ring-2 ring-red-300 transition-all shadow-md" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-red-700 uppercase px-2 flex items-center gap-2">⏰ Expiration</label>
                    <input name="doc_expiry_date" type="date" defaultValue={getFormValue(editingCustomer as any, 'documentExpiryDate', 'document_expiry_date', true)} className="w-full px-8 py-6 bg-white rounded-3xl outline-none font-black text-lg border-2 border-red-200 focus:bg-red-50 focus:border-red-600 focus:ring-2 ring-red-300 transition-all shadow-md" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-red-700 uppercase px-2 flex items-center gap-2">📍 Adresse Délivrance</label>
                    <input name="doc_issue_place" defaultValue={getFormValue(editingCustomer as any, 'documentDeliveryAddress', 'document_delivery_address')} className="w-full px-8 py-6 bg-white rounded-3xl outline-none font-black text-lg border-2 border-red-200 focus:bg-red-50 focus:border-red-600 focus:ring-2 ring-red-300 transition-all shadow-md" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-orange-700 uppercase px-2 flex items-center gap-2">🏙️ Wilaya *</label>
                      <select name="wilaya" defaultValue={getFormValue(editingCustomer as any, 'wilaya', 'wilaya') || '16 - Alger'} className="w-full px-8 py-6 bg-white rounded-3xl font-black text-lg border-2 border-orange-200 focus:bg-orange-50 focus:border-orange-600 focus:ring-2 ring-orange-300 cursor-pointer appearance-none transition-all shadow-md">
                       {ALGERIAN_WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4 md:col-span-2">
                    <label className="text-[12px] font-black text-yellow-700 uppercase px-2 flex items-center gap-2">📄 Document Déposé à l'Agence</label>
                      <select name="document_left" defaultValue={getFormValue(editingCustomer as any, 'documentLeftAtStore', 'document_left_at_store') || 'Aucun'} className="w-full px-8 py-6 bg-white rounded-3xl font-black text-lg border-2 border-yellow-300 focus:bg-yellow-50 focus:border-yellow-600 focus:ring-2 ring-yellow-300 cursor-pointer appearance-none transition-all shadow-md">
                       {t.docOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* SECTION 3: ADDRESS */}
              <section>
                <div className="flex items-center gap-4 border-b-2 border-purple-300 pb-6 mb-10">
                  <span className="text-4xl">🏠</span>
                  <h3 className="text-2xl font-black text-purple-700 uppercase tracking-widest">Adresse & Localisation</h3>
                </div>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-purple-700 uppercase px-2 flex items-center gap-2">📮 Adresse Complète</label>
                    <textarea name="address" defaultValue={getFormValue(editingCustomer as any, 'address', 'address')} className="w-full px-8 py-6 bg-white rounded-3xl outline-none font-black border-2 border-purple-200 focus:bg-purple-50 focus:border-purple-600 focus:ring-2 ring-purple-300 h-32 resize-none transition-all shadow-md" />
                  </div>
                </div>
              </section>

              {/* SECTION 4: MEDIA (Profile & Documents) */}
              <section>
                <div className="flex items-center gap-4 border-b-2 border-cyan-300 pb-6 mb-10">
                  <span className="text-4xl">📸</span>
                  <h3 className="text-2xl font-black text-cyan-700 uppercase tracking-widest">Photos & Médias</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Profile Picture */}
                  <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-12 rounded-[3rem] text-center flex flex-col items-center border-3 border-blue-300 shadow-lg">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white mb-8 flex items-center justify-center">
                      {profilePreview ? <img loading="lazy" src={profilePreview} className="w-full h-full object-cover" /> : <span className="text-7xl">👤</span>}
                    </div>
                    <p className="text-[11px] font-black text-blue-700 uppercase tracking-widest mb-6">Photo de Profil</p>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-white text-blue-600 rounded-2xl text-[12px] font-black uppercase shadow-lg hover:shadow-xl hover:scale-105 transition-all border-2 border-blue-300">📷 Charger Photo</button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} />
                  </div>

                  {/* Documents */}
                  <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-12 rounded-[3rem] border-3 border-indigo-300 shadow-lg">
                    <p className="text-[11px] font-black text-indigo-700 uppercase tracking-widest mb-6 text-center">Documents Scannés</p>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      {docPreviews.map((doc, i) => (
                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border-3 border-white group">
                          <img loading="lazy" src={doc} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setDocPreviews(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-2xl font-black">✕</button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => docInputRef.current?.click()} className="w-full py-5 bg-white text-indigo-600 rounded-2xl text-[12px] font-black uppercase shadow-lg hover:shadow-xl hover:scale-105 transition-all border-2 border-indigo-300">+ 📄 Ajouter Documents</button>
                    <input type="file" ref={docInputRef} className="hidden" multiple accept="image/*" onChange={(e) => handleImageUpload(e, 'docs')} />
                  </div>
                </div>
              </section>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-6 pt-12 border-t-2 border-gray-300">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-14 py-6 text-sm font-black text-gray-500 uppercase tracking-widest hover:text-red-600 hover:bg-red-50 transition-all rounded-[1.5rem] border-2 border-gray-200">❌ Annuler</button>
                <GradientButton type="submit" disabled={loading} className="!px-24 !py-7 text-xl rounded-[2.5rem] shadow-2xl font-black uppercase">
                  {loading ? '⏳ Enregistrement...' : (editingCustomer ? '✏️ Mettre à Jour' : '✅ Créer Client')}
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
            {filteredCustomers.length} Clients en base de données
          </div>
        </div>
        <div className={`flex flex-col sm:flex-row items-center gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <input type="text" placeholder={t.search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-[450px] py-6 px-8 bg-white border-2 border-gray-100 focus:border-blue-600 rounded-[3rem] text-lg font-bold shadow-sm outline-none" />
          <GradientButton onClick={() => handleOpenForm()} className="w-full sm:w-auto !py-6 !px-14 text-2xl shadow-xl">+ {t.addBtn}</GradientButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-12">
        {displayedCustomers.map((c) => (
          <div key={c.id} className="group bg-white rounded-[4rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden hover:shadow-[0_50px_120px_-30px_rgba(59,130,246,0.15)] hover:-translate-y-4 transition-all duration-700 flex flex-col h-full">
            <div className="p-10 flex flex-col flex-1">
              <div className="flex items-center gap-8 mb-10">
                  <div className="w-28 h-28 rounded-full border-4 border-white shadow-2xl overflow-hidden group-hover:rotate-3 group-hover:scale-105 transition-transform duration-500">
                  <img loading="lazy" src={c.profilePicture || 'https://via.placeholder.com/200'} className="w-full h-full object-cover" alt="Profile" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-gray-900 leading-tight truncate">{c.firstName} {c.lastName}</h3>
                  <p className="text-lg font-black text-blue-600 mt-2">📞 {c.phone}</p>
                  {c.documentLeftAtStore && c.documentLeftAtStore !== 'Aucun' && (
                    <span className="mt-2 inline-flex items-center px-3 py-1 bg-red-50 text-red-600 text-[9px] font-black uppercase rounded-full border border-red-100">📄 Dépôt: {c.documentLeftAtStore}</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="p-6 rounded-[2.5rem] bg-gray-50 flex flex-col items-center text-center shadow-inner"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Locations</p><p className="text-3xl font-black text-gray-900">{c.totalReservations}</p></div>
                <div className="p-6 rounded-[2.5rem] bg-gray-50 flex flex-col items-center text-center shadow-inner"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Investissement</p><p className="text-xl font-black text-green-600">{c.totalSpent.toLocaleString()} DZ</p></div>
              </div>
              <div className="mt-auto space-y-4 pt-4 border-t border-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setActiveModal({ type: 'details', customer: c })} className="py-4.5 rounded-2xl bg-blue-50 text-blue-600 font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2">🔍 {t.details}</button>
                  <button onClick={() => setActiveModal({ type: 'history', customer: c })} className="py-4.5 rounded-2xl bg-gray-50 text-gray-500 font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all shadow-sm flex items-center justify-center gap-2">📜 {t.history}</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleOpenForm(c)} className="py-4.5 rounded-2xl bg-gray-50 text-gray-500 font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">✏️ {t.edit}</button>
                  <button onClick={() => setActiveModal({ type: 'delete', customer: c })} className="py-4.5 rounded-2xl bg-red-50 text-red-600 font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2">🗑️ {t.delete}</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length > displayedCustomers.length && (
        <div className="flex justify-center mt-8">
          <button onClick={() => setDisplayCount(prev => prev + 50)} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black">Charger plus</button>
        </div>
      )}

      {activeModal.type === 'delete' && activeModal.customer && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-12 text-center">
              <h3 className="text-2xl font-black text-gray-900 mb-4">{t.confirmDelete}</h3>
              <div className="flex gap-4">
                <button onClick={() => setActiveModal({ type: null, customer: null })} className="flex-1 py-5 bg-gray-100 rounded-[1.5rem] font-black uppercase text-[10px]">Annuler</button>
                <button onClick={() => handleDelete(activeModal.customer!.id)} className="flex-1 py-5 bg-red-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] shadow-xl">Supprimer</button>
              </div>
           </div>
        </div>
      )}

      {activeModal.type === 'details' && activeModal.customer && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal({ type: null, customer: null }); }}>
          <div className="bg-white w-full max-w-6xl rounded-[4rem] overflow-hidden shadow-2xl animate-scale-in flex flex-col md:flex-row h-[90vh]">
            <div className="md:w-1/3 bg-gray-50 p-10 flex flex-col items-center border-r border-gray-100 overflow-y-auto custom-scrollbar">
              <div className="w-48 h-48 rounded-full border-8 border-white shadow-2xl overflow-hidden mb-8 flex-shrink-0">
                <img src={activeModal.customer.profilePicture || 'https://via.placeholder.com/200'} className="w-full h-full object-cover" alt="Profile" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 text-center mb-10 leading-tight">{getField(activeModal.customer, 'firstName', 'first_name')}<br/>{getField(activeModal.customer, 'lastName', 'last_name')}</h2>
              <div className="w-full space-y-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Documents Scannés</p>
                <div className="grid grid-cols-1 gap-4">
                  {((activeModal.customer as any).documentImages || []).map((url: string, i: number) => (
                    <img key={i} loading="lazy" src={url} className="w-full rounded-2xl shadow-sm border-2 border-white" />
                  ))}
                </div>
              </div>
            </div>
            <div className="md:w-2/3 p-16 overflow-y-auto relative bg-white custom-scrollbar text-left">
              <button onClick={() => setActiveModal({ type: null, customer: null })} className="absolute top-8 right-8 w-14 h-14 flex items-center justify-center bg-gray-50 rounded-full text-2xl">✕</button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* use safe accessor */}
                {(() => {
                  const c: any = activeModal.customer;
                  return (
                    <>
                      <div className="p-6 bg-blue-50 rounded-2xl flex items-start gap-4">
                        <div className="text-3xl">📱</div>
                        <div>
                          <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Téléphone</p>
                          <p className="text-2xl font-black">{getField(c, 'phone', 'phone')}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-purple-50 rounded-2xl flex items-start gap-4">
                        <div className="text-3xl">📧</div>
                        <div>
                          <p className="text-[10px] font-black text-purple-600 uppercase mb-1">Email</p>
                          <p className="text-2xl font-black">{getField(c, 'email', 'email') || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-pink-50 rounded-2xl flex items-start gap-4">
                        <div className="text-3xl">🎂</div>
                        <div>
                          <p className="text-[10px] font-black text-pink-600 uppercase mb-1">Date Naissance</p>
                          <p className="text-xl font-bold">{formatDate(getField(c, 'birthday', 'birthday'))}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-pink-50 rounded-2xl flex items-start gap-4">
                        <div className="text-3xl">📍</div>
                        <div>
                          <p className="text-[10px] font-black text-pink-600 uppercase mb-1">Lieu Naissance</p>
                          <p className="text-xl font-bold">{getField(c, 'birthPlace', 'birth_place')}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-yellow-50 rounded-2xl flex items-start gap-4">
                        <div className="text-3xl">🆔</div>
                        <div>
                          <p className="text-[10px] font-black text-yellow-700 uppercase mb-1">N° CNI</p>
                          <p className="text-xl font-bold">{getField(c, 'idCardNumber', 'id_card_number')}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-indigo-50 rounded-2xl flex items-start gap-4">
                        <div className="text-3xl">🎫</div>
                        <div>
                          <p className="text-[10px] font-black text-indigo-700 uppercase mb-1">Type Doc</p>
                          <p className="text-xl font-bold">{getField(c, 'documentType', 'document_type')}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-indigo-50 rounded-2xl flex items-start gap-4">
                        <div className="text-3xl">🔢</div>
                        <div>
                          <p className="text-[10px] font-black text-indigo-700 uppercase mb-1">N° Doc</p>
                          <p className="text-xl font-bold">{getField(c, 'documentNumber', 'document_number')}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-green-50 rounded-2xl flex items-start gap-4">
                        <div className="text-3xl">📅</div>
                        <div>
                          <p className="text-[10px] font-black text-green-700 uppercase mb-1">Délivrance</p>
                          <p className="text-xl font-bold">{formatDate(getField(c, 'documentDeliveryDate', 'document_delivery_date'))}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-red-50 rounded-2xl flex items-start gap-4">
                        <div className="text-3xl">⏰</div>
                        <div>
                          <p className="text-[10px] font-black text-red-600 uppercase mb-1">Expiration Doc</p>
                          <p className="text-xl font-bold">{formatDate(getField(c, 'documentExpiryDate', 'document_expiry_date'))}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-amber-50 rounded-2xl flex items-start gap-4">
                        <div className="text-3xl">📍</div>
                        <div>
                          <p className="text-[10px] font-black text-amber-700 uppercase mb-1">Lieu Délivrance</p>
                          <p className="text-xl font-bold">{getField(c, 'documentDeliveryAddress', 'document_delivery_address')}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-gray-50 rounded-2xl flex items-start gap-4">
                        <div className="text-3xl">🚗</div>
                        <div>
                          <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Permis</p>
                          <p className="text-xl font-bold">{getField(c, 'licenseNumber', 'license_number')}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-gray-50 rounded-2xl flex items-start gap-4">
                        <div className="text-3xl">⏱️</div>
                        <div>
                          <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Expiration Permis</p>
                          <p className="text-xl font-bold">{formatDate(getField(c, 'licenseExpiry', 'license_expiry'))}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-gray-50 rounded-2xl flex items-start gap-4">
                        <div className="text-3xl">📅</div>
                        <div>
                          <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Délivrance Permis</p>
                          <p className="text-xl font-bold">{formatDate(getField(c, 'licenseIssueDate', 'license_issue_date'))}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-gray-50 rounded-2xl flex items-start gap-4">
                        <div className="text-3xl">📍</div>
                        <div>
                          <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Lieu Délivrance Permis</p>
                          <p className="text-xl font-bold">{getField(c, 'licenseIssuePlace', 'license_issue_place')}</p>
                        </div>
                      </div>

                      <div className="sm:col-span-2 p-6 bg-red-50 rounded-3xl border border-red-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Document laissé à l'agence</p>
                          <p className="text-xl font-black text-red-900">{getField(c, 'documentLeftAtStore', 'document_left_at_store')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wilaya</p>
                          <p className="text-xl font-black">{getField(c, 'wilaya', 'wilaya')}</p>
                          <p className="text-sm text-gray-500 mt-2">{getField(c, 'address', 'address')}</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="mt-16 p-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] text-white shadow-2xl flex justify-between items-center">
                <div><p className="text-[10px] font-black uppercase opacity-60 mb-2">Valeur Client</p><p className="text-6xl font-black">{(activeModal.customer?.totalSpent || 0).toLocaleString()} DZ</p></div>
                <div className="text-right"><p className="text-[10px] font-black uppercase opacity-60 mb-2">Total Locations</p><p className="text-6xl font-black">{activeModal.customer?.totalReservations || 0}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal.type === 'history' && activeModal.customer && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-6xl rounded-[3rem] overflow-hidden shadow-2xl animate-scale-in p-8">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-2xl font-black">Historique: {activeModal.customer.firstName} {activeModal.customer.lastName}</h3>
              <button onClick={() => setActiveModal({ type: null, customer: null })} className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full text-2xl">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-6 bg-gray-50 rounded-2xl text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase">Nombre de locations</p>
                <p className="text-3xl font-black">{customerHistory.length}</p>
              </div>
              <div className="p-6 bg-green-50 rounded-2xl text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase">Total facturé</p>
                <p className="text-3xl font-black text-green-600">{historyTotalAmount.toLocaleString()} {t.currency}</p>
              </div>
              <div className="p-6 bg-blue-50 rounded-2xl text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase">Total payé</p>
                <p className="text-3xl font-black text-blue-700">{historyPaidAmount.toLocaleString()} {t.currency}</p>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[60vh]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm text-gray-500 uppercase text-[11px]">
                    <th className="p-3">#</th>
                    <th className="p-3">Période</th>
                    <th className="p-3">Véhicule</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3 text-right">Montant</th>
                    <th className="p-3 text-right">Payé</th>
                  </tr>
                </thead>
                <tbody>
                  {customerHistory.map((r, i) => {
                    const vehicle = vehicles.find(v => v.id === r.vehicleId);
                    return (
                      <tr key={r.id} className="border-t border-gray-100">
                        <td className="p-3 align-top text-sm">{i + 1}</td>
                        <td className="p-3 align-top text-sm">{r.startDate} → {r.endDate}</td>
                        <td className="p-3 align-top text-sm">{vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.immatriculation})` : r.vehicleId}</td>
                        <td className="p-3 align-top text-sm">{r.status}</td>
                        <td className="p-3 align-top text-sm text-right font-black">{(r.totalAmount || 0).toLocaleString()} {t.currency}</td>
                        <td className="p-3 align-top text-sm text-right font-black">{(r.paidAmount || 0).toLocaleString()} {t.currency}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
