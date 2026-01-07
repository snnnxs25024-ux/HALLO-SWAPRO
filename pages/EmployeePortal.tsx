
import React, { useState, useMemo, useEffect } from 'react';
import { Employee, Client, Payslip, DocumentRequest, DocumentRequestStatus, DocumentType } from '../types';
import { LogOut, User as UserIcon, Briefcase, Phone, FileText, Shield, Calendar, CreditCard, Download, FileX, Building, MapPin, Cake, GraduationCap, Lock, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { useNotifier } from '../components/Notifier';

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const getFileNameFromUrl = (url?: string) => !url ? 'File tidak ditemukan' : decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'file_tidak_valid');

const DocumentActionButton: React.FC<{
    employeeId: string;
    documentType: DocumentType;
    documentIdentifier: string;
    documentName: string;
    fileUrl?: string;
    requests: DocumentRequest[];
    onRequest: (request: Omit<DocumentRequest, 'id' | 'status' | 'requestTimestamp'>) => void;
    fullWidth?: boolean;
}> = ({ employeeId, documentType, documentIdentifier, documentName, fileUrl, requests, onRequest, fullWidth = false }) => {
    const [timeLeft, setTimeLeft] = useState('');

    const relevantRequest = useMemo(() => {
        return requests
            .filter(r => r.employeeId === employeeId && r.documentType === documentType && r.documentIdentifier === documentIdentifier)
            .sort((a, b) => new Date(b.requestTimestamp).getTime() - new Date(a.requestTimestamp).getTime())[0];
    }, [requests, employeeId, documentType, documentIdentifier]);

    useEffect(() => {
        if (relevantRequest?.status !== DocumentRequestStatus.APPROVED || !relevantRequest.accessExpiresAt) {
            setTimeLeft('');
            return;
        }

        const interval = setInterval(() => {
            const now = new Date();
            const expiry = new Date(relevantRequest.accessExpiresAt!);
            if (now > expiry) {
                setTimeLeft('Akses Kedaluwarsa');
                clearInterval(interval);
            } else {
                const diff = expiry.getTime() - now.getTime();
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);

    }, [relevantRequest]);

    const handleRequest = () => {
        onRequest({ employeeId, documentType, documentIdentifier, documentName });
    };

    const baseClass = `flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${fullWidth ? 'w-full' : 'w-full md:w-auto'}`;

    if (relevantRequest) {
        const { status, accessExpiresAt, rejectionReason } = relevantRequest;
        if (status === DocumentRequestStatus.PENDING) {
            return <button disabled className={`${baseClass} bg-slate-100 text-slate-400 cursor-wait`}><Clock className="w-4 h-4" /><span>Diproses...</span></button>;
        }
        if (status === DocumentRequestStatus.APPROVED && accessExpiresAt && new Date(accessExpiresAt) > new Date()) {
            return (
                <a href={fileUrl} download={getFileNameFromUrl(fileUrl)} target="_blank" rel="noopener noreferrer" className={`${baseClass} bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700`}>
                    <Download className="w-4 h-4" />
                    <span>Unduh ({timeLeft})</span>
                </a>
            );
        }
        if (status === DocumentRequestStatus.REJECTED) {
            return (
                <div className="group relative w-full">
                    <button onClick={handleRequest} className={`${baseClass} bg-red-50 text-red-600 border border-red-200 hover:bg-red-100`}>
                       <XCircle className="w-4 h-4" /> <span>Ditolak, Minta Lagi?</span>
                    </button>
                    {rejectionReason && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] p-2 text-[10px] bg-slate-800 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{rejectionReason}</div>}
                </div>
            );
        }
    }
    
    return (
        <button onClick={handleRequest} className={`${baseClass} bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700`}>
            <Lock className="w-4 h-4" />
            <span>Minta Akses</span>
        </button>
    );
};

const EmployeeProfileView: React.FC<{
    employee: Employee;
    clients: Client[];
    payslips: Payslip[];
    documentRequests: DocumentRequest[];
    onRequestDocument: (request: Omit<DocumentRequest, 'id' | 'status' | 'requestTimestamp'>) => void;
}> = ({ employee, clients, payslips, documentRequests, onRequestDocument }) => {
    const [activeTab, setActiveTab] = useState('profil');
    const [selectedPayslipYear, setSelectedPayslipYear] = useState(new Date().getFullYear());
    
    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
    const employeePayslips = useMemo(() => payslips.filter(p => p.employeeId === employee.id).sort((a,b) => b.period.localeCompare(a.period)), [payslips, employee.id]);
    const contractHistory = employee.documents?.contractHistory || [];

    const payslipYears = useMemo(() => {
        const years = new Set<string>(employeePayslips.map(p => p.period.substring(0, 4)));
        years.add(new Date().getFullYear().toString());
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [employeePayslips]);

    const tabs = [
        { id: 'profil', label: 'Profil', icon: <UserIcon className="w-4 h-4" /> },
        { id: 'pekerjaan', label: 'Kerja', icon: <Briefcase className="w-4 h-4" /> },
        { id: 'finansial', label: 'Bank', icon: <CreditCard className="w-4 h-4" /> },
        { id: 'dokumen', label: 'Doku', icon: <FileText className="w-4 h-4" /> },
        { id: 'slip gaji', label: 'Slip', icon: <Calendar className="w-4 h-4" /> }
    ];
    
    const renderInfoItem = (icon: React.ReactNode, label: string, value: any) => (
        <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex-shrink-0 text-blue-500 mt-0.5">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-bold text-slate-800 break-words leading-tight">{value || '-'}</p>
            </div>
        </div>
    );
    
    const DetailSection: React.FC<{ title: string; children: React.ReactNode; grid?: boolean }> = ({ title, children, grid = true }) => (
      <div className="mb-6 last:mb-0">
        <h4 className="text-[10px] font-black text-blue-700 bg-blue-50 py-1.5 px-3 rounded-lg tracking-widest uppercase mb-3 inline-block">{title}</h4>
        <div className={grid ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-3"}>
          {children}
        </div>
      </div>
    );
    
    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden flex flex-col">
            {/* Optimized Scrollable Tabs for Mobile */}
            <div className="px-2 border-b border-gray-100 bg-white sticky top-0 z-10">
                <nav className="flex space-x-1 overflow-x-auto no-scrollbar py-2">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`flex items-center space-x-2 py-2.5 px-4 rounded-xl font-bold text-xs whitespace-nowrap transition-all duration-200 ${
                                activeTab === tab.id 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-4 md:p-8">
                {activeTab === 'profil' && (
                    <DetailSection title="Data Pribadi">
                        {renderInfoItem(<UserIcon className="w-4 h-4" />, "NIK KTP", employee.ktpId)}
                        {renderInfoItem(<UserIcon className="w-4 h-4" />, "NIK SWAPRO", employee.swaproId)}
                        {renderInfoItem(<Phone className="w-4 h-4" />, "WhatsApp", employee.whatsapp)}
                        {renderInfoItem(<UserIcon className="w-4 h-4" />, "Gender", employee.gender)}
                        {renderInfoItem(<Cake className="w-4 h-4" />, "Tgl Lahir", employee.birthDate ? new Date(employee.birthDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'}) : '-')}
                        {renderInfoItem(<GraduationCap className="w-4 h-4" />, "Pendidikan", employee.lastEducation)}
                        {renderInfoItem(<CreditCard className="w-4 h-4" />, "NPWP", employee.npwp)}
                    </DetailSection>
                )}

                {activeTab === 'pekerjaan' && (
                    <>
                        <DetailSection title="Informasi Posisi">
                            {renderInfoItem(<Building className="w-4 h-4" />, "Klien", clientMap.get(employee.clientId || ''))}
                            {renderInfoItem(<Briefcase className="w-4 h-4" />, "Jabatan", employee.position)}
                            {renderInfoItem(<MapPin className="w-4 h-4" />, "Cabang", employee.branch)}
                        </DetailSection>
                        <DetailSection title="Status & Kontrak">
                            {renderInfoItem(<Calendar className="w-4 h-4" />, "Tgl Join", employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-')}
                            {renderInfoItem(<Calendar className="w-4 h-4" />, "Selesai Kontrak", employee.endDate ? new Date(employee.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-')}
                            {renderInfoItem(<Calendar className="w-4 h-4" />, "Tgl Resign", employee.resignDate ? new Date(employee.resignDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-')}
                            {renderInfoItem(<FileText className="w-4 h-4" />, "Kontrak Ke", employee.contractNumber)}
                            <div className="sm:col-span-2">
                                {renderInfoItem(<Shield className="w-4 h-4" />, "Catatan SP", employee.disciplinaryActions)}
                            </div>
                        </DetailSection>
                    </>
                )}

                {activeTab === 'finansial' && (
                    <>
                        <DetailSection title="Rekening Bank">
                            {renderInfoItem(<CreditCard className="w-4 h-4" />, "Bank", employee.bankAccount?.bankName)}
                            {renderInfoItem(<CreditCard className="w-4 h-4" />, "No. Rekening", employee.bankAccount?.number)}
                            {renderInfoItem(<UserIcon className="w-4 h-4" />, "Atas Nama", employee.bankAccount?.holderName)}
                        </DetailSection>
                        <DetailSection title="Jaminan Sosial">
                            {renderInfoItem(<Shield className="w-4 h-4" />, "BPJS TK", employee.bpjs?.ketenagakerjaan)}
                            {renderInfoItem(<Shield className="w-4 h-4" />, "BPJS KS", employee.bpjs?.kesehatan)}
                        </DetailSection>
                    </>
                )}

                {activeTab === 'dokumen' && (
                    <>
                        <DetailSection title="Dokumen Utama" grid={false}>
                            {[{type: DocumentType.PKWT_NEW, url: employee.documents?.pkwtNewHire, name: "PKWT New Hire"}, {type: DocumentType.SP_LETTER, url: employee.documents?.spLetter, name: "Surat Peringatan (SP)"}].map(doc => (
                                <div className="flex flex-col space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200" key={doc.type}>
                                    <div className="flex items-center space-x-3 min-w-0">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FileText className="w-5 h-5 flex-shrink-0" /></div>
                                        <span className="font-bold text-sm text-slate-700 truncate">{doc.name}</span>
                                    </div>
                                    <DocumentActionButton employeeId={employee.id} documentType={doc.type} documentIdentifier={doc.type} documentName={doc.name} fileUrl={doc.url} requests={documentRequests} onRequest={onRequestDocument} fullWidth={true} />
                                </div>
                            ))}
                        </DetailSection>
                        <DetailSection title="Riwayat Kontrak Perpanjangan" grid={false}>
                            {contractHistory.length > 0 ? contractHistory.map(doc => (
                                <div key={doc.id} className="flex flex-col space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <div className="flex items-center space-x-3 min-w-0">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FileText className="w-5 h-5 flex-shrink-0" /></div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-slate-700 truncate">{doc.name}</p>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase">
                                                {new Date(doc.startDate).toLocaleDateString('id-ID')} - {new Date(doc.endDate).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                    <DocumentActionButton employeeId={employee.id} documentType={DocumentType.PKWT_HISTORY} documentIdentifier={doc.id} documentName={doc.name} fileUrl={doc.fileUrl} requests={documentRequests} onRequest={onRequestDocument} fullWidth={true} />
                                </div>
                            )) : (
                                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                                    <FileX className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-400 italic">Belum ada riwayat perpanjangan kontrak.</p>
                                </div>
                            )}
                        </DetailSection>
                    </>
                )}

                {activeTab === 'slip gaji' && (
                    <div>
                        <div className="flex justify-between items-center mb-5">
                            <h4 className="text-[10px] font-black text-blue-700 bg-blue-50 py-1.5 px-3 rounded-lg tracking-widest uppercase">Histori Slip Gaji</h4>
                            <select 
                                value={selectedPayslipYear} 
                                onChange={e => setSelectedPayslipYear(Number(e.target.value))} 
                                className="font-bold text-xs bg-slate-100 border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            >
                                {payslipYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {MONTH_NAMES.map((month, index) => { 
                                const period = `${selectedPayslipYear}-${(index + 1).toString().padStart(2, '0')}`; 
                                const payslipForMonth = employeePayslips.find(p => p.period === period); 
                                return (
                                    <div key={month} className={`flex flex-col p-3 rounded-2xl border transition-all ${payslipForMonth ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                        <span className="font-black text-[10px] uppercase text-slate-400 mb-3 tracking-tighter">{month}</span>
                                        {payslipForMonth ? (
                                            <DocumentActionButton 
                                                employeeId={employee.id} 
                                                documentType={DocumentType.PAYSLIP} 
                                                documentIdentifier={period} 
                                                documentName={`Slip Gaji ${month} ${selectedPayslipYear}`} 
                                                fileUrl={payslipForMonth.fileUrl} 
                                                requests={documentRequests} 
                                                onRequest={onRequestDocument} 
                                                fullWidth={true} 
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center space-x-2 w-full px-3 py-2.5 bg-slate-200 text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed">
                                                <FileX className="w-3.5 h-3.5" />
                                                <span>Kosong</span>
                                            </div>
                                        )}
                                    </div>
                                ); 
                            })}
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

interface EmployeePortalProps {
    verifiedEmployee: Employee;
    onLogout: () => void;
    clients: Client[];
    payslips: Payslip[];
    documentRequests: DocumentRequest[];
    onRequestDocument: (request: Omit<DocumentRequest, 'id' | 'status' | 'requestTimestamp'>) => Promise<void>;
}

const EmployeePortal: React.FC<EmployeePortalProps> = ({ verifiedEmployee, onLogout, ...allData }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
             {/* Mobile-First Floating Header */}
             <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 p-3 md:p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                        <img 
                            src={verifiedEmployee.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(verifiedEmployee.fullName)}&background=E0E7FF&color=4F46E5`} 
                            alt={verifiedEmployee.fullName} 
                            className="w-10 h-10 md:w-12 md:h-12 rounded-2xl object-cover border-2 border-white shadow-lg shrink-0"
                        />
                         <div className="min-w-0">
                            <h1 className="text-sm md:text-base font-black tracking-tight text-slate-900 truncate">Halo, {verifiedEmployee.fullName.split(' ')[0]}!</h1>
                            <p className="text-[10px] md:text-xs text-blue-600 font-bold uppercase tracking-widest">{verifiedEmployee.id}</p>
                         </div>
                    </div>
                     <button 
                        onClick={onLogout} 
                        className="flex items-center justify-center w-10 h-10 md:w-auto md:px-4 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-100 active:scale-90 transition-all"
                    >
                        <LogOut className="w-5 h-5 md:mr-2" />
                        <span className="hidden md:inline font-bold text-sm">Keluar</span>
                    </button>
                </div>
            </header>
            
            <main className="flex-1 p-3 md:p-10 max-w-4xl mx-auto w-full pb-20">
                <EmployeeProfileView 
                    employee={verifiedEmployee} 
                    clients={allData.clients} 
                    payslips={allData.payslips} 
                    documentRequests={allData.documentRequests}
                    onRequestDocument={allData.onRequestDocument}
                />
            </main>

            {/* Subtle Brand Footer for Mobile */}
            <footer className="p-6 text-center">
                <div className="flex items-center justify-center space-x-2 opacity-30 grayscale mb-1">
                    <img src="https://i.imgur.com/P7t1bQy.png" alt="SWAPRO" className="h-4" />
                    <span className="text-[10px] font-black tracking-tighter">HALO SWAPRO</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic">Sistem Keamanan Terenkripsi & Verifikasi NIK</p>
            </footer>
        </div>
    );
};

export default EmployeePortal;
