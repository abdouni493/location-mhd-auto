
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Language, Reservation, ReservationStatus, Customer, Vehicle, 
  RentalOption, Worker, Agency, LocationLog 
} from '../types';
import { ALGERIAN_WILAYAS } from '../constants';
import { supabase } from '../lib/supabase';
import GradientButton from '../components/GradientButton';
import DocumentPersonalizer from '../components/DocumentPersonalizer';
interface PlannerPageProps { 
  lang: Language; 
  customers: Customer[];
  vehicles: Vehicle[];
  agencies: Agency[];
  workers: Worker[];
  reservations: Reservation[];
  onUpdateReservation: () => void;
  onAddReservation: () => void;
  onDeleteReservation: () => void;
  storeLogo?: string;
  storeInfo?: { name: string; phone: string; email: string; address: string };
  onUpdateTemplates?: (tpls: any[]) => void;
  templates?: any[];
}

type ActionModal = 'details' | 'pay' | 'activate' | 'terminate' | 'delete' | 'add-option' | 'personalize' | null;

const ModalBase: React.FC<{ title: string, children?: React.ReactNode, onClose: () => void, maxWidth?: string }> = ({ title, children, onClose, maxWidth = "max-w-4xl" }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
    <div className={`bg-white w-full ${maxWidth} rounded-[3.5rem] shadow-2xl animate-scale-in p-10 overflow-y-auto max-h-[95vh] border border-white/20`}>
      <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-6">
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{title}</h2>
        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-xl">✕</button>
      </div>
      {children}
    </div>
  </div>
);

const FuelSelector: React.FC<{ value: string, onChange: (v: any) => void }> = ({ value, onChange }) => (
  <div className="grid grid-cols-5 gap-2">
    {['PLEIN', '1/2', '1/4', '1/8', 'VIDE'].map(level => (
      <button
        key={level}
        type="button"
        onClick={() => onChange(level.toLowerCase())}
        className={`py-6 rounded-3xl font-black text-[10px] transition-all border-2 ${value === level.toLowerCase() ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105' : 'bg-gray-50 border-transparent text-gray-400 hover:border-blue-200'}`}
      >
        {level}
      </button>
    ))}
  </div>
);

const SignaturePad: React.FC<{ onSave: (dataUrl: string) => void, isRtl: boolean, initialValue?: string }> = ({ onSave, isRtl, initialValue }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef(false);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(800, Math.floor(rect.width * dpr));
    canvas.height = Math.max(260, Math.floor(260 * dpr));
    canvas.style.width = '100%';
    canvas.style.height = '260px';
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
    }
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    if (!initialValue) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    };
    img.src = initialValue;
  }, [initialValue]);

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = (e.clientX ?? e.touches?.[0]?.clientX);
    const clientY = (e.clientY ?? e.touches?.[0]?.clientY);
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const pointerDown = (e: any) => {
    drawingRef.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    e.preventDefault();
  };

  const pointerMove = (e: any) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    e.preventDefault();
  };

  const pointerUp = () => {
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) onSave(canvas.toDataURL());
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSave('');
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('pointerdown', pointerDown);
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('touchstart', pointerDown, { passive: false } as any);
    window.addEventListener('touchmove', pointerMove as any, { passive: false } as any);
    window.addEventListener('touchend', pointerUp as any);
    return () => {
      canvas.removeEventListener('pointerdown', pointerDown);
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('touchstart', pointerDown as any);
      window.removeEventListener('touchmove', pointerMove as any);
      window.removeEventListener('touchend', pointerUp as any);
    };
  }, [canvasRef.current]);

  return (
    <div ref={containerRef} className="relative group">
      <canvas ref={canvasRef} className="w-full bg-white border-4 border-dashed border-gray-200 rounded-[2rem] cursor-crosshair touch-none shadow-inner" />
      <button type="button" onClick={clear} className="absolute bottom-3 right-3 px-4 py-2 bg-red-50 text-red-600 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">Effacer</button>
    </div>
  );
};

const PlannerPage: React.FC<PlannerPageProps> = ({ 
  lang, customers, vehicles, agencies, workers, reservations, 
  onUpdateReservation, onAddReservation, onDeleteReservation,
  storeLogo, storeInfo, onUpdateTemplates, templates = []
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState(1);
  const [searchQuery, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  
  
  // Creation form state
  const [formData, setFormData] = useState<Partial<Reservation> & {
    startTime: string; endTime: string; differentReturn: boolean;
    tempOptions: RentalOption[]; isWithDriver: boolean; paidAmount: number;
    discount: number; withTVA: boolean; tvaPercentage: number;
  }>({
    startTime: '10:00', endTime: '10:00', differentReturn: false, tempOptions: [],
    isWithDriver: false, paidAmount: 0, status: 'confermer',
    cautionAmount: 0, discount: 0, withTVA: false, tvaPercentage: 19
  });

  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [newClientData, setNewClientData] = useState<Partial<Customer>>({
    wilaya: '16 - Alger',
    documentImages: [],
    profilePicture: 'https://via.placeholder.com/200'
  });
  const [profilePreviewNew, setProfilePreviewNew] = useState<string | null>(null);
  const [docPreviewsNew, setDocPreviewsNew] = useState<string[]>([]);
  const fileInputRefNew = useRef<HTMLInputElement | null>(null);
  const docInputRefNew = useRef<HTMLInputElement | null>(null);

  const handleImageUploadNew = (e: React.ChangeEvent<HTMLInputElement>, target: 'profile' | 'docs') => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          if (target === 'profile') setProfilePreviewNew(base64);
          else setDocPreviewsNew(prev => [...prev, base64]);
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const [tempOptionCat, setTempOptionCat] = useState<RentalOption['category'] | null>(null);
  const [activeModal, setActiveModal] = useState<ActionModal>(null);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [openRowActions, setOpenRowActions] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [activePayTab, setActivePayTab] = useState<'pay'|'history'>('pay');
  const [paymentHistory, setPaymentHistory] = useState<Array<any>>([]);

  const [logData, setLogData] = useState<Partial<LocationLog>>({ fuel: 'plein', location: '' });
  const [termData, setTermData] = useState({
    mileage: 0, fuel: 'plein' as any, date: new Date().toISOString().slice(0, 16),
    location: '', notes: '', extraKmCost: 0, extraFuelCost: 0, withTva: false, tvaPercentage: 19
  });
  const [selectedDocType, setSelectedDocType] = useState<'devis'|'contrat'|'versement'|'facture'|'engagement'|null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [termDocsLeft, setTermDocsLeft] = useState<{ label: string; url?: string; left: boolean }[]>([]);

  // Inspection modal + templates state
  const [inspModalVisible, setInspModalVisible] = useState(false);
  const [inspectionTemplates, setInspectionTemplates] = useState<any[]>([]);
  // Rental/options (Services & Options Additionnels)
  const [rentalOptions, setRentalOptions] = useState<RentalOption[]>([]);
  const [optionName, setOptionName] = useState('');
  const [optionPrice, setOptionPrice] = useState<number | ''>('');
  const [newSecItem, setNewSecItem] = useState<string>('');
  const [newEqItem, setNewEqItem] = useState('');
  const [newConfItem, setNewConfItem] = useState('');
  const [clickedItemKey, setClickedItemKey] = useState<string | null>(null);
  const [deletedItems, setDeletedItems] = useState<Record<string, Set<string>>>({});
  const [pendingInspection, setPendingInspection] = useState<Partial<any> | null>(null);
  const [inspectionData, setInspectionData] = useState<{ depart?: any; retour?: any }>({});
  const [retourInspectionConfirm, setRetourInspectionConfirm] = useState<{ security: Record<string, boolean>; equipment: Record<string, boolean>; comfort: Record<string, boolean>; cleanliness: Record<string, boolean> }>({ security: {}, equipment: {}, comfort: {}, cleanliness: {} });
  const interiorInputRef = useRef<HTMLInputElement | null>(null);
  const exteriorInputRef = useRef<HTMLInputElement | null>(null);
  const [interiorPreviews, setInteriorPreviews] = useState<string[]>([]);
  const [exteriorPreviews, setExteriorPreviews] = useState<string[]>([]);

  // Helper to get the reservation's departure mileage (check-in)
  const getDepartureMileage = (res?: Reservation | null) => {
    if (!res) return 0;
    // Prefer explicit inspection depart mileage if available, then activationLog (camelCase), then activation_log (snake_case)
    const inspMileage = inspectionData?.depart?.mileage;
    if (typeof inspMileage === 'number' && !isNaN(inspMileage)) return inspMileage;

    const rawAct = (res as any)?.activationLog ?? (res as any)?.activation_log ?? null;
    if (!rawAct) return 0;

    // If activationLog is a JSON string, try parsing
    let actObj: any = rawAct;
    if (typeof rawAct === 'string') {
      try { actObj = JSON.parse(rawAct); } catch (e) { actObj = null; }
    }
    if (!actObj) return 0;

    const maybeMileage = actObj.mileage ?? actObj.km ?? actObj.mileage_start ?? null;
    const num = Number(maybeMileage);
    if (Number.isFinite(num)) return num;

    // Fallback: use vehicle's last known mileage if available
    const vehicle = vehicles.find(v => v.id === res.vehicleId);
    if (vehicle && typeof vehicle.mileage === 'number') return vehicle.mileage;

    return 0;
  };

  // When opening the terminate modal, refresh reservation from DB to ensure activationLog is current
  useEffect(() => {
    if (activeModal !== 'terminate' || !selectedRes?.id) return;
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.from('reservations').select('*').eq('id', selectedRes.id).single();
        if (!mounted) return;
        if (error) {
          console.warn('Failed to refresh reservation', error);
          return;
        }
        if (data) {
          setSelectedRes(data as Reservation);
          const rawAct = (data as any).activationLog ?? (data as any).activation_log ?? null;
          if (rawAct) {
            let actObj: any = rawAct;
            if (typeof rawAct === 'string') {
              try { actObj = JSON.parse(rawAct); } catch (e) { actObj = null; }
            }
            if (actObj) setInspectionData(prev => ({ ...(prev||{}), depart: actObj }));
          }
        }
      } catch (e) {
        console.warn('Error fetching reservation', e);
      }
    })();
    return () => { mounted = false; };
  }, [activeModal, selectedRes?.id]);
  
  // Terminate modal inspection items
  const [termInspectionItems, setTermInspectionItems] = useState<{ security?: any[]; equipment?: any[]; comfort?: any[] }>({ security: [], equipment: [], comfort: [] });
  const [termInspectionNewItems, setTermInspectionNewItems] = useState<{ security: string; equipment: string; comfort: string }>({ security: '', equipment: '', comfort: '' });
  const [termInspectionNotes, setTermInspectionNotes] = useState('');

  const initialPendingInsp = {
    mileage: formData.cautionAmount || 0,
    fuel: 'plein',
    security: {},
    equipment: {},
    comfort: {},
    cleanliness: {},
    notes: ''
  } as any;

  useEffect(() => {
    // load active templates from DB only
    const loadTemplates = async () => {
      try {
        const { data } = await supabase.from('inspection_templates').select('*').eq('is_active', true).order('created_at', { ascending: true });
        if (data) {
          const prepared = data.map((t: any) => ({ ...t, _key: (t._key || (t.item_name || '')).toString().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() }));
          setInspectionTemplates(prepared);
        }
      } catch (err) {
        console.error('Failed to load inspection templates from DB', err);
        setInspectionTemplates([]);
      }
    };
    loadTemplates();
    // load rental options
    const loadOptions = async () => {
      try {
        const { data } = await supabase.from('rental_options').select('*').eq('is_active', true).order('created_at', { ascending: true });
        if (data) setRentalOptions(data as any[]);
      } catch (err) {
        console.error('Failed to load rental options', err);
        setRentalOptions([]);
      }
    };
    loadOptions();
  }, []);

  // Load inspections when details modal opens
  useEffect(() => {
    const loadInspections = async () => {
      if (!selectedRes?.id) {
        setInspectionData({});
        return;
      }
      try {
        const { data } = await supabase.from('inspections').select('*').eq('reservation_id', selectedRes.id);
        if (data && Array.isArray(data)) {
          const departInsp = data.find(i => i.type === 'depart');
          const retourInsp = data.find(i => i.type === 'retour');
          setInspectionData({
            depart: departInsp || null,
            retour: retourInsp || null
          });
        } else {
          setInspectionData({});
        }
      } catch (err) {
        console.error('Failed to load inspections', err);
        setInspectionData({});
      }
    };
    
    if (activeModal === 'details') {
      loadInspections();
    }
  }, [activeModal, selectedRes?.id]);

  const handleInteriorUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files as FileList) as File[];
    const urls = files.map((f: File) => URL.createObjectURL(f as Blob));
    setInteriorPreviews(prev => [...prev, ...urls]);
    setPendingInspection(prev => ({ ...(prev || initialPendingInsp), interiorPhotos: [...((prev || initialPendingInsp).interiorPhotos || []), ...urls] }));
  };

  const handleExteriorUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files as FileList) as File[];
    const urls = files.map((f: File) => URL.createObjectURL(f as Blob));
    setExteriorPreviews(prev => [...prev, ...urls]);
    setPendingInspection(prev => ({ ...(prev || initialPendingInsp), exteriorPhotos: [...((prev || initialPendingInsp).exteriorPhotos || []), ...urls] }));
  };

  const makeKey = (s: string) => s.toString().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();

  const addCustomTemplate = async (type: string, name: string) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    try {
      const key = makeKey(trimmed);
      const insertObj: any = { template_type: type, item_name: trimmed, _key: key, is_active: true };
      // use upsert so repeated adds won't create duplicates and can reactivate existing keys
      try {
        const result = await supabase.from('inspection_templates').upsert([insertObj], { onConflict: '_key' });
        const { data, error } = result;
        if (error) {
          console.error('Supabase upsert error', error);
          alert('Erreur lors de l\'ajout du template: ' + (error.message || JSON.stringify(error)));
          return;
        }
        if (data && Array.isArray(data) && data.length > 0) {
          const item = { ...data[0] };
          setInspectionTemplates(prev => [...prev, item]);
          setPendingInspection(prev => ({ ...(prev || initialPendingInsp), [type]: { ...(((prev || initialPendingInsp) as any)[type] || {}), [item._key || key]: true } }));
        }
      } catch (dbErr) {
        console.error('Error adding template', dbErr);
      }
    } catch (err) { console.error('Error adding template', err); }
  };

  const addRentalOption = async (category: RentalOption['category'], name: string, price: number) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    try {
      const key = makeKey(trimmed);
      const insertObj: any = { category, name: trimmed, price: price || 0, _key: key, is_active: true };
      const result = await supabase.from('rental_options').upsert([insertObj], { onConflict: '_key' });
      const { data, error } = result;
      if (error) {
        console.error('Supabase upsert rental option error', error);
        alert('Erreur lors de l\'ajout de l\'option: ' + (error.message || JSON.stringify(error)));
        return;
      }
      if (data && Array.isArray(data) && data.length > 0) setRentalOptions(prev => [...prev, data[0]]);
    } catch (err) { console.error('Error adding rental option', err); }
  };

  const deleteRentalOption = async (id: string) => {
    if (!confirm('Supprimer cette option ?')) return;
    try {
      const { error } = await supabase.from('rental_options').delete().eq('id', id);
      if (!error) setRentalOptions(prev => prev.filter(o => o.id !== id));
      else console.error('Supabase delete rental option error', error);
    } catch (err) { console.error('Error deleting rental option', err); }
  };

  const toggleOptionSelection = (opt: RentalOption) => {
    const exists = formData.tempOptions.find(o => o.id === opt.id || o._key === (opt as any)._key || (o.name === opt.name && o.category === opt.category));
    if (exists) {
      setFormData({...formData, tempOptions: formData.tempOptions.filter(o => !(o.id === opt.id || o._key === (opt as any)._key || (o.name === opt.name && o.category === opt.category))) });
    } else {
      const toAdd: any = { id: (opt as any).id || (`opt_${Date.now()}`), name: opt.name, price: Number(opt.price) || 0, category: opt.category };
      setFormData({...formData, tempOptions: [...formData.tempOptions, toAdd]});
    }
  };

  const deleteCustomTemplate = async (id: string, type: string, key: string) => {
    if (!confirm('Supprimer cet item du modèle ?')) return;
    try {
      const { error } = await supabase.from('inspection_templates').delete().eq('id', id);
      if (!error) {
        setInspectionTemplates(prev => prev.filter(t => t.id !== id && t._key !== key));
        setPendingInspection(prev => {
          if (!prev) return prev;
          const nextSection = { ...((prev as any)[type] || {}) };
          delete nextSection[key];
          return { ...prev, [type]: nextSection };
        });
      } else {
        console.error('Supabase delete error', error);
      }
    } catch (err) {
      console.error('Error deleting template', err);
    }
  };

  const removeInspectionItem = async (type: string, key: string) => {
    // if this item is from templates, delete from DB
    const tpl = inspectionTemplates.find(t => t._key === key && t.template_type === type);
    if (tpl) {
      await deleteCustomTemplate(tpl.id, type, key);
      return;
    }
    if (!confirm('Supprimer cet item de la liste de contrôles ?')) return;
    // hide locally
    setDeletedItems(prev => {
      const next = { ...(prev || {}) } as Record<string, Set<string>>;
      next[type] = new Set(next[type] ? Array.from(next[type]) : []);
      next[type].add(key);
      return next;
    });
    setPendingInspection(prev => {
      if (!prev) return prev;
      const nextSection = { ...((prev as any)[type] || {}) };
      delete nextSection[key];
      return { ...prev, [type]: nextSection };
    });
  };

  const handleNextStep = () => {
    // if moving from vehicle selection to inspection step, initialize pending inspection
    if (creationStep === 2) {
      setPendingInspection(initialPendingInsp);
      setInteriorPreviews([]);
      setExteriorPreviews([]);
      setCreationStep(3);
      return;
    }
    setCreationStep(creationStep + 1);
  };

  const handleToggleInsp = (category: string, key: string) => {
    setPendingInspection(prev => {
      const next = { ...(prev || initialPendingInsp) } as any;
      next[category] = { ...(next[category] || {}) };
      next[category][key] = !next[category][key];
      return next;
    });
    // reveal delete button when item clicked
    setClickedItemKey(key);
  };

  const replaceVariables = (content: string, res: Reservation) => {
    const client = customers.find(c => c.id === res.customerId);
    const vehicle = vehicles.find(v => v.id === res.vehicleId);
    return content
      .replace(/{{client_name}}/g, `${client?.firstName} ${client?.lastName}`)
      .replace(/{{client_phone}}/g, client?.phone || '')
      .replace(/{{client_email}}/g, client?.email || '')
      .replace(/{{vehicle_brand}}/g, vehicle?.brand || '')
      .replace(/{{vehicle_model}}/g, vehicle?.model || '')
      .replace(/{{vehicle_plate}}/g, vehicle?.immatriculation || '')
      .replace(/{{res_number}}/g, res.reservationNumber)
      .replace(/{{res_date}}/g, new Date(res.startDate).toLocaleDateString())
      .replace(/{{total_amount}}/g, res.totalAmount.toLocaleString())
      .replace(/{{paid_amount}}/g, res.paidAmount.toLocaleString())
      .replace(/{{remaining_amount}}/g, (res.totalAmount - res.paidAmount).toLocaleString())
      .replace(/{{store_name}}/g, storeInfo?.name || 'DriveFlow')
      .replace(/{{store_phone}}/g, storeInfo?.phone || '')
      .replace(/{{store_email}}/g, storeInfo?.email || '')
      .replace(/{{store_address}}/g, storeInfo?.address || '');
  };

  const isRtl = lang === 'ar';
  const t = {
    fr: {
      title: 'Planificateur',
      status: { all: 'Tous', confermer: 'Confirmé', 'en cours': 'En Cours', terminer: 'Terminé', annuler: 'Annulé', 'en attente': 'En Attente' }
    },
    ar: {
      title: 'المخطط',
      status: { all: 'الكل', confermer: 'مؤكد', 'en cours': 'قيد التنفيذ', terminer: 'منتهي', annuler: 'ملغي', 'en attente': 'في الانتظار' }
    }
  }[lang];

  const imgFallbackSrc = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="Arial, Helvetica, sans-serif" font-size="20">Image unavailable</text></svg>';
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const t = e.currentTarget as HTMLImageElement;
    t.onerror = null;
    t.src = imgFallbackSrc;
  };

  const getVehicle = (id: string) => vehicles.find(v => v.id === id);
  const getCustomer = (id: string) => customers.find(c => c.id === id);
  
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const s = new Date(start); const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    const d = Math.ceil(diff / (1000 * 3600 * 24));
    return d > 0 ? d : 1;
  };

  // Calculate invoice totals
  const invoice = useMemo(() => {
    const v = getVehicle(formData.vehicleId || '');
    const days = calculateDays(formData.startDate || '', formData.endDate || '');
    const baseTotal = (v?.dailyRate || 0) * days;
    const optionsTotal = formData.tempOptions.reduce((acc, o) => acc + o.price, 0);
    const subtotal = baseTotal + optionsTotal - (formData.discount || 0);
    const tvaMultiplier = 1 + (formData.tvaPercentage || 19) / 100;
    const computedFinal = formData.withTVA ? subtotal * tvaMultiplier : subtotal;
    const override = (formData as any).totalAmount;
    const finalTotal = typeof override === 'number' && !isNaN(override) ? override : computedFinal;
    const rest = finalTotal - (formData.paidAmount || 0);
    return { days, baseTotal, optionsTotal, subtotal, finalTotal, rest };
  }, [formData]);

  const resetForm = () => {
    setIsCreating(false);
    setCreationStep(1);
    setFormData({
      startTime: '10:00', endTime: '10:00', differentReturn: false, tempOptions: [],
      isWithDriver: false, paidAmount: 0, status: 'confermer',
      cautionAmount: 0, discount: 0, withTVA: false, tvaPercentage: 19
    });
    setIsCreatingNewClient(false);
    setNewClientData({
      wilaya: '16 - Alger',
      documentImages: [],
      profilePicture: 'https://via.placeholder.com/200'
    });
  };

  const handleSaveReservation = async () => {
    if (!formData.customerId || !formData.vehicleId || !formData.startDate || !formData.endDate || !formData.pickupAgencyId) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    setLoading(true);
    try {
      const resData = {
        customer_id: formData.customerId,
        vehicle_id: formData.vehicleId,
        start_date: `${formData.startDate}T${formData.startTime}`,
        end_date: `${formData.endDate}T${formData.endTime}`,
        pickup_agency_id: formData.pickupAgencyId,
        return_agency_id: formData.differentReturn ? formData.returnAgencyId : formData.pickupAgencyId,
        driver_id: formData.isWithDriver ? formData.driverId : null,
        status: 'confermer',
        total_amount: (formData as any).totalAmount ?? invoice.finalTotal,
        paid_amount: formData.paidAmount,
        caution_amount: formData.cautionAmount || 0,
        discount: formData.discount || 0,
        with_tva: formData.withTVA || false,
        tva_percentage: formData.tvaPercentage || 19,
        options: (formData.tempOptions && formData.tempOptions.length > 0) ? formData.tempOptions : null
      };

      // insert reservation and get inserted row
      const resultInsert = await supabase.from('reservations').insert([resData]);
      const { data: insertedData, error } = resultInsert;
      const inserted = Array.isArray(insertedData) && insertedData.length > 0 ? insertedData[0] : insertedData;
      if (error || !inserted) throw error || new Error('Reservation insert failed');

      // if user filled an inspection in the modal, persist it attached to this reservation
      if (pendingInspection) {
        try {
          const inspPayload: any = {
            reservation_id: inserted.id,
            type: 'depart',
            date: new Date().toISOString().split('T')[0],
            mileage: pendingInspection.mileage || 0,
            fuel: pendingInspection.fuel || 'plein',
            security: pendingInspection.security || {},
            equipment: pendingInspection.equipment || {},
            comfort: pendingInspection.comfort || {},
            cleanliness: pendingInspection.cleanliness || {},
            exterior_photos: (pendingInspection.exteriorPhotos && pendingInspection.exteriorPhotos.length > 0) ? pendingInspection.exteriorPhotos : null,
            interior_photos: (pendingInspection.interiorPhotos && pendingInspection.interiorPhotos.length > 0) ? pendingInspection.interiorPhotos : null,
            signature: pendingInspection.signature || '',
            notes: pendingInspection.notes || ''
          };
          console.log('Saving inspection payload:', inspPayload);
          const resultInsp = await supabase.from('inspections').insert([inspPayload]);
          const { data: inspData, error: inspErr } = resultInsp;
          if (inspErr) {
            console.error('Failed to save inspection:', inspErr);
            // Don't throw - inspection is optional
          } else {
            console.log('Inspection saved successfully:', inspData);
          }
        } catch (ie) {
          console.error('Inspection save error:', ie);
          // Don't throw - inspection is optional
        }
      }

      // Update vehicle status to 'loué' and update mileage if provided in the inspection
      try {
        const updateData: any = { status: 'loué' };
        if (pendingInspection && typeof pendingInspection.mileage === 'number' && !isNaN(pendingInspection.mileage)) {
          updateData.mileage = pendingInspection.mileage;
        }
        await supabase.from('vehicles').update(updateData).eq('id', formData.vehicleId);
      } catch (vErr) {
        console.error('Failed to update vehicle status/mileage', vErr);
      }

      onAddReservation();
      resetForm();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const c = getCustomer(res.customerId);
      const q = searchQuery.toLowerCase();
      const customerName = c ? `${c.firstName} ${c.lastName}`.toLowerCase() : '';
      const reservationNum = res.reservationNumber ? res.reservationNumber.toLowerCase() : '';
      const matchSearch = reservationNum.includes(q) || 
                          customerName.includes(q);
      const matchStatus = filterStatus === 'all' || res.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [reservations, searchQuery, filterStatus, customers]);

  const handleActivate = async () => {
    if (!selectedRes) return;
    setLoading(true);
    try {
      const activationLogData = { ...logData, date: new Date().toISOString() };
      
      // Make both updates in parallel for fastest execution
      const [updateResResult, updateVehicleResult] = await Promise.all([
        supabase.from('reservations').update({
          status: 'en cours',
          activationLog: activationLogData
        }).eq('id', selectedRes.id),
        supabase.from('vehicles').update({ 
          status: 'loué', 
          mileage: logData.mileage 
        }).eq('id', selectedRes.vehicleId)
      ]);
      
      if (updateResResult.error) throw updateResResult.error;
      if (updateVehicleResult.error) throw updateVehicleResult.error;
      
      onUpdateReservation();
      setActiveModal(null);
      setLogData({ fuel: 'plein', location: '' });
    } catch (err: any) { 
      alert(`Erreur d'activation: ${err.message}`); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleTerminate = async () => {
    if (!selectedRes) return;
    setLoading(true);
    try {
      const extraTotal = (termData.extraKmCost + termData.extraFuelCost) * (termData.withTva ? 1.19 : 1);
      const terminationLogData = { ...termData, documentsLeft: termDocsLeft };
      
      // Compute new total safely (handle camelCase/snake_case coming from DB)
      const currentTotal = Number((selectedRes as any).totalAmount ?? (selectedRes as any).total_amount ?? 0) || 0;
      const newTotal = currentTotal + Number(extraTotal || 0);

      // Make both updates in parallel for faster execution
      const updatePromises = [
        supabase.from('reservations').update({
          status: 'terminer',
          terminationLog: terminationLogData,
          // write both camelCase and snake_case to be safe depending on DB column naming
          totalAmount: newTotal,
          total_amount: newTotal
        }).eq('id', selectedRes.id),
        supabase.from('vehicles').update({ 
          status: 'disponible', 
          mileage: termData.mileage 
        }).eq('id', selectedRes.vehicleId)
      ];
      
      // If there's a depart inspection and retour confirmation, save retour inspection
      if (inspectionData.depart && (retourInspectionConfirm.security.verified || retourInspectionConfirm.equipment.verified || retourInspectionConfirm.comfort.verified || retourInspectionConfirm.cleanliness.verified)) {
        updatePromises.push(
          supabase.from('inspections').insert([{
            reservation_id: selectedRes.id,
            type: 'retour',
            date: new Date().toISOString(),
            mileage: termData.mileage,
            fuel: termData.fuel,
            security: retourInspectionConfirm.security,
            equipment: retourInspectionConfirm.equipment,
            comfort: retourInspectionConfirm.comfort,
            cleanliness: retourInspectionConfirm.cleanliness,
            notes: termData.notes
          }])
        );
      }
      
      const [updateResResult, updateVehicleResult, ...otherResults] = await Promise.all(updatePromises);
      
      if (updateResResult.error) throw updateResResult.error;
      if (updateVehicleResult.error) throw updateVehicleResult.error;
      
      // Ensure vehicle status is set to 'disponible' (extra safety in case of DB naming differences)
      try {
        await supabase.from('vehicles').update({ status: 'disponible', state: 'disponible' }).eq('id', selectedRes.vehicleId);
      } catch (e) { console.warn('Failed to ensure vehicle status update', e); }

      onUpdateReservation();
      setActiveModal(null);
      setRetourInspectionConfirm({ security: {}, equipment: {}, comfort: {}, cleanliness: {} });
    } catch (err: any) { 
      alert(`Erreur de clôture: ${err.message}`); 
    } finally { 
      setLoading(false); 
    }
  };

  const createClientAlert = async (customerId: string, reservationId: string, message: string) => {
    try {
      // try to store in a server table 'client_alerts' if available
      const { error } = await supabase.from('client_alerts').insert([{ customer_id: customerId, reservation_id: reservationId, message, read: false }]);
      if (error) throw error;
      return true;
    } catch (err) {
      // fallback to localStorage
      try {
        const key = `clientAlerts_${customerId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push({ reservationId, message, read: false, createdAt: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(existing));
        return true;
      } catch (e) {
        console.error('Failed to save client alert:', e);
        return false;
      }
    }
  };

  const removeClientAlertsForReservation = async (customerId: string, reservationId: string) => {
    try {
      const result = await supabase.from('client_alerts').delete().eq('customer_id', customerId);
      if (result.error) throw result.error;
    } catch (err) {
      const key = `clientAlerts_${customerId}`;
      try {
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = existing.filter((a:any) => a.reservationId !== reservationId);
        localStorage.setItem(key, JSON.stringify(filtered));
      } catch (e) { console.error(e); }
    }
  };

  const markDocumentsTaken = async (taken: boolean) => {
    if (!selectedRes) return;
    try {
      // try to persist flag on reservation
      await supabase.from('reservations').update({ documents_taken: taken }).eq('id', selectedRes.id);
    } catch (err) {
      // ignore failure - local fallback
      const key = `reservation_docs_${selectedRes.id}`;
      localStorage.setItem(key, JSON.stringify({ taken, docs: termDocsLeft }));
    }

    if (taken) {
      // remove alerts for this reservation
      await removeClientAlertsForReservation(selectedRes.customerId, selectedRes.id);
      alert('Marqué comme récupéré.');
    } else {
      // create client alert
      await createClientAlert(selectedRes.customerId, selectedRes.id, 'Vos documents sont restés à l\'agence. Veuillez les récupérer.');
      alert('Le client sera notifié que ses documents sont toujours en agence.');
    }
  };

  const handlePayment = async () => {
    if (!selectedRes || paymentAmount <= 0) return;
    setLoading(true);
    try {
      const newPaidAmount = Number(selectedRes.paidAmount) + Number(paymentAmount);
      // 1) Record payment in payment_history
      const insertRes = await supabase.from('payment_history').insert([{ reservation_id: selectedRes.id, amount: paymentAmount, payment_method: 'cash', notes: 'Point de vente' }]);
      if (insertRes.error) throw insertRes.error;

      // 2) Update reservation paid amount
      const { error } = await supabase.from('reservations').update({
        paid_amount: newPaidAmount
      }).eq('id', selectedRes.id);
      
      if (error) throw error;
      onUpdateReservation();
      setActiveModal(null);
      // refresh history if modal remains open later
      setPaymentHistory(prev => [{ id: (insertRes.data && insertRes.data[0] && insertRes.data[0].id) || 'new', amount: paymentAmount, created_at: new Date().toISOString() }, ...prev]);
    } catch (err: any) { 
      console.error("Payment Error:", err);
      alert(lang === 'fr' 
        ? `Échec du versement: ${err.message}` 
        : `فشل الدفع: ${err.message}`); 
    } finally { setLoading(false); }
  };

  const fetchPaymentHistory = async (reservationId?: string) => {
    if (!reservationId) return;
    try {
      const res = await supabase.from('payment_history').select('*').then((r:any)=>r);
      if (res?.data) {
        const list = (res.data as any[]).filter(p => p.reservation_id === reservationId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setPaymentHistory(list);
      }
    } catch (e) { console.error('Failed to fetch payments', e); }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!paymentId || !selectedRes) return;
    if (!confirm('Supprimer ce paiement ? Cette action ajustera le montant payé.')) return;
    setLoading(true);
    try {
      // fetch payment to know amount
      const getRes:any = await supabase.from('payment_history').select('*').then((r:any)=>r);
      const payment = (getRes.data || []).find((p:any) => p.id === paymentId);
      if (!payment) throw new Error('Paiement introuvable');

      const del = await supabase.from('payment_history').delete().eq('id', paymentId);
      if (del.error) throw del.error;

      // decrement reservation paid amount
      const newPaid = Math.max(0, Number(selectedRes.paidAmount) - Number(payment.amount));
      const upd = await supabase.from('reservations').update({ paid_amount: newPaid }).eq('id', selectedRes.id);
      if (upd.error) throw upd.error;

      // update local state
      setPaymentHistory(prev => prev.filter(p => p.id !== paymentId));
      onUpdateReservation();
      alert('Paiement supprimé. Montant ajusté.');
    } catch (e:any) { console.error(e); alert('Erreur suppression paiement: ' + (e.message || e)); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeModal === 'pay' && selectedRes) {
      fetchPaymentHistory(selectedRes.id);
    }
  }, [activeModal, selectedRes]);

  const handleDeleteRes = async (id: string) => {
    if(!confirm('Supprimer ce dossier ?')) return;
    setLoading(true);
    try {
      await supabase.from('reservations').delete().eq('id', id);
      onUpdateReservation();
      setActiveModal(null);
    } catch (err) { alert("Erreur suppression"); } finally { setLoading(false); }
  };

  const handleEditReservation = (res: Reservation) => {
    // Populate the creation form with reservation data so user can edit step-by-step
    try {
      const s = new Date(res.startDate);
      const e = new Date(res.endDate);
      const startDate = s.toISOString().slice(0,10);
      const startTime = s.toISOString().slice(11,16);
      const endDate = e.toISOString().slice(0,10);
      const endTime = e.toISOString().slice(11,16);

      setFormData({
        ...formData,
        customerId: res.customerId,
        vehicleId: res.vehicleId,
        startDate,
        startTime,
        endDate,
        endTime,
        pickupAgencyId: (res as any).pickupAgencyId || (res as any).pickup_agency_id || undefined,
        returnAgencyId: (res as any).returnAgencyId || (res as any).return_agency_id || undefined,
        differentReturn: ((res as any).returnAgencyId || (res as any).return_agency_id) && ((res as any).returnAgencyId || (res as any).return_agency_id) !== ((res as any).pickupAgencyId || (res as any).pickup_agency_id),
        driverId: (res as any).driverId || (res as any).driver_id || undefined,
        isWithDriver: !!((res as any).driverId || (res as any).driver_id),
        paidAmount: (res as any).paidAmount || (res as any).paid_amount || 0,
        discount: (res as any).discount || res.discount || 0,
        withTVA: (res as any).with_tva || res.withTVA || false,
        tvaPercentage: (res as any).tva_percentage || res.tvaPercentage || 19,
        tempOptions: (res as any).options || res.options || [],
        cautionAmount: (res as any).cautionAmount || (res as any).caution_amount || 0,
        status: res.status,
        // allow overriding total
        totalAmount: (res as any).totalAmount || (res as any).total_amount || undefined
      });

      setIsCreating(true);
      setCreationStep(1);
      setIsCreatingNewClient(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to populate reservation for edit', err);
      alert('Impossible d\'ouvrir la réservation pour modification.');
    }
  };

  return (
    <div className={`p-4 md:p-12 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
      <style>{`\
        /* Print helpers: hide controls and show only printable preview when user prints from browser */\
        @media print {\
          .no-print { display: none !important; }\
          .print-only { display: block !important; }\
          /* Keep printable area full page */\
          .print-only { position: fixed; left:0; top:0; width:100%; height:100%; background: white; padding: 0; margin:0; }\
        }\
      `}</style>
      <div className="flex justify-between items-center mb-16">
        <h1 className="text-6xl font-black text-gray-900 tracking-tighter">{t.title}</h1>
        {!isCreating && (
          <GradientButton onClick={() => setIsCreating(true)} className="!py-6 !px-12 text-2xl shadow-2xl">
            + Nouveau Dossier
          </GradientButton>
        )}
        {isCreating && (
          <button onClick={resetForm} className="px-10 py-5 bg-gray-100 rounded-3xl font-black text-gray-400 hover:text-red-500 uppercase text-xs tracking-widest transition-all">Annuler</button>
        )}
      </div>

      {isCreating ? (
        <div className="max-w-6xl mx-auto">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-12 max-w-4xl mx-auto px-4">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black transition-all ${creationStep >= s ? 'bg-blue-600 text-white shadow-xl' : 'bg-gray-100 text-gray-300'}`}>
                  {creationStep > s ? '✓' : s}
                </div>
                {s < 6 && <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${creationStep > s ? 'bg-blue-600' : 'bg-gray-100'}`}></div>}
              </React.Fragment>
            ))}
          </div>

          <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 p-10 md:p-16 min-h-[700px] flex flex-col relative overflow-hidden">
            {/* STEP 1: Dates & Agencies */}
            {creationStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
                <div className="p-10 bg-blue-50/50 rounded-[3.5rem] border border-blue-100 space-y-8 shadow-inner">
                  <h3 className="text-sm font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-4">🛫 DÉPART</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <input type="date" value={formData.startDate || ''} onChange={e => setFormData({...formData, startDate: e.target.value})} className="px-6 py-4 rounded-2xl font-bold bg-white shadow-sm outline-none focus:ring-2 ring-blue-300" />
                    <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="px-6 py-4 rounded-2xl font-bold bg-white shadow-sm outline-none focus:ring-2 ring-blue-300" />
                  </div>
                  <select value={formData.pickupAgencyId || ''} onChange={e => setFormData({...formData, pickupAgencyId: e.target.value})} className="w-full px-6 py-4 rounded-2xl font-bold bg-white shadow-sm outline-none appearance-none cursor-pointer focus:ring-2 ring-blue-300">
                    <option value="">Sélectionner une agence de départ</option>
                    {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="p-10 bg-indigo-50/50 rounded-[3.5rem] border border-indigo-100 space-y-8 shadow-inner">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-indigo-600 uppercase tracking-[0.3em]">🛬 RETOUR</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.differentReturn} onChange={e => setFormData({...formData, differentReturn: e.target.checked})} className="w-6 h-6 rounded-lg text-indigo-600" />
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Agence différente</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <input type="date" value={formData.endDate || ''} onChange={e => setFormData({...formData, endDate: e.target.value})} className="px-6 py-4 rounded-2xl font-bold bg-white shadow-sm outline-none focus:ring-2 ring-indigo-300" />
                    <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="px-6 py-4 rounded-2xl font-bold bg-white shadow-sm outline-none focus:ring-2 ring-indigo-300" />
                  </div>
                  {formData.differentReturn && (
                    <select value={formData.returnAgencyId || ''} onChange={e => setFormData({...formData, returnAgencyId: e.target.value})} className="w-full px-6 py-4 rounded-2xl font-bold bg-white shadow-sm outline-none appearance-none cursor-pointer focus:ring-2 ring-indigo-300">
                      <option value="">Sélectionner agence de retour</option>
                      {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Vehicle Selection */}
            {creationStep === 2 && (
              <div className="animate-fade-in">
                <h3 className="text-2xl font-black text-gray-900 mb-10 uppercase">Sélectionnez un véhicule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-h-[500px] overflow-y-auto pr-4">
                  {vehicles.map(v => (
                    <button key={v.id} onClick={() => setFormData({...formData, vehicleId: v.id})} className={`group p-8 rounded-[3.5rem] border-4 transition-all text-left relative overflow-hidden ${formData.vehicleId === v.id ? 'border-blue-600 bg-blue-50 shadow-2xl scale-105' : 'border-gray-50 bg-gray-50/50 hover:border-blue-200'}`}>
                        <div className="relative h-40 rounded-[2rem] overflow-hidden mb-6 shadow-xl">
                        <img src={v.mainImage} onError={handleImgError} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      </div>
                      <h4 className="text-xl font-black text-gray-900 truncate uppercase">{v.brand} {v.model}</h4>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">{v.immatriculation} • {v.fuelType}</p>
                      <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Tarif/J</p>
                        <p className="text-2xl font-black text-gray-900">{v.dailyRate.toLocaleString()} <span className="text-xs opacity-40">DZ</span></p>
                      </div>
                      <div className="text-[9px] font-bold text-gray-500 mt-4 pt-4 border-t border-gray-100">
                        <p>📍 {v.currentLocation}</p>
                        <p className="mt-1">📊 {v.status}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Inspection */}
            {creationStep === 3 && (
              <div className="p-10 md:p-16 space-y-12 animate-fade-in bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="text-center mb-8">
                  <h3 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">🔍 Inspection - État de départ</h3>
                  <p className="text-gray-600 font-bold">Documentez l'état initial du véhicule avant la location</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Vehicle Section */}
                  <div className="p-8 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-[2.5rem] border-2 border-blue-300/30 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-3xl">🚗</span>
                      <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest">Véhicule</h4>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl mb-6">
                      <p className="font-black text-lg text-gray-900">{getVehicle(formData.vehicleId || '')?.brand} {getVehicle(formData.vehicleId || '')?.model}</p>
                      <p className="text-sm text-blue-600 font-bold">📋 {getVehicle(formData.vehicleId || '')?.immatriculation}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-black text-blue-600 uppercase flex items-center gap-2 mb-2">
                          <span>🔢</span> Kilométrage (départ)
                        </label>
                        <input type="number" value={(pendingInspection?.mileage as any) || ''} onChange={e => setPendingInspection(prev => ({ ...(prev || initialPendingInsp), mileage: Number(e.target.value) }))} className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-blue-200 focus:border-blue-600 outline-none font-bold" placeholder="0 km" />
                      </div>
                      
                      <div>
                        <label className="text-xs font-black text-blue-600 uppercase flex items-center gap-2 mb-2">
                          <span>⛽</span> Niveau carburant
                        </label>
                        <select value={(pendingInspection?.fuel as any) || 'plein'} onChange={e => setPendingInspection(prev => ({ ...(prev || initialPendingInsp), fuel: e.target.value }))} className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-blue-200 focus:border-blue-600 outline-none font-bold">
                          <option value="plein">🟢 PLEIN (8/8)</option>
                          <option value="1/2">🟡 1/2 (4/8)</option>
                          <option value="1/4">🟠 1/4 (2/8)</option>
                          <option value="1/8">🔴 1/8 (1/8)</option>
                          <option value="vide">⚫ VIDE (0/8)</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h5 className="text-xs font-black text-blue-600 uppercase flex items-center gap-2 mb-4">
                        <span>📸</span> Photos Extérieur
                      </h5>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {exteriorPreviews.length === 0 ? <div className="col-span-3 py-8 text-center border-3 border-dashed border-blue-300 rounded-2xl text-blue-400 bg-white/50">📷 Aucune photo</div> : exteriorPreviews.map((p, i) => <img key={i} src={p} className="w-full aspect-square object-cover rounded-xl border-2 border-blue-300 shadow-md" />)}
                      </div>
                      <div className="flex gap-3">
                        <input type="file" ref={exteriorInputRef} className="hidden" multiple accept="image/*" onChange={handleExteriorUpload} />
                        <button onClick={() => exteriorInputRef.current?.click()} className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-all shadow-lg">+ 📷 Ajouter ext.</button>
                        <button onClick={() => { setExteriorPreviews([]); setPendingInspection(prev => ({ ...(prev||initialPendingInsp), exteriorPhotos: [] })); }} className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-black transition-all">🗑️ Supprimer</button>
                      </div>
                    </div>
                  </div>

                  {/* Client Section */}
                  <div className="p-8 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-[2.5rem] border-2 border-purple-300/30 shadow-lg hover:shadow-xl transition-all">
                    <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl mb-6">
                      <p className="font-black text-lg text-gray-900">{getCustomer(formData.customerId || '')?.firstName} {getCustomer(formData.customerId || '')?.lastName}</p>
                      <p className="text-sm text-purple-600 font-bold">{getCustomer(formData.customerId || '')?.phone}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-xs font-black text-purple-600 uppercase flex items-center gap-2 mb-4">
                          <span>📸</span> Photos Intérieur
                        </h5>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {interiorPreviews.length === 0 ? <div className="col-span-3 py-8 text-center border-3 border-dashed border-purple-300 rounded-2xl text-purple-400 bg-white/50">📷 Aucune photo</div> : interiorPreviews.map((p, i) => <img key={i} src={p} className="w-full aspect-square object-cover rounded-xl border-2 border-purple-300 shadow-md" />)}
                        </div>
                        <div className="flex gap-3 mb-6">
                          <input type="file" ref={interiorInputRef} className="hidden" multiple accept="image/*" onChange={handleInteriorUpload} />
                          <button onClick={() => interiorInputRef.current?.click()} className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black transition-all shadow-lg">+ 📷 Ajouter int.</button>
                          <button onClick={() => { setInteriorPreviews([]); setPendingInspection(prev => ({ ...(prev||initialPendingInsp), interiorPhotos: [] })); }} className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-black transition-all">🗑️ Supprimer</button>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-xs font-black text-purple-600 uppercase flex items-center gap-2 mb-3">
                          <span>✍️</span> Signature Client
                        </h5>
                        <div className="bg-white/70 backdrop-blur-sm p-2 rounded-2xl">
                          <SignaturePad initialValue={(pendingInspection?.signature as string) || ''} isRtl={isRtl} onSave={(s) => setPendingInspection(prev => ({ ...(prev||initialPendingInsp), signature: s }))} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[2.5rem] border-2 border-indigo-200 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">✅</span>
                    <h4 className="text-lg font-black text-indigo-600 uppercase">Contrôles d'Inspection</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Security Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border-2 border-blue-300">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">🔒</span>
                        <h5 className="text-xs font-black text-blue-600 uppercase">Sécurité</h5>
                      </div>
                      <div className="flex items-center gap-2 mb-4 w-full">
                        <input value={newSecItem} onChange={e => setNewSecItem(e.target.value)} placeholder="Ajouter un contrôle..." className="px-4 py-2 rounded-xl border-2 border-blue-300 bg-white text-sm flex-1 min-w-0 font-bold" />
                        <button onClick={() => { addCustomTemplate('security', newSecItem); setNewSecItem(''); }} className="px-3 py-2 bg-blue-600 text-white rounded-xl font-black flex-none hover:bg-blue-700 transition-all">+</button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {inspectionTemplates.filter(t => t.template_type === 'security').map(tp => (
                          <div key={tp.id} className="relative">
                            <button onClick={() => handleToggleInsp('security', tp._key)} className={`w-full text-left p-3 rounded-xl border-2 flex items-center justify-between transition-all ${pendingInspection?.security?.[tp._key] ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-gray-700 border-blue-200 hover:border-blue-400'}`}>
                              <span className="flex items-center gap-2 flex-1"><span className="text-lg">{pendingInspection?.security?.[tp._key] ? '✅' : '⭕'}</span><span className="font-black uppercase text-xs">{tp.item_name}</span></span>
                              <span onClick={(e) => { e.stopPropagation(); deleteCustomTemplate(tp.id, 'security', tp._key); }} className="text-xs text-red-600 cursor-pointer hover:text-red-700">🗑️</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Equipment Section */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border-2 border-orange-300">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">🛠️</span>
                        <h5 className="text-xs font-black text-orange-600 uppercase">Équipements</h5>
                      </div>
                      <div className="flex items-center gap-2 mb-4 w-full">
                        <input value={newEqItem} onChange={e => setNewEqItem(e.target.value)} placeholder="Ajouter équipement..." className="px-4 py-2 rounded-xl border-2 border-orange-300 bg-white text-sm flex-1 min-w-0 font-bold" />
                        <button onClick={() => { addCustomTemplate('equipment', newEqItem); setNewEqItem(''); }} className="px-3 py-2 bg-orange-600 text-white rounded-xl font-black flex-none hover:bg-orange-700 transition-all">+</button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {inspectionTemplates.filter(t => t.template_type === 'equipment').map(tp => (
                          <div key={tp.id} className="relative">
                            <button onClick={() => handleToggleInsp('equipment', tp._key)} className={`w-full text-left p-3 rounded-xl border-2 flex items-center justify-between transition-all ${pendingInspection?.equipment?.[tp._key] ? 'bg-orange-600 text-white border-orange-600 shadow-lg' : 'bg-white text-gray-700 border-orange-200 hover:border-orange-400'}`}>
                              <span className="flex items-center gap-2 flex-1"><span className="text-lg">{pendingInspection?.equipment?.[tp._key] ? '✅' : '⭕'}</span><span className="font-black uppercase text-xs">{tp.item_name}</span></span>
                              <span onClick={(e) => { e.stopPropagation(); deleteCustomTemplate(tp.id, 'equipment', tp._key); }} className="text-xs text-red-600 cursor-pointer hover:text-red-700">🗑️</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Comfort Section */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border-2 border-green-300">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">🧹</span>
                        <h5 className="text-xs font-black text-green-600 uppercase">Confort & Propreté</h5>
                      </div>
                      <div className="flex items-center gap-2 mb-4 w-full">
                        <input value={newConfItem} onChange={e => setNewConfItem(e.target.value)} placeholder="Ajouter item..." className="px-4 py-2 rounded-xl border-2 border-green-300 bg-white text-sm flex-1 min-w-0 font-bold" />
                        <button onClick={() => { addCustomTemplate('comfort', newConfItem); setNewConfItem(''); }} className="px-3 py-2 bg-green-600 text-white rounded-xl font-black flex-none hover:bg-green-700 transition-all">+</button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {inspectionTemplates.filter(t => t.template_type === 'comfort').map(tp => (
                          <div key={tp.id} className="relative">
                            <button onClick={() => handleToggleInsp('comfort', tp._key)} className={`w-full text-left p-3 rounded-xl border-2 flex items-center justify-between transition-all ${pendingInspection?.comfort?.[tp._key] ? 'bg-green-600 text-white border-green-600 shadow-lg' : 'bg-white text-gray-700 border-green-200 hover:border-green-400'}`}>
                              <span className="flex items-center gap-2 flex-1"><span className="text-lg">{pendingInspection?.comfort?.[tp._key] ? '✅' : '⭕'}</span><span className="font-black uppercase text-xs">{tp.item_name}</span></span>
                              <span onClick={(e) => { e.stopPropagation(); deleteCustomTemplate(tp.id, 'comfort', tp._key); }} className="text-xs text-red-600 cursor-pointer hover:text-red-700">🗑️</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t-2 border-indigo-200 flex justify-between items-start gap-6">
                    <div className="flex-1">
                      <label className="text-xs font-black text-indigo-600 uppercase flex items-center gap-2 mb-3">
                        <span>📝</span> Observations / Notes
                      </label>
                      <textarea value={pendingInspection?.notes || ''} onChange={e => setPendingInspection(prev => ({ ...(prev||initialPendingInsp), notes: e.target.value }))} className="w-full px-6 py-4 rounded-2xl border-2 border-indigo-200 focus:border-indigo-600 outline-none font-bold min-h-[100px]" placeholder="Ajoutez vos observations ici..." />
                    </div>
                    <div className="flex flex-col gap-3 pt-7">
                      <button onClick={() => setCreationStep(2)} className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-black transition-all shadow-lg">← Retour</button>
                      <button onClick={() => setCreationStep(4)} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black transition-all shadow-lg">Valider →</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Customer Selection */}
            {creationStep === 4 && (
              <div className="animate-fade-in space-y-10">
                {!isCreatingNewClient ? (
                  <>
                    <div className="relative group max-w-2xl mx-auto">
                      <span className="absolute inset-y-0 left-8 flex items-center text-3xl opacity-20">🔍</span>
                      <input type="text" placeholder="Rechercher client..." className="w-full pl-24 pr-8 py-7 bg-gray-50 border-4 border-transparent focus:bg-white focus:border-blue-600 rounded-[3rem] outline-none font-black text-2xl transition-all shadow-inner" onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {customers.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)).slice(0, 6).map(c => (
                        <button key={c.id} onClick={() => setFormData({...formData, customerId: c.id})} className={`flex items-center gap-7 p-8 rounded-[3.5rem] border-2 transition-all ${formData.customerId === c.id ? 'bg-blue-600 border-blue-600 text-white shadow-2xl scale-[1.02]' : 'bg-gray-50 border-transparent hover:border-blue-400'}`}>
                          <img src={c.profilePicture} onError={handleImgError} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-xl" />
                          <div className="text-left overflow-hidden flex-1">
                            <p className={`text-xl font-black truncate ${formData.customerId === c.id ? 'text-white' : 'text-gray-900'}`}>{c.firstName} {c.lastName}</p>
                            <p className={`text-xs font-bold ${formData.customerId === c.id ? 'text-blue-100' : 'text-gray-400'}`}>📞 {c.phone}</p>
                            <p className={`text-xs font-bold mt-1 ${formData.customerId === c.id ? 'text-blue-100' : 'text-gray-500'}`}>🆔 {c.idCardNumber || 'N/A'}</p>
                          </div>
                        </button>
                      ))}
                      <button onClick={() => setIsCreatingNewClient(true)} className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-[3.5rem] border-4 border-dashed border-gray-200 hover:border-blue-400 hover:bg-white transition-all group col-span-1 md:col-span-2">
                        <span className="text-5xl mb-4">👤+</span>
                        <span className="font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-600">Créer un nouveau client</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-16 rounded-[4rem] border-2 border-blue-200 shadow-2xl animate-scale-in space-y-12">
                    <div className="flex items-center gap-4 pb-8 border-b-3 border-blue-300">
                      <span className="text-5xl">👤</span>
                      <h3 className="text-3xl font-black text-blue-700 uppercase tracking-widest">Créer un nouveau client</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                      {/* LEFT: PERSONAL INFO */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-3 pb-6 border-b-2 border-blue-200">
                          <span className="text-3xl">📋</span>
                          <h4 className="text-lg font-black text-gray-800 uppercase">Infos Personnelles</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-[11px] font-black text-blue-700 uppercase px-2 flex items-center gap-2">✍️ Prénom</label>
                            <input type="text" placeholder="Prénom" value={newClientData.firstName || ''} onChange={e => setNewClientData({...newClientData, firstName: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-white shadow-md outline-none font-bold border-2 border-blue-100 focus:border-blue-500 focus:ring-2 ring-blue-200 transition-all" />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[11px] font-black text-blue-700 uppercase px-2 flex items-center gap-2">✍️ Nom</label>
                            <input type="text" placeholder="Nom" value={newClientData.lastName || ''} onChange={e => setNewClientData({...newClientData, lastName: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-white shadow-md outline-none font-bold border-2 border-blue-100 focus:border-blue-500 focus:ring-2 ring-blue-200 transition-all" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-blue-700 uppercase px-2 flex items-center gap-2">📱 Téléphone</label>
                          <input type="tel" placeholder="+213 XXX XXX XXX" value={newClientData.phone || ''} onChange={e => setNewClientData({...newClientData, phone: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-white shadow-md outline-none font-bold border-2 border-green-200 focus:border-green-500 focus:ring-2 ring-green-200 transition-all" />
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-blue-700 uppercase px-2 flex items-center gap-2">📧 Email</label>
                          <input type="email" placeholder="email@example.com" value={newClientData.email || ''} onChange={e => setNewClientData({...newClientData, email: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-white shadow-md outline-none font-bold border-2 border-blue-100 focus:border-blue-500 focus:ring-2 ring-blue-200 transition-all" />
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-blue-700 uppercase px-2 flex items-center gap-2">🎂 Date Naissance</label>
                          <input type="date" value={newClientData.birthday || ''} onChange={e => setNewClientData({...newClientData, birthday: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-white shadow-md outline-none font-bold border-2 border-blue-100 focus:border-blue-500 focus:ring-2 ring-blue-200 transition-all" />
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-blue-700 uppercase px-2 flex items-center gap-2">📍 Lieu Naissance</label>
                          <input type="text" placeholder="Ville, Pays" value={newClientData.birthPlace || ''} onChange={e => setNewClientData({...newClientData, birthPlace: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-white shadow-md outline-none font-bold border-2 border-blue-100 focus:border-blue-500 focus:ring-2 ring-blue-200 transition-all" />
                        </div>
                      </div>

                      {/* MIDDLE: LOCATION & DOCUMENTS */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-3 pb-6 border-b-2 border-purple-200">
                          <span className="text-3xl">🏠</span>
                          <h4 className="text-lg font-black text-gray-800 uppercase">Adresse & Région</h4>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-purple-700 uppercase px-2 flex items-center gap-2">🏙️ Wilaya</label>
                          <select value={newClientData.wilaya} onChange={e => setNewClientData({...newClientData, wilaya: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-white shadow-md outline-none font-bold border-2 border-purple-200 focus:border-purple-500 focus:ring-2 ring-purple-200 cursor-pointer transition-all appearance-none">
                            {ALGERIAN_WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-purple-700 uppercase px-2 flex items-center gap-2">📮 Adresse Complète</label>
                          <textarea placeholder="Rue, numéro, immeuble..." value={newClientData.address || ''} onChange={e => setNewClientData({...newClientData, address: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-white shadow-md outline-none font-bold border-2 border-purple-200 focus:border-purple-500 focus:ring-2 ring-purple-200 h-28 resize-none transition-all" />
                        </div>

                        <div className="p-6 bg-yellow-50 rounded-2xl border-2 border-yellow-200">
                          <label className="text-[11px] font-black text-yellow-700 uppercase px-2 flex items-center gap-2 mb-4">📄 Document Déposé à l'Agence</label>
                          <select value={newClientData.documentLeftAtStore || 'Aucun'} onChange={e => setNewClientData({...newClientData, documentLeftAtStore: e.target.value})} className="w-full px-6 py-4 rounded-xl bg-white shadow-md outline-none font-bold border-2 border-yellow-300 focus:border-yellow-500 cursor-pointer">
                            {['Aucun', 'Passeport', 'Carte d\'identité', 'Permis de conduire', 'Chèque de garantie', 'Autre'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* RIGHT: DOCUMENTS & MEDIA */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-3 pb-6 border-b-2 border-red-200">
                          <span className="text-3xl">🆔</span>
                          <h4 className="text-lg font-black text-gray-800 uppercase">Documents</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-[11px] font-black text-red-700 uppercase px-2 flex items-center gap-2">🎫 Type Doc</label>
                            <select value={newClientData.documentType || ''} onChange={e => setNewClientData({...newClientData, documentType: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-white shadow-md outline-none font-bold border-2 border-red-100 focus:border-red-500 focus:ring-2 ring-red-200 cursor-pointer transition-all appearance-none">
                              <option value="">Aucun</option>
                              <option value="carte_identite">Carte ID</option>
                              <option value="passeport">Passeport</option>
                              <option value="autre">Autre</option>
                            </select>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[11px] font-black text-red-700 uppercase px-2 flex items-center gap-2">🔢 N° Doc</label>
                            <input type="text" placeholder="N° Document" value={newClientData.documentNumber || newClientData.idCardNumber || ''} onChange={e => setNewClientData({...newClientData, documentNumber: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-white shadow-md outline-none font-bold border-2 border-red-100 focus:border-red-500 focus:ring-2 ring-red-200 transition-all" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-[11px] font-black text-red-700 uppercase px-2 flex items-center gap-2">📅 Délivrance</label>
                            <input type="date" value={newClientData.documentDeliveryDate || ''} onChange={e => setNewClientData({...newClientData, documentDeliveryDate: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-white shadow-md outline-none font-bold border-2 border-red-100 focus:border-red-500 focus:ring-2 ring-red-200 transition-all" />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[11px] font-black text-red-700 uppercase px-2 flex items-center gap-2">⏰ Expiration</label>
                            <input type="date" value={newClientData.documentExpiryDate || ''} onChange={e => setNewClientData({...newClientData, documentExpiryDate: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-white shadow-md outline-none font-bold border-2 border-red-100 focus:border-red-500 focus:ring-2 ring-red-200 transition-all" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-red-700 uppercase px-2 flex items-center gap-2">📍 Adresse Délivrance</label>
                          <input type="text" placeholder="Lieu de délivrance" value={newClientData.documentDeliveryAddress || ''} onChange={e => setNewClientData({...newClientData, documentDeliveryAddress: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-white shadow-md outline-none font-bold border-2 border-red-100 focus:border-red-500 focus:ring-2 ring-red-200 transition-all" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-[11px] font-black text-red-700 uppercase px-2 flex items-center gap-2">🆔 N° CNI</label>
                            <input type="text" placeholder="N° CNI" value={newClientData.idCardNumber || ''} onChange={e => setNewClientData({...newClientData, idCardNumber: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-white shadow-md outline-none font-bold border-2 border-red-100 focus:border-red-500 focus:ring-2 ring-red-200 transition-all" />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[11px] font-black text-red-700 uppercase px-2 flex items-center gap-2">🚗 Permis</label>
                            <input type="text" placeholder="N° Permis" value={newClientData.licenseNumber || ''} onChange={e => setNewClientData({...newClientData, licenseNumber: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-white shadow-md outline-none font-bold border-2 border-red-100 focus:border-red-500 focus:ring-2 ring-red-200 transition-all" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-red-700 uppercase px-2 flex items-center gap-2">⏱️ Expiration Permis</label>
                          <input type="date" value={newClientData.licenseExpiry || ''} onChange={e => setNewClientData({...newClientData, licenseExpiry: e.target.value})} className="w-full px-6 py-5 rounded-2xl bg-white shadow-md outline-none font-bold border-2 border-red-100 focus:border-red-500 focus:ring-2 ring-red-200 transition-all" />
                        </div>
                      </div>
                    </div>

                    {/* MEDIA SECTION */}
                    <div className="pt-8 border-t-3 border-gray-200">
                      <div className="flex items-center gap-3 mb-8">
                        <span className="text-3xl">📸</span>
                        <h4 className="text-lg font-black text-gray-800 uppercase">Photos & Documents</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-10 rounded-[2.5rem] text-center border-3 border-blue-300 shadow-lg">
                          <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-6 border-4 border-white shadow-2xl bg-white">
                            {profilePreviewNew ? <img src={profilePreviewNew} onError={handleImgError} className="w-full h-full object-cover" /> : <span className="text-6xl flex items-center justify-center h-full">👤</span>}
                          </div>
                          <button type="button" onClick={() => fileInputRefNew.current?.click()} className="px-6 py-3 bg-white text-blue-600 rounded-2xl font-black text-[11px] uppercase shadow-lg hover:shadow-xl hover:scale-105 transition-all border-2 border-blue-300">📷 Photo Profil</button>
                          <input type="file" ref={fileInputRefNew} className="hidden" accept="image/*" onChange={(e) => handleImageUploadNew(e, 'profile')} />
                        </div>

                        <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-10 rounded-[2.5rem] border-3 border-indigo-300 shadow-lg">
                          <div className="grid grid-cols-3 gap-3 mb-6">
                            {docPreviewsNew.map((doc, i) => (
                              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border-3 border-white group">
                                <img src={doc} onError={handleImgError} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setDocPreviewsNew(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-black text-xl">✕</button>
                              </div>
                            ))}
                          </div>
                          <button type="button" onClick={() => docInputRefNew.current?.click()} className="w-full py-4 bg-white text-indigo-600 rounded-2xl text-[11px] font-black uppercase shadow-lg hover:shadow-xl hover:scale-105 transition-all border-2 border-indigo-300">+ 📄 Ajouter Documents</button>
                          <input type="file" ref={docInputRefNew} className="hidden" multiple accept="image/*" onChange={(e) => handleImageUploadNew(e, 'docs')} />
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-6 pt-8 border-t-2 border-gray-200">
                      <button onClick={() => setIsCreatingNewClient(false)} className="flex-1 py-5 px-8 text-gray-500 font-black uppercase text-[12px] bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all">❌ Annuler</button>
                      <GradientButton onClick={async () => {
                        setLoading(true);
                        try {
                          const dbData: any = {
                            first_name: newClientData.firstName || null,
                            last_name: newClientData.lastName || null,
                            phone: newClientData.phone || null,
                            email: newClientData.email || null,
                            id_card_number: newClientData.idCardNumber || null,
                            document_type: newClientData.documentType || null,
                            document_number: newClientData.documentNumber || null,
                            document_delivery_date: newClientData.documentDeliveryDate || null,
                            document_delivery_address: newClientData.documentDeliveryAddress || null,
                            document_expiry_date: newClientData.documentExpiryDate || null,
                            wilaya: newClientData.wilaya || '16 - Alger',
                            address: newClientData.address || null,
                            license_number: newClientData.licenseNumber || null,
                            license_expiry: newClientData.licenseExpiry || null,
                            license_issue_date: newClientData.licenseIssueDate || null,
                            license_issue_place: newClientData.licenseIssuePlace || null,
                            profile_picture: profilePreviewNew || newClientData.profilePicture || null,
                            document_images: (docPreviewsNew && docPreviewsNew.length > 0) ? docPreviewsNew : null,
                            document_left_at_store: newClientData.documentLeftAtStore || 'Aucun',
                            birthday: newClientData.birthday || null,
                            birth_place: newClientData.birthPlace || null
                          };

                          const resultInsert = await supabase.from('customers').insert([dbData]);
                          const inserted = Array.isArray((resultInsert as any).data) && (resultInsert as any).data.length > 0 ? (resultInsert as any).data[0] : (resultInsert as any).data;
                          if ((resultInsert as any).error || !inserted) throw (resultInsert as any).error || new Error('Insertion failed');
                          setFormData(prev => ({...prev, customerId: inserted.id}));
                          setIsCreatingNewClient(false);
                          setNewClientData({ wilaya: '16 - Alger', documentImages: [], profilePicture: 'https://via.placeholder.com/200' });
                          setProfilePreviewNew(null);
                          setDocPreviewsNew([]);
                          // Automatically advance to step 5 (services & options)
                          setCreationStep(5);
                          onAddReservation?.();
                        } catch (err: any) {
                          console.error(err);
                          alert('❌ Erreur: ' + (err?.message || err));
                        } finally { setLoading(false); }
                      }} className="flex-[2] !py-5 rounded-2xl shadow-2xl text-lg">✅ Créer & Valider</GradientButton>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: Services & Options */}
            {creationStep === 5 && (
              <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-10">
                  <div className="p-10 bg-gray-50 rounded-[3.5rem] border border-gray-100 shadow-inner">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">🤵‍♂️ Avec Chauffeur</h3>
                      <input type="checkbox" checked={formData.isWithDriver} onChange={e => setFormData({...formData, isWithDriver: e.target.checked})} className="w-8 h-8 rounded-xl text-blue-600" />
                    </div>
                    {formData.isWithDriver && (
                      <select value={formData.driverId || ''} onChange={e => setFormData({...formData, driverId: e.target.value})} className="w-full px-6 py-4 rounded-2xl font-bold bg-white shadow-sm outline-none appearance-none cursor-pointer focus:ring-2 ring-blue-300">
                        <option value="">Choisir un chauffeur</option>
                        {workers.filter(w => w.role === 'driver').map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="p-10 bg-blue-50/50 rounded-[3.5rem] border border-blue-100 shadow-inner">
                    <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 px-4">💎 Caution (Montant)</label>
                    <input type="number" value={formData.cautionAmount || ''} onChange={e => setFormData({...formData, cautionAmount: Number(e.target.value)})} className="w-full px-8 py-6 rounded-[2rem] bg-white font-black text-4xl text-blue-600 shadow-xl text-center outline-none focus:ring-2 ring-blue-300" placeholder="0" />
                  </div>
                </div>
                <div className="p-10 bg-white border border-gray-100 rounded-[3.5rem] shadow-xl space-y-10 flex flex-col overflow-hidden">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] border-b pb-6">Services & Options Additionnels</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(['decoration', 'equipment', 'insurance', 'service'] as const).map(cat => (
                      <button key={cat} onClick={() => { setTempOptionCat(cat); setActiveModal('add-option'); }} className="px-6 py-4 bg-gray-50 rounded-2xl text-[10px] font-black uppercase text-gray-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm">+ {cat}</button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {formData.tempOptions.map((o, idx) => (
                      <div key={idx} className="flex justify-between items-center p-6 bg-gray-50 rounded-[2rem] border border-gray-100 animate-scale-in">
                        <div><p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">{o.category}</p><p className="font-black text-gray-900 text-lg leading-none">{o.name}</p></div>
                        <button onClick={() => setFormData({...formData, tempOptions: formData.tempOptions.filter((_, i) => i !== idx)})} className="text-red-600 hover:text-red-800 font-black">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Payment Summary */}
            {creationStep === 6 && (
              <div className="animate-fade-in space-y-12">
                <div className="bg-gray-900 rounded-[4.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5 text-[15rem] font-black rotate-12 leading-none">BILL</div>
                  <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
                    <div className="flex items-center gap-10">
                      <img src={getVehicle(formData.vehicleId!)?.mainImage} onError={handleImgError} className="w-32 h-32 rounded-full border-4 border-white/20 p-2 bg-white/5 shadow-2xl object-cover" />
                      <div>
                        <h4 className="text-4xl font-black uppercase leading-none mb-3">{getVehicle(formData.vehicleId!)?.brand} {getVehicle(formData.vehicleId!)?.model}</h4>
                        <p className="text-blue-400 font-black text-sm tracking-[0.3em] uppercase">{getVehicle(formData.vehicleId!)?.immatriculation}</p>
                        <div className="flex gap-4 mt-8">
                          <span className="px-6 py-2 bg-white/10 rounded-full text-xs font-black uppercase">{invoice.days} Jours</span>
                          <span className="px-6 py-2 bg-white/10 rounded-full text-xs font-black uppercase">{getVehicle(formData.vehicleId!)?.dailyRate.toLocaleString()} DZ/J</span>
                        </div>
                      </div>
                    </div>
                      <div className="w-full text-center">
                        <p className="text-[10px] font-black uppercase opacity-40 mb-4 tracking-[0.4em]">TOTAL GÉNÉRAL À PAYER</p>
                        <div className="flex items-center justify-center gap-4">
                          <input
                            type="number"
                            step="0.01"
                            value={((formData as any).totalAmount ?? invoice.finalTotal) as any}
                            onChange={e => setFormData({...formData, totalAmount: e.target.value === '' ? undefined : Number(e.target.value)})}
                            className="w-full max-w-[420px] text-center text-7xl font-black text-blue-400 leading-none tracking-tighter px-6 py-3 rounded-xl bg-white/5"
                          />
                          <span className="text-3xl font-bold uppercase">DZ</span>
                        </div>
                      </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="p-12 bg-white border border-gray-100 rounded-[4.5rem] shadow-sm space-y-10">
                    <div className="space-y-6 border-b border-gray-50 pb-8">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Décomposition du tarif</h4>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-blue-600 uppercase">💰 Appliquer TVA</label>
                          <input type="checkbox" checked={formData.withTVA} onChange={e => setFormData({...formData, withTVA: e.target.checked})} className="w-8 h-8 rounded-xl text-blue-600" />
                        </div>
                        {formData.withTVA && (
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-blue-600 uppercase block">📊 Choisir le taux TVA</label>
                            <div className="grid grid-cols-4 gap-2">
                              {[17, 19, 20, 21].map(rate => (
                                <button
                                  key={rate}
                                  onClick={() => setFormData({...formData, tvaPercentage: rate})}
                                  className={`py-3 px-2 rounded-xl font-black transition-all border-2 text-xs ${
                                    formData.tvaPercentage === rate
                                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                      : 'bg-white border-blue-200 text-blue-600 hover:border-blue-400'
                                  }`}
                                >
                                  {rate}%
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-6 font-bold text-gray-700">
                      <div className="flex justify-between items-center text-xl"><span>Base location ({invoice.days}j × {getVehicle(formData.vehicleId!)?.dailyRate.toLocaleString()} DZ)</span><span className="font-black text-gray-900">{invoice.baseTotal.toLocaleString()} DZ</span></div>
                      {formData.tempOptions.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-lg"><span>Options & Services</span><span className="font-black text-gray-900">{invoice.optionsTotal.toLocaleString()} DZ</span></div>
                          <div className="space-y-2 text-gray-600">
                            {formData.tempOptions.map((o, i) => (
                              <div key={i} className="flex justify-between items-center text-sm pl-4">
                                <span>{o.name}</span>
                                <span className="font-black">{Number(o.price || 0).toLocaleString()} DZ</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {(formData.cautionAmount || 0) > 0 && <div className="flex justify-between items-center text-lg"><span>Caution</span><span className="font-black text-gray-900">{(formData.cautionAmount || 0).toLocaleString()} DZ</span></div>}
                      <div className="flex justify-between items-center pt-8 border-t-2 border-dashed border-gray-50">
                        <span className="text-red-500 text-[10px] font-black uppercase">Remise exceptionnelle</span>
                        <input type="number" value={formData.discount || ''} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} className="w-44 px-6 py-4 bg-red-50 rounded-[1.5rem] text-right font-black text-red-600 outline-none focus:ring-2 ring-red-300" placeholder="0" />
                      </div>
                    </div>
                  </div>
                  <div className="p-12 bg-blue-50/20 border border-blue-100 rounded-[4.5rem] shadow-inner space-y-12">
                    <div className="space-y-6">
                      <label className="block text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] px-6">💰 Acompte versé aujourd'hui</label>
                      <input type="number" value={formData.paidAmount || ''} onChange={e => setFormData({...formData, paidAmount: Number(e.target.value)})} className="w-full px-10 py-10 rounded-[3rem] bg-white font-black text-7xl text-blue-600 shadow-2xl text-center outline-none focus:ring-4 ring-blue-200 transition-all" />
                    </div>
                    <div className="p-10 bg-white/80 rounded-[3.5rem] border border-blue-200 flex justify-between items-center shadow-xl">
                      <div><p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 leading-none">Reste à payer</p></div>
                      <p className={`text-6xl font-black ${invoice.rest > 0 ? 'text-red-600' : 'text-green-600'} tracking-tighter`}>{invoice.rest.toLocaleString()} <span className="text-2xl font-bold">DZ</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inspection Modal (shown after vehicle selection) */}
            {inspModalVisible && (
              <ModalBase title="Inspection - État de départ" onClose={() => setInspModalVisible(false)}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <h4 className="text-xs font-black text-gray-500 uppercase">Véhicule</h4>
                      <p className="font-black text-lg mt-2">{getVehicle(formData.vehicleId || '')?.brand} {getVehicle(formData.vehicleId || '')?.model}</p>
                      <p className="text-sm text-gray-400">{getVehicle(formData.vehicleId || '')?.immatriculation}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <h4 className="text-xs font-black text-gray-500 uppercase">Client</h4>
                      <p className="font-black text-lg mt-2">{getCustomer(formData.customerId || '')?.firstName} {getCustomer(formData.customerId || '')?.lastName}</p>
                      <p className="text-sm text-gray-400">{getCustomer(formData.customerId || '')?.phone}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Kilométrage départ</label>
                      <input type="number" value={(pendingInspection?.mileage as any) || ''} onChange={e => setPendingInspection(prev => ({ ...(prev || initialPendingInsp), mileage: Number(e.target.value) }))} className="w-full px-6 py-4 rounded-2xl bg-white outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Niveau carburant</label>
                      <select value={(pendingInspection?.fuel as any) || 'plein'} onChange={e => setPendingInspection(prev => ({ ...(prev || initialPendingInsp), fuel: e.target.value }))} className="w-full px-6 py-4 rounded-2xl bg-white outline-none">
                        <option value="plein">8/8</option>
                        <option value="1/2">1/2</option>
                        <option value="1/4">1/4</option>
                        <option value="1/8">1/8</option>
                        <option value="vide">0/0</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-blue-600 uppercase mb-4">Contrôle Sécurité</h4>
                    <div className="flex items-center gap-4 mb-4">
                      <input value={newSecItem} onChange={e => setNewSecItem(e.target.value)} placeholder="Ajouter un item sécurité..." className="px-4 py-3 rounded-xl border bg-white text-sm w-full" />
                      <button onClick={() => { addCustomTemplate('security', newSecItem); setNewSecItem(''); }} className="px-4 py-3 bg-blue-600 text-white rounded-xl font-black text-sm">+ Ajouter</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {['lights','tires','brakes','wipers','mirrors','belts','horn'].map(k => (
                        <button key={k} onClick={() => handleToggleInsp('security', k)} className={`p-4 rounded-2xl border ${pendingInspection?.security?.[k] ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>{k}</button>
                      ))}
                      {inspectionTemplates.filter(t => t.template_type === 'security').map(tp => (
                        <div key={tp.id} className="relative">
                          <button onClick={() => handleToggleInsp('security', tp._key)} className={`p-4 rounded-2xl border w-full ${pendingInspection?.security?.[tp._key] ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>{tp.item_name}</button>
                          {clickedItemKey === tp._key && <span onClick={() => deleteCustomTemplate(tp.id, 'security', tp._key)} className="absolute top-2 right-2 text-xs text-red-600 cursor-pointer">Supprimer</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-sm font-black text-orange-600 uppercase mb-4">Équipements Obligatoires</h4>
                    <div className="flex items-center gap-4 mb-4">
                      <input value={newEqItem} onChange={e => setNewEqItem(e.target.value)} placeholder="Ajouter un équipement..." className="px-4 py-3 rounded-xl border bg-white text-sm w-full" />
                      <button onClick={() => { addCustomTemplate('equipment', newEqItem); setNewEqItem(''); }} className="px-4 py-3 bg-orange-600 text-white rounded-xl font-black text-sm">+ Ajouter</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {['spareWheel','jack','triangles','firstAid','docs'].map(k => (
                        <button key={k} onClick={() => handleToggleInsp('equipment', k)} className={`p-4 rounded-2xl border ${pendingInspection?.equipment?.[k] ? 'bg-orange-600 text-white' : 'bg-white text-gray-700'}`}>{k}</button>
                      ))}
                      {inspectionTemplates.filter(t => t.template_type === 'equipment').map(tp => (
                        <div key={tp.id} className="relative">
                          <button onClick={() => handleToggleInsp('equipment', tp._key)} className={`p-4 rounded-2xl border w-full ${pendingInspection?.equipment?.[tp._key] ? 'bg-orange-600 text-white' : 'bg-white text-gray-700'}`}>{tp.item_name}</button>
                          {clickedItemKey === tp._key && <span onClick={() => deleteCustomTemplate(tp.id, 'equipment', tp._key)} className="absolute top-2 right-2 text-xs text-red-600 cursor-pointer">Supprimer</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-sm font-black text-green-600 uppercase mb-4">Confort</h4>
                    <div className="flex items-center gap-4 mb-4">
                      <input value={newConfItem} onChange={e => setNewConfItem(e.target.value)} placeholder="Ajouter un item confort..." className="px-4 py-3 rounded-xl border bg-white text-sm w-full" />
                      <button onClick={() => { addCustomTemplate('comfort', newConfItem); setNewConfItem(''); }} className="px-4 py-3 bg-green-600 text-white rounded-xl font-black text-sm">+ Ajouter</button>
                    </div>
                    <div className="space-y-3">
                      <button onClick={() => handleToggleInsp('comfort', 'ac')} className={`p-4 rounded-2xl border w-full ${pendingInspection?.comfort?.ac ? 'bg-green-600 text-white' : 'bg-white text-gray-700'}`}>Climatisation (A/C)</button>
                      {inspectionTemplates.filter(t => t.template_type === 'comfort').map(tp => (
                        <div key={tp.id} className="relative">
                          <button onClick={() => handleToggleInsp('comfort', tp._key)} className={`p-4 rounded-2xl border w-full ${pendingInspection?.comfort?.[tp._key] ? 'bg-green-600 text-white' : 'bg-white text-gray-700'}`}>{tp.item_name}</button>
                          {clickedItemKey === tp._key && <span onClick={() => deleteCustomTemplate(tp.id, 'comfort', tp._key)} className="absolute top-2 right-2 text-xs text-red-600 cursor-pointer">Supprimer</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-6 border-t">
                    <button onClick={() => { setInspModalVisible(false); setPendingInspection(null); }} className="px-6 py-3 bg-gray-100 rounded-xl">Annuler</button>
                    <button onClick={() => { setInspModalVisible(false); setCreationStep(4); }} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black">Valider et continuer</button>
                  </div>
                </div>
              </ModalBase>
            )}

            {/* Navigation Buttons */}
            <div className="mt-auto pt-16 flex justify-between items-center">
              <button disabled={creationStep === 1} onClick={() => setCreationStep(creationStep - 1)} className={`px-14 py-6 font-black uppercase text-xs tracking-[0.3em] text-gray-300 hover:text-gray-900 transition-all ${creationStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}>← RETOUR</button>
              <div className="flex gap-4">
                {creationStep < 6 ? (
                  <GradientButton onClick={handleNextStep} className="!px-24 !py-7 text-2xl rounded-[2.5rem] shadow-2xl shadow-blue-100">Suivant →</GradientButton>
                ) : (
                  <GradientButton onClick={handleSaveReservation} disabled={loading} className="!px-32 !py-9 text-4xl rounded-[3.5rem] shadow-2xl shadow-green-100">✅ {loading ? 'Enregistrement...' : 'CONFIRMER'}</GradientButton>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-12 flex flex-col lg:flex-row gap-8 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              {(['all', 'confermer', 'en cours', 'terminer'] as const).map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all border-2 ${filterStatus === s ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-600'}`}>
                  {t.status[s as keyof typeof t.status]}
                </button>
              ))}
            </div>
            
            <div className="flex gap-4 items-center flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-white rounded-[1.5rem] p-1 border-2 border-gray-100 shadow-sm">
                <button 
                  onClick={() => setViewMode('cards')}
                  className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] transition-all ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Affichage Cartes"
                >
                  ⊞ Cartes
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Affichage Lignes"
                >
                  ≡ Lignes
                </button>
              </div>
              
              <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchTerm(e.target.value)} className="w-full lg:w-[300px] px-8 py-4 bg-white border-2 border-gray-100 rounded-[1.5rem] font-bold outline-none focus:border-blue-600 transition-all" />
            </div>
          </div>

          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReservations.map(res => {
              const c = getCustomer(res.customerId);
              const v = getVehicle(res.vehicleId);
              const days = calculateDays(res.startDate, res.endDate);
              const rest = res.totalAmount - res.paidAmount;
              const statusColors = {
                'en cours': 'bg-green-600',
                'confermer': 'bg-blue-600',
                'terminer': 'bg-gray-600',
                'annuler': 'bg-red-600',
                'en attente': 'bg-yellow-600'
              };
              
              return (
                <div key={res.id} className="bg-white rounded-[2.5rem] shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 flex flex-col h-full">
                  {/* Image Header */}
                  <div className="relative w-full h-48 bg-gray-100 overflow-hidden group">
                    <img src={v?.mainImage} alt={v?.brand} onError={handleImgError} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    {/* Status Badge */}
                    <span className={`absolute top-3 right-3 px-4 py-2 rounded-[1.5rem] text-[10px] font-black uppercase text-white shadow-lg ${statusColors[res.status as keyof typeof statusColors] || 'bg-gray-600'}`}>{res.status}</span>
                    {/* Delete Button */}
                    <button onClick={() => handleDeleteRes(res.id)} title="Supprimer" className="absolute top-3 left-3 bg-white/95 text-red-600 hover:bg-red-600 hover:text-white rounded-full p-2 shadow-md transition-colors">
                      🗑️
                    </button>
                    {/* Edit Button removed from image area - moved into header below */}
                    {/* Client Avatar */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 backdrop-blur rounded-full pr-3 shadow-lg">
                      {c?.profilePicture ? (
                        <img src={c.profilePicture} alt="Client" onError={handleImgError} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-black text-sm">{(c?.firstName || 'C')[0]}</div>
                      )}
                      <span className="text-xs font-black text-gray-900 whitespace-nowrap">{c?.firstName}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    {/* Header Info */}
                    <div className="mb-4 relative">
                      <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Réservation #{res.reservationNumber}</div>
                      <div className="absolute top-0 right-0 flex gap-2 z-30">
                        <button onClick={() => { setSelectedRes(res); setSelectedDocType('engagement'); setSelectedTemplate(null); setActiveModal('personalize'); }} title="Imprimer Engagement" className="bg-white/95 text-gray-600 hover:bg-green-600 hover:text-white rounded-full p-2 shadow-md transition-colors">🖨️</button>
                        <button onClick={() => handleEditReservation(res)} title="Modifier" className="bg-white/95 text-gray-600 hover:bg-blue-600 hover:text-white rounded-full p-2 shadow-md transition-colors">✏️</button>
                      </div>
                      <h3 className="text-lg font-black text-gray-900 leading-tight">{v?.brand} {v?.model}</h3>
                      <p className="text-[11px] text-gray-500 font-bold">{v?.immatriculation}</p>
                    </div>

                    {/* Duration & Dates */}
                    <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-gray-500 uppercase">Durée</span>
                        <span className="text-2xl font-black text-blue-600">{days}j</span>
                      </div>
                      <div className="text-[10px] text-gray-600 space-y-1">
                        <div>📍 Départ: {new Date(res.startDate).toLocaleDateString('fr-FR', {day:'2-digit', month:'short'})}</div>
                        <div>📍 Retour: {new Date(res.endDate).toLocaleDateString('fr-FR', {day:'2-digit', month:'short'})}</div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 font-bold">Total:</span>
                        <span className="font-black text-blue-600">{res.totalAmount.toLocaleString()} DZ</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 font-bold">Payé:</span>
                        <span className="font-black text-green-600">{res.paidAmount.toLocaleString()} DZ</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2">
                        <span className="text-gray-600 font-bold">Reste:</span>
                        <span className={`font-black text-lg ${rest>0? 'text-red-600':'text-green-600'}`}>{rest.toLocaleString()} DZ</span>
                      </div>
                    </div>

                    {/* Action Buttons - Responsive Grid */}
                    <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
                      {/* Primary Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => { setSelectedRes(res); setActiveModal('details'); }} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all whitespace-nowrap">🔍 Détails</button>
                        <button onClick={() => { setSelectedRes(res); setPaymentAmount(0); setActiveModal('pay'); }} className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${rest>0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`} disabled={rest === 0}>💰 Payer</button>
                      </div>
                      
                      {/* Status Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        {res.status === 'confermer' && (<button onClick={() => { setSelectedRes(res); setLogData({ mileage: v?.mileage, fuel: 'plein', location: agencies[0]?.name }); setActiveModal('activate'); }} className="px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-black hover:bg-green-700 transition-all">🏁 Activer</button>)}
                        {res.status === 'en cours' && (<button onClick={() => { setSelectedRes(res); setTermData({ mileage:(v?.mileage||0)+100, fuel:'plein', date:new Date().toISOString().slice(0,16), location:agencies[0]?.name, notes:'', extraKmCost:0, extraFuelCost:0, withTva:false }); const cust = customers.find(c=>c.id===res.customerId); const docs = (cust?.documentImages||[]).map((d:any,i:number)=>({label:`Document ${i+1}`, url:d, left:true})); setTermDocsLeft(docs); setActiveModal('terminate'); }} className="px-3 py-2 bg-orange-600 text-white rounded-xl text-xs font-black hover:bg-orange-700 transition-all col-span-2">🔒 Terminer</button>)}
                        {res.status !== 'en cours' && res.status !== 'confermer' && (<div className="col-span-2"></div>)}
                      </div>

                      {/* Document Actions */}
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => { setSelectedRes(res); setSelectedDocType('devis'); const tpl = templates?.find(t=>t.category==='devis'); if(tpl){ setSelectedTemplate(tpl); setActiveModal('print-choice'); } else { setSelectedTemplate(null); setActiveModal('personalize'); } }} className="px-2 py-2 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black hover:bg-purple-600 hover:text-white transition-all">📋 Devis</button>
                        <button onClick={() => { setSelectedRes(res); setSelectedDocType('contrat'); const tpl = templates?.find(t=>t.category==='contract'||t.category==='contrat'); if(tpl){ setSelectedTemplate(tpl); setActiveModal('print-choice'); } else { setSelectedTemplate(null); setActiveModal('personalize'); } }} className="px-2 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black hover:bg-indigo-600 hover:text-white transition-all">📄 Contrat</button>
                        <button onClick={() => { setSelectedRes(res); setSelectedDocType('versement'); const tpl = templates?.find(t=>t.category==='versement'); if(tpl){ setSelectedTemplate(tpl); setActiveModal('print-choice'); } else { setSelectedTemplate(null); setActiveModal('personalize'); } }} className="px-2 py-2 bg-cyan-50 text-cyan-600 rounded-lg text-[9px] font-black hover:bg-cyan-600 hover:text-white transition-all">🧾 Versement</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-[2rem] text-white font-black uppercase text-[10px] sticky top-0 z-10 shadow-lg">
                <div className="col-span-1">🔢 #</div>
                <div className="col-span-2">🚗 Véhicule</div>
                <div className="col-span-2">👤 Client</div>
                <div className="col-span-1 text-center">📅 Départ</div>
                <div className="col-span-1 text-center">📅 Retour</div>
                <div className="col-span-1 text-center">💰 Montant</div>
                <div className="col-span-1 text-center">💳 Payé</div>
                <div className="col-span-1 text-center">🔄 Reste</div>
                <div className="col-span-1 text-center">📊 Statut</div>
                <div className="col-span-1 text-center">•</div>
              </div>

              {/* Table Rows */}
              {filteredReservations.map((res, idx) => {
                const c = getCustomer(res.customerId);
                const v = getVehicle(res.vehicleId);
                const days = calculateDays(res.startDate, res.endDate);
                const rest = res.totalAmount - res.paidAmount;
                const statusColors = {
                  'en cours': 'bg-green-100 text-green-800 border-green-300',
                  'confermer': 'bg-blue-100 text-blue-800 border-blue-300',
                  'terminer': 'bg-gray-100 text-gray-800 border-gray-300',
                  'annuler': 'bg-red-100 text-red-800 border-red-300',
                  'en attente': 'bg-yellow-100 text-yellow-800 border-yellow-300'
                };

                return (
                  <div key={res.id} className="grid grid-cols-12 gap-4 px-6 py-4 bg-white rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-lg transition-all items-center group">
                    {/* Index */}
                    <div className="col-span-1 text-[11px] font-black text-gray-400">
                      {idx + 1}
                    </div>

                    {/* Vehicle */}
                    <div className="col-span-2">
                      <p className="text-sm font-black text-gray-900 uppercase truncate">{v?.brand} {v?.model}</p>
                      <p className="text-[9px] font-bold text-gray-500">{v?.immatriculation}</p>
                    </div>

                    {/* Customer */}
                    <div className="col-span-2">
                      <p className="text-sm font-black text-gray-900 truncate">{c?.firstName} {c?.lastName}</p>
                      <p className="text-[9px] font-bold text-gray-500">{c?.phone}</p>
                    </div>

                    {/* Start Date */}
                    <div className="col-span-1 text-center">
                      <p className="text-sm font-black text-gray-900">{new Date(res.startDate).toLocaleDateString('fr-FR', { month: 'short', day: '2-digit' })}</p>
                      <p className="text-[8px] font-bold text-gray-500">{new Date(res.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    {/* End Date */}
                    <div className="col-span-1 text-center">
                      <p className="text-sm font-black text-gray-900">{new Date(res.endDate).toLocaleDateString('fr-FR', { month: 'short', day: '2-digit' })}</p>
                      <p className="text-[8px] font-bold text-gray-500">{days}j</p>
                    </div>

                    {/* Total Amount */}
                    <div className="col-span-1 text-center">
                      <p className="text-sm font-black text-blue-600">{res.totalAmount.toLocaleString()}</p>
                      <p className="text-[8px] font-bold text-gray-400">DZ</p>
                    </div>

                    {/* Paid Amount */}
                    <div className="col-span-1 text-center">
                      <p className="text-sm font-black text-green-600">{res.paidAmount.toLocaleString()}</p>
                      <p className="text-[8px] font-bold text-gray-400">DZ</p>
                    </div>

                    {/* Remaining */}
                    <div className="col-span-1 text-center">
                      <p className={`text-sm font-black ${rest > 0 ? 'text-red-600' : 'text-green-600'}`}>{rest.toLocaleString()}</p>
                      <p className="text-[8px] font-bold text-gray-400">DZ</p>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border inline-block ${statusColors[res.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                        {res.status}
                      </span>
                    </div>

                    {/* Actions column (three-dots menu) - list view only */}
                    <div className="col-span-1 text-right relative">
                      <button onClick={() => setOpenRowActions(openRowActions === res.id ? null : res.id)} className="px-3 py-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-all">⋯</button>
                      {openRowActions === res.id && (
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border p-2 z-40">
                          <div className="flex flex-col gap-2">
                            <button onClick={() => { setSelectedRes(res); setSelectedDocType('engagement'); setSelectedTemplate(null); setActiveModal('personalize'); setOpenRowActions(null); }} className="text-left px-2 py-2 rounded-md hover:bg-gray-50">🖨️ Imprimer</button>
                            <button onClick={() => { setSelectedRes(res); handleEditReservation(res); setOpenRowActions(null); }} className="text-left px-2 py-2 rounded-md hover:bg-gray-50">✏️ Modifier</button>
                            <button onClick={() => { setSelectedRes(res); setActiveModal('details'); setOpenRowActions(null); }} className="text-left px-2 py-2 rounded-md hover:bg-gray-50">🔍 Détails</button>
                            {rest > 0 && <button onClick={() => { setSelectedRes(res); setPaymentAmount(0); setActiveModal('pay'); setOpenRowActions(null); }} className="text-left px-2 py-2 rounded-md hover:bg-gray-50">💰 Payer</button>}
                            <button onClick={() => { setSelectedRes(res); setSelectedDocType('devis'); const tpl = templates?.find(t=>t.category==='devis'); if(tpl){ setSelectedTemplate(tpl); setActiveModal('print-choice'); } else { setSelectedTemplate(null); setActiveModal('personalize'); } setOpenRowActions(null); }} className="text-left px-2 py-2 rounded-md hover:bg-gray-50">📋 Devis</button>
                            <button onClick={() => { setSelectedRes(res); setSelectedDocType('contrat'); const tpl = templates?.find(t=>t.category==='contract'||t.category==='contrat'); if(tpl){ setSelectedTemplate(tpl); setActiveModal('print-choice'); } else { setSelectedTemplate(null); setActiveModal('personalize'); } setOpenRowActions(null); }} className="text-left px-2 py-2 rounded-md hover:bg-gray-50">📄 Contrat</button>
                            <button onClick={() => { setSelectedRes(res); setSelectedDocType('versement'); const tpl = templates?.find(t=>t.category==='versement'); if(tpl){ setSelectedTemplate(tpl); setActiveModal('print-choice'); } else { setSelectedTemplate(null); setActiveModal('personalize'); } setOpenRowActions(null); }} className="text-left px-2 py-2 rounded-md hover:bg-gray-50">🧾 Versement</button>
                            {res.status === 'confermer' && <button onClick={() => { setSelectedRes(res); setLogData({ mileage: v?.mileage, fuel: 'plein', location: agencies[0]?.name }); setActiveModal('activate'); setOpenRowActions(null); }} className="text-left px-2 py-2 rounded-md hover:bg-green-50">🏁 Activer</button>}
                            {res.status === 'en cours' && <button onClick={() => { setSelectedRes(res); setTermData({ mileage: (v?.mileage || 0) + 100, fuel: 'plein', date: new Date().toISOString().slice(0, 16), location: agencies[0]?.name, notes: '', extraKmCost: 0, extraFuelCost: 0, withTva: false }); setActiveModal('terminate'); setOpenRowActions(null); }} className="text-left px-2 py-2 rounded-md hover:bg-orange-50">🔒 Terminer</button>}
                            <button onClick={() => { handleDeleteRes(res.id); setOpenRowActions(null); }} className="text-left px-2 py-2 rounded-md hover:bg-red-50">🗑️ Supprimer</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {/* --- PRINT CHOICE MODAL --- */}
      {/* --- ADD / SELECT OPTION MODAL --- */}
      {activeModal === 'add-option' && (
        <div className="fixed inset-0 z-[360] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl">
            <h3 className="text-xl font-black mb-4">Options & Services</h3>
            <p className="text-sm text-gray-500 mb-4">Catégorie: {tempOptionCat}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Nom de l'option</label>
                <input value={optionName} onChange={e => setOptionName(e.target.value)} className="w-full px-4 py-3 rounded-xl border" placeholder="Ex: Siège bébé" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">Prix (DZ)</label>
                <input value={optionPrice as any} onChange={e => setOptionPrice(e.target.value === '' ? '' : Number(e.target.value))} type="number" className="w-full px-4 py-3 rounded-xl border" placeholder="0" />
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <button onClick={() => { if (tempOptionCat) { addRentalOption(tempOptionCat as any, optionName, Number(optionPrice) || 0); setOptionName(''); setOptionPrice(''); } }} className="px-4 py-3 bg-blue-600 text-white rounded-2xl font-black">+ Ajouter</button>
              <button onClick={() => setActiveModal(null)} className="px-4 py-3 bg-gray-100 rounded-2xl">Fermer</button>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto">
              {rentalOptions.filter(o => o.category === (tempOptionCat as any)).map(opt => (
                <div key={opt.id} className="flex items-center justify-between p-4 rounded-xl border bg-gray-50">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" checked={!!formData.tempOptions.find(t => t.id === opt.id || t.name === opt.name)} onChange={() => toggleOptionSelection(opt)} className="w-5 h-5" />
                    <div>
                      <div className="font-black">{opt.name}</div>
                      <div className="text-xs text-gray-400">{opt.price?.toLocaleString?.() || opt.price} DZ</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => deleteRentalOption(opt.id)} className="text-red-600">🗑️</button>
                  </div>
                </div>
              ))}
              {rentalOptions.filter(o => o.category === (tempOptionCat as any)).length === 0 && (
                <div className="text-sm text-gray-400">Aucune option enregistrée pour cette catégorie.</div>
              )}
            </div>
          </div>
        </div>
      )}
      {activeModal === 'print-choice' && selectedRes && selectedDocType && (
        <div className="fixed inset-0 z-[350] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black mb-4">Choisir une action</h3>
            <p className="text-sm text-gray-500 mb-6">Voulez-vous personnaliser le document ou imprimer directement avec le modèle enregistré ?</p>
            <div className="flex gap-3">
              <button onClick={() => { setActiveModal('personalize'); }} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-2xl font-black">Personnaliser</button>
              <button onClick={() => { setActiveModal('print-preview'); }} className="flex-1 px-4 py-3 bg-green-600 text-white rounded-2xl font-black">Imprimer avec le modèle</button>
            </div>
            <div className="mt-4">
              <button onClick={() => setActiveModal(null)} className="w-full px-4 py-2 bg-gray-100 rounded-2xl">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* --- PERSONALIZE DOCUMENT MODAL --- */}
      {activeModal === 'personalize' && selectedRes && selectedDocType && (
        <DocumentPersonalizer
          lang={lang}
          reservation={selectedRes}
          customer={customers.find(c => c.id === selectedRes.customerId)!}
          vehicle={vehicles.find(v => v.id === selectedRes.vehicleId)!}
          docType={selectedDocType}
          storeLogo={storeLogo}
          storeInfo={storeInfo}
          onSaveTemplate={(template) => {
            if (onUpdateTemplates) {
              const updatedTemplates = templates.filter(t => t.category !== template.category);
              onUpdateTemplates([...updatedTemplates, template]);
              setActiveModal(null);
            }
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* --- PRINT PREVIEW MODAL --- */}
      {activeModal === 'print-preview' && selectedRes && selectedTemplate && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8 animate-fade-in">
           <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
              <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 no-print">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl">🖨️</div>
                    <div>
                      <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Aperçu Impression</h2>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Dossier: {selectedRes.reservationNumber} • Modèle: {selectedTemplate.name}</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <GradientButton onClick={() => {
                      if (!selectedRes || !selectedTemplate) return;
                      
                      // Create hidden iframe for printing instead of new window
                      const iframe = document.createElement('iframe');
                      iframe.style.display = 'none';
                      document.body.appendChild(iframe);
                      
                      const printWindow = iframe.contentWindow;
                      if (!printWindow) return;
                      
                      const customer = customers.find(c => c.id === selectedRes.customerId);
                      const vehicle = vehicles.find(v => v.id === selectedRes.vehicleId);
                      if (!customer || !vehicle) return;

                      // Prefer `storeInfo`/`storeLogo` props; fall back to agency record from `agencies`
                      const agency = agencies.find(a => a.id === (selectedRes as any).pickupAgencyId || a.id === (selectedRes as any).pickup_agency_id) || null;
                      const logoSrc = storeLogo || (agency && (agency as any).logo_url) || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2250%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%2250%22/%3E%3C/svg%3E';
                      
                      // Helper to replace variables (UPDATED: Added client_id_card)
                      const replaceVars = (text: string): string => {
                        const days = Math.ceil((new Date(selectedRes.endDate).getTime() - new Date(selectedRes.startDate).getTime()) / (1000 * 60 * 60 * 24));
                        return text
                          .replace('{{client_name}}', `${customer.firstName} ${customer.lastName}`)
                          .replace('{{client_phone}}', customer.phone || '')
                          .replace('{{client_email}}', customer.email || '')
                          .replace('{{client_id_card}}', customer.idCardNumber || customer.documentNumber || '')
                          .replace('{{client_dob}}', customer.birthday ? new Date(customer.birthday).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR') : '')
                          .replace('{{client_pob}}', customer.birthPlace || '')
                          .replace('{{client_license}}', customer.licenseNumber || '')
                          .replace('{{license_issued}}', customer.licenseIssueDate ? new Date(customer.licenseIssueDate).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR') : '')
                          .replace('{{license_expiry}}', customer.licenseExpiry ? new Date(customer.licenseExpiry).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR') : '')
                          .replace('{{license_place}}', customer.licenseIssuePlace || '')
                          .replace('{{vehicle_brand}}', vehicle.brand)
                          .replace('{{vehicle_model}}', vehicle.model)
                          .replace('{{vehicle_color}}', vehicle.color || '')
                          .replace('{{vehicle_plate}}', vehicle.immatriculation || '')
                          .replace('{{vehicle_vin}}', vehicle.vin || '')
                          .replace('{{vehicle_fuel}}', vehicle.fuelType || '')
                          .replace('{{vehicle_mileage}}', vehicle.mileage?.toString() || '0')
                          .replace('{{res_number}}', selectedRes.reservationNumber)
                          .replace('{{res_date}}', new Date(selectedRes.startDate).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR'))
                          .replace('{{start_date}}', new Date(selectedRes.startDate).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR'))
                          .replace('{{end_date}}', new Date(selectedRes.endDate).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR'))
                          .replace('{{duration}}', days.toString().padStart(2, '0'))
                          .replace('{{total_amount}}', selectedRes.totalAmount.toLocaleString())
                          .replace('{{total_ht}}', (selectedRes.totalAmount * 0.81).toLocaleString())
                          .replace('{{unit_price}}', (selectedRes.totalAmount / days).toLocaleString())
                          .replace('{{paid_amount}}', selectedRes.paidAmount.toLocaleString())
                          .replace('{{remaining_amount}}', (selectedRes.totalAmount - selectedRes.paidAmount).toLocaleString())
                          .replace('{{store_name}}', storeInfo?.name || agency?.name || 'DriveFlow')
                          .replace('{{store_phone}}', storeInfo?.phone || agency?.phone || '')
                          .replace('{{store_email}}', storeInfo?.email || agency?.email || '')
                          .replace('{{store_address}}', storeInfo?.address || agency?.address || '');
                      };
                      
                      const paidAmount = Number(selectedRes.paidAmount || 0);
                      const totalAmount = Number((selectedRes as any).totalAmount || 0);
                      const remaining = totalAmount - paidAmount;

                      const htmlContent = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <title>Contrat de Location de Véhicule</title>
                          <style>
                            * {
                              margin: 0;
                              padding: 0;
                              box-sizing: border-box;
                            }
                            html, body {
                              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                              background: white;
                              padding: 0;
                              margin: 0;
                            }
                            .page {
                              width: 210mm;
                              height: 297mm;
                              padding: 15mm;
                              background: white;
                              position: relative;
                              page-break-after: always;
                              overflow: hidden;
                            }
                            .section-header {
                              background-color: #2563eb;
                              color: white;
                              padding: 8px 12px;
                              font-weight: 900;
                              font-size: 11px;
                              margin-top: 8px;
                              margin-bottom: 6px;
                              border-radius: 3px;
                              text-transform: uppercase;
                              letter-spacing: 0.5px;
                            }
                            .section-header.purple { background-color: #7c3aed; }
                            .section-header.green { background-color: #059669; }
                            .section-header.red { background-color: #dc2626; }
                            .section-header.orange { background-color: #ea580c; }
                            .section-header.indigo { background-color: #6366f1; }
                            
                            .content-box {
                              background-color: #f3f4f6;
                              border: 1px solid #e5e7eb;
                              padding: 8px;
                              margin-bottom: 8px;
                              border-radius: 3px;
                              font-size: 9px;
                              line-height: 1.5;
                            }
                            .two-column {
                              display: grid;
                              grid-template-columns: 1fr 1fr;
                              gap: 10px;
                            }
                            .signature-box {
                              border: 2px solid #d1d5db;
                              padding: 10px;
                              height: 60px;
                              text-align: center;
                              font-size: 8px;
                              font-weight: 600;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                            }
                            .logo {
                              max-width: 80px;
                              max-height: 40px;
                              margin-bottom: 10px;
                            }
                            .title {
                              font-size: 18px;
                              font-weight: 900;
                              text-align: center;
                              margin-bottom: 10px;
                              color: #1f2937;
                              letter-spacing: 0.5px;
                            }
                            .checklist {
                              display: grid;
                              grid-template-columns: repeat(4, 1fr);
                              gap: 6px;
                              font-size: 8px;
                            }
                            .checklist-item {
                              display: flex;
                              align-items: center;
                              gap: 3px;
                            }
                            .arabic-text {
                              text-align: right;
                              direction: rtl;
                              font-size: 8px;
                              line-height: 1.6;
                            }
                            @page {
                              size: A4;
                              margin: 0;
                            }
                            @media print {
                              body { margin: 0; padding: 0; }
                              .page { page-break-after: always; margin: 0; padding: 15mm; width: 100%; height: auto; }
                              .page:last-child { page-break-after: avoid; }
                            }
                          </style>
                        </head>
                        <body>
                          <div class="page">
                            <div style="display:flex; justify-content:flex-end; margin-bottom:8px; gap:16px;">
                              <div style="flex:0 0 160px; text-align:right; font-size:12px;">
                                <div style="font-weight:700;">Payé: ${paidAmount.toLocaleString()} DZ</div>
                                <div style="color:#dc2626; font-weight:800; margin-top:6px;">Reste: ${remaining.toLocaleString()} DZ</div>
                              </div>
                            </div>
                            <div class="title">ENGAGEMENT</div>
                            <div class="two-column">
                              <div>
                                <div class="section-header">DÉTAILS DU CONTRAT</div>
                                <div class="content-box">
                                  <strong>Date du contrat:</strong> ${replaceVars('{{res_date}}')}<br>
                                  <strong>Numéro du contrat:</strong> ${replaceVars('{{res_number}}')}<br>
                                </div>
                              </div>
                              <div>
                                <div class="section-header">PÉRIODE DE LOCATION</div>
                                <div class="content-box">
                                  <strong>Date de départ:</strong> ${replaceVars('{{start_date}}')}<br>
                                  <strong>Date de retour:</strong> ${replaceVars('{{end_date}}')}<br>
                                  <strong>Durée:</strong> ${replaceVars('{{duration}}')} jours<br>
                                </div>
                              </div>
                            </div>
                            <div class="section-header purple">INFORMATIONS DU CONDUCTEUR (Conducteur 01)</div>
                            <div class="content-box">
                              <strong>Nom:</strong> ${replaceVars('{{client_name}}')}<br>
                              <strong>N° Passeport / CIN:</strong> ${replaceVars('{{client_id_card}}')}<br>
                              <strong>Date de naissance:</strong> ${replaceVars('{{client_dob}}')}<br>
                              <strong>Lieu de naissance:</strong> ${replaceVars('{{client_pob}}')}<br>
                              <strong>Type de document:</strong> Permis de conduire biométrique<br>
                              <strong>Numéro du document:</strong> ${replaceVars('{{client_license}}')}<br>
                              <strong>Date d'émission:</strong> ${replaceVars('{{license_issued}}')}<br>
                              <strong>Date d'expiration:</strong> ${replaceVars('{{license_expiry}}')}<br>
                              <strong>Lieu d'émission:</strong> ${replaceVars('{{license_place}}')}<br>
                            </div>
                            <div class="section-header green">INFORMATIONS DU VÉHICULE</div>
                            <div class="content-box">
                              <strong>Modèle:</strong> ${replaceVars('{{vehicle_model}}')}<br>
                              <strong>Couleur:</strong> ${replaceVars('{{vehicle_color}}')}<br>
                              <strong>Immatriculation:</strong> ${replaceVars('{{vehicle_plate}}')}<br>
                              <strong>Numéro de série:</strong> ${replaceVars('{{vehicle_vin}}')}<br>
                              <strong>Type de carburant:</strong> ${replaceVars('{{vehicle_fuel}}')}<br>
                              <strong>Kilométrage au départ:</strong> ${replaceVars('{{vehicle_mileage}}')} km<br>
                            </div>
                            <div class="section-header red">INFORMATIONS FINANCIÈRES</div>
                            <div class="content-box" style="background-color: #fee2e2; border-color: #fca5a5;">
                              <strong>Prix unitaire:</strong> ${replaceVars('{{unit_price}}')} DZ<br>
                              <strong>Prix total (HT):</strong> ${replaceVars('{{total_ht}}')} DZ<br>
                              <strong>Montant total du contrat:</strong> ${replaceVars('{{total_amount}}')} DZ<br>
                            </div>
                            <div class="section-header orange">LISTE DE VÉRIFICATION DE L'ÉQUIPEMENT ET DE L'INSPECTION</div>
                            <div class="content-box">
                              <div class="checklist">
                                <div class="checklist-item">☐ Pneus</div>
                                <div class="checklist-item">☐ Batterie</div>
                                <div class="checklist-item">☐ Freins</div>
                                <div class="checklist-item">☐ Phares</div>
                                <div class="checklist-item">☐ Essuie-glaces</div>
                                <div class="checklist-item">☐ Moteur</div>
                                <div class="checklist-item">☐ Ceintures</div>
                                <div class="checklist-item">☐ Intérieur propre</div>
                                <div class="checklist-item">☐ Réservoir plein</div>
                                <div class="checklist-item">☐ Fenêtres</div>
                                <div class="checklist-item">☐ Miroirs</div>
                                <div class="checklist-item">☐ Autres</div>
                              </div>
                            </div>
                            <div class="section-header indigo">SIGNATURES</div>
                            <div class="two-column">
                              <div class="signature-box">
                                <strong>Signature du locataire<br>et empreinte</strong><br><br>
                              </div>
                              <div class="signature-box">
                                <strong>Signature de l'agent<br>et cachet</strong><br><br>
                              </div>
                            </div>
                          </div>
                          <div class="page">
                            <div class="title">CONDITIONS ET TERMES DU CONTRAT</div>
                            <div style="background-color: #dbeafe; border: 2px solid #0ea5e9; padding: 15px; margin-bottom: 15px; border-radius: 4px;">
                              <strong style="font-size: 11px;">يمكنك قراءة شروط العقد في الأسفل ومصادقة عليها</strong>
                            </div>
                            <div class="arabic-text">
                              <strong>1- السن:</strong> يجب أن يكون السائق يبلغ من العمر 20 عاماً على الأقل، وأن يكون حاصلاً على رخصة قيادة منذ سنتين على الأقل.<br><br>
                              <strong>2- جواز السفر:</strong> إيداع جواز السفر البيومتري الإلزامي، بالإضافة إلى دفع تأمين ابتدائي يبدأ من 30,000.00 دج حسب فئة المركبة، ويعد هذا بمثابة ضمان لطلبه.<br><br>
                              <strong>3- الوقود:</strong> الوقود يكون على نفقة الزبون.<br><br>
                              <strong>4- قانون ونظام:</strong> يتم الدفع نقداً عند تسليم السيارة.<br><br>
                              <strong>5- النظافة:</strong> تسلم السيارة نظيفة ويجب إرجاعها في نفس الحالة، وفي حال عدم ذلك، سيتم احتساب تكلفة الغسيل بمبلغ 1000 دج.<br><br>
                              <strong>6- مكان التسليم:</strong> يتم تسليم السيارات في موقف السيارات التابع لوكالاتنا.<br><br>
                              <strong>7- جدول المواعيد:</strong> يجب على الزبون احترام المواعيد المحددة عند الحجز، يجب الإبلاغ مسبقاً عن أي تغيير. لا يمكن للزبون تمديد مدة الإيجار إلا بعد الحصول على إذن من وكالتنا للإيجار، وذلك بإشعار مسبق لا يقل عن 48 ساعة.<br><br>
                              <strong>8- الأضرار والخسائر:</strong> التأمين الأساسي: يلتزم الزبون بدفع جميع الأضرار التي تلحق بالمركبة سواء كان مخطئاً أو غير مخطئ. أي ضرر يلحق بالمركبة سيؤدي إلى خصم من مبلغ الضمان.<br><br>
                              <strong>9- عند السرقة:</strong> في حالة السرقة أو تضرر المركبة، يجب تقديم تصريح لدى مصالح الشرطة أو الدرك الوطني قبل أي تصريح، يجب على الزبون إبلاغ وكالة الكراء بشكل إلزامي.<br><br>
                              <strong>10- تأمين:</strong> يستفيد من التأمين فقط السائقون المذكورون في عقد الكراء، يُمنع منعاً باتاً إعارة أو تأجير المركبة من الباطن، وتكون جميع الأضرار الناتجة عن مثل هذه الحالات على عاتق الزبون بالكامل.<br><br>
                              <strong>11- عطل ميكانيكي:</strong> خلال فترة الإيجار، وبناءً على عدد الكيلومترات المقطوعة، يجب على الزبون إجراء الفحوصات اللازمة مثل مستوى الزيت، حالة المحرك، ضغط الإطارات. في حال حدوث عطل ميكانيكي بسبب إهمال الزبون، فإن تكاليف الإصلاح والصيانة تكون على عاتق الزبون بالكامل.<br><br>
                              <strong>12- خسائر إضافية:</strong> الأضرار التي تلحق بالعجلات والإطارات، القيادة بالإطارات المفرغة من الهواء، التدهور، السرقة، نهب الملحقات، أعمال التخريب، كلها سيتم تحميل تكلفتها على الزبون.<br><br>
                              <strong>13- ضريبة التأخير:</strong> مدة الإيجار تُحتسب على فترات كاملة مدتها 24 ساعة غير قابلة للتقسيم. يجب على الزبون إعادة المركبة في نفس الوقت، وإلا سيتم احتساب تكلفة تأخير مقدارها 800 دينار لكل ساعة تأخير.<br><br>
                              <strong>14- عدد الأميال:</strong> عدد الكيلومترات محدود بـ 300 كم يومياً، ويفرض غرامة قدرها 30 دج عن كل كيلومتر زائد.<br><br>
                              <strong>15- شروط:</strong> يقر الزبون بأنه اطلع على شروط الإيجار هذه وقبلها دون أي تحفظ، ويتعهد بتوقيع هذا العقد.<br>
                            </div>
                            <div class="section-header indigo">الموافقة والتوقيع</div>
                            <div class="signature-box" style="text-align: center;">
                              <strong>امضاء وبصمة الزبون<br>Signature et Empreinte du Client</strong><br><br>
                            </div>
                          </div>
                        </body>
                        </html>
                      `;
                      
                      printWindow.document.write(htmlContent);
                      printWindow.document.close();
                      
                      setTimeout(() => {
                        printWindow.print();
                        setTimeout(() => document.body.removeChild(iframe), 100);
                      }, 500);
                    }} className="!px-10 !py-4 shadow-xl">Imprimer Document</GradientButton>
                    <button onClick={() => setActiveModal(null)} className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm hover:text-red-500 transition-all">✕</button>
                 </div>
              </div>
              
              <div className="flex-1 bg-gray-100 p-16 overflow-y-auto custom-scrollbar flex justify-center print-only">
                 <div className="bg-white shadow-2xl relative" style={{ width: `${selectedTemplate.canvasWidth}px`, height: `${selectedTemplate.canvasHeight}px` }}>
                    {selectedTemplate.elements.map((el: any, idx: number) => {
                      // Filter out duplicate logo elements - only show the first one
                      const prevLogoIdx = selectedTemplate.elements.findIndex((e: any) => e.type === 'logo');
                      if (el.type === 'logo' && idx !== prevLogoIdx) return null;
                      
                      return (
                      <div key={el.id} className="absolute" style={{
                         left: `${el.x}px`, top: `${el.y}px`, width: `${el.width}px`, height: el.type === 'divider' ? `${el.height}px` : 'auto',
                         minHeight: `${el.height}px`, fontSize: `${el.fontSize}px`, color: el.color, backgroundColor: el.backgroundColor,
                         fontFamily: el.fontFamily, fontWeight: el.fontWeight as any, textAlign: el.textAlign, borderRadius: `${el.borderRadius}px`,
                         padding: `${el.padding}px`, borderWidth: `${el.borderWidth}px`, borderColor: el.borderColor, opacity: el.opacity,
                         zIndex: el.zIndex, whiteSpace: 'pre-wrap', lineHeight: el.lineHeight
                      }}>
                         {/* Variable Replacement Logic */}
                         {el.type === 'logo' && <div className="w-full h-full flex items-center justify-center font-black opacity-30 uppercase tracking-tighter">{el.content}</div>}
                         {el.type === 'table' && (
                           <div className="w-full border-t-2 border-gray-900 mt-4 overflow-hidden">
                              <table className="w-full text-[9px] font-black uppercase">
                                 <thead className="bg-gray-50/50"><tr className="border-b"><th className="p-2 text-left">Désignation</th><th className="p-2 text-center">Qté</th><th className="p-2 text-right">Total HT</th></tr></thead>
                                 <tbody className="opacity-40">
                                   <tr><td className="p-2 border-b">{replaceVariables("LOCATION VÉHICULE {{vehicle_brand}} {{vehicle_model}}", selectedRes)}</td><td className="p-2 border-b text-center">--</td><td className="p-2 border-b text-right">{replaceVariables("{{total_amount}}", selectedRes)} DZ</td></tr>
                                 </tbody>
                              </table>
                           </div>
                         )}
                         {el.type === 'signature' && <div className="w-full h-full flex flex-col justify-between"><span className="text-[8px] font-black uppercase text-gray-300 border-b border-gray-100 pb-1">{el.content}</span><div className="flex-1 py-8 flex items-center justify-center opacity-10"><span className="text-4xl italic">Signature</span></div></div>}
                         {el.type === 'checklist' && (() => {
                           let items: { label: string; checked: boolean }[] = [];
                           try { items = JSON.parse(el.content || '[]'); } catch (e) { items = []; }
                           return (
                             <div className="p-4 text-[10px]">
                               {items.map((it:any, idx:number) => (
                                 <div key={idx} className="flex items-center gap-3 py-1"><div className={`w-4 h-4 rounded-sm border ${it.checked ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'}`} /> <div className={`${it.checked ? 'line-through text-gray-400' : ''}`}>{it.label}</div></div>
                               ))}
                             </div>
                           );
                         })()}
                         {el.type !== 'logo' && el.type !== 'table' && el.type !== 'signature' && el.type !== 'checklist' && replaceVariables(el.content, selectedRes)}
                      </div>
                    );
                    })}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- DETAILS MODAL (Détails de Réservation) --- */}
      {activeModal === 'details' && selectedRes && (
        <ModalBase title="📋 Détails Complets de la Réservation" onClose={() => setActiveModal(null)} maxWidth="max-w-6xl">
          <div className="space-y-8 bg-gradient-to-b from-blue-50 via-white to-purple-50 p-8 rounded-[3rem]">
            {/* Header Section - Reservation & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-8 border-b-4 border-gradient-to-r from-blue-300 to-purple-300">
              <div className="lg:col-span-1 bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 rounded-[2rem] shadow-2xl text-center">
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-blue-100">🗂️ Dossier</p>
                <p className="text-4xl font-black mb-2">#{selectedRes.reservationNumber}</p>
                <p className="text-[9px] font-bold text-blue-200">{new Date(selectedRes.startDate).toLocaleDateString('fr-FR')}</p>
              </div>
              
              <div className="lg:col-span-1 bg-gradient-to-br from-green-500 to-green-700 text-white p-8 rounded-[2rem] shadow-2xl text-center">
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-green-100">📊 Statut</p>
                <p className="text-2xl font-black mb-2 capitalize">{selectedRes.status}</p>
                <p className={`text-[9px] font-bold px-3 py-1 rounded-xl inline-block ${
                  selectedRes.status === 'en cours' ? 'bg-green-300 text-green-900' :
                  selectedRes.status === 'confermer' ? 'bg-blue-300 text-blue-900' :
                  selectedRes.status === 'terminer' ? 'bg-gray-300 text-gray-900' :
                  selectedRes.status === 'annuler' ? 'bg-red-300 text-red-900' :
                  'bg-yellow-300 text-yellow-900'
                }`}>Actif</p>
              </div>

              <div className="lg:col-span-1 bg-gradient-to-br from-purple-500 to-purple-700 text-white p-8 rounded-[2rem] shadow-2xl text-center">
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-purple-100">⏱️ Durée</p>
                <p className="text-4xl font-black mb-1">{calculateDays(selectedRes.startDate, selectedRes.endDate)}</p>
                <p className="text-[10px] font-bold text-purple-200">jours</p>
              </div>

              <div className="lg:col-span-1 bg-gradient-to-br from-orange-500 to-red-600 text-white p-8 rounded-[2rem] shadow-2xl text-center">
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-orange-100">💰 Total</p>
                <p className="text-3xl font-black mb-1">{selectedRes.totalAmount.toLocaleString()}</p>
                <p className="text-[9px] font-bold text-orange-200">DZ</p>
              </div>
            </div>

            {/* Vehicle & Customer Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Vehicle Image */}
              <div className="lg:col-span-1">
                <img src={getVehicle(selectedRes.vehicleId)?.mainImage} alt="vehicle" onError={handleImgError} className="w-full h-72 object-cover rounded-[2.5rem] shadow-2xl border-4 border-gradient-to-br from-blue-300 to-purple-300" />
              </div>

              {/* Vehicle Details */}
              <div className="lg:col-span-1 space-y-4">
                <div className="p-6 bg-gradient-to-br from-blue-100 to-blue-50 rounded-[2.5rem] border-3 border-blue-300 shadow-lg">
                  <p className="text-[11px] font-black text-blue-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="text-2xl">🚗</span> Véhicule
                  </p>
                  <p className="text-2xl font-black text-gray-900 mb-1">{getVehicle(selectedRes.vehicleId)?.brand}</p>
                  <p className="text-xl font-black text-blue-800 mb-4">{getVehicle(selectedRes.vehicleId)?.model}</p>
                  <div className="space-y-2 border-t-2 border-blue-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-gray-600 flex items-center gap-1">🏷️ Immat:</span>
                      <span className="font-black text-blue-900">{getVehicle(selectedRes.vehicleId)?.immatriculation}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-gray-600 flex items-center gap-1">📅 Année:</span>
                      <span className="font-black text-blue-900">{getVehicle(selectedRes.vehicleId)?.year}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-gray-600 flex items-center gap-1">🎨 Couleur:</span>
                      <span className="font-black text-blue-900">{getVehicle(selectedRes.vehicleId)?.color}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-gray-600 flex items-center gap-1">⛽ Carburant:</span>
                      <span className="font-black text-blue-900">{getVehicle(selectedRes.vehicleId)?.fuelType}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="lg:col-span-1 space-y-4">
                <div className="p-6 bg-gradient-to-br from-green-100 to-green-50 rounded-[2.5rem] border-3 border-green-300 shadow-lg">
                  <p className="text-[11px] font-black text-green-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="text-2xl">👤</span> Locataire
                  </p>
                  <p className="text-2xl font-black text-gray-900 mb-4">{getCustomer(selectedRes.customerId)?.firstName} {getCustomer(selectedRes.customerId)?.lastName}</p>
                  <div className="space-y-2 border-t-2 border-green-200 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📱</span>
                      <span className="text-[9px] font-bold text-green-900">{getCustomer(selectedRes.customerId)?.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📧</span>
                      <span className="text-[9px] font-bold text-green-900">{getCustomer(selectedRes.customerId)?.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🪪</span>
                      <span className="text-[9px] font-bold text-green-900">{getCustomer(selectedRes.customerId)?.licenseNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⏳</span>
                      <span className="text-[9px] font-bold text-green-900">{new Date(getCustomer(selectedRes.customerId)?.licenseExpiry || '').toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline - Dates & Duration */}
            <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 p-8 rounded-[3rem] border-3 border-purple-300 shadow-xl">
              <p className="text-[11px] font-black text-purple-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="text-2xl">📅</span> Chronologie de la Location
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
                {/* Start Date */}
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-6 rounded-[2rem] text-center shadow-lg">
                  <p className="text-[9px] font-black uppercase mb-2 text-purple-100">📍 Départ</p>
                  <p className="text-[10px] font-bold mb-1">{new Date(selectedRes.startDate).toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  <p className="text-lg font-black">{new Date(selectedRes.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                {/* Arrow */}
                <div className="flex justify-center text-4xl font-black text-purple-600 hidden lg:block">→</div>

                {/* Duration */}
                <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-[2rem] text-center shadow-lg lg:col-span-1">
                  <p className="text-[9px] font-black uppercase mb-2 text-orange-100">⏱️ Durée</p>
                  <p className="text-4xl font-black">{calculateDays(selectedRes.startDate, selectedRes.endDate)}</p>
                  <p className="text-[10px] font-bold text-orange-100">jours</p>
                </div>

                {/* Arrow */}
                <div className="flex justify-center text-4xl font-black text-orange-500 hidden lg:block">→</div>

                {/* End Date */}
                <div className="bg-gradient-to-br from-pink-600 to-rose-800 text-white p-6 rounded-[2rem] text-center shadow-lg">
                  <p className="text-[9px] font-black uppercase mb-2 text-pink-100">🎯 Retour</p>
                  <p className="text-[10px] font-bold mb-1">{new Date(selectedRes.endDate).toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  <p className="text-lg font-black">{new Date(selectedRes.endDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>

            {/* Pickup & Return Locations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-gradient-to-br from-blue-100 to-blue-50 rounded-[2.5rem] border-3 border-blue-400 shadow-lg">
                <p className="text-[11px] font-black text-blue-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="text-2xl">🏠</span> Lieu de Prise en Charge
                </p>
                <p className="text-xl font-black text-blue-900 mb-2">{agencies.find(a => a.id === selectedRes.pickupAgencyId)?.name || '❓ Non défini'}</p>
                <p className="text-[10px] font-bold text-blue-800 border-t border-blue-300 pt-3">📍 {agencies.find(a => a.id === selectedRes.pickupAgencyId)?.address || 'Adresse non disponible'}</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-teal-100 to-teal-50 rounded-[2.5rem] border-3 border-teal-400 shadow-lg">
                <p className="text-[11px] font-black text-teal-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="text-2xl">🏁</span> Lieu de Retour
                </p>
                <p className="text-xl font-black text-teal-900 mb-2">{agencies.find(a => a.id === selectedRes.returnAgencyId)?.name || '❓ Non défini'}</p>
                <p className="text-[10px] font-bold text-teal-800 border-t border-teal-300 pt-3">📍 {agencies.find(a => a.id === selectedRes.returnAgencyId)?.address || 'Adresse non disponible'}</p>
              </div>
            </div>

            {/* Check-in & Check-out Logs */}
            {(selectedRes.activationLog || selectedRes.terminationLog) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedRes.activationLog && (
                  <div className="p-6 bg-yellow-50 rounded-[2rem] border-2 border-yellow-200">
                    <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-4">✅ Check-in (Mise en Circulation)</p>
                    <div className="space-y-3 text-[10px]">
                      <div className="flex justify-between"><span className="font-black text-gray-600">Kilométrage:</span> <span className="font-black text-yellow-900">{selectedRes.activationLog.mileage} KM</span></div>
                      <div className="flex justify-between"><span className="font-black text-gray-600">Carburant:</span> <span className="font-black text-yellow-900">⛽ {selectedRes.activationLog.fuel?.toUpperCase()}</span></div>
                      <div className="flex justify-between"><span className="font-black text-gray-600">Localisation:</span> <span className="font-black text-yellow-900">{selectedRes.activationLog.location}</span></div>
                      <div className="flex justify-between"><span className="font-black text-gray-600">Date:</span> <span className="font-black text-yellow-900">{new Date(selectedRes.activationLog.date).toLocaleString()}</span></div>
                      {selectedRes.activationLog.notes && <div className="pt-2 border-t border-yellow-200"><span className="font-black text-gray-600">Notes:</span> <p className="text-yellow-900 mt-1">{selectedRes.activationLog.notes}</p></div>}
                    </div>
                  </div>
                )}
                {/* État de Départ - show exact items from depart inspection */}
                {inspectionData.depart && (
                  <div className="p-6 bg-white rounded-2xl border border-gray-100 mt-4">
                    <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-4">🔎 État de Départ (détails de l'inspection)</p>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      {[
                        { key: 'security', title: 'Sécurité', icon: '🔒' },
                        { key: 'equipment', title: 'Équipements', icon: '🔧' },
                        { key: 'comfort', title: 'Confort', icon: '🛋️' },
                        { key: 'cleanliness', title: 'Propreté', icon: '🧽' }
                      ].map(cat => {
                        const items = Object.entries((inspectionData.depart as any)[cat.key] || {});
                        return (
                          <div key={cat.key} className="p-5 bg-white rounded-2xl border shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-9 h-9 rounded-md bg-gray-50 flex items-center justify-center text-lg">{cat.icon}</div>
                              <div>
                                <div className="text-xs uppercase text-violet-700 font-black">État de Départ</div>
                                <div className="font-bold text-sm">{cat.title}:</div>
                              </div>
                            </div>
                            <div className="p-4 bg-violet-50 rounded-lg">
                              {items.length === 0 ? (
                                <div className="text-[13px] text-gray-400">Aucun élément enregistré</div>
                              ) : (
                                <ul className="space-y-3">
                                  {items.map(([k, v]) => {
                                    const tpl = inspectionTemplates.find((t: any) => t._key === k) as any;
                                    const label = tpl ? tpl.item_name : k.replace(/_/g, ' ');
                                    const ok = !!v && !(typeof v === 'number' && v === 0);
                                    return (
                                      <li key={k} className="flex items-start gap-3">
                                        <div className="mt-1">
                                          {ok ? (
                                            <span className="inline-flex items-center gap-2 text-green-600">
                                              <span className="w-4 h-4 inline-flex items-center justify-center rounded-sm bg-green-50 text-green-600">✅</span>
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-2 text-red-500">
                                              <span className="w-4 h-4 inline-flex items-center justify-center rounded-sm bg-red-50 text-red-500">❌</span>
                                            </span>
                                          )}
                                        </div>
                                        <div>
                                          <div className="text-sm font-semibold">{label}</div>
                                          <div className={`text-[13px] mt-0.5 ${ok ? 'text-green-600' : 'text-red-500'}`}>{ok ? 'Vérifiée' : 'Non vérifiée'}</div>
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {selectedRes.terminationLog && (
                  <div className="p-6 bg-red-50 rounded-[2rem] border-2 border-red-200">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-4">🔒 Check-out (Clôture)</p>
                    <div className="space-y-3 text-[10px]">
                      <div className="flex justify-between"><span className="font-black text-gray-600">Kilométrage:</span> <span className="font-black text-red-900">{(selectedRes.terminationLog as any)?.mileage} KM</span></div>
                      <div className="flex justify-between"><span className="font-black text-gray-600">Distance:</span> <span className="font-black text-red-900">{((selectedRes.terminationLog as any)?.mileage || 0) - (selectedRes.activationLog?.mileage || 0)} KM</span></div>
                      <div className="flex justify-between"><span className="font-black text-gray-600">Carburant:</span> <span className="font-black text-red-900">⛽ {(selectedRes.terminationLog as any)?.fuel?.toUpperCase()}</span></div>
                      <div className="flex justify-between"><span className="font-black text-gray-600">Localisation:</span> <span className="font-black text-red-900">{(selectedRes.terminationLog as any)?.location}</span></div>
                      {(selectedRes.terminationLog as any)?.notes && <div className="pt-2 border-t border-red-200"><span className="font-black text-gray-600">Notes:</span> <p className="text-red-900 mt-1">{(selectedRes.terminationLog as any)?.notes}</p></div>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pricing & Payment Section */}
            <div className="bg-gradient-to-r from-green-100 via-blue-100 to-purple-100 p-8 rounded-[3rem] border-3 border-green-400 shadow-xl">
              <p className="text-[11px] font-black text-green-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="text-2xl">💳</span> Détails Financiers
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-[1.5rem] border-2 border-blue-300 shadow-md text-center">
                  <p className="text-[8px] font-black text-blue-600 uppercase mb-2 flex items-center justify-center gap-1">
                    <span>💰</span> Montant Total
                  </p>
                  <p className="text-2xl font-black text-blue-900">{selectedRes.totalAmount.toLocaleString()}</p>
                  <p className="text-[8px] font-bold text-blue-700 mt-1">DZ</p>
                </div>
                <div className="p-5 bg-white rounded-[1.5rem] border-2 border-green-300 shadow-md text-center">
                  <p className="text-[8px] font-black text-green-600 uppercase mb-2 flex items-center justify-center gap-1">
                    <span>✅</span> Montant Payé
                  </p>
                  <p className="text-2xl font-black text-green-900">{selectedRes.paidAmount.toLocaleString()}</p>
                  <p className="text-[8px] font-bold text-green-700 mt-1">DZ</p>
                </div>
                <div className={`p-5 bg-white rounded-[1.5rem] border-2 shadow-md text-center ${
                  selectedRes.totalAmount - selectedRes.paidAmount > 0 ? 'border-red-300' : 'border-green-300'
                }`}>
                  <p className={`text-[8px] font-black uppercase mb-2 flex items-center justify-center gap-1 ${
                    selectedRes.totalAmount - selectedRes.paidAmount > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    <span>{selectedRes.totalAmount - selectedRes.paidAmount > 0 ? '⚠️' : '🎉'}</span> Reste à Payer
                  </p>
                  <p className={`text-2xl font-black ${
                    selectedRes.totalAmount - selectedRes.paidAmount > 0 ? 'text-red-900' : 'text-green-900'
                  }`}>{(selectedRes.totalAmount - selectedRes.paidAmount).toLocaleString()}</p>
                  <p className={`text-[8px] font-bold mt-1 ${
                    selectedRes.totalAmount - selectedRes.paidAmount > 0 ? 'text-red-700' : 'text-green-700'
                  }`}>DZ</p>
                </div>
                <div className="p-5 bg-white rounded-[1.5rem] border-2 border-purple-300 shadow-md text-center">
                  <p className="text-[8px] font-black text-purple-600 uppercase mb-2 flex items-center justify-center gap-1">
                    <span>🔐</span> Caution
                  </p>
                  <p className="text-2xl font-black text-purple-900">{selectedRes.cautionAmount.toLocaleString()}</p>
                  <p className="text-[8px] font-bold text-purple-700 mt-1">DZ</p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-gradient-to-br from-amber-100 to-amber-50 rounded-[1.5rem] border-2 border-amber-300 shadow-md text-center">
                <p className="text-[9px] font-black text-amber-700 uppercase mb-1 flex items-center justify-center gap-1">📍 Remise</p>
                <p className="text-xl font-black text-amber-900">{selectedRes.discount} DZ</p>
              </div>
              <div className="p-5 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-[1.5rem] border-2 border-indigo-300 shadow-md text-center">
                <p className="text-[9px] font-black text-indigo-700 uppercase mb-1 flex items-center justify-center gap-1">🧾 TVA</p>
                <p className="text-xl font-black text-indigo-900">{selectedRes.withTVA ? `${(selectedRes as any).tvaPercentage || 19}%` : 'Non'}</p>
              </div>
              {selectedRes.driverId && (
                <div className="p-5 bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-[1.5rem] border-2 border-cyan-300 shadow-md text-center">
                  <p className="text-[9px] font-black text-cyan-700 uppercase mb-1 flex items-center justify-center gap-1">🚙 Chauffeur</p>
                  <p className="text-sm font-black text-cyan-900">{workers.find(w => w.id === selectedRes.driverId)?.fullName || 'N/A'}</p>
                </div>
              )}
              <div className="p-5 bg-gradient-to-br from-rose-100 to-rose-50 rounded-[1.5rem] border-2 border-rose-300 shadow-md text-center">
                <p className="text-[9px] font-black text-rose-700 uppercase mb-1 flex items-center justify-center gap-1">📅 Créée</p>
                <p className="text-sm font-black text-rose-900">{new Date(selectedRes.startDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: '2-digit' })}</p>
              </div>
            </div>

            {/* Options & Services Section */}
            {selectedRes.options && selectedRes.options.length > 0 && (
              <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-orange-100 p-8 rounded-[3rem] border-3 border-amber-400 shadow-xl">
                <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="text-2xl">🎁</span> Options & Services Additionnels
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {selectedRes.options.map((opt, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-[1.5rem] border-2 border-amber-300 shadow-md flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-[11px] font-black text-amber-900">{opt.name}</p>
                        <p className="text-[9px] font-bold text-amber-700 mt-1 px-2 py-1 bg-amber-200 rounded-lg inline-block">{opt.category}</p>
                      </div>
                      <p className="text-lg font-black text-amber-900 ml-2">{opt.price?.toLocaleString() || 'N/A'} DZ</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Check-in & Check-out Logs */}
            {(selectedRes.activationLog || selectedRes.terminationLog) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedRes.activationLog && (
                  <div className="p-6 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-[2rem] border-3 border-yellow-400 shadow-xl">
                    <p className="text-[11px] font-black text-yellow-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="text-2xl">✅</span> Check-in (Mise en Circulation)
                    </p>
                    <div className="space-y-3 text-[10px]">
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="font-black text-gray-600 flex items-center gap-1">⛽ Kilométrage:</span>
                        <span className="font-black text-yellow-900">{selectedRes.activationLog.mileage} KM</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="font-black text-gray-600 flex items-center gap-1">🛢️ Carburant:</span>
                        <span className="font-black text-yellow-900">{selectedRes.activationLog.fuel?.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="font-black text-gray-600 flex items-center gap-1">📍 Localisation:</span>
                        <span className="font-black text-yellow-900">{selectedRes.activationLog.location}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="font-black text-gray-600 flex items-center gap-1">📅 Date:</span>
                        <span className="font-black text-yellow-900">{new Date(selectedRes.activationLog.date).toLocaleString('fr-FR')}</span>
                      </div>
                      {selectedRes.activationLog.notes && (
                        <div className="p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                          <span className="font-black text-gray-600 block mb-1">📝 Notes:</span>
                          <p className="text-yellow-900">{selectedRes.activationLog.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {selectedRes.terminationLog && (
                  <div className="p-6 bg-gradient-to-br from-red-100 to-red-50 rounded-[2rem] border-3 border-red-400 shadow-xl">
                    <p className="text-[11px] font-black text-red-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="text-2xl">🔒</span> Check-out (Clôture)
                    </p>
                    <div className="space-y-3 text-[10px]">
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="font-black text-gray-600 flex items-center gap-1">⛽ Kilométrage:</span>
                        <span className="font-black text-red-900">{(selectedRes.terminationLog as any)?.mileage} KM</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="font-black text-gray-600 flex items-center gap-1">📏 Distance:</span>
                        <span className="font-black text-red-900">{((selectedRes.terminationLog as any)?.mileage || 0) - (selectedRes.activationLog?.mileage || 0)} KM</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="font-black text-gray-600 flex items-center gap-1">🛢️ Carburant:</span>
                        <span className="font-black text-red-900">{(selectedRes.terminationLog as any)?.fuel?.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                        <span className="font-black text-gray-600 flex items-center gap-1">📍 Localisation:</span>
                        <span className="font-black text-red-900">{(selectedRes.terminationLog as any)?.location}</span>
                      </div>
                      {(selectedRes.terminationLog as any)?.notes && (
                        <div className="p-3 bg-red-50 rounded-lg border-2 border-red-200">
                          <span className="font-black text-gray-600 block mb-1">📝 Notes:</span>
                          <p className="text-red-900">{(selectedRes.terminationLog as any)?.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Inspection Information Section */}
            <div className="bg-gradient-to-r from-purple-100 via-indigo-100 to-blue-100 p-8 rounded-[3rem] border-3 border-purple-400 shadow-xl">
              <p className="text-[11px] font-black text-purple-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="text-2xl">🔍</span> État du Véhicule
              </p>
              
              {!inspectionData.depart && !inspectionData.retour ? (
                // No inspections yet
                <div className="text-center p-8 bg-white rounded-[2rem] border-2 border-dashed border-purple-300">
                  <p className="text-[12px] font-black text-purple-700 uppercase mb-2">⏳ Aucune Inspection Effectuée</p>
                  <p className="text-[10px] text-purple-600">Les inspections apparaîtront ici une fois effectuées</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* État de Départ */}
                  {inspectionData.depart ? (
                    <div className="p-6 bg-white rounded-[2rem] border-2 border-purple-300 shadow-lg">
                      <p className="text-[10px] font-black text-purple-600 uppercase mb-4 flex items-center gap-2">
                        <span className="text-2xl">📸</span> État de Départ
                      </p>
                      <div className="space-y-3 text-[9px]">
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <span className="font-black text-purple-900 flex items-center gap-1">🛡️ Sécurité:</span>
                          <p className="text-purple-800 mt-1 ml-4">
                            {inspectionData.depart.security && Object.values(inspectionData.depart.security).some((v: any) => v) ? '✅ Vérifiée' : '❌ Non vérifiée'}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <span className="font-black text-purple-900 flex items-center gap-1">🔧 Équipement:</span>
                          <p className="text-purple-800 mt-1 ml-4">
                            {inspectionData.depart.equipment && Object.values(inspectionData.depart.equipment).some((v: any) => v) ? '✅ Complet' : '❌ Non complet'}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <span className="font-black text-purple-900 flex items-center gap-1">🛋️ Confort:</span>
                          <p className="text-purple-800 mt-1 ml-4">
                            {inspectionData.depart.comfort && Object.values(inspectionData.depart.comfort).some((v: any) => v) ? '✅ Bon État' : '❌ Non vérifiée'}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <span className="font-black text-purple-900 flex items-center gap-1">🧹 Propreté:</span>
                          <p className="text-purple-800 mt-1 ml-4">
                            {inspectionData.depart.cleanliness && Object.values(inspectionData.depart.cleanliness).some((v: any) => v) ? '✅ Impeccable' : '❌ Non vérifiée'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-white rounded-[2rem] border-2 border-dashed border-purple-300 shadow-lg flex flex-col items-center justify-center">
                      <p className="text-[10px] font-black text-purple-600 uppercase mb-2">⏳ Inspection Départ</p>
                      <p className="text-[9px] text-purple-500">En Attente</p>
                    </div>
                  )}

                  {/* État de Retour */}
                  {inspectionData.retour ? (
                    <div className="p-6 bg-white rounded-[2rem] border-2 border-indigo-300 shadow-lg">
                      <p className="text-[10px] font-black text-indigo-600 uppercase mb-4 flex items-center gap-2">
                        <span className="text-2xl">📋</span> État de Retour
                      </p>
                      <div className="space-y-3 text-[9px]">
                        <div className="p-3 bg-indigo-50 rounded-lg">
                          <span className="font-black text-indigo-900 flex items-center gap-1">🛡️ Sécurité:</span>
                          <p className="text-indigo-800 mt-1 ml-4">
                            {inspectionData.retour.security && Object.values(inspectionData.retour.security).some((v: any) => v) ? '✅ Vérifiée' : '❌ Non vérifiée'}
                          </p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg">
                          <span className="font-black text-indigo-900 flex items-center gap-1">🔧 Équipement:</span>
                          <p className="text-indigo-800 mt-1 ml-4">
                            {inspectionData.retour.equipment && Object.values(inspectionData.retour.equipment).some((v: any) => v) ? '✅ Complet' : '❌ Non complet'}
                          </p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg">
                          <span className="font-black text-indigo-900 flex items-center gap-1">🛋️ Confort:</span>
                          <p className="text-indigo-800 mt-1 ml-4">
                            {inspectionData.retour.comfort && Object.values(inspectionData.retour.comfort).some((v: any) => v) ? '✅ Bon État' : '❌ Non vérifiée'}
                          </p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg">
                          <span className="font-black text-indigo-900 flex items-center gap-1">🧹 Propreté:</span>
                          <p className="text-indigo-800 mt-1 ml-4">
                            {inspectionData.retour.cleanliness && Object.values(inspectionData.retour.cleanliness).some((v: any) => v) ? '✅ Impeccable' : '❌ Non vérifiée'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-white rounded-[2rem] border-2 border-dashed border-indigo-300 shadow-lg flex flex-col items-center justify-center">
                      <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">⏳ Inspection Retour</p>
                      <p className="text-[9px] text-indigo-500">En Attente</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t-4 border-gray-200">
              <button onClick={() => setActiveModal(null)} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black uppercase text-[10px] hover:bg-gray-200 transition-all shadow-lg">
                ❌ Fermer
              </button>
              {(selectedRes.totalAmount - selectedRes.paidAmount) > 0 && (
                <button 
                  onClick={() => { setActiveModal('pay'); }}
                  className="flex-1 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg hover:shadow-2xl transition-all hover:scale-105">
                  💰 Régler la Dette
                </button>
              )}
            </div>
          </div>
        </ModalBase>
      )}

      {/* --- PAY MODAL (Régler Dette) --- */}
      {activeModal === 'pay' && selectedRes && (
        <ModalBase title="Règlement de Dette" onClose={() => setActiveModal(null)} maxWidth="max-w-xl">
          <div className="flex flex-col items-center space-y-6 py-4">
            {/* Tabs */}
            <div className="w-full max-w-2xl flex items-center justify-between bg-white/20 rounded-3xl p-2">
              <div className="flex gap-2">
                <button onClick={() => setActivePayTab('pay')} className={`px-4 py-2 rounded-2xl font-black text-sm transition ${activePayTab==='pay' ? 'bg-gradient-to-r from-purple-600 to-emerald-400 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>💳 Payer</button>
                <button onClick={() => setActivePayTab('history')} className={`px-4 py-2 rounded-2xl font-black text-sm transition ${activePayTab==='history' ? 'bg-gradient-to-r from-purple-600 to-emerald-400 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>🧾 Historique</button>
              </div>
              <div className="text-xs font-bold text-gray-500 flex items-center gap-2">✨ <span>{selectedRes.reservationNumber || selectedRes.reservation_number}</span></div>
            </div>

            {activePayTab === 'pay' ? (
            <div className="flex flex-col items-center space-y-10 py-4 w-full">
              {/* Actual Debt Card */}
              <div className="w-full bg-gradient-to-r from-purple-50 to-emerald-50 rounded-[3.5rem] p-8 text-center border border-purple-100/50 relative overflow-hidden">
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-40 h-40 rounded-full bg-purple-200/30 blur-3xl"></div>
                <p className="text-purple-600 font-black text-[11px] uppercase tracking-[0.2em] mb-2">DETTE ACTUELLE</p>
                <p className="text-[4.5rem] font-black text-purple-700 leading-none tracking-tighter">
                  {(selectedRes.totalAmount - selectedRes.paidAmount).toLocaleString()}
                </p>
                <p className="text-2xl font-black text-emerald-700 mt-4 tracking-widest uppercase opacity-80">DZ</p>
              </div>

              {/* Input Section */}
              <div className="w-full space-y-6">
                <div className="flex items-center justify-between px-4">
                  <p className="text-gray-400 font-black text-[11px] uppercase tracking-[0.2em]">{lang === 'fr' ? "MONTANT À VERSER" : "المبلغ المراد دفعه"}</p>
                  <button 
                   onClick={() => setPaymentAmount(selectedRes.totalAmount - selectedRes.paidAmount)}
                   className="text-[10px] font-black text-emerald-600 uppercase hover:underline flex items-center gap-2"
                  >
                   ⚡ Solder tout
                  </button>
                </div>
                    
                <div className="relative h-28 bg-[#071024] rounded-[3rem] flex items-center px-8 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)] overflow-hidden border border-white/8 group">
                  <div className="text-2xl font-black text-gray-400 select-none mr-4">DZ</div>
                       
                  <input 
                    type="number" 
                    value={paymentAmount || ''} 
                    onChange={e => {
                     const val = Number(e.target.value);
                     const max = selectedRes.totalAmount - selectedRes.paidAmount;
                     setPaymentAmount(Math.min(val, max));
                    }} 
                    className="flex-1 bg-transparent text-white text-[2.8rem] font-black outline-none text-right pr-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    autoFocus
                  />
                       
                  <div className="w-px h-12 bg-white/8 mx-6"></div>
                       
                  <div className="flex flex-col gap-2">
                    <button 
                     type="button" 
                     onClick={() => setPaymentAmount(prev => Math.min((prev||0) + 1000, selectedRes.totalAmount - selectedRes.paidAmount))
                     }
                     className="p-1 hover:text-white text-gray-400 transition-colors"
                    >
                     ➕
                    </button>
                    <button 
                     type="button" 
                     onClick={() => setPaymentAmount(prev => Math.max(0, (prev||0) - 1000))
                     }
                     className="p-1 hover:text-white text-gray-400 transition-colors"
                    >
                     ➖
                    </button>
                  </div>
                </div>

                {/* Quick Action Presets */}
                <div className="grid grid-cols-3 gap-3 px-2">
                  {[1000, 5000, 10000].map(val => (
                    <button 
                    key={val}
                    onClick={() => setPaymentAmount(prev => Math.min((prev||0) + val, selectedRes.totalAmount - selectedRes.paidAmount))}
                    className="py-3 bg-white rounded-2xl font-black text-[10px] text-gray-700 hover:bg-purple-700 hover:text-white transition-all uppercase tracking-widest border border-transparent active:scale-95"
                    >
                    +{val.toLocaleString()} DZ
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm Button */}
              <div className="w-full pt-2">
               <GradientButton 
                onClick={handlePayment} 
                disabled={loading || paymentAmount <= 0} 
                className="w-full !py-8 text-xl uppercase tracking-widest rounded-[2rem] shadow-2xl transition-all active:scale-[0.98] bg-gradient-to-r from-purple-600 to-emerald-400"
               >
                 {loading ? (lang === 'fr' ? 'Traitement...' : 'جاري المعالجة...') : (lang === 'fr' ? 'Confirmer le versement 🎉' : 'تأكيد الدفع ←')}
               </GradientButton>
              </div>
            </div>
            ) : (
             <div className="w-full max-w-2xl bg-white rounded-2xl p-4">
               <h4 className="text-lg font-black text-gray-800 flex items-center gap-2">🧾 Historique des Paiements</h4>
               <p className="text-sm text-gray-500 mb-4">Liste des opérations pour ce dossier. Vous pouvez supprimer une entrée pour ajuster le montant payé.</p>
               <div className="space-y-3 max-h-72 overflow-auto">
                {paymentHistory.length === 0 && <div className="text-sm text-gray-400">Aucun paiement enregistré.</div>}
                {paymentHistory.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                   <div>
                    <div className="font-black">{Number(p.amount).toLocaleString()} DZ</div>
                    <div className="text-xs text-gray-500">{new Date(p.created_at).toLocaleString()} · {p.payment_method || 'cash'}</div>
                   </div>
                   <div className="flex items-center gap-2">
                    <button onClick={() => handleDeletePayment(p.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-sm">🗑️ Supprimer</button>
                   </div>
                  </div>
                ))}
               </div>
             </div>
            )}
          </div>
        </ModalBase>
      )}

      {/* --- ACTIVATE MODAL (CHECK-IN) --- */}
      {activeModal === 'activate' && selectedRes && (
        <ModalBase title="Mise en Circulation (Check-in)" onClose={() => setActiveModal(null)} maxWidth="max-w-2xl">
          <div className="space-y-8">
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-50 via-rose-50 to-indigo-50 border border-gray-100 shadow-xl flex items-center gap-6">
              <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-inner border-4 border-white bg-white flex items-center justify-center">
                <img src={getVehicle(selectedRes.vehicleId)?.mainImage} onError={handleImgError} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black text-gray-900 uppercase flex items-center gap-3">🚀 Mise en Circulation — <span className="text-sm text-gray-500 font-medium ml-2">{getVehicle(selectedRes.vehicleId)?.brand} {getVehicle(selectedRes.vehicleId)?.model}</span></h3>
                <div className="mt-2 text-sm text-gray-600 flex items-center gap-4">
                  <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-indigo-700">{getVehicle(selectedRes.vehicleId)?.immatriculation}</span>
                  <span className="text-xs text-gray-500">Réservation: <strong className="text-gray-800">{selectedRes.reservationNumber || selectedRes.reservation_number || selectedRes.id.slice(0,8)}</strong></span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-xs text-gray-500">Début prévu</div>
                <div className="font-black text-lg">{new Date(selectedRes.startDate).toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">🧭 Kilométrage au départ</label>
                <input type="number" value={logData.mileage || ''} onChange={e => setLogData({...logData, mileage: Number(e.target.value)})} className="w-full mt-3 px-6 py-4 bg-gray-50 rounded-xl font-black text-4xl outline-none shadow-inner text-center" />

                <div className="mt-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">📍 Lieu de prise en charge</label>
                  <select value={logData.location} onChange={e => setLogData({...logData, location: e.target.value})} className="w-full mt-2 px-4 py-3 bg-gray-50 rounded-xl font-bold outline-none">
                    <option value="">Sélectionner un lieu</option>
                    {agencies.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                    <option value="Aéroport">Aéroport</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">⛽ Niveau de carburant</label>
                <div className="mt-3">
                  <FuelSelector value={logData.fuel || 'plein'} onChange={v => setLogData({...logData, fuel: v})} />
                </div>

                <div className="mt-6">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">📝 Notes rapides</label>
                  <textarea placeholder="Ex: Petit éraflure sur portière droite" value={logData.notes} onChange={e => setLogData({...logData, notes: e.target.value})} className="w-full mt-3 p-3 bg-gray-50 rounded-xl outline-none text-sm h-28" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setActiveModal(null)} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black uppercase text-[12px] hover:bg-gray-200 transition-all">❌ Annuler</button>
              <button onClick={handleActivate} disabled={loading} className="flex-1 py-4 bg-gradient-to-r from-rose-500 to-yellow-400 text-white rounded-2xl font-black uppercase text-[12px] shadow-lg hover:scale-[0.995] transition-transform">✅ Confirmer et Activer</button>
            </div>
          </div>
        </ModalBase>
      )}

      {/* --- TERMINATE MODAL (CHECK-OUT) --- */}
      {activeModal === 'terminate' && selectedRes && (
        <ModalBase title="Clôture de la Location (Check-out)" onClose={() => setActiveModal(null)} maxWidth="max-w-6xl">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Left Column: KM Tracking */}
              <div className="space-y-12">
                 <div className="bg-gray-900 rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 text-9xl font-black rotate-12">KM</div>
                    <SectionHeader icon="🗺️" text="Suivi Kilométrique" dark />
                    
                    {/* Departure Mileage (Read-only) */}
                      <div className="mt-10 p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-teal-700 to-emerald-700 shadow-md">
                        <p className="text-[10px] font-black text-teal-100 uppercase tracking-widest mb-3">Kilométrage au Départ (Check-in)</p>
                        <p className="text-5xl font-black text-white">{getDepartureMileage(selectedRes)} <span className="text-2xl text-teal-200">KM</span></p>
                      </div>

                    {/* Return Mileage (Input) */}
                    <div className="mt-8 p-8 bg-blue-600/20 rounded-3xl border-2 border-blue-400">
                       <label className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-4 block">Kilométrage de Retour (Entrée Requise)</label>
                       <input 
                          type="number" 
                          value={termData.mileage} 
                          onChange={e => setTermData({...termData, mileage: Number(e.target.value)})} 
                          placeholder="Saisissez le kilométrage du compteur"
                          className="w-full bg-white/10 p-6 rounded-2xl text-4xl font-black text-right outline-none border border-blue-400/50 focus:border-blue-300 focus:bg-white/15 transition-all placeholder-gray-400"
                       />
                    </div>

                    {/* Distance Calculation */}
                    <div className="mt-10 pt-10 border-t border-white/20 space-y-4">
                       <p className="text-xs font-black uppercase text-gray-400">Distance Totale Parcourue</p>
                       <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-8 text-center">
                          <p className="text-7xl font-black text-white">{Math.max(0, termData.mileage - getDepartureMileage(selectedRes))}</p>
                          <p className="text-2xl font-black text-blue-100 mt-2">KM</p>
                       </div>
                    </div>
                 </div>

                 <div className="p-10 bg-blue-50/50 rounded-[4rem] border border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase mb-4 tracking-widest">⛽ Niveau Carburant (Départ: {selectedRes.activationLog?.fuel?.toUpperCase()})</p>
                    <FuelSelector value={termData.fuel} onChange={v => setTermData({...termData, fuel: v})} />
                 </div>
              </div>

              {/* Right Column: Fees & Finish */}
              <div className="space-y-12 bg-white p-12 rounded-[4rem] shadow-inner border border-gray-50 flex flex-col">
                {/* Inspection controls: reuse the creation inspection UI for full feature parity */}
                

                 {/* PHOTOS SECTION (terminer la location) - Signature and vehicle fields removed per request */}
                 <div className="grid grid-cols-1 gap-6">
                   {/* Interior Photos */}
                   <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl border-2 border-purple-200">
                     <p className="text-[10px] font-black text-purple-700 uppercase mb-4 flex items-center gap-2">📸 Photos Intérieur</p>
                     <div className="grid grid-cols-3 gap-3 mb-4">
                       {interiorPreviews.length === 0 ? <div className="col-span-3 py-8 text-center border-3 border-dashed border-purple-300 rounded-2xl text-purple-400 bg-white/50">📷 Aucune photo</div> : interiorPreviews.map((p, i) => (
                         <div key={i} className="relative">
                           <img src={p} className="w-full aspect-square object-cover rounded-xl border-2 border-purple-300 shadow-md" />
                           <button onClick={() => setInteriorPreviews(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-white/80 rounded-full p-1 text-sm">🗑️</button>
                         </div>
                       ))}
                     </div>
                     <div className="flex gap-3 mb-2">
                       <input type="file" ref={interiorInputRef} className="hidden" multiple accept="image/*" onChange={handleInteriorUpload} />
                       <button onClick={() => interiorInputRef.current?.click()} className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black transition-all shadow-lg">+ 📷 Ajouter int.</button>
                       <button onClick={() => { setInteriorPreviews([]); setPendingInspection(prev => ({ ...(prev||initialPendingInsp), interiorPhotos: [] })); }} className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-black transition-all">🗑️ Supprimer</button>
                     </div>
                   </div>
                 </div>

                 {/* EXTERIOR PHOTOS */}
                 <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border-2 border-amber-200">
                    <p className="text-[10px] font-black text-amber-700 uppercase mb-4 flex items-center gap-2">📸 Photos Extérieur</p>
                    <div className="bg-white rounded-2xl p-6 text-center border-2 border-dashed border-amber-200 mb-3">
                       <p className="text-[11px] font-bold text-gray-500">📷 Aucune photo</p>
                    </div>
                    <div className="flex gap-3">
                       <button className="flex-1 py-3 bg-amber-600 text-white rounded-2xl text-[11px] font-black">+ 📷 Ajouter ext.</button>
                       <button className="flex-1 py-2 bg-red-100 text-red-700 rounded-2xl text-[11px] font-black">🗑️ Supprimer</button>
                    </div>
                 </div>

                 {/* Inspection Section - Comparing Depart vs Retour */}
                 {inspectionData.depart && (
                    <div className="bg-gradient-to-r from-purple-100 via-indigo-100 to-blue-100 p-8 rounded-[3rem] border-3 border-purple-400 shadow-xl">
                       <p className="text-[11px] font-black text-purple-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <span className="text-2xl">🔄</span> Vérification Retour (État de Retour)
                       </p>
                       <div className="space-y-4">
                          {/* Security */}
                          <div className="p-4 bg-white rounded-2xl border-2 border-purple-300">
                             <p className="text-[10px] font-black text-purple-700 mb-3 flex items-center gap-2">🛡️ Sécurité</p>
                             <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-gray-600">
                                   État Départ: {inspectionData.depart.security && Object.values(inspectionData.depart.security).some((v: any) => v) ? '✅ Vérifiée' : '❌'}
                                </span>
                                <label className="flex items-center gap-2 cursor-pointer">
                                   <input 
                                      type="checkbox" 
                                      checked={retourInspectionConfirm.security.verified || false}
                                      onChange={(e) => setRetourInspectionConfirm({...retourInspectionConfirm, security: {...retourInspectionConfirm.security, verified: e.target.checked}})}
                                      className="w-5 h-5 rounded text-purple-600"
                                   />
                                   <span className="text-[9px] font-black text-purple-700">Confirmer État Retour</span>
                                </label>
                             </div>
                              {/* List depart items for reference */}
                              {inspectionData.depart.security && Object.keys(inspectionData.depart.security).length > 0 && (
                                <ul className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                                  {Object.entries(inspectionData.depart.security).map(([k,v]) => {
                                    const tpl = inspectionTemplates.find(t => t._key === k) as any;
                                    const label = tpl ? tpl.item_name : k.replace(/_/g,' ');
                                    return (<li key={k} className="flex items-center gap-2"><span className={`w-3 h-3 rounded-sm ${v ? 'bg-green-600' : 'bg-gray-300'}`} />{label}</li>);
                                  })}
                                </ul>
                              )}
                          </div>

                          {/* Equipment */}
                          <div className="p-4 bg-white rounded-2xl border-2 border-purple-300">
                             <p className="text-[10px] font-black text-purple-700 mb-3 flex items-center gap-2">🔧 Équipement</p>
                             <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-gray-600">
                                   État Départ: {inspectionData.depart.equipment && Object.values(inspectionData.depart.equipment).some((v: any) => v) ? '✅ Complet' : '❌'}
                                </span>
                                <label className="flex items-center gap-2 cursor-pointer">
                                   <input 
                                      type="checkbox" 
                                      checked={retourInspectionConfirm.equipment.verified || false}
                                      onChange={(e) => setRetourInspectionConfirm({...retourInspectionConfirm, equipment: {...retourInspectionConfirm.equipment, verified: e.target.checked}})}
                                      className="w-5 h-5 rounded text-purple-600"
                                   />
                                   <span className="text-[9px] font-black text-purple-700">Confirmer État Retour</span>
                                </label>
                             </div>
                            {inspectionData.depart.equipment && Object.keys(inspectionData.depart.equipment).length > 0 && (
                              <ul className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                                {Object.entries(inspectionData.depart.equipment).map(([k,v]) => {
                                  const tpl = inspectionTemplates.find(t => t._key === k) as any;
                                  const label = tpl ? tpl.item_name : k.replace(/_/g,' ');
                                  return (<li key={k} className="flex items-center gap-2"><span className={`w-3 h-3 rounded-sm ${v ? 'bg-green-600' : 'bg-gray-300'}`} />{label}</li>);
                                })}
                              </ul>
                            )}
                          </div>

                          {/* Comfort */}
                          <div className="p-4 bg-white rounded-2xl border-2 border-purple-300">
                             <p className="text-[10px] font-black text-purple-700 mb-3 flex items-center gap-2">🛋️ Confort</p>
                             <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-gray-600">
                                   État Départ: {inspectionData.depart.comfort && Object.values(inspectionData.depart.comfort).some((v: any) => v) ? '✅ Bon État' : '❌'}
                                </span>
                                <label className="flex items-center gap-2 cursor-pointer">
                                   <input 
                                      type="checkbox" 
                                      checked={retourInspectionConfirm.comfort.verified || false}
                                      onChange={(e) => setRetourInspectionConfirm({...retourInspectionConfirm, comfort: {...retourInspectionConfirm.comfort, verified: e.target.checked}})}
                                      className="w-5 h-5 rounded text-purple-600"
                                   />
                                   <span className="text-[9px] font-black text-purple-700">Confirmer État Retour</span>
                                </label>
                             </div>
                            {inspectionData.depart.comfort && Object.keys(inspectionData.depart.comfort).length > 0 && (
                              <ul className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                                {Object.entries(inspectionData.depart.comfort).map(([k,v]) => {
                                  const tpl = inspectionTemplates.find(t => t._key === k) as any;
                                  const label = tpl ? tpl.item_name : k.replace(/_/g,' ');
                                  return (<li key={k} className="flex items-center gap-2"><span className={`w-3 h-3 rounded-sm ${v ? 'bg-green-600' : 'bg-gray-300'}`} />{label}</li>);
                                })}
                              </ul>
                            )}
                          </div>

                          {/* Cleanliness */}
                          <div className="p-4 bg-white rounded-2xl border-2 border-purple-300">
                             <p className="text-[10px] font-black text-purple-700 mb-3 flex items-center gap-2">🧹 Propreté</p>
                             <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-gray-600">
                                   État Départ: {inspectionData.depart.cleanliness && Object.values(inspectionData.depart.cleanliness).some((v: any) => v) ? '✅ Impeccable' : '❌'}
                                </span>
                                <label className="flex items-center gap-2 cursor-pointer">
                                   <input 
                                      type="checkbox" 
                                      checked={retourInspectionConfirm.cleanliness.verified || false}
                                      onChange={(e) => setRetourInspectionConfirm({...retourInspectionConfirm, cleanliness: {...retourInspectionConfirm.cleanliness, verified: e.target.checked}})}
                                      className="w-5 h-5 rounded text-purple-600"
                                   />
                                   <span className="text-[9px] font-black text-purple-700">Confirmer État Retour</span>
                                </label>
                             </div>
                            {inspectionData.depart.cleanliness && Object.keys(inspectionData.depart.cleanliness).length > 0 && (
                              <ul className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                                {Object.entries(inspectionData.depart.cleanliness).map(([k,v]) => {
                                  const tpl = inspectionTemplates.find(t => t._key === k) as any;
                                  const label = tpl ? tpl.item_name : k.replace(/_/g,' ');
                                  const display = typeof v === 'number' ? `${v}/10` : (v ? 'OK' : 'N/A');
                                  return (<li key={k} className="flex items-center justify-between"><div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-sm ${v ? 'bg-green-600' : 'bg-gray-300'}`} />{label}</div><span className="font-black text-sm">{display}</span></li>);
                                })}
                              </ul>
                            )}
                          </div>
                       </div>
                    </div>
                 )}

                 <div className="relative overflow-hidden p-8 border-2 border-dashed border-gray-100 rounded-[3rem]">
                    <div className="absolute -top-4 -right-4 opacity-5 text-7xl font-black rotate-12">FRAIS</div>
                    <SectionHeader icon="💸" text="Frais Supplémentaires de Clôture" />
                    <div className="space-y-6 mt-10">
                       <div className="flex justify-between items-center bg-red-50/50 p-6 rounded-3xl">
                          <div><p className="text-xs font-black text-gray-900 uppercase">Kilométrage Excédentaire</p><p className="text-[9px] font-bold text-gray-400">Facturé si dépassement forfait</p></div>
                          <input type="number" value={termData.extraKmCost} onChange={e => setTermData({...termData, extraKmCost: Number(e.target.value)})} className="w-32 bg-white p-4 rounded-2xl font-black text-2xl text-right text-red-600 outline-none shadow-sm" />
                       </div>
                       <div className="flex justify-between items-center bg-red-50/50 p-6 rounded-3xl">
                          <div><p className="text-xs font-black text-gray-900 uppercase">Carburant Manquant</p><p className="text-[9px] font-bold text-gray-400">Différence par rapport au check-in</p></div>
                          <input type="number" value={termData.extraFuelCost} onChange={e => setTermData({...termData, extraFuelCost: Number(e.target.value)})} className="w-32 bg-white p-4 rounded-2xl font-black text-2xl text-right text-red-600 outline-none shadow-sm" />
                       </div>
                    </div>
                    <div className="mt-10 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200 space-y-4">
                       <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-blue-600 uppercase">💰 Appliquer TVA</label>
                          <input type="checkbox" checked={termData.withTva} onChange={e => setTermData({...termData, withTva: e.target.checked})} className="w-8 h-8 rounded-xl text-blue-600" />
                       </div>
                       {termData.withTva && (
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-blue-600 uppercase block">📊 Choisir le taux TVA</label>
                             <div className="grid grid-cols-4 gap-2">
                                {[17, 19, 20, 21].map(rate => (
                                   <button
                                      key={rate}
                                      onClick={() => setTermData({...termData, tvaPercentage: rate})}
                                      className={`py-3 px-2 rounded-xl font-black transition-all border-2 text-xs ${
                                         (termData as any).tvaPercentage === rate
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                            : 'bg-white border-blue-200 text-blue-600 hover:border-blue-400'
                                      }`}
                                   >
                                      {rate}%
                                   </button>
                                ))}
                             </div>
                          </div>
                       )}
                    </div>
                    <div className="mt-10 pt-6 border-t border-gray-200">
                       <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-gray-600 uppercase">Total Frais de Clôture (TTC)</p>
                          <p className="text-5xl font-black text-gray-900">{((termData.extraKmCost + termData.extraFuelCost) * (termData.withTva ? (1 + ((termData as any).tvaPercentage || 19) / 100) : 1)).toLocaleString('fr-DZ', { maximumFractionDigits: 2 })} <span className="text-sm">DZ</span></p>
                       </div>
                    </div>
                 </div>

                 {/* Documents déposés en agence */}
                 <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                    <p className="text-sm font-black uppercase text-gray-500">Documents laissés par le client</p>
                    {termDocsLeft.length === 0 && <p className="text-[13px] text-gray-400">Aucun document trouvé pour ce client.</p>}
                    {termDocsLeft.map((d, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={d.left} onChange={() => {
                            setTermDocsLeft(prev => prev.map((p,i)=> i===idx ? { ...p, left: !p.left } : p));
                          }} className="w-5 h-5" />
                          <div className="text-sm font-bold">{d.label}{d.url ? (<a className="text-blue-500 underline ml-2" href={d.url} target="_blank" rel="noreferrer">Voir</a>) : null}</div>
                        </div>
                        <div className="text-sm text-gray-500">{d.left ? 'Conservé en agence' : 'Retiré'}</div>
                      </div>
                    ))}

                    <div className="flex gap-3 pt-3">
                      <button onClick={() => markDocumentsTaken(true)} className="flex-1 px-4 py-3 bg-green-600 text-white rounded-2xl font-black">Client a récupéré</button>
                      <button onClick={() => markDocumentsTaken(false)} className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-2xl font-black">Notifier client (non récupéré)</button>
                    </div>
                 </div>

                 <textarea placeholder="Note de clôture: observations sur l'état général au retour..." value={termData.notes} onChange={e => setTermData({...termData, notes: e.target.value})} className="w-full p-8 bg-gray-50 rounded-[2.5rem] outline-none font-bold shadow-inner h-32 resize-none mt-auto" />

                 <GradientButton onClick={handleTerminate} disabled={loading} className="w-full !py-10 text-3xl uppercase tracking-tighter rounded-[2.5rem] shadow-2xl mt-8">
                    ✅ {loading ? 'Clôture...' : 'Clôturer le Dossier'}
                 </GradientButton>
              </div>
           </div>
        </ModalBase>
      )}
    </div>
  );
};

const SectionHeader = ({ icon, text, dark }: { icon: string, text: string, dark?: boolean }) => (
  <div className={`flex items-center gap-3 ${dark ? 'text-teal-200' : 'text-green-600'}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-gradient-to-br from-teal-600 to-emerald-600' : 'bg-green-50'}`}>
      <span className="text-2xl">{icon}</span>
    </div>
    <h3 className={`text-[12px] font-black uppercase tracking-widest ${dark ? 'text-teal-100' : 'text-gray-900'}`}>{text}</h3>
  </div>
);

export default PlannerPage;
