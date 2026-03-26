
import React, { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { HashRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Login } from './components/Login';
import { api } from './supabaseAPI';
import { LandingPage } from './components/LandingPage';
import { Signup } from './components/Signup';
import { ProductTour } from './components/ProductTour';
import { User, Message } from './types';
import { saveSession, loadSession, clearSession } from './sessionUtils';
import { supabase } from './supabaseClient';
import { playNotificationSound, triggerVibration } from './notificationUtils';
import { MainLayout } from './components/MainLayout';
import { ChatRoom } from './components/ChatRoom';
import WelcomeView from './components/WelcomeView';
import { findGroupByIdOrSlug } from './routeUtils';
import { initializeNativePlugins, isNative, scheduleLocalNotification } from './capacitorUtils';

import { useLocation } from 'react-router-dom';
import { SettingsPage } from './components/SettingsPage';
import { useOnboarding } from './hooks/useOnboarding';
import { useGlobalNotifications } from './hooks/useGlobalNotifications';
import { useAppSync } from './hooks/useAppSync';

const AuthenticatedApp: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const { groupId } = useParams();
    const isSettings = location.pathname === '/settings';

    const {
        deferredPrompt, setDeferredPrompt, showInstallPopup,
        setShowInstallPopup, runTour, setRunTour, handleInstall
    } = useOnboarding();

    useGlobalNotifications(user, groupId);

    // Fetch data for the layout
    const { data: allChannels = [] } = useQuery({
        queryKey: ['channels', user.id],
        queryFn: () => api.getAllChannels(user),
    });

    const { data: pos = [] } = useQuery({
        queryKey: ['pos', user.id],
        queryFn: () => api.getPOs(user),
    });

    const { data: userCompany } = useQuery({
        queryKey: ['company', user.company_id],
        queryFn: () => api.getCompany(user.company_id),
        enabled: !!user.company_id
    });

    const selectedChannel = findGroupByIdOrSlug(groupId, allChannels, pos, userCompany || undefined);
    const selectedPO = selectedChannel ? pos.find(p => p.id === selectedChannel.po_id) || null : null;


    return (
        <MainLayout
            user={user}
            handleLogout={onLogout}
            deferredPrompt={deferredPrompt}
            setDeferredPrompt={setDeferredPrompt}
            setRunTour={setRunTour}
            runTour={runTour}
            isSettings={isSettings}
        >
            {isSettings ? (
                <SettingsPage currentUser={user} onLogout={onLogout} />
            ) : groupId ? (
                selectedChannel && selectedPO ? (
                    <ChatRoom
                        currentUser={user}
                        channel={selectedChannel}
                        po={selectedPO}
                        onBack={() => navigate('/')}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-white">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008069]"></div>
                    </div>
                )
            ) : (
                <WelcomeView />
            )}

            {/* Premium Installation Prompt */}
            {showInstallPopup && deferredPrompt && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-[2px] md:bg-transparent md:items-end md:justify-start md:p-8">
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
                        <div className="flex items-start gap-4">
                            <div className="h-16 w-16 bg-gray-50 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-inner">
                                <img src="/Kramiz%20app%20icon.png" alt="Kramiz" className="w-10 h-10 object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-black text-gray-900 leading-tight">Install Kramiz (Beta)</h3>
                                <p className="text-sm text-gray-500 mt-1 leading-relaxed">Add Kramiz to your home screen for high-speed tracking.</p>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleInstall}
                                className="flex-1 py-3 bg-[#008069] text-white rounded-xl font-bold text-sm hover:bg-[#006a57] shadow-lg transition-all active:scale-95"
                            >
                                Install Now
                            </button>
                            <button onClick={() => setShowInstallPopup(false)} className="px-5 py-3 bg-gray-50 text-gray-400 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all font-blanka">Later</button>
                        </div>
                    </div>
                </div>
            )}

            <ProductTour
                currentUser={user}
                run={runTour}
                onFinish={() => {
                    setRunTour(false);
                    localStorage.setItem('kramiz_onboarded', 'true');
                }}
            />
        </MainLayout>
    );
};

const AppRoutes: React.FC<{
    user: User | null;
    handleDemoLogin: () => Promise<void>;
    handleLogin: (loggedInUser: User, rememberMe: boolean) => void;
    handleLogout: () => void;
}> = ({ user, handleDemoLogin, handleLogin, handleLogout }) => {
    const navigate = useNavigate();

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : (isNative ? <Navigate to="/login" replace /> : <LandingPage onDemoLogin={handleDemoLogin} />)} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} onBack={() => navigate('/')} />} />
            <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup onBack={() => navigate('/')} onSignupSuccess={() => navigate('/login')} />} />

            {/* Protected App Routes */}
            <Route path="/dashboard" element={user ? <AuthenticatedApp user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />} />
            <Route path="/group/:groupId" element={user ? <AuthenticatedApp user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />} />
            <Route path="/settings" element={user ? <AuthenticatedApp user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const App: React.FC = () => {
    const {
        user, isRestoringSession, handleLogin, handleLogout, handleDemoLogin
    } = useAppSync();


    if (isRestoringSession) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
                <div className="text-center">
                    <div className="h-20 w-48 mb-6 flex items-center justify-center mx-auto">
                        <img src="/logo_v2.png" alt="Kramiz" className="w-full h-full object-contain animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 font-blanka tracking-widest uppercase">Kramiz</h2>
                    <p className="text-sm text-gray-500 mt-2">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <HashRouter>
            <AppRoutes
                user={user}
                handleDemoLogin={handleDemoLogin}
                handleLogin={handleLogin}
                handleLogout={handleLogout}
            />
        </HashRouter>
    );
};

export default App;
