import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { User, Contact, Message } from '../types';
import { aiApi } from '../api/ai';
import { api } from '../supabaseAPI';

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
