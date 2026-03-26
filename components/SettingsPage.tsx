
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, hasPermission } from '../types';
import { useTeam } from '../hooks/useTeam';
import { useSettings } from '../hooks/useSettings';
import { Modal } from './Modal';
import { CompanyIdentityCard } from '../features/company-identity/CompanyIdentityCard';
import { PartnershipsPage } from '../features/partnerships/PartnershipsPage';

interface SettingsPageProps {
    currentUser: User;
    onLogout: () => void;
}

type SettingsSection = 'GENERAL' | 'TEAM' | 'PARTNERS' | 'SECURITY';

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser, onLogout }) => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<SettingsSection>('GENERAL');
    
    // Hooks
    const { teamList, addTeamMember, deleteTeamMember, inviteLink: teamInvite, setInviteLink: setTeamInvite, isAdding: isAddingTeam } = useTeam(currentUser);
    const { userCompany, updateCompanyName, updatePasscode, deleteOrganization, isUpdatingCompany, isUpdatingPasscode, isDeletingOrg } = useSettings(currentUser);

    // Form States
    const [newTeamMember, setNewTeamMember] = useState({ name: '', phone: '', passcode: '', role: 'JUNIOR_MERCHANDISER' as User['role'] });
    const [newVendor, setNewVendor] = useState({ name: '', phone: '', adminName: '' });
    const [passcodeData, setPasscodeData] = useState({ oldPasscode: '', newPasscode: '', confirmPasscode: '' });
    const [editCompanyName, setEditCompanyName] = useState(userCompany?.name || '');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const isAdmin = currentUser.role === 'ADMIN';

    // Permissions
    const canManageTeam = isAdmin;
    const canEditCompany = isAdmin;

    const handleUpdatePasscode = () => {
        if (!passcodeData.oldPasscode || !passcodeData.newPasscode || !passcodeData.confirmPasscode) return alert("Fill all fields");
        if (passcodeData.newPasscode !== passcodeData.confirmPasscode) return alert("Mismatched new passcodes");
        updatePasscode({ oldPasscode: passcodeData.oldPasscode, newPasscode: passcodeData.newPasscode });
    };

    const handleDeleteOrg = async () => {
        if (deleteConfirmText !== userCompany?.name) {
            return alert(`Please type "${userCompany?.name}" exactly to confirm.`);
        }
        if (window.confirm("FINAL WARNING: Permanent wipeout. Continue?")) {
            await deleteOrganization();
            onLogout();
            navigate('/');
        }
    };

    const renderNav = () => (
        <div className="flex overflow-x-auto border-b border-gray-200 bg-white sticky top-0 z-10 md:flex-col md:border-b-0 md:border-r md:w-64 md:h-full md:p-4 md:space-y-1">
            <button onClick={() => setActiveSection('GENERAL')} className={`whitespace-nowrap px-6 py-4 text-sm font-bold md:rounded-lg md:text-left ${activeSection === 'GENERAL' ? 'text-[#008069] border-b-2 border-[#008069] bg-green-50/50 md:border-b-0' : 'text-gray-500 hover:bg-gray-50'}`}>General</button>
            <button onClick={() => setActiveSection('TEAM')} className={`whitespace-nowrap px-6 py-4 text-sm font-bold md:rounded-lg md:text-left ${activeSection === 'TEAM' ? 'text-[#008069] border-b-2 border-[#008069] bg-green-50/50 md:border-b-0' : 'text-gray-500 hover:bg-gray-50'}`}>Team</button>
            {isAdmin && <button onClick={() => setActiveSection('PARTNERS')} className={`whitespace-nowrap px-6 py-4 text-sm font-bold md:rounded-lg md:text-left ${activeSection === 'PARTNERS' ? 'text-[#008069] border-b-2 border-[#008069] bg-green-50/50 md:border-b-0' : 'text-gray-500 hover:bg-gray-50'}`}>Partners</button>}
            <button onClick={() => setActiveSection('SECURITY')} className={`whitespace-nowrap px-6 py-4 text-sm font-bold md:rounded-lg md:text-left ${activeSection === 'SECURITY' ? 'text-[#008069] border-b-2 border-[#008069] bg-green-50/50 md:border-b-0' : 'text-gray-500 hover:bg-gray-50'}`}>Security</button>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] md:flex-row">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 md:hidden safe-pt">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h1 className="text-xl font-black text-gray-900 font-blanka tracking-wider uppercase">Settings</h1>
                <div className="w-10"></div>
            </div>

            {renderNav()}

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    {activeSection === 'GENERAL' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Company name, GST, Kramiz ID — managed by feature component */}
                            <CompanyIdentityCard
                                currentUser={currentUser}
                                userCompany={userCompany}
                            />
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Push Notifications</p>
                                                <p className="text-[11px] text-gray-500">Test if your device is receiving alerts</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if ('Notification' in window && Notification.permission === 'granted') {
                                                        new Notification("Kramiz Test", { body: "Working! ✅" });
                                                    } else {
                                                        alert("Please enable notifications in your browser first.");
                                                    }
                                                }}
                                                className="px-4 py-2 border border-blue-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-all"
                                            >
                                                Test Pings
                                            </button>
                                        </div>
                                    </div>
                            </div>
                        )}

                    {activeSection === 'TEAM' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {canManageTeam && (
                                <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">➕</div>
                                        Invite New Member
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
                                            <input type="text" value={newTeamMember.name} onChange={e => setNewTeamMember({...newTeamMember, name: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008069]" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Role</label>
                                            <select value={newTeamMember.role} onChange={e => setNewTeamMember({...newTeamMember, role: e.target.value as any})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008069]">
                                                <option value="JUNIOR_MERCHANDISER">Junior Merchandiser</option>
                                                <option value="SENIOR_MERCHANDISER">Senior Merchandiser</option>
                                                <option value="JUNIOR_MANAGER">Junior Manager</option>
                                                <option value="SENIOR_MANAGER">Senior Manager</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Phone Number</label>
                                            <input type="tel" value={newTeamMember.phone} onChange={e => setNewTeamMember({...newTeamMember, phone: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008069]" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Passcode (4 Digits)</label>
                                            <input type="password" maxLength={4} value={newTeamMember.passcode} onChange={e => setNewTeamMember({...newTeamMember, passcode: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008069]" />
                                        </div>
                                    </div>
                                    <button onClick={() => addTeamMember(newTeamMember)} disabled={isAddingTeam} className="w-full mt-6 py-3 bg-[#008069] text-white rounded-xl font-bold shadow-lg hover:bg-[#006a57] transition-all">Invite via WhatsApp</button>
                                </section>
                            )}

                            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h2 className="text-lg font-black text-gray-900 mb-4">Current Team</h2>
                                <div className="divide-y divide-gray-100">
                                    {teamList.map(member => (
                                        <div key={member.id} className="py-4 flex justify-between items-center group">
                                            <div>
                                                <p className="font-bold text-gray-900">{member.name} {member.id === currentUser.id && "(You)"}</p>
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-tight">{member.role.replace('_', ' ')} • {member.phone}</p>
                                            </div>
                                            {canManageTeam && member.id !== currentUser.id && (
                                                <button onClick={() => deleteTeamMember(member.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeSection === 'PARTNERS' && (
                        <PartnershipsPage currentUser={currentUser} />
                    )}

                    {activeSection === 'SECURITY' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">🔐</div>
                                    Change Security Passcode
                                </h2>
                                <div className="space-y-4">
                                    <input type="password" placeholder="Current 4-digit passcode" maxLength={4} value={passcodeData.oldPasscode} onChange={e => setPasscodeData({...passcodeData, oldPasscode: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008069] tracking-widest" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="password" placeholder="New" maxLength={4} value={passcodeData.newPasscode} onChange={e => setPasscodeData({...passcodeData, newPasscode: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008069] tracking-widest" />
                                        <input type="password" placeholder="Confirm" maxLength={4} value={passcodeData.confirmPasscode} onChange={e => setPasscodeData({...passcodeData, confirmPasscode: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008069] tracking-widest" />
                                    </div>
                                    <button onClick={handleUpdatePasscode} disabled={isUpdatingPasscode} className="w-full py-3 bg-[#008069] text-white rounded-xl font-bold shadow-lg hover:bg-[#006a57] transition-all">Update Passcode</button>
                                </div>
                            </section>

                            {currentUser.role === 'ADMIN' && (
                                <section className="bg-red-50 rounded-2xl p-6 shadow-sm border border-red-100">
                                    <h2 className="text-lg font-black text-red-900 mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700">🗑️</div>
                                        Danger Zone
                                    </h2>
                                    <p className="text-sm text-red-700 font-medium mb-4">Deleting your organization will wipe out all orders, files, and users. This is permanent.</p>
                                    <div className="space-y-4">
                                        <input 
                                            placeholder={`Type "${userCompany?.name}" to confirm`} 
                                            value={deleteConfirmText}
                                            onChange={e => setDeleteConfirmText(e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                                        />
                                        <button 
                                            onClick={handleDeleteOrg}
                                            disabled={isDeletingOrg || deleteConfirmText !== userCompany?.name}
                                            className="w-full py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700 disabled:opacity-50 transition-all uppercase tracking-widest text-xs"
                                        >
                                            Delete Organization Forever
                                        </button>
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for invitations */}
            {teamInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white rounded-3xl shadow-3xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-green-100 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-6">✅</div>
                        <h3 className="text-2xl font-black text-gray-900 text-center mb-2">Invite Ready!</h3>
                        <p className="text-gray-500 text-center mb-8 text-sm">Send the login details to your new team member via WhatsApp.</p>
                        <a 
                            href={teamInvite} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block w-full py-4 bg-[#25D366] text-white text-center rounded-2xl font-black shadow-xl hover:bg-[#128C7E] transition-all mb-4"
                            onClick={() => setTeamInvite(null)}
                        >
                            Share on WhatsApp
                        </a>
                        <button 
                            onClick={() => setTeamInvite(null)}
                            className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-all uppercase tracking-widest text-xs"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
