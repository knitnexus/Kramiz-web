import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { User, Channel, Company, PurchaseOrder, hasPermission } from '../types';
import { api } from '../supabaseAPI';

export const useSidebar = (currentUser: User, selectedGroupId?: string) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'ORDERS' | 'PARTNERS'>('ORDERS');
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [expandedPOs, setExpandedPOs] = useState<Record<string, boolean>>({});
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
    const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [userCompany, setUserCompany] = useState<Company | null>(null);
    const [vendorsList, setVendorsList] = useState<Company[]>([]);
    const [modalState, setModalState] = useState<{
        type: 'NONE' | 'NEW_PO' | 'ADD_GROUP' | 'EDIT_PO' | 'DELETE_PO';
        data?: any;
    }>({ type: 'NONE' });

    // Form States
    const [newPOData, setNewPOData] = useState({ orderNo: '', styleNo: '', selectedTeamMembers: [] as string[] });
    const [newGroupData, setNewGroupData] = useState({ name: '', vendorId: '' });
    const [editPOData, setEditPOData] = useState({ orderNo: '', styleNo: '', status: 'PENDING' });

    const prevSelectedId = useRef<string | undefined>(selectedGroupId);

    // Queries
    const { data: pos = [], isLoading: loadingPOs } = useQuery({
        queryKey: ['pos', currentUser.id],
        queryFn: () => api.getPOs(currentUser),
    });

    const { data: allChannels = [], isLoading: loadingChannels } = useQuery({
        queryKey: ['channels', currentUser.id],
        queryFn: () => api.getAllChannels(currentUser),
    });

    const { data: partners = [], isLoading: loadingPartners } = useQuery({
        queryKey: ['partners', currentUser.id],
        queryFn: () => api.getPartners(currentUser),
    });

    const loading = loadingPOs || loadingChannels || loadingPartners;


    // Derived Data
    const channelsMap = useMemo(() => {
        const map: Record<string, Channel[]> = {};
        allChannels.forEach(ch => {
            if (!map[ch.po_id]) map[ch.po_id] = [];
            map[ch.po_id].push(ch);
        });
        Object.keys(map).forEach(poId => {
            map[poId].sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateA - dateB;
            });
        });
        return map;
    }, [allChannels]);

    // Permissions — in peer model, all companies can create POs and groups
    const canCreatePO = hasPermission(currentUser.role, 'CREATE_PO');
    const canEditPO = hasPermission(currentUser.role, 'EDIT_PO');
    const canDeletePO = hasPermission(currentUser.role, 'DELETE_PO');
    const canCreateGroup = hasPermission(currentUser.role, 'CREATE_CHANNEL');

    useEffect(() => {
        const loadCompany = async () => {
            const company = await api.getCompany(currentUser.company_id);
            setUserCompany(company);
        };
        loadCompany();
    }, [currentUser.company_id]);

    useEffect(() => {
        setActiveTab('ORDERS');
    }, []);

    useEffect(() => {
        if (!selectedGroupId && prevSelectedId.current) {
            queryClient.invalidateQueries({ queryKey: ['pos'] });
            queryClient.invalidateQueries({ queryKey: ['channels'] });
        }
        prevSelectedId.current = selectedGroupId;
    }, [selectedGroupId, queryClient]);

    // Mutations
    const handleRefresh = () => {
        queryClient.invalidateQueries();
    };

    const createPOMutation = useMutation({
        mutationFn: (data: { orderNo: string; styleNo: string; selectedTeamMembers: string[] }) =>
            api.createPO(currentUser, data.orderNo, data.styleNo, data.selectedTeamMembers),
        onSuccess: () => {
            closeModal();
            handleRefresh();
            setNewPOData({ orderNo: '', styleNo: '', selectedTeamMembers: [] });
        }
    });

    const createGroupMutation = useMutation({
        mutationFn: (data: { name: string; vendorId: string; poId: string }) =>
            api.createChannel(currentUser, data.poId, data.name, data.vendorId),
        onSuccess: () => {
            closeModal();
            handleRefresh();
        },
        onError: (err: any) => alert(err.message || "Failed to create group")
    });

    const handleCreatePO = async () => {
        if (!newPOData.orderNo || !newPOData.styleNo) return;
        createPOMutation.mutate(newPOData);
    };

    const handleCreateGroup = async () => {
        if (!newGroupData.name.trim() || !newGroupData.vendorId) {
            alert("Please fill in Group Name and assign a Supplier.");
            return;
        }
        createGroupMutation.mutate({ ...newGroupData, poId: modalState.data.poId });
    };

    const handlePOStatusChange = async (poId: string, newStatus: any) => {
        try {
            await api.updatePOStatus(poId, newStatus);
            handleRefresh();
        } catch (err: any) { alert(err.message || "Failed to update status"); }
    };

    const handleEditPO = async () => {
        if (!modalState.data?.id) return;
        setIsProcessing(true);
        try {
            await api.updatePO(currentUser, modalState.data.id, {
                order_number: editPOData.orderNo,
                style_number: editPOData.styleNo,
                status: editPOData.status as any
            });
            closeModal();
            handleRefresh();
        } catch (err: any) { alert(err.message || "Failed to update PO"); }
        finally { setIsProcessing(false); }
    };

    const handleDeletePO = async () => {
        if (!modalState.data?.id) return;
        setIsProcessing(true);
        try {
            await api.deletePO(currentUser, modalState.data.id);
            closeModal();
            handleRefresh();
        } catch (err: any) { alert(err.message || "Failed to delete PO"); }
        finally { setIsProcessing(false); }
    };

    const openModal = async (type: typeof modalState.type, data?: any) => {
        setModalState({ type, data });
        if (type === 'ADD_GROUP') {
            setVendorsList(await api.getAcceptedPartners(currentUser));
            setNewGroupData({ name: '', vendorId: '' });
        }
        if (type === 'EDIT_PO' && data) {
            setEditPOData({ orderNo: data.order_number, styleNo: data.style_number, status: data.status });
        }
    };

    const closeModal = () => setModalState({ type: 'NONE' });

    const togglePO = (id: string) => {
        setExpandedPOs(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const isOverdue = (date: string | undefined) => {
        if (!date) return false;
        const d = new Date(date);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        return d < now;
    };

    return {
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
        queryClient,
        navigate
    };
};
