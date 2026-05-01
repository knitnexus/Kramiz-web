/**
 * notifications.ts
 *
 * API functions for retrieving notification history and managing preferences.
 */

import { supabase } from '../supabaseClient';
import { User } from '../types';

export const getNotifications = async (currentUser: User) => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
};

export const markNotificationRead = async (notificationId: string) => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) throw new Error(error.message);
};

export const updateUserNotificationPreference = async (userId: string, enabled: boolean) => {
    const { error } = await supabase
        .from('users')
        .update({ notifications_enabled: enabled })
        .eq('id', userId);

    if (error) throw new Error(error.message);
};

export const saveNotification = async (params: {
    user_id: string;
    title: string;
    body: string;
    type?: string;
    extra_data?: any;
}) => {
    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id:    params.user_id,
            title:      params.title,
            body:       params.body,
            type:       params.type,
            extra_data: params.extra_data,
        });
    
    if (error) console.error('[API] Failed to save notification:', error);
};

export const saveNotificationForCompany = async (params: {
    company_id: string;
    title: string;
    body: string;
    type?: string;
    extra_data?: any;
}) => {
    // Find all admins
    const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('company_id', params.company_id)
        .eq('role', 'ADMIN');
    
    if (admins) {
        const inserts = admins.map(a => ({
            user_id:    a.id,
            title:      params.title,
            body:       params.body,
            type:       params.type,
            extra_data: params.extra_data,
        }));
        await supabase.from('notifications').insert(inserts);
    }
};
