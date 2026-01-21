
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Employee, Client, Payslip, DocumentRequest, DocumentRequestStatus, DocumentType, EmployeeStatus, AppSettings, EmployeeDataSubmission, SubmissionStatus } from '../types';
import { LogOut, User as UserIcon, Briefcase, Phone, FileText, Shield, Calendar, CreditCard, Download, FileX, Building, MapPin, Cake, GraduationCap, Lock, Clock, CheckCircle, XCircle, ChevronRight, Eye, EyeOff, PenTool, Eraser, Check, FilePenLine, Home, Heart, Mail, Users, Flag, BookOpen, Award } from 'lucide-react';
import { useNotifier } from '../components/Notifier';
import DataUpdateForm from './DataUpdateForm';

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const calculateAge = (birthDate?: string): string => {
    if (!birthDate) return '-';
    try {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age > 0 ? `${age} tahun` : 'Invalid';
    } catch (e) {
        return '-';
    }
};

const MaskedField: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    const maskValue = (str: string) => {
        if (!str || str.length < 8) return str;
        return str.substring(0, 4) + '*'.repeat(Math.max(0, str.length - 8)) + str.slice(-4);
    };

    return (
        <div className="flex items-start space-x-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 relative group">
            <div className="flex-shrink-0 text-blue-500 mt-0.5">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-800 break-all leading-none font-mono tracking-tight">
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

const InfoField: React.FC<{ label: string; value: string | undefined | null; icon: React.ReactNode; className?: string; }> = ({ label, value, icon, className }) => (
    <div className={`flex items-start space-x-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 ${className}`}>
        <div className="flex-shrink-0 text-blue-500 mt-0.5">{icon}</div>
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-800 leading-none">{value || '-'}</p>
        </div>
    </div>
);

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

    const baseClass = `flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-black transition-all active:scale-95 ${fullWidth ? 'w-full' : 'w-full md:w-auto'}`;

    if (relevantRequest) {
        const { status, accessExpiresAt, rejectionReason } = relevantRequest;
        if (status === DocumentRequestStatus.PENDING) {
            return <button disabled className={`${baseClass} bg-slate-100 text-slate-400 cursor-wait shadow-inner`}><Clock className="w-4 h-4" /><span>Diproses...</span></button>;
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
                    <button onClick={handleRequest} className={`${baseClass} bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100`}>
                       <XCircle className="w-4 h-4" /> <span>Ditolak, Minta Lagi?</span>
                    </button>
                    {rejectionReason && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] p-2 text-[10px] bg-slate-800 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-2xl">{rejectionReason}</div>}
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
    appSettings: AppSettings[];
    employeeSubmissions: EmployeeDataSubmission[];
    onRequestDocument: (request: Omit<DocumentRequest, 'id' | 'status' | 'requestTimestamp'>) => void;
    onUpdateEmployee: (employee: Partial<Employee>) => Promise<void>;
    onCreateSubmission: (submission: Omit<EmployeeDataSubmission, 'id' | 'submitted_at' | 'status'>) => Promise<void>;
}> = ({ employee, clients, payslips, documentRequests, appSettings, employeeSubmissions, onRequestDocument, onUpdateEmployee, onCreateSubmission }) => {
    const [activeTab, setActiveTab] = useState('profil');
    const [showSignature, setShowSignature] = useState(false);
    const [signatureData, setSignatureData] = useState<string | null>(employee.documents?.e_signature || null);
    const [selectedPayslipYear, setSelectedPayslipYear] = useState(new Date().getFullYear());
    const notifier = useNotifier();

    const dataUpdateSetting = useMemo(() => {
        const setting = appSettings.find(s => s.key === 'data_update_form');
        return setting ? setting.value : { is_active: false };
    }, [appSettings]);

    const pendingSubmission = useMemo(() => {
        return employeeSubmissions
            .filter(s => s.employee_id === employee.id && s.status === SubmissionStatus.PENDING_REVIEW)
            .sort((a,b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0];
    }, [employeeSubmissions, employee.id]);
    
    useEffect(() => {
        setSignatureData(employee.documents?.e_signature || null);
    }, [employee.documents?.e_signature]);

    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
    const employeePayslips = useMemo(() => payslips.filter(p => p.employeeId === employee.id).sort((a,b) => b.period.localeCompare(a.period)), [payslips, employee.id]);

    const handleSaveSignature = async (data: string) => {
        setShowSignature(false);
        try {
            const updatedDocuments = { ...(employee.documents || {}), e_signature: data };
            await onUpdateEmployee({ id: employee.id, documents: updatedDocuments });
            setSignatureData(data);
            notifier.addNotification("Tanda tangan berhasil disimpan.", "success");
        } catch (error) {
            notifier.addNotification("Gagal menyimpan tanda tangan.", "error");
        }
    };
    
    const DetailSection: React.FC<{ title: string; children: React.ReactNode; grid?: boolean }> = ({ title, children, grid = true }) => (
      <div className="mb-12 last:mb-0">
        <h4 className="text-xs font-black text-slate-400 mb-6 pb-2 border-b border-slate-100 uppercase tracking-[0.2em]">{title}</h4>
        <div className={grid ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
          {children}
        </div>
      </div>
    );
    
    const renderDocumentLink = (label: string, url?: string) => (
        url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white hover:bg-blue-50 rounded-2xl transition-all border border-slate-100 shadow-sm hover:shadow-md">
                <div className="flex items-center space-x-4 min-w-0">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-5 h-5 shrink-0" /></div>
                    <span className="font-bold text-sm text-slate-700 truncate">{label}</span>
                </div>
                <Eye className="w-5 h-5 text-slate-300 ml-2" />
            </a>
        ) : (
             <div className="flex items-center space-x-4 p-4 bg-slate-50/50 rounded-2xl opacity-60 border border-dashed border-slate-200">
                <div className="p-2 bg-slate-100 text-slate-400 rounded-lg"><FileText className="w-5 h-5" /></div>
                <span className="text-sm text-slate-400 italic font-medium">{label} belum tersedia</span>
            </div>
        )
    );

    const portalTabs = [
        { id: 'profil', label: 'Profil', icon: <UserIcon className="w-4 h-4" /> },
        { id: 'alamat', label: 'Alamat', icon: <Home className="w-4 h-4" /> },
        { id: 'keluarga', label: 'Keluarga', icon: <Heart className="w-4 h-4" /> },
        { id: 'pendidikan', label: 'Pendidikan', icon: <GraduationCap className="w-4 h-4" /> },
        { id: 'pekerjaan', label: 'Kerja', icon: <Briefcase className="w-4 h-4" /> },
        { id: 'finansial', label: 'Bank', icon: <CreditCard className="w-4 h-4" /> },
        { id: 'dokumen', label: 'Dokumen', icon: <FileText className="w-4 h-4" /> },
        { id: 'slip gaji', label: 'Slip Gaji', icon: <Calendar className="w-4 h-4" /> }
    ];

    if (dataUpdateSetting.is_active) {
        portalTabs.push({ id: 'pengkinian data', label: 'Pengkinian Data', icon: <FilePenLine className="w-4 h-4" /> });
    }

    return (
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-200 overflow-hidden flex flex-col min-h-[70vh] animate-slideIn">
            {showSignature && <SignatureModal onSave={handleSaveSignature} onClose={() => setShowSignature(false)} />}
            
            <div className="p-10 md:p-14 bg-slate-50/50 border-b border-slate-100 text-center relative">
                <div className="absolute top-8 left-8">
                    <div className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border shadow-sm ${employee.status === EmployeeStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {employee.status}
                    </div>
                </div>
                <div className="relative inline-block group">
                    <img 
                        src={employee.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=E0E7FF&color=4F46E5`} 
                        alt={employee.fullName} 
                        className="w-36 h-36 rounded-full object-cover mx-auto ring-8 ring-white shadow-2xl transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute bottom-1 right-2 bg-blue-600 p-2.5 rounded-full border-4 border-white shadow-lg text-white">
                        <Shield className="w-5 h-5" />
                    </div>
                </div>
                <h2 className="mt-8 text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">{employee.fullName}</h2>
                <div className="mt-4 flex items-center justify-center space-x-3 text-slate-400 font-mono text-sm font-bold bg-white/50 w-fit mx-auto px-4 py-1.5 rounded-full border border-slate-100">
                    <span>{employee.id}</span>
                    <span className="opacity-30">/</span>
                    <span className="text-blue-500">{employee.swaproId}</span>
                </div>
            </div>

            {/* TAB NAVIGATION: Fixed clipping and unprofessional layout on small screens */}
            <div className="bg-white/95 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 shadow-sm overflow-hidden">
                <div className="max-w-full px-4 sm:px-6">
                    <nav className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-4 scroll-smooth">
                        {/* Hidden spacer to ensure first item isn't clipped by rounding or parent container */}
                        <div className="w-1 shrink-0"></div>
                        {portalTabs.map(tab => (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id)} 
                                className={`flex items-center space-x-2.5 py-3 px-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] transition-all duration-300 shrink-0 ${
                                    activeTab === tab.id 
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 -translate-y-0.5' 
                                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                        {/* Extra space at end for better mobile UX */}
                        <div className="w-10 shrink-0"></div>
                    </nav>
                </div>
            </div>

            <div className="p-8 md:p-14 flex-1 bg-white">
                {activeTab === 'profil' && (
                    <DetailSection title="Identitas Pribadi">
                        <MaskedField label="NIK Identitas (KTP)" value={employee.ktpId} icon={<UserIcon className="w-4 h-4" />} />
                        <InfoField label="Email Pribadi" value={employee.email} icon={<Mail className="w-4 h-4" />} />
                        <InfoField label="WhatsApp" value={employee.whatsapp} icon={<Phone className="w-4 h-4" />} />
                        <InfoField label="Tempat Lahir" value={employee.birthPlace} icon={<MapPin className="w-4 h-4" />} />
                        <InfoField label="Tanggal Lahir" value={employee.birthDate ? new Date(employee.birthDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'}) : '-'} icon={<Cake className="w-4 h-4" />} />
                        <InfoField label="Usia" value={calculateAge(employee.birthDate)} icon={<Calendar className="w-4 h-4" />} />
                        <InfoField label="Jenis Kelamin" value={employee.gender} icon={<Users className="w-4 h-4" />} />
                        <InfoField label="Status Pernikahan" value={employee.maritalStatus} icon={<Heart className="w-4 h-4" />} />
                        <InfoField label="Kewarganegaraan" value={employee.nationality} icon={<Flag className="w-4 h-4" />} />
                    </DetailSection>
                )}

                {activeTab === 'alamat' && (
                    <>
                        <DetailSection title="Alamat Sesuai KTP">
                            <InfoField className="md:col-span-2" label="Alamat Lengkap" value={employee.addressKtp?.address} icon={<Home className="w-4 h-4" />} />
                            <InfoField label="RT / RW" value={`${employee.addressKtp?.rt || '-'} / ${employee.addressKtp?.rw || '-'}`} icon={<Home className="w-4 h-4" />} />
                            <InfoField label="Kelurahan / Desa" value={employee.addressKtp?.village} icon={<Home className="w-4 h-4" />} />
                            <InfoField label="Kecamatan" value={employee.addressKtp?.district} icon={<Home className="w-4 h-4" />} />
                            <InfoField label="Kota / Kabupaten" value={employee.addressKtp?.city} icon={<Home className="w-4 h-4" />} />
                            <InfoField label="Provinsi" value={employee.addressKtp?.province} icon={<Home className="w-4 h-4" />} />
                            <InfoField label="Kode Pos" value={employee.addressKtp?.postalCode} icon={<Home className="w-4 h-4" />} />
                        </DetailSection>
                        <DetailSection title="Alamat Domisili Saat Ini">
                            {employee.addressDomicile?.isSameAsKtp ? (
                                <div className="md:col-span-2 p-10 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest italic">Sama dengan alamat KTP</p>
                                </div>
                            ) : (
                                <>
                                    <InfoField className="md:col-span-2" label="Alamat Lengkap" value={employee.addressDomicile?.address} icon={<MapPin className="w-4 h-4" />} />
                                    <InfoField label="RT / RW" value={`${employee.addressDomicile?.rt || '-'} / ${employee.addressDomicile?.rw || '-'}`} icon={<MapPin className="w-4 h-4" />} />
                                    <InfoField label="Kelurahan / Desa" value={employee.addressDomicile?.village} icon={<MapPin className="w-4 h-4" />} />
                                    <InfoField label="Kecamatan" value={employee.addressDomicile?.district} icon={<MapPin className="w-4 h-4" />} />
                                    <InfoField label="Kota / Kabupaten" value={employee.addressDomicile?.city} icon={<MapPin className="w-4 h-4" />} />
                                    <InfoField label="Provinsi" value={employee.addressDomicile?.province} icon={<MapPin className="w-4 h-4" />} />
                                    <InfoField label="Kode Pos" value={employee.addressDomicile?.postalCode} icon={<MapPin className="w-4 h-4" />} />
                                </>
                            )}
                        </DetailSection>
                    </>
                )}

                {activeTab === 'keluarga' && (
                    <>
                        <DetailSection title="Informasi Orang Tua">
                            <InfoField label="Nama Ibu Kandung" value={employee.familyData?.motherName} icon={<UserIcon className="w-4 h-4" />} />
                            <InfoField label="Tanggal Lahir Ibu" value={employee.familyData?.motherBirthDate ? new Date(employee.familyData.motherBirthDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'}) : '-'} icon={<Cake className="w-4 h-4" />} />
                            <InfoField label="Nama Ayah Kandung" value={employee.familyData?.fatherName} icon={<UserIcon className="w-4 h-4" />} />
                            <InfoField label="Tanggal Lahir Ayah" value={employee.familyData?.fatherBirthDate ? new Date(employee.familyData.fatherBirthDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'}) : '-'} icon={<Cake className="w-4 h-4" />} />
                        </DetailSection>
                        <DetailSection title="Kontak Darurat">
                            <InfoField label="Nama" value={employee.emergencyContact?.name} icon={<UserIcon className="w-4 h-4" />} />
                            <InfoField label="Hubungan" value={employee.emergencyContact?.relationship} icon={<Heart className="w-4 h-4" />} />
                            <InfoField label="No. Telepon" value={employee.emergencyContact?.phone} icon={<Phone className="w-4 h-4" />} />
                        </DetailSection>
                        <DetailSection title="Daftar Anggota Keluarga (Anak)" grid={false}>
                            {(employee.familyData?.childrenData && employee.familyData.childrenData.length > 0) ? (
                                employee.familyData.childrenData.map((child, index) => (
                                    <div key={index} className="flex items-center space-x-5 p-6 bg-slate-50/50 rounded-2xl border border-slate-200 hover:bg-white transition-colors group">
                                        <div className="p-4 bg-white text-blue-600 rounded-xl shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all"><UserIcon className="w-6 h-6" /></div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-800 uppercase text-sm tracking-tight">{child.name}</p>
                                            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Lahir: {child.birthDate ? new Date(child.birthDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'}) : '-'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-14 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest italic">Belum ada data anak terdaftar</p>
                                </div>
                            )}
                        </DetailSection>
                    </>
                )}

                {activeTab === 'pendidikan' && (
                    <DetailSection title="Jenjang Pendidikan Terakhir">
                        <InfoField label="Pendidikan Terakhir" value={employee.lastEducation} icon={<GraduationCap className="w-4 h-4" />} />
                        <InfoField label="Nama Sekolah/Universitas" value={employee.educationDetails?.universityName} icon={<Building className="w-4 h-4" />} />
                        <InfoField label="Jurusan / Konsentrasi" value={employee.educationDetails?.major} icon={<BookOpen className="w-4 h-4" />} />
                        {['D3', 'S1', 'S2', 'S3'].includes(employee.lastEducation || '') && (
                            <InfoField label="Indeks Prestasi Kumulatif (IPK)" value={employee.educationDetails?.gpa} icon={<Award className="w-4 h-4" />} />
                        )}
                        <InfoField label="Tahun Masuk" value={employee.educationDetails?.entryYear} icon={<Calendar className="w-4 h-4" />} />
                        <InfoField label="Tahun Kelulusan" value={employee.educationDetails?.graduationYear} icon={<Calendar className="w-4 h-4" />} />
                    </DetailSection>
                )}

                {activeTab === 'pekerjaan' && (
                    <DetailSection title="Data Kepegawaian">
                        <InfoField label="Jabatan Saat Ini" value={employee.position} icon={<Briefcase className="w-4 h-4" />} />
                        <InfoField label="Penempatan Klien" value={clientMap.get(employee.clientId || '')} icon={<Building className="w-4 h-4" />} />
                        <InfoField label="Cabang Operasional" value={employee.branch} icon={<MapPin className="w-4 h-4" />} />
                        <InfoField label="Tanggal Bergabung" value={employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'} icon={<Calendar className="w-4 h-4" />} />
                        <InfoField label="End of Contract (EOC)" value={employee.endDate ? new Date(employee.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'} icon={<Calendar className="w-4 h-4" />} />
                        <InfoField label="Kontrak Kerja Ke-" value={String(employee.contractNumber)} icon={<FileText className="w-4 h-4" />} />
                        <InfoField label="Nama Atasan MH/ARHEAD" value={employee.atasanMH?.name} icon={<UserIcon className="w-4 h-4" />} />
                        <InfoField label="Telepon Atasan MH/ARHEAD" value={employee.atasanMH?.phone} icon={<Phone className="w-4 h-4" />} />
                        <InfoField label="Nama BM/KACAB" value={employee.atasanBM?.name} icon={<UserIcon className="w-4 h-4" />} />
                        <InfoField label="Telepon BM/KACAB" value={employee.atasanBM?.phone} icon={<Phone className="w-4 h-4" />} />
                        <div className="md:col-span-2">
                            <InfoField label="Catatan Kedisiplinan / SP" value={employee.disciplinaryActions} icon={<Shield className="w-4 h-4" />} />
                        </div>
                    </DetailSection>
                )}

                {activeTab === 'finansial' && (
                    <>
                        <DetailSection title="Rekening Payroll">
                            <MaskedField label="Nomor Rekening" value={employee.bankAccount?.number} icon={<CreditCard className="w-4 h-4" />} />
                            <InfoField label="Nama Bank" value={employee.bankAccount?.bankName} icon={<Building className="w-4 h-4" />} />
                             <div className="md:col-span-2">
                                <InfoField label="Atas Nama Pemilik Rekening" value={employee.bankAccount?.holderName} icon={<UserIcon className="w-4 h-4" />} />
                            </div>
                        </DetailSection>
                         <DetailSection title="Informasi Perpajakan & BPJS">
                            <MaskedField label="BPJS Ketenagakerjaan" value={employee.bpjs?.ketenagakerjaan} icon={<Shield className="w-4 h-4" />} />
                            <MaskedField label="BPJS Kesehatan" value={employee.bpjs?.kesehatan} icon={<Shield className="w-4 h-4" />} />
                             <MaskedField label="NPWP (Pajak)" value={employee.npwp} icon={<CreditCard className="w-4 h-4" />} />
                        </DetailSection>
                    </>
                )}

                {activeTab === 'dokumen' && (
                    <div className="space-y-12">
                        <DetailSection title="Legalitas: Tanda Tangan Digital" grid={false}>
                            <div className="p-10 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 text-center shadow-inner">
                                {signatureData ? (
                                    <div className="space-y-6">
                                        <div className="inline-block p-8 bg-white rounded-3xl shadow-xl border border-white transition-transform hover:scale-105 duration-500">
                                            <img src={signatureData} alt="Signature" className="h-32 mx-auto" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-blue-600 uppercase tracking-widest">E-Signature Terverifikasi</p>
                                            <button onClick={() => setShowSignature(true)} className="mt-3 text-[10px] font-black text-slate-400 hover:text-blue-600 underline uppercase tracking-widest transition-colors">Perbarui Tanda Tangan</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8 py-6">
                                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto text-blue-600 shadow-xl border-4 border-blue-50">
                                            <PenTool className="w-12 h-12" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-800">Aktifkan E-Signature</h4>
                                            <p className="text-base text-slate-500 font-medium mt-2 max-w-sm mx-auto">Tanda tangan digital diperlukan untuk memproses administrasi kontrak Anda secara instan dan aman.</p>
                                        </div>
                                        <button 
                                            onClick={() => setShowSignature(true)}
                                            className="px-12 py-5 bg-blue-600 text-white font-black text-xs rounded-2xl shadow-2xl shadow-blue-600/30 active:scale-95 transition-all uppercase tracking-[0.2em]"
                                        >
                                            Buat Sekarang
                                        </button>
                                    </div>
                                )}
                            </div>
                        </DetailSection>

                        <DetailSection title="Arsip Dokumen Kerja" grid={false}>
                            {[
                                {type: DocumentType.PKWT_NEW, url: employee.documents?.pkwtNewHire, name: "PKWT New Hire"}, 
                                {type: DocumentType.SP_LETTER, url: employee.documents?.spLetter, name: "Surat Peringatan (SP)"}
                            ].map(doc => (
                                <div className="flex flex-col md:flex-row md:items-center space-y-5 md:space-y-0 p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 transition-all hover:bg-white hover:shadow-2xl hover:border-blue-200" key={doc.type}>
                                    <div className="flex items-center space-x-6 flex-1 min-w-0">
                                        <div className="p-5 bg-white text-blue-600 rounded-2xl shadow-sm border border-slate-50"><FileText className="w-8 h-8 shrink-0" /></div>
                                        <div className="min-w-0">
                                            <span className="font-black text-lg text-slate-800 uppercase tracking-tight block truncate">{doc.name}</span>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">Official Employment Record</p>
                                        </div>
                                    </div>
                                    <div className="md:ml-6">
                                        <DocumentActionButton employeeId={employee.id} documentType={doc.type} documentIdentifier={doc.type} documentName={doc.name} fileUrl={doc.url} requests={documentRequests} onRequest={onRequestDocument} fullWidth={true} />
                                    </div>
                                </div>
                            ))}
                        </DetailSection>
                         <DetailSection title="Berkas Identitas" grid={false}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {renderDocumentLink("Foto KTP Asli", employee.documents?.photoKtpUrl)}
                                {renderDocumentLink("Foto Kartu NPWP", employee.documents?.photoNpwpUrl)}
                                {renderDocumentLink("Foto Kartu Keluarga", employee.documents?.photoKkUrl)}
                            </div>
                        </DetailSection>
                    </div>
                )}

                {activeTab === 'slip gaji' && (
                    <DetailSection title={`Rekapitulasi Slip Gaji ${selectedPayslipYear}`} grid={false}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                            {MONTH_NAMES.map((month, index) => { 
                                const period = `${selectedPayslipYear}-${(index + 1).toString().padStart(2, '0')}`; 
                                const payslipForMonth = employeePayslips.find(p => p.period === period);
                                return (
                                    <div key={month} className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center ${payslipForMonth ? 'bg-white border-blue-50 shadow-xl shadow-slate-200/40 hover:border-blue-400' : 'bg-slate-50/50 border-slate-50 opacity-40'}`}>
                                        <span className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-6 block">{month}</span>
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
                                            <div className="flex flex-col items-center justify-center space-y-2 w-full p-4 bg-slate-100/50 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                                                <FileX className="w-5 h-5 mb-1" />
                                                <span>Belum Ada</span>
                                            </div>
                                        )}
                                    </div>
                                ); 
                            })}
                        </div>
                    </DetailSection>
                )}

                {activeTab === 'pengkinian data' && (
                    <div className="animate-fadeIn">
                        {pendingSubmission ? (
                             <div className="text-center py-20 px-8 bg-amber-50/50 rounded-[3rem] border-2 border-dashed border-amber-200 shadow-inner">
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto text-amber-500 shadow-xl mb-8">
                                    <Clock className="w-12 h-12 animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Menunggu Verifikasi PIC</h3>
                                <p className="text-base text-slate-500 mt-4 leading-relaxed max-w-sm mx-auto font-medium">
                                    Data Anda yang dikirim pada <span className="text-amber-600 font-bold">{new Date(pendingSubmission.submitted_at).toLocaleString('id-ID')}</span> sedang kami tinjau. Fitur pengkinian akan terbuka kembali setelah disetujui.
                                </p>
                            </div>
                        ) : (
                           <DataUpdateForm 
                                employee={employee}
                                onCreateSubmission={onCreateSubmission}
                           />
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

interface EmployeePortalProps {
    verifiedEmployee: Employee;
    onLogout: () => void;
    clients: Client[];
    payslips: Payslip[];
    documentRequests: DocumentRequest[];
    appSettings: AppSettings[];
    employeeSubmissions: EmployeeDataSubmission[];
    onRequestDocument: (request: Omit<DocumentRequest, 'id' | 'status' | 'requestTimestamp'>) => Promise<void>;
    onUpdateEmployee: (employee: Partial<Employee>) => Promise<void>;
    onCreateSubmission: (submission: Omit<EmployeeDataSubmission, 'id' | 'submitted_at' | 'status'>) => Promise<void>;
}

const EmployeePortal: React.FC<EmployeePortalProps> = ({ verifiedEmployee, onLogout, ...allData }) => {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col p-4 md:p-12">
            {/* Header: Fixed Professional Spacing and safe area */}
            <header className="max-w-4xl mx-auto w-full flex items-center justify-between mb-12 px-6 py-2 bg-white/60 backdrop-blur-lg rounded-[2rem] border border-white shadow-xl shadow-slate-200/50">
                <div className="flex items-center space-x-4">
                    <div className="bg-slate-900 p-2 rounded-xl">
                        <img src="https://i.imgur.com/P7t1bQy.png" alt="SWAPRO Logo" className="h-8 brightness-0 invert" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase leading-none mb-1">Portal Mandiri</span>
                        <span className="text-sm font-black text-slate-800 tracking-tight uppercase">Karyawan SWA PRO</span>
                    </div>
                </div>
                <button 
                    onClick={onLogout} 
                    className="group flex items-center space-x-2 p-3 bg-red-50 text-red-500 rounded-2xl shadow-sm border border-red-100 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                    title="Keluar dari Portal"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline group-hover:inline-block">Logout</span>
                    <LogOut className="w-5 h-5" />
                </button>
            </header>
            
            <main className="max-w-4xl mx-auto w-full pb-24">
                <EmployeeProfileView 
                    employee={verifiedEmployee} 
                    clients={allData.clients} 
                    payslips={allData.payslips} 
                    documentRequests={allData.documentRequests}
                    appSettings={allData.appSettings}
                    employeeSubmissions={allData.employeeSubmissions}
                    onRequestDocument={allData.onRequestDocument}
                    onUpdateEmployee={allData.onUpdateEmployee}
                    onCreateSubmission={allData.onCreateSubmission}
                />
                
                <div className="text-center mt-12 space-y-2 opacity-50 select-none">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
                        PT SWAPRO International
                    </p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                        Secure Human Resource Management System v3.0
                    </p>
                </div>
            </main>
            
            <style>{`
                @keyframes slideIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slideIn { animation: slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default EmployeePortal;