import React, { useEffect, useState, useRef } from 'react';
import { User, PurchaseOrder, Channel, Company, hasPermission } from '../types';
import { api } from '../supabaseAPI';
import { Modal } from './Modal';
import { useSidebar } from '../hooks/useSidebar';

interface SidebarProps {
    currentUser: User;
    onSelectGroup: (channel: Channel, po: PurchaseOrder) => void;
    selectedGroupId?: string;
    onLogout: () => void;
    installPrompt?: any;
    onInstallApp?: () => void;
    onTakeTour?: () => void;
    isTourActive?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentUser, onSelectGroup, selectedGroupId, onLogout, installPrompt, onInstallApp, onTakeTour, isTourActive }) => {
    const {
        activeTab, setActiveTab,
        globalSearchQuery, setGlobalSearchQuery,
        expandedPOs, togglePO,
        isSupplierDropdownOpen, setIsSupplierDropdownOpen,
        supplierSearchQuery, setSupplierSearchQuery,
        isProcessing,
        userCompany,
        vendorsList,
        modalState,
        openModal, closeModal,
        newPOData, setNewPOData,
        newGroupData, setNewGroupData,
        editPOData, setEditPOData,
        loading,
        pos, allChannels, partners,
        channelsMap,
        canCreatePO, canEditPO, canDeletePO, canCreateGroup,
        handleCreatePO, handleCreateGroup, handlePOStatusChange,
        handleEditPO, handleDeletePO,
        createPOMutation, createGroupMutation,
        isOverdue,
        queryClient, navigate
    } = useSidebar(currentUser, selectedGroupId);

    const supplierComboboxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (supplierComboboxRef.current && !supplierComboboxRef.current.contains(event.target as Node)) {
                setIsSupplierDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setIsSupplierDropdownOpen]);


    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full md:w-[400px]">
            {/* Header & Tabs */}
            <div className="bg-[#f0f2f5] border-b sticky top-0 z-10 flex flex-col safe-pt">
                <div className="px-1 py-1 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="h-12 w-28 p-2 flex items-center justify-center">
                            <img src="/logo_v2.png" alt="Kramiz" className="w-full h-full object-contain" />
                        </div>
                    </div>
                    <div className="flex flex-col items-end py-1 px-3">
                        <h2 className="text-[14px] font-bold text-gray-900 leading-tight tracking-tight">{currentUser.name}</h2>
                    </div>
                </div>

                <div className="px-4 py-2 bg-white/50 border-t border-gray-100 flex justify-center items-center">
                    <span className="text-[14px] text-gray-500 font-medium">{userCompany?.name}</span>
                </div>

                <div className="flex">
                    <button onClick={() => setActiveTab('ORDERS')} className={`flex-1 py-2 text-m font-medium border-b-2 transition-colors ${activeTab === 'ORDERS' ? 'border-[#008069] text-[#008069]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Orders</button>
                    <button onClick={() => setActiveTab('PARTNERS')} className={`flex-1 py-2 text-m font-medium border-b-2 transition-colors ${activeTab === 'PARTNERS' ? 'border-[#008069] text-[#008069]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Partners</button>
                </div>
            </div>

            {/* Global Search Bar */}
            <div className="px-4 py-2 border-b border-gray-100">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={`Search ${activeTab.toLowerCase()}...`}
                        value={globalSearchQuery}
                        onChange={(e) => setGlobalSearchQuery(e.target.value)}
                        className="w-full bg-gray-100 border-none rounded-lg py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-[#00a884]"
                    />
                    <div className="absolute left-3 top-2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center text-gray-400 text-sm">Syncing secure data...</div>
                ) : activeTab === 'ORDERS' ? (
                    <React.Fragment>
                        {(() => {
                            const filteredPos = pos.filter(po => 
                                po.order_number.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
                                po.style_number?.toLowerCase().includes(globalSearchQuery.toLowerCase())
                            );

                            if (filteredPos.length === 0 && isTourActive) {
                                // Guest view for tour omitted for brevity or can be re-added if needed
                            }

                            if (filteredPos.length === 0) {
                                return <div className="p-4 text-center text-gray-400 text-sm">No matching orders found.</div>;
                            }

                            return filteredPos.map(po => {
                                const poChannels = channelsMap[po.id] || [];
                                const isCompleted = po.status === 'COMPLETED';
                                const isExpanded = expandedPOs[po.id] ?? true;
                                const hasUnread = poChannels.some(ch => ch.last_activity_at && ch.last_read_at && new Date(ch.last_activity_at) > new Date(ch.last_read_at));
                                return (
                                    <div key={po.id} className={`mb-3 mx-2 rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-all duration-300 ${isExpanded ? 'bg-white ring-1 ring-gray-200 shadow-md' : 'bg-gray-100 hover:bg-gray-200'} ${isCompleted ? 'opacity-60' : ''}`}>
                                        <div onClick={() => togglePO(po.id)} className={`px-4 py-3 flex gap-3 items-center group relative cursor-pointer transition-colors ${!isExpanded ? 'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]' : ''}`}>
                                            <svg className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-gray-900 text-[16px] truncate leading-tight">{po.order_number}</h3>
                                                    {hasUnread && !isExpanded && <div className="w-2 h-2 bg-[#00a884] rounded-full"></div>}
                                                </div>
                                                <p className="text-[12px] font-medium text-gray-500 truncate uppercase tracking-wider mt-0.5">{po.style_number}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={po.status}
                                                    onChange={(e) => handlePOStatusChange(po.id, e.target.value)}
                                                    className={`text-[12px] px-2 py-0.5 rounded border-none focus:ring-0 cursor-pointer font-light tracking-wide ${po.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700' : po.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <option value="PENDING">PENDING</option>
                                                    <option value="IN_PROGRESS">ACTIVE</option>
                                                    <option value="COMPLETED">DONE</option>
                                                </select>
                                                {canEditPO && (
                                                    <button onClick={(e) => { e.stopPropagation(); openModal('EDIT_PO', po); }} className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-[#008069] transition-all duration-200">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {isExpanded && (
                                            <div className="animate-in fade-in slide-in-from-top-1 duration-200 px-2 divide-y-2 divide-gray-100 bg-gray-100/30">
                                                {poChannels.map((ch, idx) => (
                                                    <div
                                                        key={ch.id}
                                                        onClick={() => {
                                                            onSelectGroup(ch, po);
                                                            api.markChannelAsRead(currentUser, ch.id);
                                                            queryClient.invalidateQueries({ queryKey: ['channels'] });
                                                        }}
                                                        className={`px-4 py-2 rounded cursor-pointer flex items-center relative group transition-all duration-300 hover:bg-gray-200 hover:shadow-sm ${selectedGroupId === ch.id ? 'bg-white shadow-inner' : ''}`}
                                                    >
                                                        {(ch.last_activity_at && ch.last_read_at && new Date(ch.last_activity_at) > new Date(ch.last_read_at)) && <div className="absolute left-3 w-2.5 h-2.5 bg-[#00a884] rounded-full shadow-md animate-pulse"></div>}
                                                        <div className="flex-1 ml-4">
                                                            <div className="flex justify-between items-center gap-3">
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className={`text-[16px] truncate ${ch.last_activity_at && ch.last_read_at && new Date(ch.last_activity_at) > new Date(ch.last_read_at) ? 'font-black text-gray-900' : 'font-regular text-gray-600 group-hover:text-gray-900'}`}>{ch.name}</span>
                                                                    {ch.due_date && (
                                                                        <span className={`text-[11px] font-normal uppercase tracking-tight ${isOverdue(ch.due_date) ? 'text-red-500' : 'text-gray-400'}`}>
                                                                            Due: {new Date(ch.due_date).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <span className={`text-[12px] font-light px-2 py-0.5 rounded-md uppercase tracking-tighter shadow-sm ${ch.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : (ch.status === 'IN_PROGRESS' || ch.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700')}`}>{ch.status}</span>
                                                                    <svg className="w-4 h-4 text-gray-400 group-hover:text-[#008069] transition-all duration-300 transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {!isCompleted && canCreateGroup && (
                                                    <div className="px-4 py-2 rounded border-t border-gray-50">
                                                        <button onClick={() => openModal('ADD_GROUP', { poId: po.id })} className="w-full py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center gap-1.5 transition-all">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Add Group
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                        })()}
                    </React.Fragment>
                ) : (
                    <div className="pb-2 px-2 space-y-2 pt-.5">
                        {partners.filter(p => p.name.toLowerCase().includes(globalSearchQuery.toLowerCase())).length === 0 && <div className="p-4 text-center text-gray-400 text-sm">No partners found. Use Settings → Partners to connect.</div>}
                        {partners.filter(p => p.name.toLowerCase().includes(globalSearchQuery.toLowerCase())).map(partner => (
                            <div key={partner.id} className="mb-4 mx-2 rounded-xl border border-gray-200 overflow-hidden bg-white shadow-md ring-1 ring-gray-200">
                                <div className="px-4 py-2 bg-slate-50 font-bold text-[11px] text-slate-500 uppercase tracking-widest border-b border-gray-200">{partner.name}</div>
                                {allChannels.filter(c => c.vendor_id === partner.id || pos.find(p => p.id === c.po_id)?.manufacturer_id === partner.id).map(ch => {
                                    const parentPO = pos.find(p => p.id === ch.po_id);
                                    if (!parentPO) return null;
                                    return (
                                        <div key={ch.id} onClick={() => { onSelectGroup(ch, parentPO); api.markChannelAsRead(currentUser, ch.id); queryClient.invalidateQueries({ queryKey: ['channels'] }); }} className={`px-4 py-2.5 cursor-pointer hover:bg-gray-50 flex items-center relative group border-b border-gray-100 last:border-b-0 ${selectedGroupId === ch.id ? 'bg-[#f0f2f5]' : ''}`}>
                                            {(ch.last_activity_at && ch.last_read_at && new Date(ch.last_activity_at) > new Date(ch.last_read_at)) && <div className="absolute left-1.5 w-2 h-2 bg-[#00a884] rounded-full shadow-sm"></div>}
                                            <div className="flex-1 flex justify-between items-center min-w-0">
                                                <div className="flex flex-col min-w-0">
                                                    <span className={`text-[15px] truncate ${ch.last_activity_at && ch.last_read_at && new Date(ch.last_activity_at) > new Date(ch.last_read_at) ? 'font-bold text-gray-900' : 'font-regular text-gray-700'}`}>{ch.name} ({parentPO.order_number})</span>
                                                    {ch.due_date && (
                                                        <span className={`text-[10px] font-normal uppercase tracking-tight ${isOverdue(ch.due_date) ? 'text-red-500' : 'text-gray-400'}`}>
                                                            Due: {new Date(ch.due_date).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={`text-[10px] font-normal px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm border ${ch.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-100' : (ch.status === 'IN_PROGRESS' || ch.status === 'ACTIVE' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100')}`}>{ch.status}</span>
                                                    <svg className="w-4 h-4 text-gray-300 group-hover:text-[#008069] transition-all transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center relative safe-pb">
                <div className="relative">
                    <button 
                        onClick={() => navigate('/settings')} 
                        className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg border border-gray-300 bg-white shadow-sm" 
                        title="Settings"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>
                {canCreatePO && (
                    <button onClick={() => openModal('NEW_PO')} className="h-10 w-10 flex items-center justify-center text-white bg-[#008069] hover:bg-[#006a57] rounded-full shadow-lg transition-transform hover:scale-105" title="Create New Order">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                )}
            </div>

            {/* Core Workflow Modals Omitted for brevitiy except NEW_PO, ADD_GROUP, EDIT_PO, DELETE_PO */}
            <Modal isOpen={modalState.type === 'NEW_PO'} onClose={closeModal} title="Create New Order" footer={<button onClick={handleCreatePO} disabled={createPOMutation.isPending} className="bg-[#008069] text-white px-6 py-2 rounded text-sm font-bold shadow-md hover:bg-[#006a57] disabled:bg-gray-300">{createPOMutation.isPending ? 'Creating...' : 'Create Order'}</button>}>
                <div className="space-y-4">
                    <div><label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-tight">Order Name/Number</label><input type="text" className="w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 focus:outline-none focus:border-[#008069]" placeholder="e.g. ORD-2024..." value={newPOData.orderNo} onChange={e => setNewPOData({ ...newPOData, orderNo: e.target.value })} /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-tight">Style Type</label><input type="text" className="w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 focus:outline-none focus:border-[#008069]" placeholder="e.g. T-Shirt..." value={newPOData.styleNo} onChange={e => setNewPOData({ ...newPOData, styleNo: e.target.value })} /></div>
                </div>
            </Modal>
            
            <Modal isOpen={modalState.type === 'ADD_GROUP'} onClose={closeModal} title="Add Supplier Group" footer={<button onClick={handleCreateGroup} disabled={createGroupMutation.isPending} className="bg-[#008069] text-white px-6 py-2 rounded text-sm font-bold shadow-md hover:bg-[#006a57] disabled:bg-gray-300">{createGroupMutation.isPending ? 'Adding...' : 'Add Group'}</button>}>
                <div className="space-y-4 pb-16">
                    <div><label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-tight">Group Name</label><input type="text" className="w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 focus:outline-none focus:border-[#008069]" placeholder="e.g. Knitting..." value={newGroupData.name} onChange={e => setNewGroupData({ ...newGroupData, name: e.target.value })} /></div>
                    <div className="relative" ref={supplierComboboxRef}>
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-tight mb-1">Assign Supplier</label>
                        <div className="relative">
                            <input type="text" className="w-full border rounded px-3 py-2 pr-8 text-sm bg-white border-gray-300 focus:outline-none focus:border-[#008069]" placeholder="Search supplier..." value={supplierSearchQuery || vendorsList.find(v => v.id === newGroupData.vendorId)?.name || ''} onChange={(e) => { setSupplierSearchQuery(e.target.value); setIsSupplierDropdownOpen(true); if (!e.target.value) setNewGroupData({ ...newGroupData, vendorId: '' }); }} onFocus={() => setIsSupplierDropdownOpen(true)} />
                            {isSupplierDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                                    {vendorsList.filter(v => v.name.toLowerCase().includes(supplierSearchQuery.toLowerCase())).map(v => (
                                        <div key={v.id} className={`px-3 py-2 text-m cursor-pointer hover:bg-gray-100 ${newGroupData.vendorId === v.id ? 'bg-[#008069]/10 text-[#008069] font-medium' : 'text-gray-700'}`} onClick={() => { setNewGroupData({ ...newGroupData, vendorId: v.id }); setSupplierSearchQuery(''); setIsSupplierDropdownOpen(false); }}>
                                            <div className="flex flex-col"><span className="font-semibold">{v.name}</span></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={modalState.type === 'EDIT_PO'} onClose={closeModal} title="Edit Order Details" footer={<div className="flex gap-3 justify-stretch">{canDeletePO && <button onClick={() => { closeModal(); openModal('DELETE_PO', modalState.data); }} disabled={isProcessing} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50">Delete Order</button>}<button onClick={handleEditPO} disabled={isProcessing} className="bg-[#008069] text-white px-6 py-2 rounded text-sm font-bold shadow-md hover:bg-[#006a57] disabled:bg-gray-300">{isProcessing ? 'Saving...' : 'Save Changes'}</button></div>}>
                <div className="space-y-4">
                    <div><label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-tight">Order #</label><input type="text" className="w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 focus:outline-none focus:border-[#008069]" value={editPOData.orderNo} onChange={e => setEditPOData({ ...editPOData, orderNo: e.target.value })} /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-tight">Style</label><input type="text" className="w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 focus:outline-none focus:border-[#008069]" value={editPOData.styleNo} onChange={e => setEditPOData({ ...editPOData, styleNo: e.target.value })} /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-tight">Status</label><select className="w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 focus:outline-none focus:border-[#008069]" value={editPOData.status} onChange={e => setEditPOData({ ...editPOData, status: e.target.value })}><option value="PENDING">Pending</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option></select></div>
                </div>
            </Modal>

            <Modal isOpen={modalState.type === 'DELETE_PO'} onClose={closeModal} title="Delete Order" footer={<div className="flex gap-3 justify-end"><button onClick={closeModal} disabled={isProcessing} className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50">Cancel</button><button onClick={handleDeletePO} disabled={isProcessing} className="px-6 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded font-bold shadow-md disabled:bg-red-400">{isProcessing ? 'Deleting...' : 'Delete'}</button></div>}><div className="space-y-3"><p className="text-sm text-gray-700">Are you sure you want to delete <strong>{modalState.data?.order_number}</strong>?</p><div className="bg-red-50 border border-red-200 rounded p-3"><p className="text-sm text-red-800 font-medium">⚠️ Warning</p><p className="text-xs text-red-700 mt-1">Permanently delete everything? This cannot be undone.</p></div></div></Modal>
        </div>
    );
};
