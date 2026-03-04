
import React, { useState, useEffect } from 'react';
import { User, Language, Vehicle, Agency, Customer, Worker, Reservation } from './types';
import { MOCK_WORKERS, DEFAULT_TEMPLATES } from './constants';
import { supabase } from './lib/supabase';
import { apiFetch } from './lib/api';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import EmptyPage from './pages/EmptyPage';
import VehiclesPage from './pages/VehiclesPage';
import AgenciesPage from './pages/AgenciesPage';
import PlannerPage from './pages/PlannerPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import BillingPage from './pages/BillingPage';
import ReportsPage from './pages/ReportsPage';
import ConfigPage from './pages/ConfigPage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import WorkerPaymentsPage from './pages/WorkerPaymentsPage';
import OperationsPage from './pages/OperationsPage';
import PersonalizationPage from './pages/PersonalizationPage';
import WorkersPage from './pages/WorkersPage';
import ExpensesPage from './pages/ExpensesPage';

const App: React.FC = () => {
  // Load user from localStorage if available
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('app.user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [lang, setLang] = useState<Language>('fr');
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [templates, setTemplates] = useState<any[]>(DEFAULT_TEMPLATES);
  const [workers] = useState<Worker[]>(MOCK_WORKERS);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState({ 
    storeName: 'DriveFlow', 
    logo_url: null as string | null,
    address: '',
    phone: '',
    email: ''
  });

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('app.user', JSON.stringify(user));
    } else {
      localStorage.removeItem('app.user');
    }
  }, [user]);

  const fetchSystemConfig = async () => {
    try {
      const { data } = await supabase.from('system_config').select('*').limit(1);
      if (data && Array.isArray(data) && data.length > 0) {
        const cfg = data[0];
        const config = {
          storeName: cfg.store_name || 'DriveFlow',
          logo_url: cfg.logo_url || null,
          address: cfg.address || '',
          phone: cfg.phone || '',
          email: cfg.email || ''
        };
        setSystemConfig(config);
        // Save to localStorage so Sidebar can read it
        localStorage.setItem('app.system_config', JSON.stringify(config));
        // Dispatch custom event for components listening to config changes
        window.dispatchEvent(new CustomEvent('app:config:update', { detail: config }));
      }
    } catch (err) {
      console.warn('Failed to load system config:', err);
    }
  };

  const refreshData = async () => {
    try {
      await Promise.allSettled([fetchVehicles(), fetchAgencies(), fetchCustomers(), fetchReservations(), fetchExpenses(), fetchMaintenances(), fetchSystemConfig()]);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAndSetUser = (userId: string, email: string) => {
    const isAdminEmail = email.toLowerCase() === 'admin@admin.com';
    setUser({ username: email.split('@')[0], role: isAdminEmail ? 'admin' : 'worker' });
  };

  const fetchVehicles = async () => {
    const { data } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
    if (data) {
      const formatted = data.map(v => ({
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
        secondaryImages: v.secondary_images || []
      }));
      setVehicles(formatted as any);
    }
  };

  const fetchAgencies = async () => {
    const { data } = await supabase.from('agencies').select('*').order('name', { ascending: true });
    if (data) setAgencies(data);
  };

  const fetchCustomers = async () => {
    // OPTIMIZATION: Fetch only initial batch + essential fields for faster loading
    // Use paginated API endpoint for better performance
    try {
      // Try API endpoint first for pagination support
      const res = await apiFetch('/api/customers/list?page=0&limit=200');
      const json = await res.json();
      const data = json.data || [];
      
      const formatted = data.map((c: any) => ({
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
      setCustomers(formatted as any);
    } catch (err: any) {
      // Fallback to Supabase with limited fields if API fails
      console.warn('API fetch failed, using Supabase fallback', err);
      const { data } = await supabase
        .from('customers')
        .select('id,first_name,last_name,phone,email,id_card_number,document_number,wilaya,address,license_number,license_expiry,license_issue_date,license_issue_place,profile_picture,birthday,birth_place,document_type,document_delivery_date,document_delivery_address,document_expiry_date,document_images,document_left_at_store,total_reservations,total_spent')
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (data) {
        const formatted = data.map(c => ({
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
        setCustomers(formatted as any);
      }
    }
  };

  const fetchReservations = async () => {
    // Specifically mapping all columns used in PlannerPage to avoid 400 errors or missing data
    const { data } = await supabase.from('reservations').select(`
      id, reservation_number, customer_id, vehicle_id, start_date, end_date, status, 
      total_amount, paid_amount, pickup_agency_id, return_agency_id, driver_id, 
      caution_amount, discount, with_tva, options, activation_log, termination_log
    `).order('created_at', { ascending: false });
    
    if (data) {
      const formatted = data.map(r => ({
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
      setReservations(formatted as any);
    }
  };

  const fetchExpenses = async () => {
    const { data } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (data) {
      const formatted = data.map(e => ({
        id: e.id,
        name: e.name,
        cost: e.cost,
        date: e.date ? (typeof e.date === 'string' ? e.date.split('T')[0] : e.date) : ''
      }));
      setExpenses(formatted);
    }
  };

  const fetchMaintenances = async () => {
    const { data } = await supabase.from('maintenance').select('*').order('created_at', { ascending: false });
    if (data) {
      const formatted = data.map(m => ({
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
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        fetchAndSetUser(session.user.id, session.user.email || '');
        refreshData();
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        fetchAndSetUser(session.user.id, session.user.email || '');
        refreshData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    // Fetch system config on app startup
    fetchSystemConfig();

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setUser(null);
    localStorage.removeItem('app.user');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': 
        return <DashboardPage lang={lang} onNavigate={setActivePage} user={user!} reservations={reservations} vehicles={vehicles} customers={customers} maintenances={maintenances} />;
      case 'vehicles': 
        return <VehiclesPage lang={lang} initialVehicles={vehicles} agencies={agencies} onUpdate={fetchVehicles} />;
      case 'customers':
        return <CustomersPage lang={lang} customers={customers} reservations={reservations} vehicles={vehicles} onRefresh={fetchCustomers} />;
      case 'agencies': 
        return <AgenciesPage lang={lang} initialAgencies={agencies} onUpdate={fetchAgencies} />;
      case 'planner':
        return <PlannerPage 
          lang={lang} 
          customers={customers} 
          vehicles={vehicles} 
          agencies={agencies} 
          workers={workers} 
          reservations={reservations} 
          onUpdateReservation={refreshData} 
          onAddReservation={refreshData} 
          onDeleteReservation={refreshData}
          templates={templates}
          onUpdateTemplates={setTemplates}
          storeLogo={systemConfig.logo_url || undefined}
          storeInfo={{
            name: systemConfig.storeName,
            phone: systemConfig.phone,
            email: systemConfig.email,
            address: systemConfig.address
          }}
        />;
      case 'team':
        return <WorkersPage lang={lang} initialWorkers={workers} onUpdate={()=>{}} />;
      case 'billing':
        return <BillingPage lang={lang} customers={customers} vehicles={vehicles} templates={templates} reservations={reservations} />;
      case 'expenses':
        return <ExpensesPage lang={lang} initialExpenses={expenses} initialMaintenances={maintenances} initialVehicles={vehicles} onUpdate={refreshData} />;
      case 'operations':
        return <OperationsPage lang={lang} vehicles={vehicles} inspections={[]} damages={[]} templates={templates} onAddInspection={()=>{}} onUpdateInspection={()=>{}} onDeleteInspection={()=>{}} onUpdateVehicleMileage={()=>{}} onAddDamage={()=>{}} onUpdateDamage={()=>{}} onDeleteDamage={()=>{}} />;
      case 'personalization':
        return <PersonalizationPage lang={lang} initialTemplates={templates} onUpdateTemplates={setTemplates} />;
      case 'reports':
        return <ReportsPage lang={lang} vehicles={vehicles} customers={customers} reservations={reservations} workers={workers} expenses={expenses} maintenances={maintenances} inspections={[]} damages={[]} agencies={agencies} />;
      case 'ai_analysis':
        return <AIAnalysisPage lang={lang} dataContext={{ reservations, vehicles, customers }} />;
      case 'config':
        return <ConfigPage lang={lang} />;
      case 'my_payments':
        return <WorkerPaymentsPage lang={lang} user={user!} />;
      default: 
        return <EmptyPage title={activePage} lang={lang} />;
    }
  };

  if (!user) return <LoginPage onLogin={setUser} lang={lang} onLanguageToggle={setLang} />;

  return (
    <div className={`min-h-screen bg-gray-50 flex ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
      <Sidebar isOpen={sidebarOpen} activeId={activePage} onNavigate={setActivePage} lang={lang} onToggle={() => setSidebarOpen(!sidebarOpen)} user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden text-gray-900">
        <Navbar user={user} lang={lang} onLanguageChange={setLang} onLogout={handleLogout} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-gray-50/50 custom-scrollbar p-4 md:p-8">
          <div className="container mx-auto max-w-[1600px]">{renderPage()}</div>
        </main>
      </div>
    </div>
  );
};

export default App;
