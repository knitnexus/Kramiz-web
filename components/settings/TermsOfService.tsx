import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SubScreenContent } from './SettingsLayout';

export const TermsOfService: React.FC = () => {
    const navigate = useNavigate();

    return (
        <SubScreenContent title="Terms of Service" onBack={() => navigate('/settings')}>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6 text-gray-700">
                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">1. Acceptance of Terms</h3>
                    <p className="text-sm leading-relaxed">
                        By accessing and using Kramiz, you agree to be bound by these Terms of Service. 
                        Kramiz is a B2B SaaS platform provided by KnitNexus Tech Private Limited.
                    </p>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">2. Beta Status</h3>
                    <p className="text-sm leading-relaxed">
                        Kramiz is currently in Beta. While we strive for stability, the service is provided "as is" and "as available". 
                        We reserve the right to modify or discontinue features during this period.
                    </p>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">3. Data Ownership</h3>
                    <p className="text-sm leading-relaxed">
                        You retain all rights to the data you upload (orders, challans, partner info). 
                        By using the platform, you grant Kramiz a license to process this data solely for the purpose of providing the service to you.
                    </p>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">4. User Obligations</h3>
                    <p className="text-sm leading-relaxed">
                        You are responsible for maintaining the confidentiality of your account passcode. 
                        You agree not to use the service for any illegal activities or to upload fraudulent documents.
                    </p>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">5. Limitation of Liability</h3>
                    <p className="text-sm leading-relaxed">
                        KnitNexus Tech Private Limited shall not be liable for any indirect, incidental, or consequential damages 
                        arising out of your use of the service, including production delays or data loss.
                    </p>
                </section>

                <div className="pt-6 border-t border-gray-100 text-[11px] text-gray-400">
                    Last Updated: May 8, 2024
                </div>
            </div>
        </SubScreenContent>
    );
};
