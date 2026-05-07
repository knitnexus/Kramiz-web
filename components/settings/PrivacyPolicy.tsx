import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SubScreenContent } from './SettingsLayout';

export const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <SubScreenContent title="Privacy Policy" onBack={() => navigate('/settings')}>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6 text-gray-700">
                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">1. Information We Collect</h3>
                    <p className="text-sm leading-relaxed">
                        We collect business information (GST number, company address, order details) and personal information 
                        (names and phone numbers) to facilitate production tracking and communication between partners.
                    </p>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">2. How We Use Data</h3>
                    <p className="text-sm leading-relaxed">
                        Your data is used to sync updates, provide notifications, and maintain the security of your account. 
                        We do not sell your data to third parties.
                    </p>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">3. Data Sharing</h3>
                    <p className="text-sm leading-relaxed">
                        Order data is only shared with the partners you explicitly invite to a group. 
                        GST numbers may be searchable by other users to facilitate partner discovery.
                    </p>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">4. Data Security</h3>
                    <p className="text-sm leading-relaxed">
                        We use industry-standard encryption to protect your data. Your passcode is hashed 
                        and never stored in plain text.
                    </p>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">5. Your Rights</h3>
                    <p className="text-sm leading-relaxed">
                        You can update your profile or delete your organization at any time from the Settings menu. 
                        Deletion is permanent and wipes all associated data.
                    </p>
                </section>

                <div className="pt-6 border-t border-gray-100 text-[11px] text-gray-400">
                    Last Updated: May 8, 2024
                </div>
            </div>
        </SubScreenContent>
    );
};
