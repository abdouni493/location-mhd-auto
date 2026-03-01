
import React, { useMemo } from 'react';
import { Language, User, Worker } from '../types';
import { MOCK_WORKERS } from '../constants';
import GradientButton from '../components/GradientButton';

interface WorkerPaymentsPageProps {
  lang: Language;
  user: User;
}

const WorkerPaymentsPage: React.FC<WorkerPaymentsPageProps> = ({ lang, user }) => {
  const isRtl = lang === 'ar';
  
  // Find the logged-in worker in mock data
  const workerData = useMemo(() => {
    return MOCK_WORKERS.find(w => w.username === user.username) || MOCK_WORKERS[0];
  }, [user.username]);

  const stats = useMemo(() => {
    const advances = workerData.history.filter(t => t.type === 'advance').reduce((acc, t) => acc + t.amount, 0);
    const absencesCost = workerData.absences * (workerData.paymentType === 'day' ? workerData.amount : (workerData.amount / 30));
    
    return {
      advances,
      absencesCost,
      netSalary: workerData.amount - (advances + absencesCost)
    };
  }, [workerData]);

  const t = {
    fr: {
      title: 'Mon Portefeuille',
      subtitle: 'Suivi transparent de vos rémunérations et transactions.',
      baseSalary: 'Salaire de Base',
      totalPaid: 'Cumul Perçu',
      absences: 'Absences',
      history: 'Journal des Transactions',
      advances: 'Avances sur salaire',
      netPayable: 'Net à percevoir (Est.)',
      type: 'Type',
      date: 'Date',
      amount: 'Montant',
      note: 'Observations',
      currency: 'DZ',
      payment: 'Versement de salaire',
      advance: 'Avance de fonds'
    },
    ar: {
      title: 'محفظتي',
      subtitle: 'متابعة شفافة لرواتبك ومعاملاتك المالية.',
      baseSalary: 'الراتب الأساسي',
      totalPaid: 'إجمالي المقبوض',
      absences: 'الغيابات',
      history: 'سجل المعاملات',
      advances: 'تسبيقات الراتب',
      netPayable: 'صافي المستحق (تقديري)',
      type: 'النوع',
      date: 'التاريخ',
      amount: 'المبلغ',
      note: 'ملاحظات',
      currency: 'دج',
      payment: 'دفع الراتب',
      advance: 'تسبيق مالي'
    }
  }[lang];

  return (
    <div className={`p-4 md:p-12 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16">
        <div>
          <h1 className="text-6xl font-black text-gray-900 tracking-tighter mb-4">{t.title}</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em]">{t.subtitle}</p>
        </div>
        <GradientButton onClick={() => window.print()} className="!px-10 !py-4 shadow-xl">Imprimer mon relevé</GradientButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
        {/* Big Net Salary Card */}
        <div className="lg:col-span-2 bg-gray-900 rounded-[5rem] p-16 text-white shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-16 opacity-5 text-9xl font-black rotate-12">SALARY</div>
           <div className="relative z-10">
              <p className="text-xs font-black text-blue-400 uppercase tracking-[0.4em] mb-6">{t.netPayable}</p>
              <p className="text-9xl font-black tracking-tighter text-white leading-none">
                 {stats.netSalary.toLocaleString()} <span className="text-3xl font-bold uppercase">{t.currency}</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mt-16 pt-10 border-t border-white/10">
                 <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Période en cours</p>
                    <p className="text-xl font-bold">{new Date().toLocaleString(lang, { month: 'long', year: 'numeric' })}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Contrat / Base</p>
                    <p className="text-xl font-bold">{workerData.amount.toLocaleString()} {t.currency} / {workerData.paymentType === 'month' ? 'MOIS' : 'JOUR'}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Breakdown Stats */}
        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t.totalPaid}</p>
              <p className="text-5xl font-black text-blue-600">{workerData.totalPaid.toLocaleString()} <span className="text-sm">DZ</span></p>
           </div>
           <div className="bg-red-50 p-10 rounded-[3.5rem] border border-red-100 shadow-sm">
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4">{t.advances}</p>
              <p className="text-5xl font-black text-red-600">{stats.advances.toLocaleString()} <span className="text-sm">DZ</span></p>
           </div>
           <div className="bg-orange-50 p-10 rounded-[3.5rem] border border-orange-100 shadow-sm">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-4">{t.absences}</p>
              <p className="text-5xl font-black text-orange-600">{workerData.absences} <span className="text-sm">JOURS</span></p>
           </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-[4rem] shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-12 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">{t.history}</h3>
            <span className="bg-gray-100 px-6 py-2 rounded-full text-[10px] font-black uppercase text-gray-400">{workerData.history.length} Opérations</span>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-gray-50">
                  <tr>
                     <th className="px-12 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.type}</th>
                     <th className="px-12 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.date}</th>
                     <th className="px-12 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.amount}</th>
                     <th className="px-12 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.note}</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {workerData.history.slice().reverse().map(trans => (
                    <tr key={trans.id} className="hover:bg-gray-50/50 transition-colors">
                       <td className="px-12 py-8">
                          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase ${trans.type === 'payment' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                             {trans.type === 'payment' ? t.payment : t.advance}
                          </span>
                       </td>
                       <td className="px-12 py-8 font-black text-gray-900 text-sm">{new Date(trans.date).toLocaleDateString()}</td>
                       <td className="px-12 py-8 font-black text-blue-600 text-lg">{trans.amount.toLocaleString()} {t.currency}</td>
                       <td className="px-12 py-8 text-xs font-bold text-gray-400 italic max-w-xs truncate">{trans.note || '-'}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default WorkerPaymentsPage;
