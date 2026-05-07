import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SubScreenContent } from './SettingsLayout';

export const ContactUs: React.FC = () => {
    const navigate = useNavigate();

    return (
        <SubScreenContent title="Contact Us" onBack={() => navigate('/settings')}>
            <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-3xl mb-4">👋</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Get in Touch</h3>
                    <p className="text-sm text-gray-500 mb-6">We're here to help you simplify your production flow.</p>
                    
                    <div className="w-full space-y-3">
                        <a 
                            href="mailto:admin@knitnexus.com" 
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:border-[#008069] transition-all group"
                        >
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-[#008069] group-hover:text-white transition-colors">📧</div>
                            <div className="text-left">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Support</p>
                                <p className="text-[15px] font-bold text-gray-800">admin@knitnexus.com</p>
                            </div>
                        </a>

                        <a 
                            href="tel:+919363235466" 
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:border-[#008069] transition-all group"
                        >
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-[#008069] group-hover:text-white transition-colors">📞</div>
                            <div className="text-left">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Business Phone</p>
                                <p className="text-[15px] font-bold text-gray-800">+91 93632 35466</p>
                            </div>
                        </a>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Registered Office</p>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shadow-sm shrink-0">📍</div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                            <p className="font-bold text-gray-900 mb-1">KnitNexus Tech Private Limited</p>
                            <p>SF No.163 NIFTTEA College,</p>
                            <p>East of TEKIC SIDCO, Mudalipalayam,</p>
                            <p>Tiruppur, Coimbatore - 641606,</p>
                            <p>Tamil Nadu, India.</p>
                            <p className="mt-3 pt-3 border-t border-gray-50 text-[11px] font-mono text-gray-400">CIN: U62013TZ2024PTC031478</p>
                        </div>
                    </div>
                </div>
            </div>
        </SubScreenContent>
    );
};
