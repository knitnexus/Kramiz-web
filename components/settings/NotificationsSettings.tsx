import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubScreenContent } from './SettingsLayout';
import { User, Notification } from '../../types';
import { api } from '../../supabaseAPI';

interface NotificationsSettingsProps {
    currentUser: User;
}

export const NotificationsSettings: React.FC<NotificationsSettingsProps> = ({ currentUser }) => {
    const navigate = useNavigate();
    const [enabled, setEnabled] = useState(currentUser.notifications_enabled ?? true);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await api.getNotifications(currentUser);
                setNotifications(data || []);
                
                // Mark all as read when opening this screen
                const unread = data?.filter((n: Notification) => !n.is_read) || [];
                for (const n of unread) {
                    await api.markNotificationRead(n.id);
                }
            } catch (err) {
                console.error('Failed to fetch notifications:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [currentUser]);

    const handleToggle = async () => {
        const newVal = !enabled;
        setEnabled(newVal);
        try {
            await api.updateUserNotificationPreference(currentUser.id, newVal);
        } catch (err) {
            console.error('Failed to update preference:', err);
            setEnabled(!newVal); // Rollback
        }
    };

    const getIcon = (type?: string) => {
        switch (type) {
            case 'INVITE': return '🤝';
            case 'ACCEPT': return '✅';
            case 'BRIDGE': return '✨';
            case 'MESSAGE': return '💬';
            default: return '🔔';
        }
    };

    return (
        <SubScreenContent title="Notifications" onBack={() => navigate('/settings')}>
            <div className="space-y-6 max-w-2xl mx-auto px-4 py-4">

                
                {/* 1. Toggle Section */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[15px] font-semibold text-gray-900">Push Notifications</p>
                            <p className="text-[12px] text-gray-500 mt-0.5">Receive alerts for new messages, orders, and partner invites</p>
                        </div>
                        <button 
                            onClick={handleToggle}
                            className={`w-11 h-6 rounded-full transition-all duration-200 relative flex items-center px-1 ${enabled ? 'bg-[#008069]' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>

                {/* 2. History Section */}
                <div className="space-y-3">
                    <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider px-1">Notification History</h3>
                    
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                        {isLoading ? (
                            <div className="p-10 text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#008069] mx-auto mb-2"></div>
                                <p className="text-xs text-gray-400 font-blanka tracking-widest uppercase">Syncing...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                                    📭
                                </div>
                                <p className="text-[15px] font-medium text-gray-500">No notifications yet</p>
                                <p className="text-[12px] text-gray-400 mt-1">Updates about your business will appear here</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div key={n.id} className={`p-4 flex gap-4 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-green-50/30' : ''}`}>
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[14px] font-bold text-gray-900 truncate pr-2">{n.title}</p>
                                            <p className="text-[10px] text-gray-400 whitespace-nowrap pt-0.5">
                                                {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-2">
                                            {n.body}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-[11px] text-blue-600 leading-relaxed">
                        <b>Pro Tip:</b> System notifications are also mirrored in the relevant chat channels for easy context.
                    </p>
                </div>

            </div>
        </SubScreenContent>
    );
};
