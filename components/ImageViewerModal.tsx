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

    // Panning Logic
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

            {/* Bottom Controls / Zoom Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-[1001]">
                {zoom > 1 && (
                    <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-white/80 text-[10px] font-black tracking-widest border border-white/5 uppercase">
                        {Math.round(zoom * 100)}% Zoom
                    </div>
                )}
                
                <div className="flex items-center gap-1.5 p-1.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
                    <button 
                        onClick={() => setZoom(prev => Math.max(prev - 0.5, 1))}
                        className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 12H4" strokeWidth={2.5} strokeLinecap="round"/></svg>
                    </button>
                    
                    <div className="w-[1px] h-4 bg-white/20 mx-1" />
                    
                    <button 
                        onClick={() => { setZoom(1); setPosition({x:0, y:0}); }}
                        className="px-3 text-[10px] font-black text-white/40 hover:text-white uppercase tracking-tighter"
                    >
                        Reset
                    </button>

                    <div className="w-[1px] h-4 bg-white/20 mx-1" />

                    <button 
                        onClick={() => setZoom(prev => Math.min(prev + 0.5, 10))}
                        className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={2.5} strokeLinecap="round"/></svg>
                    </button>
                </div>
            </div>

            {/* Hint for mobile */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/20 text-[9px] font-bold uppercase tracking-[0.2em] pointer-events-none md:hidden">
                Double tap to zoom
            </div>
        </div>
    );
};
