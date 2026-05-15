import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { User, Contact, Message } from '../types';
import { aiApi } from '../api/ai';
import { api } from '../supabaseAPI';
import { isNative, takePhoto } from '../capacitorUtils';

interface AddContactAIModalProps {
    currentUser: User;
    message: Message;
    onClose: () => void;
    onSuccess: (contact: Contact) => void;
}

export const AddContactAIModal: React.FC<AddContactAIModalProps> = ({ 
    currentUser, message, onClose, onSuccess 
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Contact>>({
        name: '',
        gst_number: '',
        phone: '',
        address: '',
        state: '',
        pincode: '',
        notes: ''
    });

    const handleManualScan = async (file: File) => {
        setLoading(true);
        setError(null);
        try {
            const result = await aiApi.scanDocument(currentUser, file, 'VISITING_CARD');
            if (result.success && result.data) {
                const d = result.data;
                setFormData({
                    name: d.name || d.company_name || d.company || '',
                    gst_number: d.gst_number || '',
                    phone: d.phone || d.mobile || '',
                    address: d.address || '',
                    state: d.state || '',
                    pincode: d.pincode || '',
                    notes: `Extracted from uploaded image on ${new Date().toLocaleDateString()}`
                });
            } else {
                setError(result.error || 'AI could not extract contact information.');
            }
        } catch (err: any) {
            setError(err.message || 'Scan failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const performScan = async () => {
            try {
                let content: File | string = message.content;
                let type: any = 'VISITING_CARD'; // Default

                if (message.content.startsWith('[IMAGE]')) {
                    const url = message.content.split('|')[0].replace('[IMAGE]', '').trim();
                    content = await aiApi.urlToFile(url);
                } else if (message.content.startsWith('[FILE]')) {
                    const url = message.content.split('|')[0].replace('[FILE]', '').trim();
                    // For now, we treat file scan same as visiting card or invoice
                    content = await aiApi.urlToFile(url, 'document.pdf');
                    type = 'INVOICE'; // Use invoice logic for PDFs to find sender
                } else {
                    // Plain text extraction
                    type = 'VISITING_CARD'; 
                }

                const result = await aiApi.scanDocument(currentUser, content, type);
                
                if (result.success && result.data) {
                    const d = result.data;
                    setFormData({
                        name: d.name || d.company_name || '',
                        gst_number: d.gst_number || '',
                        phone: d.phone || d.mobile || '',
                        address: d.address || '',
                        state: d.state || '',
                        pincode: d.pincode || '',
                        notes: `Extracted from chat message on ${new Date().toLocaleDateString()}`
                    });
                } else {
                    setError(result.error || 'AI could not extract contact information.');
                }
            } catch (err: any) {
                setError(err.message || 'Scan failed');
            } finally {
                setLoading(false);
            }
        };

        performScan();
    }, []);

    const handleSave = async () => {
        if (!formData.name?.trim()) {
            alert('Name is required');
            return;
        }
        setLoading(true);
        try {
            const newContact = await api.createContact(currentUser, formData as any);
            onSuccess(newContact);
            onClose();
        } catch (err: any) {
            alert('Save failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Add to Contacts (AI Scan)">
            <div className="p-4 space-y-4">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#008069] border-t-transparent"></div>
                        <div className="text-center">
                            <p className="font-bold text-gray-800">AI is scanning...</p>
                            <p className="text-xs text-gray-400">Extracting details from your message</p>
                        </div>
                    </div>
                )}

                {!loading && !error && !formData.name && (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <p className="text-sm text-gray-500 text-center px-6">
                            No content found in this message. You can upload a photo of a visiting card instead.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e: any) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleManualScan(file);
                                    };
                                    input.click();
                                }}
                                className="flex-1 py-4 bg-[#008069] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                Camera
                            </button>
                            <button 
                                onClick={async () => {
                                    if (isNative) {
                                        const path = await takePhoto('gallery');
                                        if (path) {
                                            const res = await fetch(path);
                                            const blob = await res.blob();
                                            const file = new File([blob], 'gallery_contact.jpg', { type: 'image/jpeg' });
                                            handleManualScan(file);
                                        }
                                    } else {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = (e: any) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleManualScan(file);
                                        };
                                        input.click();
                                    }
                                }}
                                className="flex-1 py-4 bg-white border-2 border-[#008069] text-[#008069] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Gallery
                            </button>
                        </div>
                    </div>
                )}

                {error && !loading && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                        <button 
                            onClick={onClose}
                            className="mt-4 px-6 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold uppercase"
                        >
                            Close
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                            <span className="text-xl">✨</span>
                            <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                                AI has extracted these details. Please verify and edit any missing or incorrect information before saving.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company / Name</label>
                                <input 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#008069] transition-all text-sm font-bold"
                                    placeholder="Enter company name"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GST Number</label>
                                <input 
                                    value={formData.gst_number}
                                    onChange={e => setFormData({...formData, gst_number: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#008069] transition-all text-sm font-bold uppercase"
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <input 
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#008069] transition-all text-sm font-bold"
                                    placeholder="Contact phone"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pincode</label>
                                <input 
                                    value={formData.pincode}
                                    onChange={e => setFormData({...formData, pincode: e.target.value})}
                                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#008069] transition-all text-sm font-bold"
                                    placeholder="6 digits"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Address</label>
                            <textarea 
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#008069] transition-all text-sm font-bold resize-none h-20"
                                placeholder="Enter address"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={onClose}
                                className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex-[2] py-4 bg-[#008069] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-200 hover:shadow-xl transition-all active:scale-95"
                            >
                                Save Contact
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
