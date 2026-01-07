
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Employee, Client, Payslip, DocumentRequest, DocumentRequestStatus, DocumentType } from '../types';
import { LogOut, User as UserIcon, Briefcase, Phone, FileText, Shield, Calendar, CreditCard, Download, FileX, Building, MapPin, Cake, GraduationCap, Lock, Clock, CheckCircle, XCircle, ChevronRight, Eye, EyeOff, PenTool, Eraser, Check } from 'lucide-react';
import { useNotifier } from '../components/Notifier';

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const MaskedField: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    const maskValue = (str: string) => {
        if (!str || str.length < 8) return str;
        return str.substring(0, 4) + '*'.repeat(str.length - 8) + str.slice(-4);
    };

    return (
        <div className="flex items-start space-x-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm relative group">
            <div className="flex-shrink-0 text-blue-500 mt-0.5">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-sm font-black text-slate-800 break-all leading-none font-mono tracking-tight">
                    {isVisible ? value : maskValue(value)}
                </p>
            </div>
            <button 
                onClick={() => setIsVisible(!isVisible)}
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                title={isVisible ? "Sembunyikan" : "Tampilkan"}
            >
                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
    );
};

const SignatureModal: React.FC<{ onSave: (data: string) => void; onClose: () => void }> = ({ onSave, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.beginPath();
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.moveTo(x, y);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            onSave(canvas.toDataURL());
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[130] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Tanda Tangan Digital</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">E-Signature Verification</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-xl text-slate-400"><XCircle className="w-5 h-5" /></button>
                </div>
                <div className="p-4 bg-slate-50">
                    <canvas 
                        ref={canvasRef}
                        width={500}
                        height={250}
                        onMouseDown={startDrawing}
                        onMouseUp={stopDrawing}
                        onMouseMove={draw}
                        onTouchStart={startDrawing}
                        onTouchEnd={stopDrawing}
                        onTouchMove={draw}
                        className="w-full h-auto bg-white rounded-2xl border-2 border-dashed border-slate-300 cursor-crosshair shadow-inner touch-none"
                    />
                </div>
                <div className="p-6 flex gap-3">
                    <button onClick={clearCanvas} className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all">
                        <Eraser className="w-5 h-5" />
                        Bersihkan
                    </button>
                    <button onClick={handleSave} className="flex-[2] flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                        <Check className="w-5 h-5" />
                        Konfirmasi & Simpan
                    </button>
                </div>
            </div>
        </div>
    );
};

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

    const baseClass = `flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl text-sm font-black transition-all active:scale-95 ${fullWidth ? 'w-full' : 'w-full md:w-auto'}`;

    if (relevantRequest) {
        const { status, accessExpiresAt, rejectionReason } = relevantRequest;
        if (status === DocumentRequestStatus.PENDING) {
            return <button disabled className={`${baseClass} bg-slate-100 text-slate-400 cursor-wait shadow-inner`}><Clock className="w-4 h-4" /><span>Diproses...</span></button>;
        }
        if (status === DocumentRequestStatus.APPROVED && accessExpiresAt && new Date(accessExpiresAt) > new Date()) {
            return (
                <a href={fileUrl} download={getFileNameFromUrl(fileUrl)} target="_blank" rel="noopener noreferrer" className={`${baseClass} bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-700`}>
                    <Download className="w-4 h-4" />
                    <span>Unduh ({timeLeft})</span>
                </a>
            );
        }
        if (status === DocumentRequestStatus.REJECTED) {
            return (
                <div className="group relative w-full">
                    <button onClick={handleRequest} className={`${baseClass} bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100`}>
                       <XCircle className="w-4 h-4" /> <span>Ditolak, Minta Lagi?</span>
                    </button>
                    {rejectionReason && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] p-2 text-[10px] bg-slate-800 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-2xl">{rejectionReason}</div>}
                </div>
            );
        }
    }
    
    return (
        <button onClick={handleRequest} className={`${baseClass} bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700`}>
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
    onUpdateEmployee: (employee: Partial<Employee>) => Promise<void>;
}> = ({ employee, clients, payslips, documentRequests, onRequestDocument, onUpdateEmployee }) => {
    const [activeTab, setActiveTab] = useState('profil');
    const [showSignature, setShowSignature] = useState(false);
    const [signatureData, setSignatureData] = useState<string | null>(employee.e_signature || null);
    const [selectedPayslipYear, setSelectedPayslipYear] = useState(new Date().getFullYear());
    const notifier = useNotifier();
    
    useEffect(() => {
        setSignatureData(employee.e_signature || null);
    }, [employee.e_signature]);

    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
    const employeePayslips = useMemo(() => payslips.filter(p => p.period === employee.id).sort((a,b) => b.period.localeCompare(a.period)), [payslips, employee.id]);
    const contractHistory = employee.documents?.contractHistory || [];

    const handleSaveSignature = async (data: string) => {
        setShowSignature(false);
        try {
            await onUpdateEmployee({ id: employee.id, e_signature: data });
            setSignatureData(data);
            notifier.addNotification("Tanda tangan berhasil disimpan.", "success");
        } catch (error) {
            notifier.addNotification("Gagal menyimpan tanda tangan.", "error");
        }
    };
    
    const DetailSection: React.FC<{ title: string; children: React.ReactNode; grid?: boolean }> = ({ title, children, grid = true }) => (
      <div className="mb-8 last:mb-0">
        <h4 className="text-[11px] font-black text-blue-700 bg-blue-50/50 py-2 px-4 rounded-xl tracking-[0.2em] uppercase mb-4 inline-block border border-blue-100">{title}</h4>
        <div className={grid ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
          {children}
        </div>
      </div>
    );
    
    return (
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/80 border border-slate-200 overflow-hidden flex flex-col min-h-[70vh]">
            {showSignature && <SignatureModal onSave={handleSaveSignature} onClose={() => setShowSignature(false)} />}
            
            <div className="px-4 bg-white sticky top-0 z-10 border-b border-slate-100">
                <nav className="flex space-x-2 overflow-x-auto no-scrollbar py-4">
                    {[
                        { id: 'profil', label: 'Profil', icon: <UserIcon className="w-4 h-4" /> },
                        { id: 'pekerjaan', label: 'Kerja', icon: <Briefcase className="w-4 h-4" /> },
                        { id: 'finansial', label: 'Bank', icon: <CreditCard className="w-4 h-4" /> },
                        { id: 'dokumen', label: 'Doku', icon: <FileText className="w-4 h-4" /> },
                        { id: 'slip gaji', label: 'Slip', icon: <Calendar className="w-4 h-4" /> }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`flex items-center space-x-2 py-3 px-5 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all duration-300 ${
                                activeTab === tab.id 
                                ? 'bg-slate-900 text-white shadow-xl shadow-slate-300 scale-105' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-5 md:p-10 flex-1">
                {activeTab === 'profil' && (
                    <DetailSection title="Personal Information">
                        <MaskedField label="NIK Identitas (KTP)" value={employee.ktpId} icon={<UserIcon className="w-4 h-4" />} />
                        <MaskedField label="NPWP Pribadi" value={employee.npwp} icon={<CreditCard className="w-4 h-4" />} />
                        <div className="flex items-start space-x-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex-shrink-0 text-blue-500 mt-0.5"><Phone className="w-4 h-4" /></div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">WhatsApp</p>
                                <p className="text-sm font-black text-slate-800 leading-none">{employee.whatsapp}</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex-shrink-0 text-blue-500 mt-0.5"><Cake className="w-4 h-4" /></div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tanggal Lahir</p>
                                <p className="text-sm font-black text-slate-800 leading-none">{employee.birthDate ? new Date(employee.birthDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'}) : '-'}</p>
                            </div>
                        </div>
                    </DetailSection>
                )}

                {activeTab === 'finansial' && (
                    <DetailSection title="Bank & Payroll">
                        <MaskedField label="Nomor Rekening" value={employee.bankAccount?.number} icon={<CreditCard className="w-4 h-4" />} />
                        <div className="flex items-start space-x-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex-shrink-0 text-blue-500 mt-0.5"><Building className="w-4 h-4" /></div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Bank Penerima</p>
                                <p className="text-sm font-black text-slate-800 leading-none uppercase tracking-tighter">{employee.bankAccount?.bankName}</p>
                            </div>
                        </div>
                    </DetailSection>
                )}

                {activeTab === 'dokumen' && (
                    <div className="space-y-8">
                        <DetailSection title="Digital Approval (E-Signature)" grid={false}>
                            <div className="p-6 bg-blue-50 rounded-[2rem] border-2 border-dashed border-blue-200 text-center">
                                {signatureData ? (
                                    <div className="space-y-4">
                                        <div className="inline-block p-4 bg-white rounded-3xl shadow-lg">
                                            <img src={signatureData} alt="Signature" className="h-24 mx-auto" />
                                        </div>
                                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Tanda Tangan Tersimpan</p>
                                        <button onClick={() => setShowSignature(true)} className="text-[10px] font-black text-slate-400 underline uppercase tracking-widest">Ubah Tanda Tangan</button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                                            <PenTool className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800">Siapkan Tanda Tangan Anda</h4>
                                            <p className="text-xs text-slate-500 font-medium mt-1">Gunakan untuk persetujuan kontrak digital di masa depan.</p>
                                        </div>
                                        <button 
                                            onClick={() => setShowSignature(true)}
                                            className="px-8 py-3 bg-blue-600 text-white font-black text-xs rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest"
                                        >
                                            Buat Sekarang
                                        </button>
                                    </div>
                                )}
                            </div>
                        </DetailSection>

                        <DetailSection title="Official Documents" grid={false}>
                            {[{type: DocumentType.PKWT_NEW, url: employee.documents?.pkwtNewHire, name: "PKWT New Hire"}, {type: DocumentType.SP_LETTER, url: employee.documents?.spLetter, name: "Surat Peringatan (SP)"}].map(doc => (
                                <div className="flex flex-col space-y-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-200" key={doc.type}>
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-white text-blue-600 rounded-2xl shadow-sm border border-slate-100"><FileText className="w-6 h-6" /></div>
                                        <div>
                                            <span className="font-black text-sm text-slate-800 uppercase tracking-tight">{doc.name}</span>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dokumen Terverifikasi</p>
                                        </div>
                                    </div>
                                    <DocumentActionButton employeeId={employee.id} documentType={doc.type} documentIdentifier={doc.type} documentName={doc.name} fileUrl={doc.url} requests={documentRequests} onRequest={onRequestDocument} fullWidth={true} />
                                </div>
                            ))}
                        </DetailSection>
                    </div>
                )}
                
                {activeTab === 'pekerjaan' && (
                    <DetailSection title="Employment Status">
                         <div className="flex items-start space-x-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex-shrink-0 text-blue-500 mt-0.5"><Briefcase className="w-4 h-4" /></div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Jabatan</p>
                                <p className="text-sm font-black text-slate-800 leading-none">{employee.position}</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex-shrink-0 text-blue-500 mt-0.5"><Building className="w-4 h-4" /></div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Penempatan</p>
                                <p className="text-sm font-black text-slate-800 leading-none">{clientMap.get(employee.clientId || '')}</p>
                            </div>
                        </div>
                    </DetailSection>
                )}

                {activeTab === 'slip gaji' && (
                     <div className="grid grid-cols-2 gap-4">
                        {MONTH_NAMES.map((month, index) => { 
                            const period = `${selectedPayslipYear}-${(index + 1).toString().padStart(2, '0')}`; 
                            const payslipForMonth = employeePayslips.find(p => p.period === employee.id); // Placeholder logic
                            return (
                                <div key={month} className={`p-4 rounded-[1.5rem] border-2 transition-all ${payslipForMonth ? 'bg-white border-blue-50 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                    <span className="font-black text-[11px] uppercase text-slate-400 mb-3 block tracking-tighter">{month}</span>
                                    {payslipForMonth ? (
                                        <DocumentActionButton 
                                            employeeId={employee.id} 
                                            documentType={DocumentType.PAYSLIP} 
                                            documentIdentifier={period} 
                                            documentName={`Slip Gaji ${month}`} 
                                            fileUrl={payslipForMonth.fileUrl} 
                                            requests={documentRequests} 
                                            onRequest={onRequestDocument} 
                                            fullWidth={true} 
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center space-x-2 w-full px-3 py-3 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                                            <FileX className="w-3 h-3" />
                                            <span>N/A</span>
                                        </div>
                                    )}
                                </div>
                            ); 
                        })}
                    </div>
                )}
            </div>
            
            <footer className="p-10 text-center bg-slate-50/50">
                <div className="flex items-center justify-center space-x-2 mb-2">
                    <img src="https://i.imgur.com/P7t1bQy.png" alt="SWAPRO" className="h-4 grayscale" />
                    <span className="text-[10px] font-black tracking-tighter text-slate-300 uppercase">Secure Internal Portal</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Encrypted Connection Active</p>
            </footer>
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
    onUpdateEmployee: (employee: Partial<Employee>) => Promise<void>;
}

const EmployeePortal: React.FC<EmployeePortalProps> = ({ verifiedEmployee, onLogout, ...allData }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-10">
            <header className="max-w-4xl mx-auto w-full flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <img 
                        src={verifiedEmployee.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(verifiedEmployee.fullName)}&background=E0E7FF&color=4F46E5`} 
                        alt={verifiedEmployee.fullName} 
                        className="w-16 h-16 rounded-[2rem] object-cover border-4 border-white shadow-2xl shrink-0"
                    />
                     <div className="min-w-0">
                        <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none mb-1 uppercase italic">PORTAL {verifiedEmployee.fullName.split(' ')[0]}</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Session Verified</p>
                        </div>
                     </div>
                </div>
                <button 
                    onClick={onLogout} 
                    className="p-4 bg-white text-red-600 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:bg-red-50 transition-all active:scale-90"
                >
                    <LogOut className="w-6 h-6" />
                </button>
            </header>
            
            <main className="max-w-4xl mx-auto w-full pb-20">
                <EmployeeProfileView 
                    employee={verifiedEmployee} 
                    clients={allData.clients} 
                    payslips={allData.payslips} 
                    documentRequests={allData.documentRequests}
                    onRequestDocument={allData.onRequestDocument}
                    onUpdateEmployee={allData.onUpdateEmployee}
                />
            </main>
        </div>
    );
};

export default EmployeePortal;