
import React, { useState, useMemo } from 'react';
import { Language, Reservation, Customer, Vehicle } from '../types';
import GradientButton from '../components/GradientButton';

interface BillingPageProps {
  lang: Language;
  customers: Customer[];
  vehicles: Vehicle[];
  templates: any[];
  reservations: Reservation[];
}

const BillingPage: React.FC<BillingPageProps> = ({ lang, customers, vehicles, templates, reservations }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModal, setActiveModal] = useState<'print-preview' | null>(null);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const isRtl = lang === 'ar';
  const t = {
    fr: {
      title: 'Centre de Facturation',
      search: 'Rechercher un dossier ou client...',
      actions: 'Actions Impression',
      invoice: 'Facture',
      devis: 'Devis',
      contract: 'Contrat',
      checkin: 'P.V Départ',
      checkout: 'P.V Retour',
      total: 'Total',
      paid: 'Payé',
      debt: 'Dette',
      resNum: 'Dossier N°',
      days: 'Jours',
      printTitle: 'Aperçu Impression Document'
    },
    ar: {
      title: 'مركز الفوترة',
      search: 'بحث عن ملف أو زبون...',
      actions: 'إجراءات الطباعة',
      invoice: 'فاتورة',
      devis: 'عرض سعر',
      contract: 'عقد',
      checkin: 'محضر استلام',
      checkout: 'محضر تسليم',
      total: 'الإجمالي',
      paid: 'المدفوع',
      debt: 'الدين',
      resNum: 'ملف رقم',
      days: 'أيام',
      printTitle: 'معاينة طباعة الوثيقة'
    }
  }[lang];

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const client = customers.find(c => c.id === res.customerId);
      const name = `${client?.firstName} ${client?.lastName}`.toLowerCase();
      return name.includes(searchTerm.toLowerCase()) || res.reservationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, customers, reservations]);

  const handlePrintAction = (res: Reservation, category: string) => {
    const tpl = templates.find(t => t.category === category);
    if (tpl) {
      setSelectedRes(res);
      setSelectedTemplate(tpl);
      setActiveModal('print-preview');
    } else {
      alert(lang === 'fr' ? "Aucun modèle trouvé pour cette catégorie." : "لا يوجد نموذج لهذه الفئة.");
    }
  };

  const replaceVariables = (content: string, res: Reservation) => {
    const client = customers.find(c => c.id === res.customerId);
    const vehicle = vehicles.find(v => v.id === res.vehicleId);
    return content
      .replace('{{client_name}}', `${client?.firstName} ${client?.lastName}`)
      .replace('{{client_phone}}', client?.phone || '')
      .replace('{{res_number}}', res.reservationNumber)
      .replace('{{total_amount}}', res.totalAmount.toLocaleString())
      .replace('{{vehicle_name}}', `${vehicle?.brand} ${vehicle?.model}`)
      .replace('{{vehicle_plate}}', vehicle?.immatriculation || '')
      .replace('{{current_date}}', new Date().toLocaleDateString());
  };

  return (
    <div className={`p-4 md:p-8 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16">
        <div>
          <h1 className="text-6xl font-black text-gray-900 tracking-tighter mb-4">{t.title}</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Gestion documentaire et financière des dossiers</p>
        </div>
        <div className="relative group w-full md:w-[500px]">
          <span className="absolute inset-y-0 left-8 flex items-center text-3xl opacity-30">🔍</span>
          <input 
            type="text" 
            placeholder={t.search} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-20 pr-8 py-7 bg-white border-2 border-gray-100 focus:border-blue-600 rounded-[3rem] outline-none font-black text-xl transition-all shadow-sm hover:shadow-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-10">
        {filteredReservations.map(res => {
          const client = customers.find(c => c.id === res.customerId);
          const vehicle = vehicles.find(v => v.id === res.vehicleId);
          const debt = res.totalAmount - res.paidAmount;
          
          return (
            <div key={res.id} className="group bg-white rounded-[4rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden hover:shadow-[0_40px_100px_-20px_rgba(59,130,246,0.15)] hover:-translate-y-2 transition-all duration-700">
              <div className="p-10 space-y-10">
                {/* Header Information */}
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-6">
                      <img src={client?.profilePicture} className="w-16 h-16 rounded-full border-4 border-white shadow-xl object-cover" alt="Profile" />
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">{client?.firstName} {client?.lastName}</h3>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t.resNum}: {res.reservationNumber}</p>
                      </div>
                   </div>
                   <span className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase text-white shadow-lg ${res.status === 'en cours' ? 'bg-green-600' : 'bg-blue-600'}`}>
                      {res.status}
                   </span>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-4 bg-gray-50/50 p-6 rounded-[3rem] border border-gray-100 shadow-inner">
                   <div className="text-center">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-2">{t.total}</p>
                      <p className="text-lg font-black text-gray-900">{res.totalAmount.toLocaleString()} <span className="text-[9px] opacity-40">DZ</span></p>
                   </div>
                   <div className="text-center border-x border-gray-200">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-2">{t.paid}</p>
                      <p className="text-lg font-black text-green-600">{res.paidAmount.toLocaleString()} <span className="text-[9px] opacity-40">DZ</span></p>
                   </div>
                   <div className="text-center">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-2">{t.debt}</p>
                      <p className={`text-lg font-black ${debt > 0 ? 'text-red-600' : 'text-green-600'}`}>{debt.toLocaleString()} <span className="text-[9px] opacity-40">DZ</span></p>
                   </div>
                </div>

                {/* Vehicle Mini Info */}
                <div className="flex items-center gap-6 p-6 bg-white border border-gray-50 rounded-[2.5rem] shadow-sm">
                   <img src={vehicle?.mainImage} className="w-20 h-14 object-cover rounded-xl shadow-lg border-2 border-white" alt="Vehicle" />
                   <div>
                      <h4 className="text-base font-black text-gray-800 uppercase leading-none">{vehicle?.brand} {vehicle?.model}</h4>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{vehicle?.immatriculation}</p>
                   </div>
                </div>

                {/* Print Action Bar */}
                <div className="space-y-4 pt-6 border-t border-gray-50">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{t.actions}</p>
                   <div className="grid grid-cols-5 gap-3">
                      <button onClick={() => handlePrintAction(res, 'invoice')} className="flex flex-col items-center gap-2 group/btn">
                         <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-all">📄</div>
                         <span className="text-[8px] font-black uppercase text-gray-400">{t.invoice}</span>
                      </button>
                      <button onClick={() => handlePrintAction(res, 'devis')} className="flex flex-col items-center gap-2 group/btn">
                         <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover/btn:bg-indigo-600 group-hover/btn:text-white transition-all">📑</div>
                         <span className="text-[8px] font-black uppercase text-gray-400">{t.devis}</span>
                      </button>
                      <button onClick={() => handlePrintAction(res, 'contract')} className="flex flex-col items-center gap-2 group/btn">
                         <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover/btn:bg-yellow-600 group-hover/btn:text-white transition-all">📜</div>
                         <span className="text-[8px] font-black uppercase text-gray-400">{t.contract}</span>
                      </button>
                      <button onClick={() => handlePrintAction(res, 'checkin')} className="flex flex-col items-center gap-2 group/btn">
                         <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover/btn:bg-green-600 group-hover/btn:text-white transition-all">🏁</div>
                         <span className="text-[8px] font-black uppercase text-gray-400">{t.checkin}</span>
                      </button>
                      <button onClick={() => handlePrintAction(res, 'checkout')} className="flex flex-col items-center gap-2 group/btn">
                         <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover/btn:bg-red-600 group-hover/btn:text-white transition-all">🔒</div>
                         <span className="text-[8px] font-black uppercase text-gray-400">{t.checkout}</span>
                      </button>
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- PRINT PREVIEW MODAL --- */}
      {activeModal === 'print-preview' && selectedRes && selectedTemplate && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8 animate-fade-in">
           <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
              <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl">🖨️</div>
                    <div>
                      <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">{t.printTitle}</h2>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Dossier: {selectedRes.reservationNumber} • Modèle: {selectedTemplate.name}</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <GradientButton onClick={() => window.print()} className="!px-10 !py-4 shadow-xl">Imprimer Document</GradientButton>
                    <button onClick={() => setActiveModal(null)} className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm hover:text-red-500 transition-all">✕</button>
                 </div>
              </div>
              
              <div className="flex-1 bg-gray-100 p-16 overflow-y-auto custom-scrollbar flex justify-center">
                 <div className="bg-white shadow-2xl relative" style={{ width: `${selectedTemplate.canvasWidth}px`, height: `${selectedTemplate.canvasHeight}px` }}>
                    {selectedTemplate.elements.map((el: any) => (
                      <div key={el.id} className="absolute" style={{
                         left: `${el.x}px`, top: `${el.y}px`, width: `${el.width}px`, height: el.type === 'divider' ? `${el.height}px` : 'auto',
                         minHeight: `${el.height}px`, fontSize: `${el.fontSize}px`, color: el.color, backgroundColor: el.backgroundColor,
                         fontFamily: el.fontFamily, fontWeight: el.fontWeight as any, textAlign: el.textAlign, borderRadius: `${el.borderRadius}px`,
                         padding: `${el.padding}px`, borderWidth: `${el.borderWidth}px`, borderColor: el.borderColor, opacity: el.opacity,
                         zIndex: el.zIndex, whiteSpace: 'pre-wrap', lineHeight: el.lineHeight
                      }}>
                         {/* Variable Replacement Logic */}
                         {el.type === 'logo' && <div className="w-full h-full flex items-center justify-center font-black opacity-30 uppercase tracking-tighter">{el.content}</div>}
                         {el.type === 'qr_code' && <div className="w-full h-full flex flex-col items-center justify-center border border-gray-100 bg-white"><div className="w-10 h-10 border-2 border-gray-900 grid grid-cols-2 gap-0.5 p-0.5"><div className="bg-gray-900"></div><div className="bg-gray-900"></div><div className="bg-gray-900"></div><div></div></div><span className="text-[6px] font-black mt-1">VERIFIED-DF</span></div>}
                         {el.type === 'table' && (
                           <div className="w-full border-t-2 border-gray-900 mt-4 overflow-hidden">
                              <table className="w-full text-[9px] font-black uppercase">
                                 <thead className="bg-gray-50/50"><tr className="border-b"><th className="p-2 text-left">Désignation</th><th className="p-2 text-center">Qté</th><th className="p-2 text-right">Total HT</th></tr></thead>
                                 <tbody className="opacity-40">
                                   <tr><td className="p-2 border-b">{replaceVariables("LOCATION VÉHICULE {{vehicle_name}}", selectedRes)}</td><td className="p-2 border-b text-center">--</td><td className="p-2 border-b text-right">{replaceVariables("{{total_amount}}", selectedRes)} DZ</td></tr>
                                 </tbody>
                              </table>
                           </div>
                         )}
                         {el.type === 'fuel_mileage' && <div className="w-full h-full p-4 flex justify-between items-center text-[9px] font-black uppercase"><div className="text-center"><p className="opacity-40 text-[7px] mb-1">KM COMPTEUR</p><p>-- KM</p></div><div className="w-px h-6 bg-gray-200"></div><div className="text-center"><p className="opacity-40 text-[7px] mb-1">FUEL</p><p>⛽ PLEIN</p></div></div>}
                         {el.type === 'signature_area' && <div className="w-full h-full flex flex-col justify-between"><span className="text-[8px] font-black uppercase text-gray-300 border-b border-gray-100 pb-1">{el.content}</span><div className="flex-1 py-8 flex items-center justify-center opacity-10"><span className="text-4xl italic">Signature</span></div></div>}
                         {el.type !== 'logo' && el.type !== 'table' && el.type !== 'fuel_mileage' && el.type !== 'signature_area' && el.type !== 'qr_code' && replaceVariables(el.content, selectedRes)}
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
