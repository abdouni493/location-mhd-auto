
import React, { useEffect, useState, useMemo } from 'react';
import { Language, Vehicle, Customer, Reservation, User } from '../types';
import { apiPost } from '../lib/api';

interface DashboardPageProps {
  lang: Language;
  onNavigate: (id: string) => void;
  user: User;
  reservations?: Reservation[];
  vehicles?: Vehicle[];
  customers?: Customer[];
  maintenances?: any[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ lang, onNavigate, user, reservations: initialReservations = [], vehicles: initialVehicles = [], customers: initialCustomers = [], maintenances: initialMaintenances = [] }) => {
  const isRtl = lang === 'ar';
  
  // 🚀 Fast state management with useEffect
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [maintenances, setMaintenances] = useState<any[]>(initialMaintenances);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ⚡ Fetch all data in parallel on mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel using Promise.all
        const [resRes, vehiclesRes, customersRes, maintenanceRes] = await Promise.all([
          apiPost('/api/from/reservations/select', { columns: '*' }),
          apiPost('/api/from/vehicles/select', { columns: '*' }),
          apiPost('/api/from/customers/select', { columns: '*' }),
          apiPost('/api/from/maintenance/select', { columns: '*' })
        ]);

        // Process reservations
        if (resRes?.data) {
          const formatted = resRes.data.map((r: any) => ({
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

        // Process vehicles
        if (vehiclesRes?.data) {
          const formatted = vehiclesRes.data.map((v: any) => ({
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
        }

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

        // Process maintenances
        if (maintenanceRes?.data) {
          const formatted = maintenanceRes.data.map((m: any) => ({
            id: m.id,
            vehicleId: m.vehicle_id,
            vehicle_id: m.vehicle_id,
            type: m.type,
            name: m.name,
            cost: m.cost,
            date: m.date ? (typeof m.date === 'string' ? m.date.split('T')[0] : m.date) : '',
            expiry_date: m.expiry_date ? (typeof m.expiry_date === 'string' ? m.expiry_date.split('T')[0] : m.expiry_date) : '',
            expiryDate: m.expiry_date ? (typeof m.expiry_date === 'string' ? m.expiry_date.split('T')[0] : m.expiry_date) : '',
            note: m.note,
            next_vidange_km: m.next_vidange_km
          }));
          setMaintenances(formatted);
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []); // ✅ Fetch once on mount only

  const stats = useMemo(() => {
    const totalGains = reservations.reduce((acc, r) => acc + (r.paidAmount || 0), 0);
    const rentedCount = vehicles.filter(v => v.status === 'loué').length;
    const totalVehicles = vehicles.length;
    
    // Calculate total locations (all reservations)
    const totalLocations = reservations.length || 0;
    
    // Calculate total investment (sum of purchase prices)
    const totalInvestissement = vehicles.reduce((acc, v) => {
      const price = Number(v.purchasePrice || v.purchase_price || 0);
      return acc + (isNaN(price) ? 0 : price);
    }, 0);
    
    return {
      totalGains,
      rentedCount,
      totalVehicles,
      customerCount: customers.length,
      totalLocations,
      totalInvestissement,
      utilization: totalVehicles > 0 ? Math.round((rentedCount / totalVehicles) * 100) : 0,
    };
  }, [reservations, vehicles, customers]);

  // Get maintenance alerts
  const alerts = useMemo(() => {
    const alerts: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    maintenances.forEach((m: any) => {
      const vehicle = vehicles.find(v => v.id === m.vehicle_id || v.id === m.vehicleId);
      if (!vehicle) return;

      // Vidange alerts - if mileage exceeded
      if (m.type === 'vidange' && m.next_vidange_km) {
        if (vehicle.mileage && vehicle.mileage >= m.next_vidange_km) {
          alerts.push({
            type: 'vidange',
            severity: 'critical',
            vehicleName: `${vehicle.brand} ${vehicle.model}`,
            message: `Vidange dépassée: ${vehicle.mileage} KM (prévu: ${m.next_vidange_km} KM)`,
            icon: '🛢️'
          });
        } else if (vehicle.mileage && vehicle.mileage >= (m.next_vidange_km - 500)) {
          alerts.push({
            type: 'vidange',
            severity: 'warning',
            vehicleName: `${vehicle.brand} ${vehicle.model}`,
            message: `Vidange bientôt: ${vehicle.mileage} KM (prévu: ${m.next_vidange_km} KM)`,
            icon: '🛢️'
          });
        }
      }

      // Assurance expiry alerts
      if (m.type === 'assurance' && m.expiry_date) {
        const expiryDate = new Date(m.expiry_date);
        expiryDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) {
          alerts.push({
            type: 'assurance',
            severity: 'critical',
            vehicleName: `${vehicle.brand} ${vehicle.model}`,
            message: `Assurance expirée depuis ${Math.abs(daysLeft)} jours (${m.expiry_date})`,
            icon: '🛡️'
          });
        } else if (daysLeft <= 30) {
          alerts.push({
            type: 'assurance',
            severity: 'warning',
            vehicleName: `${vehicle.brand} ${vehicle.model}`,
            message: `Assurance expire dans ${daysLeft} jours (${m.expiry_date})`,
            icon: '🛡️'
          });
        }
      }

      // Contrôle technique expiry alerts
      if (m.type === 'ct' && m.expiry_date) {
        const expiryDate = new Date(m.expiry_date);
        expiryDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) {
          alerts.push({
            type: 'ct',
            severity: 'critical',
            vehicleName: `${vehicle.brand} ${vehicle.model}`,
            message: `Contrôle technique expiré depuis ${Math.abs(daysLeft)} jours (${m.expiry_date})`,
            icon: '🛠️'
          });
        } else if (daysLeft <= 30) {
          alerts.push({
            type: 'ct',
            severity: 'warning',
            vehicleName: `${vehicle.brand} ${vehicle.model}`,
            message: `Contrôle technique expire dans ${daysLeft} jours (${m.expiry_date})`,
            icon: '🛠️'
          });
        }
      }
    });

    return alerts;
  }, [maintenances, vehicles]);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  const t = {
    fr: {
      adminTitle: 'Tableau de bord local',
      revenue: 'Recettes totales',
      fleet: 'État de la Flotte',
      actions: { billing: 'Finances', reports: 'Audits', config: 'Système' },
      alerts: 'Alertes Maintenance',
      criticalAlerts: 'Alertes Critiques',
      warnings: 'Avertissements'
    },
    ar: {
      adminTitle: 'لوحة التحكم المحلية',
      revenue: 'إجمالي المداخيل',
      fleet: 'حالة الأسطول',
      actions: { billing: 'المالية', reports: 'التقارير', config: 'النظام' },
      alerts: 'تنبيهات الصيانة',
      criticalAlerts: 'تنبيهات حرجة',
      warnings: 'تحذيرات'
    }
  }[lang];

  // 📊 Show loading state
  if (loading) {
    return (
      <div className={`p-4 md:p-12 flex items-center justify-center min-h-screen ${isRtl ? 'font-arabic text-right' : ''}`}>
        <div className="text-center">
          <div className="mb-6 inline-block">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-xl font-black text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  // ⚠️ Show error state
  if (error) {
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

  return (
    <div className={`p-4 md:p-12 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
      <div className="mb-16">
        <h1 className="text-6xl font-black text-gray-900 tracking-tighter mb-4">{t.adminTitle}</h1>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em]">✅ Données en Temps Réel - Base de Données</p>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="mb-16">
          <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">🚨 {t.alerts} <span className="text-sm bg-red-100 text-red-700 px-4 py-2 rounded-full font-black">{alerts.length}</span></h2>
          
          {/* Critical Alerts */}
          {criticalAlerts.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-black text-red-900 mb-4">⛔ {t.criticalAlerts}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {criticalAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-red-50 to-red-100 rounded-[2rem] p-6 border-3 border-red-400 shadow-lg animate-pulse"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{alert.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-red-700 uppercase tracking-widest mb-2">🚗 {alert.vehicleName}</p>
                        <p className="text-lg font-black text-red-900">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning Alerts */}
          {warningAlerts.length > 0 && (
            <div>
              <h3 className="text-xl font-black text-orange-900 mb-4">⚠️ {t.warnings}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {warningAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-orange-50 to-yellow-100 rounded-[2rem] p-6 border-3 border-orange-400 shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{alert.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-orange-700 uppercase tracking-widest mb-2">🚗 {alert.vehicleName}</p>
                        <p className="text-lg font-black text-orange-900">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t.revenue}</p>
          <p className="text-4xl font-black text-blue-600 tracking-tighter">{stats.totalGains.toLocaleString()} <span className="text-sm font-bold opacity-30">DZ</span></p>
        </div>

        <div className="bg-gray-900 p-10 rounded-[3.5rem] shadow-2xl text-white">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Utilisation Flotte</p>
          <p className="text-5xl font-black text-white leading-none mb-2">{stats.utilization}%</p>
          <p className="text-xs font-bold opacity-60 uppercase">{stats.rentedCount} / {stats.totalVehicles} Voitures</p>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Clients</p>
          <p className="text-5xl font-black text-gray-900 tracking-tighter">{stats.customerCount || 0}</p>
        </div>

        <div className="bg-blue-600 p-10 rounded-[3.5rem] text-white">
          <p className="text-[10px] font-black uppercase tracking-widest mb-4">Missions actives</p>
          <p className="text-5xl font-black">{reservations.filter(r => r.status === 'en cours').length || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-10 rounded-[3.5rem] text-white">
          <p className="text-[10px] font-black uppercase tracking-widest mb-4">💼 Missions Total</p>
          <p className="text-5xl font-black">{stats.totalLocations || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-10 rounded-[3.5rem] text-white col-span-1 md:col-span-1 lg:col-span-1">
          <p className="text-[10px] font-black uppercase tracking-widest mb-4">📊 Investissement</p>
          <p className="text-4xl font-black leading-tight">{(stats.totalInvestissement / 1000000).toLocaleString('fr-FR', {maximumFractionDigits: 1})} <span className="text-xs">M DZ</span></p>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <button onClick={() => onNavigate('billing')} className="p-12 bg-white rounded-[4rem] border border-gray-100 hover:border-blue-600 transition-all text-center group">
          <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform">💰</span>
          <h4 className="text-xl font-black uppercase">{t.actions.billing}</h4>
        </button>
        <button onClick={() => onNavigate('reports')} className="p-12 bg-white rounded-[4rem] border border-gray-100 hover:border-indigo-600 transition-all text-center group">
          <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform">📊</span>
          <h4 className="text-xl font-black uppercase">{t.actions.reports}</h4>
        </button>
        <button onClick={() => onNavigate('config')} className="p-12 bg-white rounded-[4rem] border border-gray-100 hover:border-orange-600 transition-all text-center group">
          <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform">⚙️</span>
          <h4 className="text-xl font-black uppercase">{t.actions.config}</h4>
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
