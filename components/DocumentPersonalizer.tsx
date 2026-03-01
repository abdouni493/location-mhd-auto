import React, { useState, useRef, useEffect } from 'react';
import { Language, Reservation, Customer, Vehicle } from '../types';
import GradientButton from './GradientButton';

interface PersonalizableElement {
  id: string;
  type: 'text' | 'logo' | 'signature' | 'image' | 'table' | 'divider' | 'checklist';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  opacity: number;
}

interface DocumentTemplate {
  id: string;
  name: string;
  category: 'devis' | 'contrat' | 'versement' | 'facture';
  elements: PersonalizableElement[];
  canvasWidth: number;
  canvasHeight: number;
}

interface DocumentPersonalizerProps {
  lang: Language;
  reservation: Reservation;
  customer: Customer;
  vehicle: Vehicle;
  docType: string;
  initialTemplate?: DocumentTemplate;
  onSaveTemplate?: (template: DocumentTemplate) => void;
  onClose?: () => void;
  storeLogo?: string;
  storeInfo?: { name: string; phone: string; email: string; address: string };
}

const DocumentPersonalizer: React.FC<DocumentPersonalizerProps> = ({
  lang,
  reservation,
  customer,
  vehicle,
  docType,
  initialTemplate,
  onSaveTemplate,
  onClose,
  storeLogo,
  storeInfo,
}) => {
  const isRtl = lang === 'ar';
  const [template, setTemplate] = useState<DocumentTemplate>(
    initialTemplate || {
      id: `tpl-${Date.now()}`,
      name: `Modèle ${docType}`,
      category: docType as any,
      elements: getDefaultElements(docType, lang),
      canvasWidth: 800,
      canvasHeight: 1100,
    }
  );

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const t = {
    fr: {
      title: 'Personnaliser le Document',
      preview: 'Aperçu',
      dragText: 'Cliquez et glissez pour déplacer',
      doubleClickEdit: 'Double-cliquez pour éditer',
      color: 'Couleur',
      font: 'Police',
      size: 'Taille',
      bold: 'Gras',
      save: 'Enregistrer le modèle',
      print: 'Imprimer',
      cancel: 'Annuler',
    },
    ar: {
      title: 'تخصيص الوثيقة',
      preview: 'معاينة',
      dragText: 'انقر واسحب لنقل العنصر',
      doubleClickEdit: 'انقر مرتين للتحرير',
      color: 'اللون',
      font: 'الخط',
      size: 'الحجم',
      bold: 'غامق',
      save: 'حفظ النموذج',
      print: 'طباعة',
      cancel: 'إلغاء',
    },
  }[lang];

  const selectedElement = template.elements.find((el) => el.id === selectedElementId);

  const replaceVariables = (text: string): string => {
    const days = Math.ceil((new Date(reservation.endDate).getTime() - new Date(reservation.startDate).getTime()) / (1000 * 60 * 60 * 24));
    return text
      .replace('{{client_name}}', `${customer.firstName} ${customer.lastName}`)
      .replace('{{client_phone}}', customer.phone || '')
      .replace('{{client_email}}', customer.email || '')
      .replace('{{client_dob}}', customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR') : '')
      .replace('{{client_pob}}', customer.placeOfBirth || '')
      .replace('{{client_license}}', customer.licenseNumber || '')
      .replace('{{license_issued}}', customer.licenseIssueDate ? new Date(customer.licenseIssueDate).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR') : '')
      .replace('{{license_expiry}}', customer.licenseExpiryDate ? new Date(customer.licenseExpiryDate).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR') : '')
      .replace('{{license_place}}', customer.licensePlace || '')
      .replace('{{vehicle_brand}}', vehicle.brand)
      .replace('{{vehicle_model}}', vehicle.model)
      .replace('{{vehicle_color}}', vehicle.color || '')
      .replace('{{vehicle_plate}}', vehicle.immatriculation || '')
      .replace('{{vehicle_vin}}', vehicle.vin || '')
      .replace('{{vehicle_fuel}}', vehicle.fuelType || '')
      .replace('{{vehicle_mileage}}', vehicle.mileage?.toString() || '0')
      .replace('{{res_number}}', reservation.reservationNumber)
      .replace('{{res_date}}', new Date(reservation.startDate).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR'))
      .replace('{{start_date}}', new Date(reservation.startDate).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR'))
      .replace('{{end_date}}', new Date(reservation.endDate).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR'))
      .replace('{{duration}}', days.toString().padStart(2, '0'))
      .replace('{{total_amount}}', reservation.totalAmount.toLocaleString())
      .replace('{{total_ht}}', (reservation.totalAmount * 0.81).toLocaleString())
      .replace('{{unit_price}}', (reservation.totalAmount / days).toLocaleString())
      .replace('{{paid_amount}}', reservation.paidAmount.toLocaleString())
      .replace('{{remaining_amount}}', (reservation.totalAmount - reservation.paidAmount).toLocaleString())
      .replace('{{store_name}}', storeInfo?.name || 'DriveFlow')
      .replace('{{store_phone}}', storeInfo?.phone || '')
      .replace('{{store_email}}', storeInfo?.email || '')
      .replace('{{store_address}}', storeInfo?.address || '');
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    setSelectedElementId(elementId);
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElementId || !canvasRef.current) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setTemplate((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === selectedElementId
          ? { ...el, x: Math.max(0, el.x + deltaX), y: Math.max(0, el.y + deltaY) }
          : el
      ),
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateElement = (updates: Partial<PersonalizableElement>) => {
    if (!selectedElementId) return;
    setTemplate((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === selectedElementId ? { ...el, ...updates } : el
      ),
    }));
  };

  const handleDoubleClick = (elementId: string) => {
    const element = template.elements.find((el) => el.id === elementId);
    if (!element) return;

    const newContent = prompt(`Éditer: ${element.content}`, element.content);
    if (newContent !== null) {
      updateElement({ content: newContent });
    }
  };

  return (
    <div className={`fixed inset-0 z-[400] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8 animate-fade-in ${isRtl ? 'font-arabic' : ''}`}>
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-7xl max-h-[90vh] flex overflow-hidden">
        {/* Left Panel - Canvas */}
        <div className="flex-1 bg-gray-100 p-8 overflow-auto">
          <div
            ref={canvasRef}
            className="relative bg-white shadow-2xl mx-auto"
            style={{
              width: `${template.canvasWidth / 1.5}px`,
              height: `${template.canvasHeight / 1.5}px`,
              transform: 'scale(1)',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {template.elements.map((element) => (
              <div
                key={element.id}
                className={`absolute group cursor-move border-2 transition-all ${
                  selectedElementId === element.id
                    ? 'border-blue-500 bg-blue-50/30'
                    : 'border-transparent hover:border-gray-300'
                }`}
                style={{
                  left: `${element.x / 1.5}px`,
                  top: `${element.y / 1.5}px`,
                  width: `${element.width / 1.5}px`,
                  height: `${element.height / 1.5}px`,
                  fontSize: `${element.fontSize / 1.5}px`,
                  color: element.color,
                  fontFamily: element.fontFamily,
                  fontWeight: element.fontWeight,
                  textAlign: element.textAlign,
                  backgroundColor: element.backgroundColor,
                  borderColor: element.borderColor,
                  borderWidth: `${element.borderWidth / 1.5}px`,
                  opacity: element.opacity,
                  padding: `${8 / 1.5}px`,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
                onClick={() => setSelectedElementId(element.id)}
                onDoubleClick={() => handleDoubleClick(element.id)}
                title={t.dragText}
              >
                {element.type === 'logo' && storeLogo ? (
                  <img src={storeLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : element.type === 'signature' ? (
                  <div className="w-full h-full flex items-end justify-center border-b-2 border-gray-400">
                    <span className="text-[6px] opacity-30 mb-1">Signature</span>
                  </div>
                ) : element.type === 'table' ? (
                  <table className="w-full text-[8px] border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="p-1 text-left">Désignation</th>
                        <th className="p-1 text-center">Qté</th>
                        <th className="p-1 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-1">{replaceVariables('Location {{vehicle_brand}} {{vehicle_model}}')}</td>
                        <td className="p-1 text-center">1</td>
                        <td className="p-1 text-right">{replaceVariables('{{total_amount}}')} DZ</td>
                      </tr>
                    </tbody>
                  </table>
                ) : element.type === 'divider' ? (
                  <div className="w-full h-full border-t-2 border-gray-400" />
                ) : element.type === 'checklist' ? (
                  (() => {
                    let items: { label: string; checked: boolean }[] = [];
                    try { items = JSON.parse(element.content || '[]'); } catch (e) { items = []; }
                    return (
                      <div className="w-full h-full p-2 text-[10px]">
                        {items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-3 py-1">
                            <label className={`w-4 h-4 rounded-sm border ${it.checked ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'}`} onClick={() => {
                              const newItems = items.map((x, i) => i === idx ? { ...x, checked: !x.checked } : x);
                              updateElement({ content: JSON.stringify(newItems) });
                            }} />
                            <div className={`${it.checked ? 'line-through text-gray-400' : ''}`}>{it.label}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  replaceVariables(element.content)
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-96 bg-white border-l border-gray-200 p-8 overflow-y-auto space-y-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">{t.title}</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {docType.toUpperCase()} • {template.elements.length} éléments
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const newEl: PersonalizableElement = {
                  id: `text-${Date.now()}`,
                  type: 'text',
                  content: 'Nouveau texte',
                  x: 80, y: 200, width: 300, height: 40, fontSize: 12, color: '#111827', fontFamily: 'Inter', fontWeight: '400', textAlign: 'left', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1
                };
                setTemplate(prev => ({ ...prev, elements: [...prev.elements, newEl] }));
                setSelectedElementId(newEl.id);
              }}
              className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-black hover:bg-gray-200"
            >
              ➕ Ajouter Texte
            </button>

            <button
              onClick={() => {
                const checklistItems = [
                  { label: 'Feux & Phares', checked: false },
                  { label: 'Pneus (Usure/Pression)', checked: false },
                  { label: 'Freins', checked: false },
                  { label: 'Essuie-glaces', checked: false },
                  { label: 'Rétroviseurs', checked: false },
                  { label: 'Ceintures', checked: false },
                  { label: 'Klaxon', checked: false },
                  { label: 'Roue de secours', checked: false },
                  { label: 'Cric', checked: false },
                  { label: 'Triangles', checked: false },
                  { label: 'Trousse secours', checked: false },
                  { label: 'Docs véhicule', checked: false },
                  { label: 'Climatisation (A/C)', checked: false },
                  { label: 'Intérieur Propre', checked: false },
                  { label: 'Extérieur Propre', checked: false }
                ];
                const newEl: PersonalizableElement = {
                  id: `checklist-${Date.now()}`,
                  type: 'checklist',
                  content: JSON.stringify(checklistItems),
                  x: 60, y: 300, width: 380, height: 220, fontSize: 12, color: '#111827', fontFamily: 'Inter', fontWeight: '400', textAlign: 'left', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1
                };
                setTemplate(prev => ({ ...prev, elements: [...prev.elements, newEl] }));
                setSelectedElementId(newEl.id);
              }}
              className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-black hover:bg-gray-200"
            >
              ➕ Ajouter Checklist
            </button>
          </div>

          {selectedElement && (
            <div className="space-y-6 pt-6 border-t border-gray-200">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-3">Contenu</label>
                <textarea
                  value={selectedElement.content}
                  onChange={(e) => updateElement({ content: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">{t.color}</label>
                  <input
                    type="color"
                    value={selectedElement.color}
                    onChange={(e) => updateElement({ color: e.target.value })}
                    className="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">{t.font}</label>
                  <select
                    value={selectedElement.fontFamily}
                    onChange={(e) => updateElement({ fontFamily: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  >
                    <option>Inter</option>
                    <option>Arial</option>
                    <option>Times New Roman</option>
                    <option>Courier New</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">{t.size}</label>
                  <input
                    type="number"
                    value={selectedElement.fontSize}
                    onChange={(e) => updateElement({ fontSize: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                    min="8"
                    max="48"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">{t.bold}</label>
                  <select
                    value={selectedElement.fontWeight}
                    onChange={(e) => updateElement({ fontWeight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  >
                    <option value="400">Normal</option>
                    <option value="700">Gras</option>
                    <option value="900">Ultra</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Alignement</label>
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => updateElement({ textAlign: align })}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                        selectedElement.textAlign === align
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {align === 'left' ? '⬅' : align === 'center' ? '⬇' : '➡'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-200 space-y-3">
            {onSaveTemplate && (
              <GradientButton
                onClick={() => {
                  if (onSaveTemplate) onSaveTemplate(template);
                }}
                className="!w-full"
              >
                💾 {t.save}
              </GradientButton>
            )}
            <button
              onClick={() => {
                window.print();
              }}
              className="w-full px-6 py-3 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all shadow-lg"
            >
              🖨️ {t.print}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-gray-200 text-gray-900 font-black rounded-2xl hover:bg-gray-300 transition-all"
              >
                ✕ {t.cancel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getDefaultElements(docType: string, lang: Language): PersonalizableElement[] {
  const isAr = lang === 'ar';

  const defaultElements: Record<string, PersonalizableElement[]> = {
    devis: [
      { id: '1', type: 'logo', content: 'LOGO', x: 50, y: 30, width: 100, height: 60, fontSize: 12, color: '#111827', fontFamily: 'Inter', fontWeight: '700', textAlign: 'center', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
      { id: '2', type: 'text', content: 'DEVIS', x: 350, y: 50, width: 200, height: 40, fontSize: 32, color: '#1f2937', fontFamily: 'Inter', fontWeight: '900', textAlign: 'center', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
      { id: '3', type: 'text', content: 'Adressé à:\n{{client_name}}\n{{client_phone}}', x: 50, y: 150, width: 300, height: 80, fontSize: 11, color: '#374151', fontFamily: 'Inter', fontWeight: '400', textAlign: 'left', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
      { id: '4', type: 'text', content: 'Véhicule:\n{{vehicle_brand}} {{vehicle_model}}\n{{vehicle_plate}}', x: 450, y: 150, width: 300, height: 80, fontSize: 11, color: '#374151', fontFamily: 'Inter', fontWeight: '400', textAlign: 'left', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
      { id: '5', type: 'divider', content: '', x: 50, y: 260, width: 700, height: 2, fontSize: 1, color: '#d1d5db', fontFamily: 'Inter', fontWeight: '400', textAlign: 'left', backgroundColor: '#d1d5db', borderColor: '#d1d5db', borderWidth: 0, opacity: 1 },
      { id: '6', type: 'table', content: '', x: 50, y: 290, width: 700, height: 150, fontSize: 10, color: '#111827', fontFamily: 'Inter', fontWeight: '600', textAlign: 'left', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
      { id: '7', type: 'text', content: 'Montant Total: {{total_amount}} DZ', x: 450, y: 500, width: 300, height: 40, fontSize: 16, color: '#dc2626', fontFamily: 'Inter', fontWeight: '900', textAlign: 'right', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
      { id: '8', type: 'signature', content: 'Cachet et signature du vendeur', x: 50, y: 600, width: 250, height: 150, fontSize: 10, color: '#6b7280', fontFamily: 'Inter', fontWeight: '400', textAlign: 'center', backgroundColor: 'transparent', borderColor: '#d1d5db', borderWidth: 1, opacity: 1 },
    ],
    contrat: [
      { id: '1', type: 'logo', content: 'LOGO', x: 50, y: 20, width: 100, height: 50, fontSize: 12, color: '#111827', fontFamily: 'Inter', fontWeight: '700', textAlign: 'center', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
      { id: '2', type: 'text', content: 'CONTRAT DE LOCATION', x: 200, y: 30, width: 400, height: 40, fontSize: 18, color: '#1f2937', fontFamily: 'Inter', fontWeight: '900', textAlign: 'center', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
    ],
    checkin: [
      { id: 'i1', type: 'text', content: 'CHECK-IN REPORT', x: 50, y: 20, width: 700, height: 40, fontSize: 20, color: '#111827', fontFamily: 'Inter', fontWeight: '900', textAlign: 'center', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
    ],
    checkout: [
      { id: 'o1', type: 'text', content: 'CHECK-OUT REPORT', x: 50, y: 20, width: 700, height: 40, fontSize: 20, color: '#111827', fontFamily: 'Inter', fontWeight: '900', textAlign: 'center', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
    ],
    versement: [
      { id: '1', type: 'logo', content: 'LOGO', x: 50, y: 30, width: 100, height: 60, fontSize: 12, color: '#111827', fontFamily: 'Inter', fontWeight: '700', textAlign: 'center', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
      { id: '2', type: 'text', content: 'REÇU DE VERSEMENT', x: 250, y: 50, width: 300, height: 50, fontSize: 28, color: '#1f2937', fontFamily: 'Inter', fontWeight: '900', textAlign: 'center', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
    ],
    facture: [
      { id: '1', type: 'logo', content: 'LOGO', x: 50, y: 30, width: 100, height: 60, fontSize: 12, color: '#111827', fontFamily: 'Inter', fontWeight: '700', textAlign: 'center', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
      { id: '2', type: 'text', content: 'FACTURE', x: 400, y: 50, width: 250, height: 50, fontSize: 32, color: '#1f2937', fontFamily: 'Inter', fontWeight: '900', textAlign: 'center', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
    ],
  };

  return defaultElements[docType] || [];
}

export default DocumentPersonalizer;
