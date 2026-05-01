import { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../supabaseAPI';
import { initializeNativePlugins } from '../capacitorUtils';
import { saveSession, loadSession, clearSession } from '../sessionUtils';

export const useAppSync = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isRestoringSession, setIsRestoringSession] = useState(true);

    useEffect(() => {
        const initApp = async () => {
            try {
                await initializeNativePlugins({
                    onTokenReceived: (token) => {
                        console.log('[Native] Token received:', token);
                        localStorage.setItem('native_push_token', token);
                        const savedUser = loadSession();
                        if (savedUser) {
                            api.saveNativePushToken(savedUser.id, token);
                        }
                    },
                    onNotificationAction: (action) => {
                        console.log('[Native] Notification action:', action);
                        const data = action.notification?.data;
                        if (data && data.channel_id) {
                            window.location.hash = `#/group/${data.channel_id}`;
                        }
                    }
                });

                const savedUser = loadSession();
                if (savedUser) {
                    // Force refresh profile from DB to get latest company_id/role
                    const latestProfile = await api.getUser(savedUser.id);
                    if (latestProfile) {
                        setUser(latestProfile);
                        saveSession(latestProfile, true); // Update local storage too
                        
                        const token = localStorage.getItem('native_push_token');
                        if (token) {
                            api.saveNativePushToken(latestProfile.id, token);
                        }
                    } else {
                        // User no longer exists
                        clearSession();
                        setUser(null);
                    }
                }
            } catch (err) {
                console.error("Session restoration failed:", err);
                clearSession();
            } finally {
                setIsRestoringSession(false);
            }
        };
        initApp();
    }, []);

    const handleLogin = (loggedInUser: User, rememberMe: boolean) => {
        saveSession(loggedInUser, rememberMe);
        setUser(loggedInUser);
        const token = localStorage.getItem('native_push_token');
        if (token) {
            api.saveNativePushToken(loggedInUser.id, token);
        }
    };

    const handleLogout = () => {
        clearSession();
        setUser(null);
    };

    return {
        user,
        setUser,
        isRestoringSession,
        handleLogin,
        handleLogout
    };
};
