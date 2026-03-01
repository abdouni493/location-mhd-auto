
import React, { useState, useMemo } from 'react';
import { Language, User, Reservation, Customer, Vehicle } from '../types';
import { MOCK_RESERVATIONS, MOCK_VEHICLES, MOCK_CUSTOMERS, MOCK_AGENCIES, MOCK_WORKERS } from '../constants';

interface DriverPlannerPageProps {
  lang: Language;
  user: User;
}

const DriverPlannerPage: React.FC<DriverPlannerPageProps> = ({ lang, user }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const isRtl = lang === 'ar';

  const currentWorker = useMemo(() => MOCK_WORKERS.find(w => w.username === user.username), [user.username]);
  const driverMissions = useMemo(() => MOCK_RESERVATIONS.filter(r => r.driverId === currentWorker?.id), [currentWorker]);

  const filteredMissions = useMemo(() => {
    if (activeTab === 'upcoming') {
      return driverMissions.filter(r => r.status === 'confermer' || r.status === 'en cours').sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }
    return driverMissions.filter(r => r.status === 'terminer' || r.status === 'annuler').sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [driverMissions, activeTab]);

  const t = {
    fr: {
      title: 'Mon Planning de Route',
      subtitle: 'Suivez vos prochaines missions et consultez votre historique de conduite.',
      upcoming: 'Prochaines Missions',
      history: 'Historique des Courses',
      noMissions: 'Aucune mission trouvée pour cette période.',
      pickup: 'Départ',
      dropoff: 'Retour',
      customer: 'Client',
      vehicle: 'Véhicule',
      details: 'Mission'
    },
    ar: {
      title: 'جدول رحلاتي',
      subtitle: 'تابع مهامك القادمة واطلع على سجل قيادتك.',
      upcoming: 'المهام القادمة',
      history: 'سجل الرحلات',
      noMissions: 'لم يتم العثور على مهام لهذه الفترة.',
      pickup: 'انطلاق',
      dropoff: 'عودة',
      customer: 'الزبون',
      vehicle: 'المركبة',
      details: 'مهمة'
    }
  }[lang];

  return (
    <div className={`p-4 md:p-12 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16">
        <div>
          <h1 className="text-6xl font-black text-gray-900 tracking-tighter mb-4">{t.title}</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">{t.subtitle}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-12">
        <button 
          onClick={() => setActiveTab('upcoming')} 
          className={`px-10 py-5 rounded-[2.5rem] font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'upcoming' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-white text-gray-400 border border-gray-100'}`}
        >
          🚀 {t.upcoming}
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          className={`px-10 py-5 rounded-[2.5rem] font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white text-gray-400 border border-gray-100'}`}
        >
          📜 {t.history}
        </button>
      </div>

      {filteredMissions.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          {filteredMissions.map((mission) => {
            // Fixed typo MOCK_VE_HICLES to MOCK_VEHICLES
            const v = MOCK_VEHICLES.find(veh => veh.id === mission.vehicleId);
            const c = MOCK_CUSTOMERS.find(cust => cust.id === mission.customerId);
            const startAgency = MOCK_AGENCIES.find(a => a.id === mission.pickupAgencyId);
            const endAgency = MOCK_AGENCIES.find(a => a.id === mission.returnAgencyId);

            return (
              <div key={mission.id} className="group bg-white rounded-[4rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden hover:shadow-[0_40px_100px_-20px_rgba(59,130,246,0.15)] transition-all duration-700 p-10 flex flex-col md:flex-row gap-10">
                {/* Visual Left Side */}
                <div className="md:w-1/3 flex flex-col gap-4">
                   <div className="relative h-48 rounded-[2.5rem] overflow-hidden shadow-xl">
                      <img src={v?.mainImage} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-xl text-[8px] font-black uppercase text-gray-900 shadow-sm">
                         {v?.immatriculation}
                      </div>
                   </div>
                   <div className="bg-gray-50 p-6 rounded-[2.5rem] text-center border border-gray-100 flex flex-col items-center">
                      <img src={c?.profilePicture} className="w-14 h-14 rounded-full border-4 border-white shadow-md mb-3" />
                      <p className="text-xs font-black text-gray-900 truncate uppercase">{c?.firstName} {c?.lastName}</p>
                      <p className="text-[10px] font-bold text-blue-600 mt-1">{c?.phone}</p>
                   </div>
                </div>

                {/* Info Right Side */}
                <div className="flex-1 flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-6">
                      <div>
                         <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{t.details} #{mission.reservationNumber}</span>
                         <h4 className="text-2xl font-black text-gray-900 mt-1 uppercase">{v?.brand} {v?.model}</h4>
                      </div>
                      <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase text-white shadow-lg ${mission.status === 'en cours' ? 'bg-green-600' : mission.status === 'terminer' ? 'bg-gray-800' : 'bg-blue-600'}`}>{mission.status}</span>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-start gap-6 relative">
                         <div className="flex flex-col items-center gap-2 pt-2">
                            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                            <div className="w-0.5 h-12 bg-gray-100"></div>
                            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                         </div>
                         <div className="flex-1 space-y-8">
                            <div>
                               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.pickup}</p>
                               <p className="text-base font-black text-gray-800 uppercase">{startAgency?.name}</p>
                               <p className="text-xs font-bold text-blue-600">{new Date(mission.startDate).toLocaleString()}</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.dropoff}</p>
                               <p className="text-base font-black text-gray-800 uppercase">{endAgency?.name}</p>
                               <p className="text-xs font-bold text-indigo-600">{new Date(mission.endDate).toLocaleString()}</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="mt-8 pt-6 border-t border-gray-50">
                      <button className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">🔍 Consulter l'adresse complète</button>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[4rem] p-40 text-center border-2 border-dashed border-gray-100 flex flex-col items-center">
           <span className="text-8xl mb-8">🛣️</span>
           <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4">Route dégagée</h3>
           <p className="text-gray-400 font-bold max-w-sm">{t.noMissions}</p>
        </div>
      )}
    </div>
  );
};

export default DriverPlannerPage;
