
import React, { useState } from 'react';
import { Language, Reservation, Vehicle, Customer, Worker, Expense, Maintenance, Inspection, Damage, Agency } from '../types';
import GradientButton from '../components/GradientButton';

interface ReportsPageProps {
  lang: Language;
  vehicles: Vehicle[];
  customers: Customer[];
  reservations: Reservation[];
  workers: Worker[];
  expenses: Expense[];
  maintenances: Maintenance[];
  inspections: Inspection[];
  damages: Damage[];
  agencies: Agency[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({ 
  lang, vehicles, customers, reservations, workers, expenses, maintenances, inspections, damages, agencies 
}) => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const isRtl = lang === 'ar';
  const t = {
    fr: {
      title: 'Rapports & Statistiques',
      period: 'Période d\'analyse',
      start: 'Date de début',
      end: 'Date de fin',
      generate: 'Générer l\'Audit Complet',
      summary: 'Résumé Exécutif',
      gains: 'Gains Totaux',
      expenses: 'Dépenses Totales',
      profit: 'Bénéfice Net',
      resCount: 'Réservations',
      planner: 'Activité Planificateur',
      ops: 'Opérations & Maintenance',
      fleet: 'État de la Flotte',
      crm: 'Activité Clients',
      hr: 'Ressources Humaines',
      billing: 'Facturation & Revenus',
      details: 'Détails Littéraux',
      currency: 'DZ'
    },
    ar: {
      title: 'التقارير والإحصائيات',
      period: 'فترة التحليل',
      start: 'تاريخ البدء',
      end: 'تاريخ الانتهاء',
      generate: 'توليد التدقيق الكامل',
      summary: 'ملخص تنفيذي',
      gains: 'إجمالي الأرباح',
      expenses: 'إجمالي المصاريف',
      profit: 'صافي الربح',
      resCount: 'الحجوزات',
      planner: 'نشاط المخطط',
      ops: 'العمليات والصيانة',
      fleet: 'حالة الأسطول',
      crm: 'نشاط الزبائن',
      hr: 'الموارد البشرية',
      billing: 'الفواتير والمداخيل',
      details: 'التفاصيل الحرفية',
      currency: 'دج'
    }
  }[lang];

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate complex data crunching
    setTimeout(() => {
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);

      const filteredRes = reservations.filter(r => {
        const d = new Date(r.startDate);
        return d >= sDate && d <= eDate;
      });

      const filteredExp = expenses.filter(e => {
        const d = new Date(e.date);
        return d >= sDate && d <= eDate;
      });

      const filteredMaint = maintenances.filter(m => {
        const d = new Date(m.date);
        return d >= sDate && d <= eDate;
      });

      const filteredInsp = inspections.filter(i => {
        const d = new Date(i.date);
        return d >= sDate && d <= eDate;
      });

      const totalGains = filteredRes.reduce((acc, r) => acc + r.paidAmount, 0);
      const totalExpenses = filteredExp.reduce((acc, e) => acc + e.cost, 0) + 
                            filteredMaint.reduce((acc, m) => acc + m.cost, 0);

      setReportData({
        reservations: filteredRes,
        expenses: filteredExp,
        maintenances: filteredMaint,
        inspections: filteredInsp,
        gains: totalGains,
        costs: totalExpenses,
        profit: totalGains - totalExpenses
      });
      setIsGenerating(false);
    }, 1000);
  };

  const SectionTitle = ({ children, icon }: React.PropsWithChildren<{ icon: string }>) => (
    <div className="flex items-center gap-4 border-b border-gray-100 pb-6 mb-8">
      <span className="text-3xl">{icon}</span>
      <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{children}</h3>
    </div>
  );

  return (
    <div className={`p-4 md:p-8 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-16">
        <div>
          <h1 className="text-6xl font-black text-gray-900 tracking-tighter mb-4">{t.title}</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em]">Audit analytique de performance</p>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 flex flex-wrap items-end gap-8">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">{t.start}</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="block w-48 px-6 py-3 bg-gray-50 border-none rounded-2xl font-bold outline-none focus:ring-4 ring-blue-50 transition-all" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">{t.end}</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="block w-48 px-6 py-3 bg-gray-50 border-none rounded-2xl font-bold outline-none focus:ring-4 ring-blue-50 transition-all" />
           </div>
           <GradientButton onClick={handleGenerate} disabled={isGenerating} className="!px-10 !py-4 rounded-2xl shadow-xl min-w-[200px]">
              {isGenerating ? (
                <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>...</div>
              ) : (
                '🚀 ' + t.generate
              )}
           </GradientButton>
        </div>
      </div>

      {reportData ? (
        <div className="space-y-16 animate-fade-in">
          
          {/* Executive Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
             <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 hover:shadow-2xl transition-all group">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">{t.gains}</p>
                <p className="text-4xl font-black text-blue-600 group-hover:scale-110 transition-transform origin-left">{reportData.gains.toLocaleString()} <span className="text-sm font-bold opacity-40">{t.currency}</span></p>
             </div>
             <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 hover:shadow-2xl transition-all group">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">{t.expenses}</p>
                <p className="text-4xl font-black text-red-500 group-hover:scale-110 transition-transform origin-left">{reportData.costs.toLocaleString()} <span className="text-sm font-bold opacity-40">{t.currency}</span></p>
             </div>
             <div className="bg-gray-900 p-10 rounded-[3.5rem] shadow-2xl text-white hover:scale-[1.02] transition-all">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">{t.profit}</p>
                <p className="text-5xl font-black text-white">{reportData.profit.toLocaleString()} <span className="text-sm font-bold opacity-40">{t.currency}</span></p>
             </div>
             <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 hover:shadow-2xl transition-all group">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">{t.resCount}</p>
                <p className="text-4xl font-black text-gray-900 group-hover:scale-110 transition-transform origin-left">{reportData.reservations.length} <span className="text-sm font-bold opacity-40">DOSSIERS</span></p>
             </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
             
             {/* PLANNER SECTION */}
             <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100">
                <SectionTitle icon="📅">{t.planner}</SectionTitle>
                <div className="space-y-6">
                   {reportData.reservations.map((res: Reservation) => {
                     const client = customers.find(c => c.id === res.customerId);
                     const veh = vehicles.find(v => v.id === res.vehicleId);
                     return (
                       <div key={res.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 hover:bg-white hover:shadow-xl transition-all">
                          <div className="flex items-center gap-6">
                             <img src={client?.profilePicture} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="Profile" />
                             <div>
                               <p className="font-black text-gray-900">{client?.firstName} {client?.lastName}</p>
                               <p className="text-[10px] font-bold text-gray-400 uppercase">{veh?.brand} {veh?.model} • #{res.reservationNumber}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="font-black text-blue-600">{res.totalAmount.toLocaleString()} DZ</p>
                             <span className="text-[9px] font-black uppercase text-gray-400">{new Date(res.startDate).toLocaleDateString()}</span>
                          </div>
                       </div>
                     );
                   })}
                </div>
             </div>

             {/* OPERATIONS SECTION */}
             <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100">
                <SectionTitle icon="⚙️">{t.ops}</SectionTitle>
                <div className="space-y-6">
                   {reportData.inspections.map((insp: Inspection) => (
                     <div key={insp.id} className="p-6 bg-gray-50 rounded-[2.5rem] border-l-8 border-indigo-600">
                        <div className="flex justify-between items-start mb-2">
                           <span className="px-4 py-1 bg-white rounded-full text-[9px] font-black uppercase shadow-sm">PV {insp.type.toUpperCase()}</span>
                           <span className="text-[10px] font-bold text-gray-400">{insp.date}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-700">Kilométrage relevé : <span className="font-black text-gray-900">{insp.mileage.toLocaleString()} KM</span></p>
                        <p className="text-[10px] font-bold text-blue-600 mt-2">⛽ Carburant : {insp.fuel}</p>
                     </div>
                   ))}
                   {damages.slice(0, 2).map((dmg: Damage) => (
                     <div key={dmg.id} className="p-6 bg-red-50 rounded-[2.5rem] border-l-8 border-red-600">
                        <p className="font-black text-red-600 uppercase text-xs mb-1">Dégât Signalé: {dmg.name}</p>
                        <p className="text-[10px] font-bold text-gray-500">{dmg.description}</p>
                        <p className="text-xs font-black text-gray-900 mt-2">Coût estimé : {dmg.costs.toLocaleString()} DZ</p>
                     </div>
                   ))}
                </div>
             </div>

             {/* HR SECTION */}
             <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100">
                <SectionTitle icon="🤝">{t.hr}</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   {workers.map((worker: Worker) => (
                     <div key={worker.id} className="p-8 bg-gray-50 rounded-[3rem] border border-gray-100 flex items-center gap-6">
                        <img src={worker.photo} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-4 border-white" alt="Profile" />
                        <div>
                           <h4 className="font-black text-gray-900 leading-none mb-1">{worker.fullName}</h4>
                           <p className="text-[10px] font-bold text-blue-600 uppercase mb-3 tracking-widest">{worker.role}</p>
                           <div className="space-y-1">
                              <p className="text-[9px] font-bold text-gray-400 uppercase">Salaire: {worker.amount.toLocaleString()} DZ</p>
                              <p className="text-[9px] font-bold text-red-500 uppercase">Absences: {worker.absences} Jours</p>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* EXPENSES SECTION */}
             <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100">
                <SectionTitle icon="📉">Flux de Dépenses</SectionTitle>
                <div className="space-y-4">
                   {[...reportData.expenses, ...reportData.maintenances].map((item: any) => (
                     <div key={item.id} className="flex items-center justify-between p-5 bg-red-50/50 rounded-2xl border border-red-100/50">
                        <div className="flex items-center gap-4">
                           <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm">💸</span>
                           <div>
                              <p className="font-black text-gray-800 text-sm uppercase">{item.name}</p>
                              <p className="text-[9px] font-bold text-gray-400">{item.date}</p>
                           </div>
                        </div>
                        <p className="font-black text-red-600 text-lg">-{item.cost.toLocaleString()} DZ</p>
                     </div>
                   ))}
                </div>
             </div>

             {/* CRM & AGENCIES SECTION */}
             <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100">
                <SectionTitle icon="🏢">Agences & Portefeuille</SectionTitle>
                <div className="space-y-10">
                   <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b pb-2">Réseau d'Agences</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         {agencies.map(a => (
                           <div key={a.id} className="p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                              <p className="font-black text-gray-900 leading-none mb-1">{a.name}</p>
                              <p className="text-[9px] font-bold text-gray-400">{a.address}</p>
                           </div>
                         ))}
                      </div>
                   </div>
                   <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b pb-2">Top Clients (Période)</h4>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                         {customers.map(c => (
                           <div key={c.id} className="shrink-0 w-40 p-6 bg-blue-50/50 rounded-[2.5rem] text-center border border-blue-100">
                              <img src={c.profilePicture} className="w-14 h-14 rounded-full mx-auto border-2 border-white mb-4" alt="Profile" />
                              <p className="text-xs font-black text-gray-900 truncate">{c.firstName}</p>
                              <p className="text-[9px] font-bold text-blue-600 mt-1">{c.totalSpent.toLocaleString()} DZ</p>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>

             {/* BILLING SUMMARY SECTION */}
             <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100">
                <SectionTitle icon="💰">Analyse Facturation</SectionTitle>
                <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 space-y-8">
                   <div className="flex justify-between items-end border-b border-white pb-6">
                      <div><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Chiffre d'affaires</p><p className="text-3xl font-black text-gray-900">{reportData.gains.toLocaleString()} DZ</p></div>
                      <div className="text-right"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">TVA (19%) Estimée</p><p className="text-xl font-black text-gray-600">{(reportData.gains * 0.19).toLocaleString()} DZ</p></div>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-white rounded-[2rem] shadow-sm"><p className="text-[9px] font-black text-gray-400 uppercase mb-2">Encaissements</p><p className="text-xl font-black text-green-600">{reportData.gains.toLocaleString()} DZ</p></div>
                      <div className="p-6 bg-white rounded-[2rem] shadow-sm"><p className="text-[9px] font-black text-gray-400 uppercase mb-2">Dettes générées</p><p className="text-xl font-black text-red-500">0 DZ</p></div>
                   </div>
                </div>
             </div>

          </div>

          {/* PRINTABLE FOOTER */}
          <div className="flex justify-center pt-10 no-print">
             <GradientButton onClick={() => window.print()} className="!px-20 !py-6 text-3xl rounded-[3rem] shadow-2xl">🖨️ Imprimer cet Audit (.PDF)</GradientButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 text-center opacity-30">
           <div className="w-40 h-40 bg-gray-100 rounded-full flex items-center justify-center text-7xl mb-10 shadow-inner">📊</div>
           <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Prêt à analyser</h2>
           <p className="text-xl font-bold text-gray-500 mt-4">Sélectionnez vos dates et lancez la génération de l'audit complet.</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
