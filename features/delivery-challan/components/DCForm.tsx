/**
 * DCForm.tsx
 * Feature: Delivery Challan (Phase 3)
 *
 * Slide-up modal for creating an Outward Delivery Challan.
 * Steps:
 *   1. Recipient (partner or manual contact)
 *   2. Order refs (optional)
 *   3. Items table
 *   4. Driver details (optional — name, phone, photo)
 *   5. Notes
 *
 * On submit → api.createDeliveryChallan() → returns the DC
 * If channelId is passed, the DC is linked to that chat.
 * The parent should post a [DC:{id}] message into the channel.
 *
 * Used by: ChatRoom attach menu + standalone DC section
 */

import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../supabaseAPI';
import { User, DCItem, Contact, Company, Driver } from '../../../types';
import { ItemsTable } from './ItemsTable';

interface DCFormProps {
    currentUser: User;
    channelId?:  string;   // if opened from a chat
    onCreated:   (dcId: string, dcNumber: string) => void;
    onClose:     () => void;
}

const BLANK_ITEMS: DCItem[] = [{ description: '', quantity: 0, unit: 'KG' }];

export const DCForm: React.FC<DCFormProps> = ({ currentUser, channelId, onCreated, onClose }) => {

    // ── Form state ─────────────────────────────────────────────────────────────
    const [recipientType, setRecipientType]   = useState<'partner' | 'contact'>('partner');
    const [selectedPartnerId, setPartner]     = useState('');
    const [selectedContactId, setContact]     = useState('');
    const [orderNumber, setOrderNumber]       = useState('');
    const [refOrderNumber, setRefOrderNumber] = useState('');
    const [items, setItems]                   = useState<DCItem[]>(BLANK_ITEMS);
    const [driverName, setDriverName]         = useState('');
    const [driverPhone, setDriverPhone]       = useState('');
    const [driverPhotoUrl, setDriverPhotoUrl] = useState('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [notes, setNotes]                   = useState('');
    const [saving, setSaving]                 = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    const photoInputRef = useRef<HTMLInputElement>(null);

    // ── Data queries ───────────────────────────────────────────────────────────
    const { data: partners = [] } = useQuery<Company[]>({
        queryKey: ['partners', currentUser.company_id],
        queryFn:  () => api.getPartners(currentUser),
    });

    const { data: contacts = [] } = useQuery<Contact[]>({
        queryKey: ['contacts', currentUser.company_id],
        queryFn:  () => api.getContacts(currentUser),
    });

    const { data: savedDrivers = [] } = useQuery<Driver[]>({
        queryKey: ['drivers', currentUser.company_id],
        queryFn:  () => api.getDrivers(currentUser),
    });

    // ── Photo upload ───────────────────────────────────────────────────────────
    const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingPhoto(true);
        try {
            const url = await api.uploadDriverPhoto(currentUser, file);
            setDriverPhotoUrl(url);
        } catch (err: any) { alert(err.message); }
        finally { setUploadingPhoto(false); }
    };

    // ── Use saved driver ───────────────────────────────────────────────────────
    const applyDriver = (driver: Driver) => {
        setSelectedDriver(driver);
        setDriverName(driver.name);
        setDriverPhone(driver.phone || '');
        setDriverPhotoUrl(driver.photo_url || '');
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        const validItems = items.filter(it => it.description.trim() && it.quantity > 0);
        if (!validItems.length) { alert('Add at least one item with description and quantity'); return; }

        const hasRecipient = recipientType === 'partner' ? !!selectedPartnerId : !!selectedContactId;
        if (!hasRecipient) { alert('Please select a recipient'); return; }

        setSaving(true);
        try {
            // partners is Company[] — selectedPartnerId IS the company ID
            const dc = await api.createDeliveryChallan(currentUser, {
                channel_id:          channelId,
                receiver_company_id: recipientType === 'partner' ? selectedPartnerId : undefined,
                receiver_contact_id: recipientType === 'contact' ? selectedContactId : undefined,
                order_number:        orderNumber || undefined,
                ref_order_number:    refOrderNumber || undefined,
                items:               validItems,
                driver_name:         driverName || undefined,
                driver_phone:        driverPhone || undefined,
                driver_photo_url:    driverPhotoUrl || undefined,
                notes:               notes || undefined,
            });

            // Save driver profile if new (has a name, not a pre-saved driver)
            if (driverName && !selectedDriver) {
                await api.saveDriver(currentUser, {
                    name:      driverName,
                    phone:     driverPhone || undefined,
                    photo_url: driverPhotoUrl || undefined,
                });
            }

            onCreated(dc.id, dc.dc_number);
        } catch (err: any) {
            alert(err.message || 'Failed to create DC');
        } finally {
            setSaving(false);
        }
    };

    // ── Section label ──────────────────────────────────────────────────────────
    const SectionTitle: React.FC<{ emoji: string; title: string; subtitle?: string }> = ({ emoji, title, subtitle }) => (
        <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-base">{emoji}</div>
            <div>
                <p className="text-sm font-black text-gray-900">{title}</p>
                {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
            </div>
        </div>
    );

    const inputCls = 'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008069] transition-all';

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h3 className="font-black text-gray-900">Create Delivery Challan</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Outward dispatch record</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

                    {/* ─ Section 1: Recipient ─────────────────────────────── */}
                    <div>
                        <SectionTitle emoji="🏢" title="Recipient" />

                        {/* Toggle */}
                        <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
                            {(['partner', 'contact'] as const).map(t => (
                                <button key={t} onClick={() => setRecipientType(t)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-black capitalize transition-all ${
                                        recipientType === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
                                    }`}>
                                    {t === 'partner' ? '🤝 Connected Partner' : '📋 Manual Contact'}
                                </button>
                            ))}
                        </div>

                        {recipientType === 'partner' ? (
                            <select value={selectedPartnerId} onChange={e => setPartner(e.target.value)} className={inputCls}>
                                <option value="">Select a partner…</option>
                                {partners.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}{p.gst_number ? ` — ${p.gst_number}` : ''}</option>
                                ))}
                            </select>
                        ) : (
                            <select value={selectedContactId} onChange={e => setContact(e.target.value)} className={inputCls}>
                                <option value="">Select a contact…</option>
                                {contacts.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}{c.gst_number ? ` — ${c.gst_number}` : ''}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* ─ Section 2: Order Refs ────────────────────────────── */}
                    <div>
                        <SectionTitle emoji="📋" title="Order References" subtitle="Both optional" />
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Your Order No.</label>
                                <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)}
                                    placeholder="e.g. PO-505" className={inputCls} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Buyer's Ref No.</label>
                                <input value={refOrderNumber} onChange={e => setRefOrderNumber(e.target.value)}
                                    placeholder="e.g. BPO-2024-88" className={inputCls} />
                            </div>
                        </div>
                    </div>

                    {/* ─ Section 3: Items ─────────────────────────────────── */}
                    <div>
                        <SectionTitle emoji="📦" title="Items" />
                        <ItemsTable items={items} onChange={setItems} />
                    </div>

                    {/* ─ Section 4: Driver ────────────────────────────────── */}
                    <div>
                        <SectionTitle emoji="🚚" title="Driver / Courier" subtitle="Optional — for proof of pickup" />

                        {/* Saved drivers quick-select */}
                        {savedDrivers.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                                {savedDrivers.map(d => (
                                    <button key={d.id} onClick={() => applyDriver(d)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border flex-shrink-0 transition-all ${
                                            selectedDriver?.id === d.id
                                                ? 'bg-[#008069] text-white border-[#008069]'
                                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#008069]'
                                        }`}>
                                        {d.photo_url
                                            ? <img src={d.photo_url} className="w-5 h-5 rounded-full object-cover" alt="" />
                                            : <span>🚚</span>
                                        }
                                        {d.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Driver Name</label>
                                    <input value={driverName} onChange={e => setDriverName(e.target.value)}
                                        placeholder="Full name" className={inputCls} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Phone</label>
                                    <input value={driverPhone} onChange={e => {
                                        const v = e.target.value.replace(/\D/g, '');
                                        if (v.length <= 10) setDriverPhone(v);
                                    }} placeholder="10 digits" maxLength={10} className={`${inputCls} font-mono`} />
                                </div>
                            </div>

                            {/* Photo */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Driver Photo</label>
                                <input ref={photoInputRef} type="file" accept="image/*" capture="environment"
                                    onChange={handlePhotoCapture} className="hidden" />

                                {driverPhotoUrl ? (
                                    <div className="flex items-center gap-3">
                                        <img src={driverPhotoUrl} alt="Driver" className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                                        <div>
                                            <p className="text-xs font-bold text-green-600 mb-1">✓ Photo captured</p>
                                            <button onClick={() => { setDriverPhotoUrl(''); photoInputRef.current?.click(); }}
                                                className="text-xs text-gray-400 hover:text-gray-600 font-medium">
                                                Retake
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}
                                        className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 font-bold hover:border-[#008069] hover:text-[#008069] transition-all disabled:opacity-50">
                                        {uploadingPhoto ? (
                                            <><span className="w-4 h-4 border-2 border-gray-300 border-t-[#008069] rounded-full animate-spin" /> Uploading…</>
                                        ) : (
                                            <><span className="text-lg">📷</span> Take/Upload Driver Photo</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ─ Section 5: Notes ─────────────────────────────────── */}
                    <div>
                        <SectionTitle emoji="📝" title="Notes" subtitle="Optional" />
                        <textarea value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="Any additional notes for this dispatch…"
                            rows={2}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008069] transition-all resize-none" />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                    <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 text-gray-500 rounded-2xl font-black text-sm hover:border-gray-300 transition-all">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                        className="flex-[2] py-3 bg-[#008069] text-white rounded-2xl font-black text-sm shadow-md hover:bg-[#006a57] disabled:opacity-40 transition-all">
                        {saving ? 'Creating DC…' : '📦 Create Delivery Challan'}
                    </button>
                </div>
            </div>
        </div>
    );
};
