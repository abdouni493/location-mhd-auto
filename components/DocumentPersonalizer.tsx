import React, { useState, useRef, useEffect } from 'react';
import { Language, Reservation, Customer, Vehicle } from '../types';
import GradientButton from './GradientButton';
import { apiFetch, apiPost } from '../lib/api';

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
  const [savedTemplates, setSavedTemplates] = useState<DocumentTemplate[]>([]);
  const [showTemplatesList, setShowTemplatesList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState(`Modèle ${docType} - ${new Date().toLocaleDateString()}`);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load saved templates on mount
  useEffect(() => {
    loadSavedTemplates();
  }, [docType]);

  const loadSavedTemplates = async () => {
    try {
      const response = await apiFetch(`/api/templates?category=${docType}`);
      if (!response.ok) {
        console.warn(`Templates API returned ${response.status}, templates table may not exist`);
        setSavedTemplates([]);
        return;
      }
      const result = await response.json();
      if (result && result.data && Array.isArray(result.data)) {
        setSavedTemplates(result.data);
      } else {
        setSavedTemplates([]);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
      setSavedTemplates([]);
    }
  };

  const saveTemplateToDatabase = async () => {
    setIsSaving(true);
    try {
      const response = await apiPost('/api/templates', {
        name: saveName,
        category: docType,
        elements: template.elements,
        canvasWidth: template.canvasWidth,
        canvasHeight: template.canvasHeight,
        description: `Custom template for ${docType}`
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        alert(`Error: ${response.status} - Templates table may not exist. Please run SQL_TEMPLATES_COMPLETE.sql`);
        setIsSaving(false);
        return;
      }

      const result = await response.json();
      if (result && result.data) {
        // Update local list of templates
        setSavedTemplates([...savedTemplates, result.data]);
        // Also call the parent callback if provided
        if (onSaveTemplate) onSaveTemplate(template);
        // Reset form
        setSaveName(`Modèle ${docType} - ${new Date().toLocaleDateString()}`);
        alert(`Template "${saveName}" saved successfully!`);
      } else if (result && result.error) {
        alert('Error saving template: ' + result.error.message);
      } else {
        alert('Error saving template: Unknown error');
      }
    } catch (err) {
      console.error('Save template error:', err);
      alert(`Error saving template: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const loadTemplate = (selectedTemplate: DocumentTemplate) => {
    setTemplate({
      ...selectedTemplate,
      id: `tpl-${Date.now()}` // Generate new ID for this instance
    });
    setShowTemplatesList(false);
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce modèle?')) return;
    
    try {
      const response = await apiFetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        alert('Erreur lors de la suppression du modèle');
        return;
      }

      setSavedTemplates(savedTemplates.filter(t => t.id !== templateId));
      alert('Modèle supprimé avec succès');
    } catch (err) {
      console.error('Delete template error:', err);
      alert('Erreur lors de la suppression du modèle');
    }
  };

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
    const safeCustomer = (customer || {}) as Partial<Customer>;
    const safeVehicle = (vehicle || {}) as Partial<Vehicle>;
    const start = reservation?.startDate ? new Date(reservation.startDate) : null;
    const end = reservation?.endDate ? new Date(reservation.endDate) : null;
    const days = start && end ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))) : 1;

    const fmt = (d?: string | Date) => {
      if (!d) return '';
      const dt = typeof d === 'string' ? new Date(d) : d;
      if (!dt || Number.isNaN(dt.getTime())) return '';
      return dt.toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR');
    };

    const safeNumber = (v: any) => (typeof v === 'number' ? v : Number(v) || 0);

    // normalize possible DB field names (snake_case or camelCase)
    const clientFirst = safeCustomer.firstName || (safeCustomer as any).first_name || '';
    const clientLast = safeCustomer.lastName || (safeCustomer as any).last_name || '';
    const clientPhone = safeCustomer.phone || (safeCustomer as any).phone || '';
    const clientEmail = safeCustomer.email || (safeCustomer as any).email || '';
    const clientDob = (safeCustomer as any).birthday || (safeCustomer as any).dateOfBirth || (safeCustomer as any).birthday_date || null;
    const clientPob = (safeCustomer as any).birthPlace || (safeCustomer as any).birth_place || (safeCustomer as any).placeOfBirth || '';
    const clientLicense = safeCustomer.licenseNumber || (safeCustomer as any).license_number || '';
    const licenseIssue = (safeCustomer as any).licenseIssueDate || (safeCustomer as any).license_issue_date || null;
    const licenseExpiry = (safeCustomer as any).licenseExpiry || (safeCustomer as any).license_expiry || null;
    const licensePlace = (safeCustomer as any).licenseIssuePlace || (safeCustomer as any).license_issue_place || (safeCustomer as any).licensePlace || '';
    const passportNum = (safeCustomer as any).idCardNumber || (safeCustomer as any).id_card_number || (safeCustomer as any).documentNumber || (safeCustomer as any).document_number || '';
    const passportIssue = (safeCustomer as any).passportIssueDate || (safeCustomer as any).document_delivery_date || (safeCustomer as any).documentDeliveryDate || null;
    const passportPlace = (safeCustomer as any).passportIssuePlace || (safeCustomer as any).document_delivery_address || (safeCustomer as any).documentDeliveryAddress || '';

    // For engagement documents we hide paid/remaining summary by default
    const hidePayments = (docType || '').toLowerCase().includes('engag');
    const paidAmountStr = hidePayments ? '' : (safeNumber((reservation as any)?.paidAmount)).toLocaleString();
    const remainingStr = hidePayments ? '' : (safeNumber((reservation as any)?.totalAmount) - safeNumber((reservation as any)?.paidAmount)).toLocaleString();

    return (text || '')
      .replace(/{{client_name}}/g, `${clientFirst} ${clientLast}`.trim())
      .replace(/{{client_phone}}/g, clientPhone)
      .replace(/{{client_email}}/g, clientEmail)
      .replace(/{{client_dob}}/g, fmt(clientDob))
      .replace(/{{client_pob}}/g, clientPob)
      .replace(/{{client_license}}/g, clientLicense)
      .replace(/{{license_issued}}/g, fmt(licenseIssue))
      .replace(/{{license_expiry}}/g, fmt(licenseExpiry))
      .replace(/{{license_place}}/g, licensePlace)
      .replace(/{{client_passport}}/g, passportNum)
      .replace(/{{client_passport_issue}}/g, fmt(passportIssue))
      .replace(/{{client_passport_place}}/g, passportPlace)
      .replace(/{{vehicle_brand}}/g, safeVehicle.brand || '')
      .replace(/{{vehicle_model}}/g, safeVehicle.model || '')
      .replace(/{{vehicle_color}}/g, safeVehicle.color || '')
      .replace(/{{vehicle_plate}}/g, safeVehicle.immatriculation || '')
      .replace(/{{vehicle_vin}}/g, (safeVehicle as any).vin || '')
      .replace(/{{vehicle_fuel}}/g, (safeVehicle as any).fuelType || '')
      .replace(/{{vehicle_mileage}}/g, (safeVehicle.mileage != null ? String(safeVehicle.mileage) : '0'))
      .replace(/{{res_number}}/g, reservation?.reservationNumber || '')
      .replace(/{{res_date}}/g, fmt(reservation?.startDate))
      .replace(/{{start_date}}/g, fmt(reservation?.startDate))
      .replace(/{{end_date}}/g, fmt(reservation?.endDate))
      .replace(/{{duration}}/g, String(days).padStart(2, '0'))
      .replace(/{{total_amount}}/g, (safeNumber((reservation as any)?.totalAmount)).toLocaleString())
      .replace(/{{total_ht}}/g, (safeNumber((reservation as any)?.totalAmount) * 0.81).toLocaleString())
      .replace(/{{unit_price}}/g, (safeNumber((reservation as any)?.totalAmount) / Math.max(1, days)).toLocaleString())
      .replace(/{{paid_amount}}/g, paidAmountStr)
      .replace(/{{remaining_amount}}/g, remainingStr)
      .replace(/{{store_name}}/g, storeInfo?.name || 'DriveFlow')
      .replace(/{{store_phone}}/g, storeInfo?.phone || '')
      .replace(/{{store_email}}/g, storeInfo?.email || '')
      .replace(/{{store_address}}/g, storeInfo?.address || '');
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

              <button
                onClick={() => {
                  setTemplate(prev => ({
                    ...prev,
                    elements: prev.elements.filter(el => el.id !== selectedElementId)
                  }));
                  setSelectedElementId(null);
                }}
                className="w-full px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-black hover:bg-red-200 transition-all"
              >
                🗑️ Supprimer cet élément
              </button>
            </div>
          )}

          <div className="pt-6 border-t border-gray-200 space-y-3">
            {/* Saved Templates List */}
            {savedTemplates.length > 0 && (
              <div>
                <button
                  onClick={() => setShowTemplatesList(!showTemplatesList)}
                  className="w-full px-4 py-2 bg-blue-100 text-blue-600 rounded-2xl font-black text-sm hover:bg-blue-200 transition-all"
                >
                  📋 {showTemplatesList ? 'Masquer les modèles' : `Modèles sauvegardés (${savedTemplates.length})`}
                </button>
                {showTemplatesList && (
                  <div className="mt-2 max-h-48 overflow-y-auto border border-blue-200 rounded-2xl p-2 bg-blue-50/30">
                    {savedTemplates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="w-full px-3 py-2 mb-1 rounded-lg bg-white hover:bg-blue-100 transition-all text-sm font-bold text-gray-700 border border-transparent hover:border-blue-300 flex justify-between items-center group"
                      >
                        <button
                          onClick={() => loadTemplate(tpl)}
                          className="flex-1 text-left"
                        >
                          <div>
                            <span>{tpl.name}</span>
                            <span className="text-[10px] text-gray-400 ml-2">{new Date(tpl.created_at || '').toLocaleDateString()}</span>
                          </div>
                        </button>
                        <button
                          onClick={() => deleteTemplate(tpl.id)}
                          className="ml-2 px-2 py-1 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Supprimer ce modèle"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Save Template Section */}
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Nom du modèle..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 outline-none focus:border-blue-500"
              />
              <GradientButton
                onClick={saveTemplateToDatabase}
                disabled={isSaving || !saveName.trim()}
                className="!w-full"
              >
                {isSaving ? '⏳ Sauvegarde...' : '💾 ' + t.save}
              </GradientButton>
            </div>
            <button
              onClick={() => {
                // Create hidden iframe for printing instead of new window
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
                
                const printWindow = iframe.contentWindow;
                if (!printWindow) return;

                const safeReplace = (s: string) => replaceVariables(s).replace(/\n/g, '<br>');

                // Build HTML from template elements with proper positioning and styling
                const elemsHtml = template.elements.map(el => {
                  const baseStyle = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;font-size:${el.fontSize}px;color:${el.color};font-family:${el.fontFamily};font-weight:${el.fontWeight};text-align:${el.textAlign};background-color:${el.backgroundColor};border:${el.borderWidth}px solid ${el.borderColor};opacity:${el.opacity};padding:8px;overflow:hidden;`;
                  
                  if (el.type === 'logo') {
                    const src = storeLogo || '';
                    if (src) return `<div style="${baseStyle}"><img src="${src}" alt="logo" style="max-width:100%;height:auto;"/></div>`;
                    return `<div style="${baseStyle}"><div style="font-weight:900;">${storeInfo?.name || ''}</div></div>`;
                  }
                  if (el.type === 'signature') {
                    return `<div style="${baseStyle}"><div style="height:100%;border-bottom:1px solid #ccc;"></div></div>`;
                  }
                  if (el.type === 'table') {
                    return `<div style="${baseStyle}"><table style="width:100%;border-collapse:collapse;font-size:${el.fontSize}px;"><thead><tr style="border-bottom:1px solid #ccc;"><th style="padding:4px;text-align:left;">Désignation</th><th style="padding:4px;text-align:center;">Qté</th><th style="padding:4px;text-align:right;">Montant</th></tr></thead><tbody><tr><td style="padding:4px;">${safeReplace('Location {{vehicle_brand}} {{vehicle_model}}')}</td><td style="padding:4px;text-align:center;">1</td><td style="padding:4px;text-align:right;">${safeReplace('{{total_amount}}')} DZ</td></tr></tbody></table></div>`;
                  }
                  if (el.type === 'divider') {
                    return `<div style="${baseStyle}"><div style="border-bottom:2px solid ${el.color};height:50%;"></div></div>`;
                  }
                  if (el.type === 'checklist') {
                    return `<div style="${baseStyle}"><div style="white-space:pre-wrap;word-break:break-word;">${safeReplace(el.content)}</div></div>`;
                  }
                  // default text
                  return `<div style="${baseStyle};white-space:pre-wrap;word-break:break-word;">${safeReplace(el.content)}</div>`;
                }).join('');

                const paid = Number((reservation as any)?.paidAmount || 0);
                const total = Number((reservation as any)?.totalAmount || 0);
                const remaining = total - paid;

                const hasTitleElement = template.elements.some(el => (el.type === 'text' && typeof el.content === 'string' && el.content.toUpperCase().includes('ENGAGEMENT')));
                const showPayments = !((docType||'').toLowerCase().includes('engag'));

                const headerRight = showPayments ? `<div style="text-align:right"><div style="font-weight:700">Payé: ${paid.toLocaleString()} DZ</div><div style="color:#dc2626;font-weight:800">Reste: ${remaining.toLocaleString()} DZ</div></div>` : '';

                // add side-by-side signature blocks if template doesn't already include a signature element
                const hasSignatureElement = template.elements.some(el => el.type === 'signature' || (el.type === 'text' && typeof el.content === 'string' && el.content.toLowerCase().includes('signature')));
                const engagementSignatures = (!hasSignatureElement && (docType||'').toLowerCase().includes('engag')) ? `
                  <div style="display:flex;justify-content:space-between;margin-top:40px;gap:40px">
                    <div style="flex:1;text-align:left">
                      <div style="height:70px;border-bottom:1px solid #ccc;width:80%"></div>
                      <div style="margin-top:8px;font-size:12px">Signature et cachet de l'Agence</div>
                    </div>
                    <div style="flex:1;text-align:right">
                      <div style="height:70px;border-bottom:1px solid #ccc;width:80%;margin-left:auto"></div>
                      <div style="margin-top:8px;font-size:12px">Signature du client</div>
                    </div>
                  </div>
                ` : '';

                const isEngagement = (docType||'').toLowerCase().includes('engag');
                const headerHtml = isEngagement ? '' : `<div class="header"><div>${storeLogo ? `<img class="logo" src="${storeLogo}"/>` : ''}</div><div style="flex:1"><div style="font-weight:900">${storeInfo?.name || ''}</div><div style="color:#666;font-size:12px">${storeInfo?.address || ''} ${storeInfo?.phone ? ' • ' + storeInfo.phone : ''}</div></div>${headerRight}</div>`;

                const htmlContent = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${template.name}</title>
                <style>body{font-family:Inter,Arial,Helvetica,sans-serif;padding:24px;color:#111;position:relative} .title{font-weight:900;font-size:22px;margin:8px 0;text-align:center} .header{display:flex;align-items:center;gap:12px} .logo{max-width:140px} .canvas{position:relative;width:${template.canvasWidth}px;height:${template.canvasHeight}px;margin:20px auto;}</style></head><body>
                ${headerHtml}
                ${hasTitleElement ? '' : `<div class="title">${(docType||'').toUpperCase()}</div>`}
                <div class="canvas">${elemsHtml}</div>
                ${engagementSignatures}
                <div style="margin-top:32px;font-size:12px;color:#666">${new Date().toLocaleString()} ${storeInfo?.name || ''}</div>
                </body></html>`;

                printWindow.document.write(htmlContent);
                printWindow.document.close();
                setTimeout(() => { 
                  printWindow.print();
                  setTimeout(() => document.body.removeChild(iframe), 100);
                }, 300);
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
    engagement: [
      { id: '1', type: 'logo', content: 'LOGO', x: 50, y: 20, width: 120, height: 70, fontSize: 12, color: '#111827', fontFamily: 'Inter', fontWeight: '700', textAlign: 'left', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
      { id: '2', type: 'text', content: '{{store_name}}\n{{store_address}}\n{{store_phone}}', x: 200, y: 20, width: 450, height: 60, fontSize: 12, color: '#374151', fontFamily: 'Inter', fontWeight: '600', textAlign: 'right', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
      { id: '3', type: 'text', content: 'ENGAGEMENT', x: 50, y: 110, width: 700, height: 40, fontSize: 26, color: '#0f172a', fontFamily: 'Inter', fontWeight: '900', textAlign: 'center', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
      { id: '5', type: 'text', content: 'Avoir déposé mon passeport en garantie auprès de :\n{{store_name}}', x: 60, y: 300, width: 680, height: 60, fontSize: 12, color: '#374151', fontFamily: 'Inter', fontWeight: '500', textAlign: 'left', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
      { id: '6', type: 'text', content: 'Au niveau de votre agence de location de voiture le {{res_date}} Contrat N° {{res_number}}', x: 60, y: 370, width: 680, height: 40, fontSize: 12, color: '#374151', fontFamily: 'Inter', fontWeight: '600', textAlign: 'left', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
      { id: '7', type: 'text', content: 'Comme caution pour location du véhicule : {{vehicle_brand}} {{vehicle_model}}\nImmatriculation : {{vehicle_plate}}\nDu {{start_date}} Au {{end_date}}', x: 60, y: 420, width: 680, height: 100, fontSize: 12, color: '#111827', fontFamily: 'Inter', fontWeight: '500', textAlign: 'left', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
      { id: '8', type: 'divider', content: '', x: 60, y: 540, width: 680, height: 2, fontSize: 1, color: '#d1d5db', fontFamily: 'Inter', fontWeight: '400', textAlign: 'left', backgroundColor: '#d1d5db', borderColor: '#d1d5db', borderWidth: 0, opacity: 1 },
      { id: '4', type: 'text', content: 'Je soussigné[e] : {{client_name}}\nN° Passeport / CIN : {{client_passport}}', x: 60, y: 170, width: 680, height: 120, fontSize: 12, color: '#111827', fontFamily: 'Inter', fontWeight: '500', textAlign: 'left', backgroundColor: 'transparent', borderColor: '#e5e7eb', borderWidth: 0, opacity: 1 },
    ],
  };

  return defaultElements[docType] || [];
}

export default DocumentPersonalizer;
