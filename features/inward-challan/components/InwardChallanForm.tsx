/**
 * InwardChallanForm.tsx
 * Feature: Inward Challan (Phase 3)
 *
 * Slide-up modal for recording an Inward Challan (goods received).
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../supabaseAPI';
import { aiApi } from '../../../api/ai';
import { useContacts } from '../../contacts/useContacts';
import { AddContactModal } from '../../contacts/components/AddContactModal';
import { User, DCItem, Company, Order, Contact, DeliveryChallan, InwardChallan } from '../../../types';
import { ItemsTable } from '../../delivery-challan/components/ItemsTable';

interface InwardChallanFormProps {
    currentUser: User;
    channelId?:   string;   // optional — link to a chat
    linkedDCId?:  string;   // optional — if responding to a specific outward DC
    initialData?: InwardChallan; // optional — if editing existing IC
    onCreated:    (icId: string, icNumber: string) => void;
    onClose:      () => void;
}

const BLANK_ITEMS: DCItem[] = [{ description: '', quantity: 0, unit: 'KG' }];

export const InwardChallanForm: React.FC<InwardChallanFormProps> = ({ 
    currentUser, 
    channelId, 
    linkedDCId,
    initialData,
    onCreated, 
    onClose 
}) => {
    const { 
        isAdding: isAddingContact, 
        form: contactForm, 
        setForm: setContactForm,
        isGSTValid, isPINValid, handleGSTInput, handlePINInput,
        openAdd: openAddContact, closeModal: closeContactModal, handleSave: saveContact,
        isSaving: savingContact
    } = useContacts(currentUser);
    // ── Form state ─────────────────────────────────────────────────────────────
    const [senderSearch, setSenderSearch]       = useState('');
    const [selectedSender, setSelectedSender]   = useState<{ id: string, companyId?: string, type: 'partner' | 'contact', name: string } | null>(
        initialData ? {
            id: initialData.sender_company_id || initialData.sender_contact_id || '',
            companyId: initialData.sender_company_id,
            type: initialData.sender_company_id ? 'partner' : 'contact',
            name: (initialData as any).sender_company?.name || (initialData as any).sender_contact?.name || 'Selected'
        } : null
    );
    const [showSenderList, setShowSenderList]   = useState(false);
    const [orderId, setOrderId]                 = useState(initialData?.order_number || '');
    const [refOrderNumber, setRefOrderNumber]   = useState(initialData?.ref_order_number || '');
    const [docDate, setDocDate]                 = useState(initialData?.created_at ? new Date(initialData.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [items, setItems]                     = useState<DCItem[]>(initialData?.items_received || BLANK_ITEMS);
    const [discrepancies, setDiscrepancies]     = useState(initialData?.discrepancies || '');
    const [notes, setNotes]                     = useState(initialData?.notes || '');
    const [saving, setSaving]                   = useState(false);
    const aiScanInputRef = React.useRef<HTMLInputElement>(null);
    const [isScanning, setIsScanning] = useState(false);

    // ── Data queries ───────────────────────────────────────────────────────────
    const { data: partners = [] } = useQuery<Company[]>({
        queryKey: ['partners', currentUser.company_id],
        queryFn:  () => api.getPartners(currentUser),
    });

    const { data: contacts = [] } = useQuery<Contact[]>({
        queryKey: ['contacts', currentUser.company_id],
        queryFn:  () => api.getContacts(currentUser),
    });

    // --- Derived Data ---
    const { data: orders = [] } = useQuery<Order[]>({
        queryKey: ['orders', currentUser.id],
        queryFn:  () => api.getOrders(currentUser),
    });

    // --- Auto-populate if linked to a DC ---
    React.useEffect(() => {
        if (linkedDCId && !initialData) {
            api.getDCById(linkedDCId).then(dc => {
                if (dc) {
                    setOrderId(dc.order_number || '');
                    setRefOrderNumber(dc.dc_number);
                    setItems([...dc.items]);
                    
                    // Prioritize contact if it exists, otherwise use company
                    if (dc.receiver_contact) {
                         // Wait, this is coming TO us. So the SENDER of the DC is the SENDER of our IC.
                         // But if we are the receiver of the DC, we already have our details.
                         // We need the details of dc.sender_company
                    }

                    setSelectedSender({
                        id: dc.sender_company_id, // we don't have a contact ID for the sender often in DCs, so use company
                        companyId: dc.sender_company_id,
                        type: 'partner',
                        name: dc.sender_company?.name || 'Sender'
                    });
                }
            });
        }
    }, [linkedDCId, initialData]);

    // --- Derived Data ---
    const partnerIds = new Set(partners.map(p => p.id));

    const allPossibleSenders = [
        ...partners.map(p => ({ 
            id: p.id, 
            companyId: p.id, 
            type: 'partner' as const, 
            name: p.name, 
            tag: 'Partner' 
        })),
        ...contacts.filter(c => !c.linked_company_id || !partnerIds.has(c.linked_company_id)).map(c => ({ 
            id: c.id, 
            companyId: c.linked_company_id, 
            type: 'contact' as const, 
            name: c.name, 
            tag: c.linked_company_id ? 'Partner' : 'Manual Contact'
        }))
    ].filter(s => s.name.toLowerCase().includes(senderSearch.toLowerCase()));

    // ── AI Scanning ────────────────────────────────────────────────────────────
    const handleAIScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        try {
            const res = await aiApi.scanDocument(currentUser, file, 'IC', {
                styleNo: orders.find(o => o.id === orderId)?.style_number,
                companyName: currentUser.company?.name
            });

            if (res.success && res.data) {
                const { date, party_name, items: extractedItems, dc_number } = res.data;
                
                if (date) setDocDate(date);
                if (extractedItems?.length) setItems(extractedItems);
                if (dc_number) setRefOrderNumber(dc_number);
                
                // Try to match sender
                if (party_name) {
                    const match = allPossibleSenders.find(s => 
                        s.name.toLowerCase().includes(party_name.toLowerCase()) ||
                        party_name.toLowerCase().includes(s.name.toLowerCase())
                    );
                    if (match) setSelectedSender(match);
                }
            } else {
                alert(res.error || 'Failed to scan document');
            }
        } catch (err: any) {
            alert('AI Scanning Error: ' + err.message);
        } finally {
            setIsScanning(false);
            if (aiScanInputRef.current) aiScanInputRef.current.value = '';
        }
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        const validItems = items.filter(it => it.description.trim() && it.quantity > 0);
        if (!validItems.length) { alert('Add at least one item with description and quantity'); return; }
        if (!selectedSender) { alert('Please select the sender from the list'); return; }
        if (!orderId) { alert('Please select an Order to link this receipt to'); return; }

        setSaving(true);
        try {
            const icData = {
                channel_id:        channelId,
                linked_dc_id:      linkedDCId,
                sender_company_id: selectedSender.companyId || (selectedSender.type === 'partner' ? selectedSender.id : undefined),
                sender_contact_id: selectedSender.type === 'contact' ? selectedSender.id : undefined,
                order_number:      orderId || undefined,
                ref_order_number:  refOrderNumber || undefined,
                items_received:    validItems,
                discrepancies:     discrepancies || undefined,
                notes:             notes || undefined,
                created_at:        docDate ? new Date(docDate).toISOString() : undefined,
            };

            const ic = initialData 
                ? await api.updateInwardChallan(currentUser, initialData.id, icData)
                : await api.createInwardChallan(currentUser, icData);

            onCreated(ic.id, ic.ic_number);
        } catch (err: any) {
            alert(err.message || `Failed to ${initialData ? 'update' : 'create'} Inward Challan`);
        } finally {
            setSaving(false);
        }
    };

    const inputCls = 'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008069] transition-all';
    const labelCls = 'text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block';

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose}>
            <div className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>

                {/* Header: Fixed */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-none">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{initialData ? 'Edit' : 'Record'} Inward Challan</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{initialData ? 'Update acknowledgement' : 'Goods received acknowledgement'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body: Scrollable */}
                <div className="overflow-y-auto flex-1 px-6 pt-5 pb-10 space-y-6">
                    
                    {/* AI Magic Banner */}
                    {!initialData && (
                        <div className="bg-gradient-to-br from-[#008069] to-[#00a884] p-4 rounded-2xl shadow-lg shadow-green-100 flex items-center justify-between gap-4 border border-white/20">
                            <div className="flex-1">
                                <h4 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                                    <span className="text-lg">✨</span> AI Smart Fill
                                </h4>
                                <p className="text-green-50 text-[11px] font-medium leading-tight mt-1">Scan the paper DC/Slip you received to auto-fill this form.</p>
                            </div>
                            <button 
                                onClick={() => aiScanInputRef.current?.click()}
                                disabled={isScanning}
                                className="bg-white text-[#008069] px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-50 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                            >
                                {isScanning ? 'Scanning...' : 'Scan Now'}
                            </button>
                            <input 
                                ref={aiScanInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleAIScan}
                            />
                        </div>
                    )}

                    {/* Date Picker */}
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div>
                            <label className={labelCls}>Receipt Date</label>
                            <p className="text-xs text-gray-400">When were these goods received?</p>
                        </div>
                        <input 
                            type="date" 
                            value={docDate} 
                            onChange={e => setDocDate(e.target.value)}
                            className="bg-white px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#008069]"
                        />
                    </div>


                    {/* Sender Search + Dropdown */}
                    <div className="relative">
                        <label className={labelCls}>Sender Company / Contact</label>
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Search by name..."
                                value={selectedSender ? selectedSender.name : senderSearch}
                                onChange={e => {
                                    setSenderSearch(e.target.value);
                                    if (selectedSender) setSelectedSender(null);
                                    setShowSenderList(true);
                                }}
                                onFocus={() => setShowSenderList(true)}
                                className={inputCls + (selectedSender ? ' border-[#008069] bg-[#f0f9f7] font-bold' : '')}
                            />
                            {selectedSender && (
                                <button 
                                    onClick={() => { setSelectedSender(null); setSenderSearch(''); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500"
                                >✕</button>
                            )}
                        </div>

                        {showSenderList && !selectedSender && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                {allPossibleSenders.length === 0 ? (
                                    <div className="p-4 text-center text-gray-400 text-sm italic">No matching companies found...</div>
                                ) : (
                                    allPossibleSenders.map(s => (
                                        <button 
                                            key={`${s.type}-${s.id}`}
                                            onClick={() => {
                                                setSelectedSender(s);
                                                setShowSenderList(false);
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                                        >
                                            <span className="text-sm font-bold text-gray-900">{s.name}</span>
                                            <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${s.type === 'partner' ? 'bg-[#e7f3f1] text-[#008069]' : 'bg-gray-100 text-gray-500'}`}>
                                                {s.tag}
                                            </span>
                                        </button>
                                    ))
                                )}
                                {senderSearch.trim().length > 0 && (
                                    <button 
                                        onClick={() => {
                                            openAddContact();
                                            setContactForm(f => ({ ...f, name: senderSearch.trim() }));
                                        }}
                                        className="w-full text-left px-4 py-4 bg-[#f0f9f7] hover:bg-[#e7f3f1] flex items-center gap-3 transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-[#008069] text-white flex items-center justify-center text-lg font-bold group-hover:scale-110 transition-transform">+</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Add "{senderSearch}" as Contact</p>
                                            <p className="text-[10px] text-[#008069] font-regular tracking-widest">Quick Create Partner</p>
                                        </div>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Refs */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Your Order No.</label>
                            <select 
                                value={orderId} 
                                onChange={e => setOrderId(e.target.value)}
                                className={inputCls}
                            >
                                <option value="">Select order...</option>
                                {orders.map(o => (
                                    <option key={o.id} value={o.id}>
                                        {o.order_number} ({o.style_number})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Sender's Ref No.</label>
                            <input value={refOrderNumber} onChange={e => setRefOrderNumber(e.target.value)}
                                placeholder="e.g. DC-123" className={inputCls} />
                        </div>
                    </div>

                    {/* Items */}
                    <div>
                        <label className={labelCls}>Items Received</label>
                        <ItemsTable items={items} onChange={setItems} />
                    </div>

                    {/* Discrepancies */}
                    <div>
                        <label className={labelCls}>Discrepancies / Issues</label>
                        <textarea
                            value={discrepancies}
                            onChange={e => setDiscrepancies(e.target.value)}
                            rows={2}
                            placeholder="Describe any shortages, damage, or wrong items arrive…"
                            className={inputCls + ' resize-none'}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className={labelCls}>Notes (optional)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="Any additional internal notes…"
                            rows={2}
                            className={inputCls + ' resize-none'} />
                    </div>
                </div>

                {/* Footer: Fixed */}
                <div className="px-6 pt-4 border-t border-gray-100 flex gap-3 bg-gray-50/50 flex-none safe-pb-deep">
                    <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 text-gray-500 rounded-2xl font-black text-sm hover:border-gray-300 transition-all">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                        className="flex-[2] py-3 bg-[#008069] text-white rounded-2xl font-black text-sm shadow-md hover:bg-[#006a57] disabled:opacity-40 transition-all">
                        {saving ? (initialData ? 'Updating...' : 'Saving...') : (initialData ? '💾 Save Changes' : '📥 Record Receipts')}
                    </button>
                </div>
            </div>

            {isAddingContact && (
                <AddContactModal
                    form={contactForm}
                    setForm={setContactForm}
                    isEditing={false}
                    isSaving={savingContact}
                    isGSTValid={isGSTValid}
                    isPINValid={isPINValid}
                    handleGSTInput={handleGSTInput}
                    handlePINInput={handlePINInput}
                    onSave={saveContact}
                    onClose={closeContactModal}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};
