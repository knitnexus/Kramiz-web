 
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Channel, Order } from '../types';
import { api } from '../supabaseAPI';
import { Modal } from './Modal';

interface KramizSharePopupProps {
    currentUser: User;
    content: {
        type: 'text' | 'file';
        text?: string;
        fileUrl?: string;
        fileName?: string;
    };
    onClose: () => void;
    onSuccess?: () => void;
}

export const KramizSharePopup: React.FC<KramizSharePopupProps> = ({
    currentUser,
    content,
    onClose,
    onSuccess
}) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: allChannels = [], isLoading: loadingChannels } = useQuery<Channel[]>({
        queryKey: ['channels', currentUser.id],
        queryFn: () => api.getAllChannels(currentUser),
    });

    const { data: orders = [] } = useQuery<Order[]>({
        queryKey: ['orders', currentUser.id],
        queryFn: () => api.getOrders(currentUser),
    });

    const filteredChannels = useMemo(() => {
        if (!searchQuery.trim()) return allChannels;
        const q = searchQuery.toLowerCase();
        return allChannels.filter(ch => {
            const order = orders.find(o => o.id === ch.order_id);
            return (
                ch.name.toLowerCase().includes(q) ||
                order?.order_number.toLowerCase().includes(q) ||
                order?.style_number?.toLowerCase().includes(q)
            );
        });
    }, [allChannels, orders, searchQuery]);

    const groupedChannels = useMemo(() => {
        const groups: Record<string, { order: Order | null; channels: Channel[] }> = {};

        filteredChannels.forEach(ch => {
            const order = orders.find(o => o.id === ch.order_id) || null;
            const key = order ? order.id : 'General';
            if (!groups[key]) groups[key] = { order, channels: [] };
            groups[key].channels.push(ch);
        });

        return Object.values(groups).sort((a, b) => {
            if (!a.order) return 1;
            if (!b.order) return -1;
            return b.order.created_at.localeCompare(a.order.created_at);
        });
    }, [filteredChannels, orders]);

    const handleToggle = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedIds(next);
    };

    const handleSend = async () => {
        if (selectedIds.size === 0) return;
        setIsSending(true);
        try {
            let shareUrl = content.fileUrl;
            let isImage = false;

            // If it's a file from an external app, we MUST upload it to Supabase first
            // because the local URI (content:// or file://) is not accessible by other devices.
            if (content.type === 'file' && content.fileUrl) {
                try {
                    // 1. Fetch the file data from the local URI
                    const response = await fetch(content.fileUrl);
                    const blob = await response.blob();
                    
                    const fileName = content.fileName || 'shared_file';
                    // 2. Identify if it's an image for special treatment (previews)
                    isImage = blob.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                    
                    let fileToUpload: File | Blob = blob;
                    
                    // 3. Compress if it's an image to save space
                    if (isImage) {
                        try {
                            const { compressImage } = await import('../imageUtils');
                            fileToUpload = await compressImage(new File([blob], fileName, { type: blob.type }));
                        } catch (compressErr) {
                            console.warn('Compression failed, uploading original:', compressErr);
                        }
                    }
                    
                    // 4. Upload to Supabase Storage
                    shareUrl = await api.uploadFile(fileToUpload as File);
                } catch (uploadErr: any) {
                    console.error('File processing failed:', uploadErr);
                    // If fetch failed, it might be due to content:// URI issues or stale blobs
                    const msg = uploadErr.message?.includes('fetch') 
                        ? "Could not read the shared file. Please try saving it first and then uploading from the gallery."
                        : uploadErr.message;
                    throw new Error(msg);
                }
            }

            const targets = Array.from(selectedIds);
            await Promise.all(targets.map(async (channelId) => {
                if (content.type === 'file') {
                    // Use [IMAGE] tag for photos so they render as previews in ChatRoom
                    const tag = isImage ? '[IMAGE]' : '[FILE]';
                    await api.sendMessage(currentUser, channelId, `${tag} ${shareUrl} | ${content.fileName || (isImage ? 'Shared Photo' : 'Shared File')}`);
                } else if (content.text) {
                    await api.sendMessage(currentUser, channelId, content.text);
                }
            }));

            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Share failed:', err);
            alert('Failed to share: ' + err.message);
        } finally {
            setIsSending(false);
        }
    };


    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Share with Groups"
            footer={
                <button
                    onClick={handleSend}
                    disabled={selectedIds.size === 0 || isSending}
                    className="w-full py-4 bg-[#008069] text-white font-bold rounded-2xl shadow-lg hover:bg-[#006a57] disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {isSending ? 'Sending...' : `Send to ${selectedIds.size} Groups`}
                </button>
            }
        >
            <div className="flex flex-col gap-4 max-h-[75vh]">
                {/* Content Preview - Compact Senior Style */}
                <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100 text-left flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm shrink-0">
                        {content.type === 'file' ? '📄' : '💬'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Sharing Content</p>
                        <p className="text-sm text-gray-700 truncate font-black leading-tight">
                            {content.type === 'file' ? (content.fileName || 'File Attachment') : content.text}
                        </p>
                    </div>
                </div>

                {/* Search Bar - Modern Rounded */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search groups or order #..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#008069] transition-all"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                </div>

                {/* Groups List - Maximized Space */}
                <div className="flex-1 overflow-y-auto min-h-[300px] space-y-6 pr-1 minimal-scrollbar pb-4">

                    {loadingChannels ? (
                        <div className="py-10 text-center text-gray-400 animate-pulse font-medium">Fetching active groups...</div>
                    ) : groupedChannels.length === 0 ? (
                        <div className="py-10 text-center text-gray-400 text-sm italic">No matching groups found.</div>
                    ) : (
                        groupedChannels.map(({ order, channels }) => (
                            <div key={order?.id || 'general'} className="space-y-2">
                                <div className="flex items-center gap-2 px-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        {order ? `Order ${order.order_number}` : 'General'}
                                    </span>
                                    {order?.style_number && (
                                        <span className="text-[10px] font-bold text-gray-300">
                                            ({order.style_number})
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {channels.map(ch => (
                                        <button
                                            key={ch.id}
                                            onClick={() => handleToggle(ch.id)}
                                            className={`w-full text-left p-3.5 border rounded-2xl transition-all flex items-center justify-between group shadow-sm ${selectedIds.has(ch.id) ? 'bg-green-50 border-green-200 ring-1 ring-green-100' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-colors ${selectedIds.has(ch.id) ? 'bg-[#008069] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                    {ch.name[0]}
                                                </div>
                                                <span className={`font-bold text-sm ${selectedIds.has(ch.id) ? 'text-[#008069]' : 'text-gray-700'}`}>
                                                    {ch.name}
                                                </span>
                                            </div>
                                            {selectedIds.has(ch.id) && (
                                                <div className="h-6 w-6 bg-[#008069] rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-sm">✓</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
};
