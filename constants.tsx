
import { MenuItem, TranslationSet, Vehicle, Customer, Agency, Worker, Expense, Maintenance, Reservation, RentalOption, Inspection, Damage } from './types';

export const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', labelFr: 'Tableau de bord', labelAr: 'لوحة القيادة', icon: '📊' },
  { id: 'planner', labelFr: 'Planificateur', labelAr: 'المخطط', icon: '📅' },
  { id: 'operations', labelFr: 'Opérations', labelAr: 'العمليات', icon: '⚙️' },
  { id: 'vehicles', labelFr: 'Véhicules', labelAr: 'المركبات', icon: '🚗' },
  { id: 'customers', labelFr: 'Clients', labelAr: 'الزبائن', icon: '👥' },
  { id: 'agencies', labelFr: 'Agences', labelAr: 'الوكالات', icon: '🏢' },
  { id: 'team', labelFr: 'Équipe', labelAr: 'الفريق', icon: '🤝' },
  { id: 'billing', labelFr: 'Facturation', labelAr: 'الفواتير', icon: '💰' },
  { id: 'personalization', labelFr: 'Personalisation', labelAr: 'التخصيص', icon: '🎨' },
  { id: 'expenses', labelFr: 'Dépenses', labelAr: 'المصاريف', icon: '📉' },
  { id: 'reports', labelFr: 'Rapports', labelAr: 'التقارير', icon: '📄' },
  { id: 'ai_analysis', labelFr: 'Analyses IA', labelAr: 'تحليلات الذكاء الاصطناعي', icon: '🧠' },
  { id: 'config', labelFr: 'Configuration', labelAr: 'الإعدادات', icon: '🛠️' },
];

export const ALGERIAN_WILAYAS = [
  "01 - Adrar", "02 - Chlef", "03 - Laghouat", "04 - Oum El Bouaghi", "05 - Batna", 
  "16 - Alger", "19 - Sétif", "31 - Oran", "25 - Constantine", "09 - Blida", "35 - Boumerdes"
];

export const DEFAULT_TEMPLATES: any[] = [
  {
    id: 'tpl-inv-1',
    name: 'Facture Officielle 2024',
    category: 'invoice',
    canvasWidth: 595,
    canvasHeight: 842,
    elements: [
      { id: 'e1', type: 'logo', label: 'Logo', content: 'DRIVEFLOW', x: 40, y: 40, width: 140, height: 60, fontSize: 16, fontWeight: '900', color: '#2563eb', textAlign: 'center', backgroundColor: '#f1f5f9', borderRadius: 15 },
      { id: 'e3', type: 'static', label: 'Label', content: 'FACTURE', x: 350, y: 40, width: 200, fontSize: 28, fontWeight: '900', textAlign: 'right', color: '#1e293b' },
      { id: 'e4', type: 'variable', label: 'Détails', content: 'Facture N°: {{res_number}}\nDate: {{current_date}}', x: 350, y: 80, width: 200, textAlign: 'right', fontSize: 10, fontWeight: '700' },
      { id: 'e5', type: 'variable', label: 'Client', content: 'FACTURÉ À:\n{{client_name}}\n{{client_address}}\nTél: {{client_phone}}', x: 40, y: 200, width: 280, padding: 15, backgroundColor: '#f8fafc', borderRadius: 12, fontSize: 9, fontWeight: '700' },
      { id: 'e6', type: 'table', label: 'Lignes de facture', content: '', x: 40, y: 320, width: 515, height: 300 },
      { id: 'e7', type: 'variable', label: 'Totaux', content: 'TOTAL TTC: {{total_amount}} DZ', x: 350, y: 650, width: 200, textAlign: 'right', fontWeight: '900', fontSize: 14 }
    ]
  }
];

export const TRANSLATIONS: Record<'fr' | 'ar', TranslationSet> = {
  fr: {
    loginTitle: 'Accès DriveFlow', usernameLabel: 'Identifiant', passwordLabel: 'Mot de passe', loginButton: 'Ouvrir la session', autoFillLabel: 'Test Mode', logout: 'Quitter', welcome: 'Bonjour', searchPlaceholder: 'Filtrer les données...', emptyState: 'Aucun enregistrement local.', aiAnalyze: 'Lancer l\'expertise IA'
  },
  ar: {
    loginTitle: 'دخول درايف فلو', usernameLabel: 'اسم المستخدم', passwordLabel: 'كلمة المرور', loginButton: 'فتح الجلسة', autoFillLabel: 'وضع التجربة', logout: 'خروج', welcome: 'مرحباً', searchPlaceholder: 'تصفية البيانات...', emptyState: 'لا توجد سجلات محلية.', aiAnalyze: 'بدء تحليل الذكاء الاصطناعي'
  }
};

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1', firstName: 'Karim', lastName: 'Benali', phone: '0550 12 34 56', email: 'k.benali@gmail.com',
    idCardNumber: '1099223344', wilaya: '16 - Alger', address: 'Hydra, Cité des Pins', licenseNumber: 'DZ-99210',
    licenseExpiry: '2030-05-20', totalReservations: 14, totalSpent: 285000, documentImages: [],
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200'
  }
];

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'v1', brand: 'Volkswagen', model: 'Golf 8 R-Line', year: 2024, immatriculation: '01234-124-16', color: 'Lapiz Blue',
    chassisNumber: 'WVWZZZCDZ001', fuelType: 'essence', transmission: 'automatique', seats: 5, doors: 5,
    dailyRate: 15000, weeklyRate: 95000, monthlyRate: 360000, deposit: 100000, status: 'disponible',
    currentLocation: 'Alger', mileage: 1200, insuranceExpiry: '2025-12-01', techControlDate: '2026-01-01',
    insuranceInfo: 'Alliance', mainImage: 'https://images.unsplash.com/photo-1621348336214-6101416e788c?q=80&w=1000',
    secondaryImages: []
  }
];

export const MOCK_RESERVATIONS: Reservation[] = [];
export const MOCK_AGENCIES: Agency[] = [];
export const MOCK_WORKERS: Worker[] = [
  {
    id: 'w1', fullName: 'Mohamed Driver', birthday: '1985-10-10', phone: '0555 11 22 33', address: 'Alger',
    idCardNumber: '11223344', role: 'driver', paymentType: 'day', amount: 3000, username: 'mohamed', 
    absences: 0, totalPaid: 0, history: []
  },
  {
    id: 'w2', fullName: 'Ahmed Transport', birthday: '1990-05-15', phone: '0666 44 55 66', address: 'Blida',
    idCardNumber: '44556677', role: 'driver', paymentType: 'month', amount: 60000, username: 'ahmed',
    absences: 0, totalPaid: 0, history: []
  }
];
export const MOCK_EXPENSES: Expense[] = [];
export const MOCK_MAINTENANCE: Maintenance[] = [];
