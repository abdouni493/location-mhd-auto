
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Language, Inspection, Reservation, Vehicle, Customer, Damage } from '../types';
import GradientButton from '../components/GradientButton';

interface OperationsPageProps {
  lang: Language;
  vehicles: Vehicle[];
  inspections: Inspection[];
  damages: Damage[];
  templates: any[];
  onAddInspection: (insp: Inspection) => void;
  onUpdateInspection: (insp: Inspection) => void;
  onDeleteInspection: (id: string) => void;
  onUpdateVehicleMileage: (vehicleId: string, newMileage: number) => void;
  onAddDamage: (dmg: Damage) => void;
  onUpdateDamage: (dmg: Damage) => void;
  onDeleteDamage: (id: string) => void;
}

type OperationTab = 'inspection' | 'dommages';
type InspectionStep = 1 | 2 | 3;

interface ChecklistItemProps {
  checked: boolean;
  label: string;
  onToggle?: () => void;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ checked, label, onToggle }) => (
  <button 
    type="button" 
    onClick={onToggle}
    disabled={!onToggle}
    className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all group ${checked ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200'} ${!onToggle ? 'cursor-default' : ''}`}
  >
    <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${checked ? 'bg-white text-blue-600' : 'bg-gray-100'}`}>
      {checked ? '✓' : '✕'}
    </div>
  </button>
);

const FuelSelector: React.FC<{ value: string, onChange: (v: string) => void, lang: Language }> = ({ value, onChange, lang }) => {
  const levels = [
    { id: 'plein', label: '8/8', icon: '⛽', color: 'bg-blue-600' },
    { id: '1/2', label: '1/2', icon: '🌗', color: 'bg-blue-500' },
    { id: '1/4', label: '1/4', icon: '🌘', color: 'bg-blue-400' },
    { id: '1/8', label: '1/8', icon: '🚨', color: 'bg-orange-500' },
    { id: 'vide', label: '0/0', icon: '⚠️', color: 'bg-red-600' }
  ];
  return (
    <div className="grid grid-cols-5 gap-3">
      {levels.map(l => (
        <button
          key={l.id}
          type="button"
          onClick={() => onChange(l.id)}
          className={`flex flex-col items-center p-4 rounded-3xl border-2 transition-all group ${value === l.id ? `${l.color} border-transparent text-white shadow-xl scale-105` : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200'}`}
        >
          <span className="text-2xl group-hover:scale-125 transition-transform">{l.icon}</span>
          <span className="text-[9px] font-black mt-2 uppercase tracking-widest">{l.label}</span>
        </button>
      ))}
    </div>
  );
};

const SignaturePad: React.FC<{ onSave: (dataUrl: string) => void, isRtl: boolean, initialValue?: string }> = ({ onSave, isRtl, initialValue }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        if (initialValue) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0);
          img.src = initialValue;
        }
      }
    }
  }, [initialValue]);

  const startDrawing = (e: any) => { setIsDrawing(true); draw(e); };
  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) onSave(canvas.toDataURL());
  };
  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
  };
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); onSave(''); }
  };

  return (
    <div className="relative group">
      <canvas ref={canvasRef} width={800} height={300} className="w-full bg-white border-4 border-dashed border-gray-200 rounded-[3rem] cursor-crosshair touch-none shadow-inner" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
      <button type="button" onClick={clear} className="absolute bottom-6 right-6 px-8 py-3 bg-red-50 text-red-600 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">Effacer</button>
    </div>
  );
};

const OperationsPage: React.FC<OperationsPageProps> = ({ 
  lang, vehicles, inspections, damages, templates,
  onAddInspection, onUpdateInspection, onDeleteInspection, onUpdateVehicleMileage,
  onAddDamage, onUpdateDamage, onDeleteDamage
}) => {
  const [activeTab, setActiveTab] = useState<OperationTab>('inspection');
  const [isCreatingInsp, setIsCreatingInsp] = useState(false);
  const [editingInspId, setEditingInspId] = useState<string | null>(null);
  const [stepInsp, setStepInsp] = useState<InspectionStep>(1);
  const [searchResQuery, setSearchResQuery] = useState('');
  const [viewingInsp, setViewingInsp] = useState<Inspection | null>(null);

  const [activePrintModal, setActivePrintModal] = useState<'print-view' | null>(null);
  const [printRes, setPrintRes] = useState<Reservation | null>(null);
  const [printTemplate, setPrintTemplate] = useState<any>(null);

  const initialInspForm: Partial<Inspection> = {
    type: 'depart', 
    date: new Date().toISOString().split('T')[0], 
    fuel: 'plein',
    security: { lights: false, tires: false, brakes: false, wipers: false, mirrors: false, belts: false, horn: false },
    equipment: { spareWheel: false, jack: false, triangles: false, firstAid: false, docs: false },
    comfort: { ac: false }, 
    cleanliness: { interior: false, exterior: false },
    exteriorPhotos: [], 
    interiorPhotos: [], 
    signature: '',
    notes: ''
  };

  const [inspFormData, setInspFormData] = useState<Partial<Inspection>>(initialInspForm);
  const isRtl = lang === 'ar';

  const t = {
    fr: {
      inspection: 'Inspection', dommages: 'Dommages', history: 'Historique des Inspections',
      newBtn: 'Nouvelle Inspection',
      type: 'Type', date: 'Date', mileage: 'Kilométrage', fuel: 'Niveau Carburant',
      checkIn: 'Départ (Check-in)', checkOut: 'Retour (Check-out)',
      general: 'Informations Générales',
      security: 'Contrôle Sécurité',
      equipment: 'Équipements Obligatoires',
      comfort: 'Confort',
      cleanliness: 'État & Propreté',
      secItems: { lights: 'Feux & Phares', tires: 'Pneus (Usure/Pression)', brakes: 'Freins', wipers: 'Essuie-glaces', mirrors: 'Rétroviseurs', belts: 'Ceintures', horn: 'Klaxon' },
      eqItems: { spareWheel: 'Roue de secours', jack: 'Cric', triangles: 'Triangles', firstAid: 'Trousse secours', docs: 'Docs véhicule' },
      validate: 'Valider l\'inspection',
      next: 'Suivant', back: 'Retour',
      summary: 'Résumé de l\'inspection',
      photos: 'Photos & Validation',
      extPics: 'Photos Extérieur',
      intPics: 'Photos Intérieur',
      signature: 'Signature du Client',
      searchRes: 'Rechercher une réservation (Client)',
      vehicle: 'Véhicule',
      client: 'Locataire',
      printTitle: 'Aperçu Impression Document'
    },
    ar: {
      inspection: 'معاينة', dommages: 'أضرار', history: 'سجل المعاينات',
      newBtn: 'معاينة جديدة',
      type: 'النوع', date: 'التاريخ', mileage: 'المسافة المقطوعة', fuel: 'مستوى الوقود',
      checkIn: 'انطلاق (Check-in)', checkOut: 'عودة (Check-out)',
      general: 'معلومات عامة',
      security: 'مراقبة الأمن',
      equipment: 'المعدات الإلزامية',
      comfort: 'الراحة',
      cleanliness: 'الحالة والنظافة',
      secItems: { lights: 'الأضواء', tires: 'الإطارات', brakes: 'المكابح', wipers: 'المساحات', mirrors: 'المرايا', belts: 'أحزمة الأمان', horn: 'المنبه' },
      eqItems: { spareWheel: 'عجلة احتياطية', jack: 'رافعة', triangles: 'مثلثات التحذير', firstAid: 'صيدلية', docs: 'وثائق المركبة' },
      validate: 'تأكيد المعاينة',
      next: 'التالي', back: 'رجوع',
      summary: 'ملخص المعاينة',
      photos: 'الصور والتأكيد',
      extPics: 'صور خارجية',
      intPics: 'صور داخلية',
      signature: 'توقيع الزبون',
      searchRes: 'بحث عن حجز (الزبون)',
      vehicle: 'المركبة',
      client: 'الزبون',
      printTitle: 'معاينة طباعة الوثيقة'
    }
  }[lang];

  // Logic: Inspections depend on current state provided by App
  const handleFinishInsp = () => {
    const finalData = { ...inspFormData as Inspection, id: editingInspId || `insp-${Date.now()}` };
    if (editingInspId) onUpdateInspection(finalData);
    else onAddInspection(finalData);
    setIsCreatingInsp(false); setEditingInspId(null); setStepInsp(1); setInspFormData(initialInspForm);
  };

  const currentVeh = vehicles.find(v => v.id === vehicles.find(v2 => v2.id)?.id); // Dummy logic for preview

  if (isCreatingInsp) {
    return (
      <div className={`p-4 md:p-8 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">{editingInspId ? 'Modifier' : t.newBtn} <span className="text-blue-600">/ Étape {stepInsp} sur 3</span></h1>
            <button onClick={() => { setIsCreatingInsp(false); setEditingInspId(null); setInspFormData(initialInspForm); }} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl text-gray-400 hover:text-red-500 shadow-sm transition-all text-xl">✕</button>
          </div>

          <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 overflow-hidden">
             {stepInsp === 1 && (
                <div className="p-10 md:p-16 space-y-12 animate-fade-in">
                   <div className="space-y-6">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-4">Identification</label>
                      <select onChange={(e) => setInspFormData({...inspFormData, reservationId: e.target.value})} className="w-full px-8 py-7 bg-gray-50 border-4 border-transparent focus:bg-white focus:border-blue-600 rounded-[3rem] outline-none font-black text-2xl appearance-none">
                         <option value="">Sélectionner un dossier...</option>
                         {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} - {v.immatriculation}</option>)}
                      </select>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Odomètre (KM)</label>
                         <input type="number" value={inspFormData.mileage || ''} onChange={e => setInspFormData({...inspFormData, mileage: parseInt(e.target.value)})} className="w-full px-8 py-6 bg-gray-50 rounded-[2rem] font-black text-4xl outline-none shadow-inner" placeholder="00000" />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">{t.fuel}</label>
                         <FuelSelector value={inspFormData.fuel!} onChange={v => setInspFormData({...inspFormData, fuel: v})} lang={lang} />
                      </div>
                   </div>
                </div>
             )}

             {stepInsp === 2 && (
                <div className="p-10 md:p-16 space-y-16 animate-fade-in bg-gray-50/30">
                   <div>
                      <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-8">🛡️ {t.security}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {['lights', 'tires', 'brakes', 'wipers'].map(k => (
                          <ChecklistItem key={k} checked={!!(inspFormData.security as any)?.[k]} label={k} onToggle={() => {}} />
                        ))}
                      </div>
                   </div>
                </div>
             )}

             {stepInsp === 3 && (
                <div className="p-10 md:p-16 space-y-16 animate-fade-in">
                   <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-gray-100">
                      <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-8 border-b pb-4">{t.signature}</h4>
                      <SignaturePad isRtl={isRtl} initialValue={inspFormData.signature} onSave={s => setInspFormData({...inspFormData, signature: s})} />
                   </div>
                </div>
             )}

             <div className="p-10 md:p-14 border-t border-gray-100 bg-white flex justify-between items-center">
                <button onClick={() => setStepInsp((stepInsp - 1) as InspectionStep)} className={`px-12 py-5 font-black uppercase text-xs tracking-widest text-gray-400 hover:text-gray-900 transition-all ${stepInsp === 1 ? 'opacity-0 pointer-events-none' : ''}`}> {t.back} </button>
                <div className="flex gap-4">
                   {stepInsp < 3 ? (
                      <GradientButton onClick={() => setStepInsp((stepInsp + 1) as InspectionStep)} className="!px-16 !py-6 text-xl !rounded-[2rem]"> {t.next} → </GradientButton>
                   ) : (
                      <GradientButton onClick={handleFinishInsp} className="!px-24 !py-7 text-2xl !rounded-[2.5rem] shadow-2xl"> ✅ {t.validate} </GradientButton>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-8 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
      <div className="flex gap-4 mb-16">
        <button onClick={() => setActiveTab('inspection')} className={`px-12 py-5 rounded-[2.5rem] font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'inspection' ? 'bg-blue-600 text-white shadow-xl' : 'bg-white text-gray-400 border border-gray-100'}`}>🔍 {t.inspection}</button>
        <button onClick={() => setActiveTab('dommages')} className={`px-12 py-5 rounded-[2.5rem] font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'dommages' ? 'bg-red-600 text-white shadow-xl' : 'bg-white text-gray-400 border border-gray-100'}`}>💥 {t.dommages}</button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-12">
        <div>
          <h1 className="text-6xl font-black text-gray-900 tracking-tighter mb-4">{t.history}</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Base de données des états des lieux</p>
        </div>
        <GradientButton onClick={() => setIsCreatingInsp(true)} className="!px-14 !py-7 text-2xl shadow-2xl">+ {t.newBtn}</GradientButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-10">
        {inspections.length === 0 ? (
          <div className="col-span-full py-40 text-center opacity-20"><span className="text-8xl block mb-6">📂</span><p className="font-black uppercase tracking-widest">Aucun rapport enregistré</p></div>
        ) : inspections.map(insp => (
          <div key={insp.id} className="bg-white rounded-[4rem] p-10 border border-gray-100 shadow-sm">
             <span className="px-5 py-2 rounded-xl text-[9px] font-black uppercase text-white bg-blue-600 shadow-lg">{insp.type}</span>
             <h3 className="text-xl font-black mt-4">Inspection du {insp.date}</h3>
             <p className="text-sm font-bold text-gray-400">Kilométrage: {insp.mileage} KM</p>
             <button onClick={() => onDeleteInspection(insp.id)} className="mt-8 text-red-500 font-black uppercase text-[10px]">Supprimer</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperationsPage;
