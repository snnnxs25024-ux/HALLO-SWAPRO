import React, { useState } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { User as UserIcon, Receipt, LogOut, Phone, Building, Briefcase, Download, Cake, GraduationCap } from 'lucide-react';
import { AppState, Employee } from '../types';

interface EmployeePortalProps {
    allData: AppState;
}

const ProfileView: React.FC<{ employee: Employee, allData: AppState }> = ({ employee, allData }) => {
    const clientMap = new Map(allData.clients.map(c => [c.id, c.name]));

    const renderInfoItem = (icon: React.ReactNode, label: string, value: any) => (
        <div className="flex items-start space-x-4 py-4 border-b border-slate-100 last:border-b-0">
            <div className="flex-shrink-0 text-slate-400 mt-1">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-500 font-semibold">{label}</p>
                <p className="text-base font-bold text-slate-800 break-words">{value || '-'}</p>
            </div>
        </div>
    );
    
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-4 pb-6 border-b border-slate-200 mb-4">
                <img src={employee.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=E0E7FF&color=4F46E5`} alt={employee.fullName} className="w-20 h-20 rounded-full object-cover shadow-md border-2 border-white" />
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{employee.fullName}</h2>
                    <p className="text-slate-500 font-mono">{employee.id}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                {renderInfoItem(<UserIcon className="w-5 h-5" />, "NIK KTP", employee.ktpId)}
                {renderInfoItem(<Phone className="w-5 h-5" />, "No. WhatsApp", employee.whatsapp)}
                {renderInfoItem(<Building className="w-5 h-5" />, "Klien", clientMap.get(employee.clientId))}
                {renderInfoItem(<Briefcase className="w-5 h-5" />, "Jabatan", employee.position)}
                {renderInfoItem(<Cake className="w-5 h-5" />, "Tanggal Lahir", employee.birthDate ? new Date(employee.birthDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'}) : '-')}
                {renderInfoItem(<GraduationCap className="w-5 h-5" />, "Pendidikan", employee.lastEducation)}
            </div>
        </div>
    );
}


const EmployeePortal: React.FC<EmployeePortalProps> = ({ allData }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const employeeFromState = location.state?.employee as Employee | undefined;
    const [activeTab, setActiveTab] = useState('profil');

    if (!employeeFromState) {
        return <Navigate to="/search" replace />;
    }
    
    // Ensure we have the full, most up-to-date employee object from the main state
    const employee = allData.employees.find(e => e.id === employeeFromState.id);
    if (!employee) {
        return <Navigate to="/search" replace />;
    }

    const TABS = [
        { id: 'profil', label: 'Profil Saya', icon: <UserIcon className="w-5 h-5" /> },
        { id: 'slip', label: 'Slip Gaji', icon: <Receipt className="w-5 h-5" /> },
    ];
    
    const employeePayslips = allData.payslips.filter(p => p.employeeId === employee.id).sort((a,b) => b.period.localeCompare(a.period));

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <img src="https://i.imgur.com/P7t1bQy.png" alt="SWAPRO Logo" className="h-8" />
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">Portal Karyawan</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                           <p className="text-sm font-semibold text-slate-800 truncate">{employee.fullName}</p>
                           <p className="text-xs text-slate-500 font-mono">{employee.id}</p>
                        </div>
                        <button onClick={() => navigate('/search')} title="Keluar" className="p-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-4 md:p-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <aside className="w-full md:w-64">
                        <nav className="flex flex-row md:flex-col gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 md:flex-none flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold text-base transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <div className="flex-1 min-w-0">
                        {activeTab === 'profil' && (
                           <ProfileView employee={employee} allData={allData} />
                        )}
                        {activeTab === 'slip' && (
                             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h2 className="text-2xl font-bold text-slate-800 mb-4">Arsip Slip Gaji</h2>
                                <p className="text-slate-500 mb-6">Berikut adalah daftar slip gaji Anda. Klik untuk mengunduh.</p>
                                {employeePayslips.length > 0 ? (
                                  <div className="space-y-3">
                                    {employeePayslips.map(slip => (
                                      <a key={slip.id} href={slip.fileUrl} download={`slip-gaji-${employee.fullName}-${slip.period}.pdf`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 group">
                                        <div className="flex items-center space-x-4">
                                          <Receipt className="w-6 h-6 text-blue-500"/>
                                          <span className="font-bold text-slate-700">Slip Gaji - {new Date(slip.period + '-02').toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</span>
                                        </div>
                                        <Download className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors"/>
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-center text-slate-500 italic py-8">Belum ada slip gaji yang tersedia untuk Anda.</p>
                                )}
                             </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EmployeePortal;