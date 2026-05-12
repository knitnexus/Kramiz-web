
import React, { useRef, useEffect, useState } from 'react';
import { Modal } from './Modal';

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const startCamera = async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setIsStreaming(true);
                };
            }
        } catch (err: any) {
            console.error('Camera access error:', err);
            setError(err.message || 'Could not access camera. Please check permissions.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsStreaming(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `webcam_${Date.now()}.jpg`, { type: 'image/jpeg' });
                        onCapture(file);
                        onClose();
                    }
                }, 'image/jpeg', 0.8);
            }
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Take Photo"
        >
            <div className="flex flex-col items-center gap-4 py-2">
                <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-100">
                    {error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <span className="text-4xl mb-4">🚫</span>
                            <p className="text-red-500 font-bold text-sm">{error}</p>
                            <button 
                                onClick={startCamera}
                                className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg text-xs font-bold uppercase tracking-widest"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <>
                            <video 
                                ref={videoRef} 
                                className={`w-full h-full object-cover transition-opacity duration-500 ${isStreaming ? 'opacity-100' : 'opacity-0'}`}
                                playsInline 
                            />
                            {!isStreaming && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex gap-4 w-full">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 px-6 bg-gray-100 text-gray-500 font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-gray-200 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={capturePhoto}
                        disabled={!isStreaming}
                        className="flex-[2] py-3 px-6 bg-[#008069] text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-lg shadow-green-100 hover:bg-[#006a57] transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        Capture & Send
                    </button>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </Modal>
    );
};
