import React, { useState, useRef, useEffect } from 'react';

interface ImageViewerModalProps {
    url: string;
    onClose: () => void;
    senderName?: string;
    timestamp?: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ 
    url, onClose, senderName = 'Photo', timestamp 
}) => {
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
    const imgRef = useRef<HTMLImageElement>(null);

    // Touch state refs for pinch-to-zoom
    const touchStartRef = useRef({ x: 0, y: 0 });
    const initialDistanceRef = useRef<number | null>(null);
    const initialZoomRef = useRef(1);
    const isPanningRef = useRef(false);
    const isPinchingRef = useRef(false);
    const lastTouchCenterRef = useRef({ x: 0, y: 0 });

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Handle Scroll Wheel Zoom
    const handleWheel = (e: React.WheelEvent) => {
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        const newZoom = Math.min(Math.max(zoom + delta, 1), 10);
        setZoom(newZoom);
        if (newZoom === 1) setPosition({ x: 0, y: 0 });
    };

    // Mouse Panning Logic
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            setLastPosition({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoom > 1) {
            setPosition({
                x: e.clientX - lastPosition.x,
                y: e.clientY - lastPosition.y
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    // Touch Panning & Pinch Logic
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            if (zoom > 1) {
                isPanningRef.current = true;
                isPinchingRef.current = false;
                const touch = e.touches[0];
                touchStartRef.current = {
                    x: touch.clientX - position.x,
                    y: touch.clientY - position.y
                };
            }
        } else if (e.touches.length === 2) {
            isPanningRef.current = false;
            isPinchingRef.current = true;
            
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            initialDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
            initialZoomRef.current = zoom;
            
            lastTouchCenterRef.current = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isPanningRef.current && e.touches.length === 1 && zoom > 1) {
            const touch = e.touches[0];
            setPosition({
                x: touch.clientX - touchStartRef.current.x,
                y: touch.clientY - touchStartRef.current.y
            });
        } else if (isPinchingRef.current && e.touches.length === 2 && initialDistanceRef.current !== null) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            const currentDistance = Math.sqrt(dx * dx + dy * dy);
            
            if (currentDistance > 5) {
                const scale = currentDistance / initialDistanceRef.current;
                const newZoom = Math.min(Math.max(initialZoomRef.current * scale, 1), 10);
                
                const currentCenter = {
                    x: (touch1.clientX + touch2.clientX) / 2,
                    y: (touch1.clientY + touch2.clientY) / 2
                };
                
                if (newZoom > 1) {
                    const zoomRatio = newZoom / zoom;
                    setPosition(prev => ({
                        x: currentCenter.x - (currentCenter.x - prev.x) * zoomRatio,
                        y: currentCenter.y - (currentCenter.y - prev.y) * zoomRatio
                    }));
                } else {
                    setPosition({ x: 0, y: 0 });
                }
                
                setZoom(newZoom);
                initialDistanceRef.current = currentDistance;
                initialZoomRef.current = newZoom;
            }
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (e.touches.length === 0) {
            isPanningRef.current = false;
            isPinchingRef.current = false;
            initialDistanceRef.current = null;
        } else if (e.touches.length === 1) {
            isPinchingRef.current = false;
            if (zoom > 1) {
                isPanningRef.current = true;
                const touch = e.touches[0];
                touchStartRef.current = {
                    x: touch.clientX - position.x,
                    y: touch.clientY - position.y
                };
            }
        }
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `kramiz_img_${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            window.open(url, '_blank');
        }
    };

    const toggleZoom = () => {
        if (zoom > 1) {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
        } else {
            setZoom(2.5);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[1000] bg-black flex flex-col animate-in fade-in duration-200 select-none overflow-hidden"
            onWheel={handleWheel}
        >
            {/* WhatsApp Style Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between px-4 z-[1001] pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                    <button 
                        onClick={onClose}
                        className="p-2 text-white/90 hover:text-white transition-colors active:scale-90"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="flex flex-col">
                        <span className="text-white font-bold text-sm leading-tight">{senderName}</span>
                        {timestamp && (
                            <span className="text-white/60 text-[10px] uppercase font-black tracking-widest mt-0.5">
                                {new Date(timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    <button 
                        onClick={handleDownload}
                        className="p-2.5 text-white/80 hover:text-white transition-all active:scale-90"
                        title="Download"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-2.5 text-white/80 hover:text-white transition-all active:scale-90"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Immersive Image Viewport */}
            <div 
                className="flex-1 flex items-center justify-center relative touch-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={toggleZoom}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <img
                    ref={imgRef}
                    src={url}
                    alt="Full view"
                    draggable={false}
                    className="max-w-full max-h-full object-contain transition-transform duration-100 ease-out will-change-transform"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
                    }}
                />
            </div>

            {/* Bottom Controls / Zoom Indicator & Reset Shortcut */}
            {zoom > 1 && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[1001] animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-white/80 text-[10px] font-black tracking-widest border border-white/10 uppercase shadow-lg">
                        {Math.round(zoom * 100)}% Zoom
                    </div>
                    <button 
                        onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); }}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white hover:text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5 shadow-2xl active:scale-95 transition-all"
                    >
                        Reset Zoom
                    </button>
                </div>
            )}

            {/* Hint for mobile */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/20 text-[9px] font-bold uppercase tracking-[0.2em] pointer-events-none md:hidden">
                Pinch to Zoom • Drag to Pan
            </div>
        </div>
    );
};
