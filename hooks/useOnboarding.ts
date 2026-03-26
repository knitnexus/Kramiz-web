import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useOnboarding = () => {
    const queryClient = useQueryClient();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallPopup, setShowInstallPopup] = useState(false);
    const [runTour, setRunTour] = useState(false);

    const showOnboardingPrompts = () => {
        if (runTour) {
            setTimeout(showOnboardingPrompts, 5000);
            return;
        }
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        if (deferredPrompt) {
            setTimeout(() => setShowInstallPopup(true), 15000);
        }
    };

    useEffect(() => {
        const hasOnboarded = localStorage.getItem('kramiz_onboarded');
        if (!hasOnboarded) {
            setTimeout(() => setRunTour(true), 1500);
        }
        setTimeout(showOnboardingPrompts, 3000);

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !(window as any).isKramizUploading) {
                queryClient.invalidateQueries();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [deferredPrompt, runTour]);

    const handleInstall = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => {
                setDeferredPrompt(null);
                setShowInstallPopup(false);
            });
        }
    };

    return {
        deferredPrompt,
        setDeferredPrompt,
        showInstallPopup,
        setShowInstallPopup,
        runTour,
        setRunTour,
        handleInstall
    };
};
