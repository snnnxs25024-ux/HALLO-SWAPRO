


import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Employee, Client, Payslip, DocumentRequest, DocumentRequestStatus, DocumentType, EmployeeStatus, AppSettings, EmployeeDataSubmission, SubmissionStatus } from '../types';
import { LogOut, User as UserIcon, Briefcase, Phone, FileText, Shield, Calendar, CreditCard, Download, FileX, Building, MapPin, Cake, GraduationCap, Lock, Clock, CheckCircle, XCircle, ChevronRight, Eye, EyeOff, PenTool, Eraser, Check, FilePenLine, Home, Heart, Mail, Users, Flag, BookOpen, Award } from 'lucide-react';
import { useNotifier } from '../components/Notifier';
import DataUpdateForm from './DataUpdateForm'; // NEW

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
        return str.substring(0, 4) + '*'.repeat(str.length - 8) + str.slice(-4);
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
    appSettings: AppSettings[]; // NEW
    employeeSubmissions: EmployeeDataSubmission[]; // NEW
    onRequestDocument: (request: Omit<DocumentRequest, 'id' | 'status' | 'requestTimestamp'>) => void;
    onUpdateEmployee: (employee: Partial<Employee>) => Promise<void>;
    onCreateSubmission: (submission: Omit<EmployeeDataSubmission, 'id' | 'submitted_at' | 'status'>) => Promise<void>; // NEW
}> = ({ employee, clients, payslips, documentRequests, appSettings, employeeSubmissions, onRequestDocument, onUpdateEmployee, onCreateSubmission }) => {
    const [activeTab, setActiveTab] = useState('profil');
    const [showSignature, setShowSignature] = useState(false);
    const [signatureData, setSignatureData] = useState<string | null>(employee.documents?.e_signature || null);
    const [selectedPayslipYear, setSelectedPayslipYear] = useState(new Date().getFullYear());
    const notifier = useNotifier();

    // --- NEW STATE & LOGIC FOR DATA UPDATE ---
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
      <div className="mb-10 last:mb-0">
        <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-100 uppercase tracking-wider">{title}</h4>
        <div className={grid ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
          {children}
        </div>
      </div>
    );
    
    const renderDocumentLink = (label: string, url?: string) => (
        url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-100 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200">
                <div className="flex items-center space-x-3 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="font-semibold text-sm text-slate-700 truncate">{label}</span>
                </div>
                <Eye className="w-5 h-5 text-slate-400 ml-2" />
            </a>
        ) : (
             <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg opacity-60 border border-gray-100">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500 italic">{label} belum tersedia</span>
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
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/80 border border-slate-200 overflow-hidden flex flex-col min-h-[70vh]">
            {showSignature && <SignatureModal onSave={handleSaveSignature} onClose={() => setShowSignature(false)} />}
            
            <div className="p-6 md:p-8 bg-slate-50/70 border-b border-slate-200/80 text-center">
                <img 
                    src={employee.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=E0E7FF&color=4F46E5`} 
                    alt={employee.fullName} 
                    className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-white shadow-lg"
                />
                <h2 className="mt-4 text-3xl font-black text-slate-900 tracking-tight">{employee.fullName}</h2>
                <p className="text-base text-slate-500 font-mono mt-1">{employee.id} / {employee.swaproId}</p>
                <div className={`mt-3 inline-block text-xs font-bold uppercase px-3 py-1.5 rounded-full ${employee.status === EmployeeStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                    {employee.status}
                </div>
            </div>

            <div className="px-4 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-100">
                <nav className="flex space-x-1 justify-center overflow-x-auto no-scrollbar py-2">
                    {portalTabs.map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`flex items-center space-x-2.5 py-3 px-5 rounded-2xl font-bold text-sm transition-all duration-300 ${
                                activeTab === tab.id 
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                            }`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-6 md:p-10 flex-1">
                {activeTab === 'profil' && (
                    <DetailSection title="Data Pribadi">
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
                        <DetailSection title="Alamat Domisili">
                            {employee.addressDomicile?.isSameAsKtp ? (
                                <p className="md:col-span-2 text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl">Sama dengan alamat KTP.</p>
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
                        <DetailSection title="Data Orang Tua">
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
                        <DetailSection title="Data Anak" grid={false}>
                            {(employee.familyData?.childrenData && employee.familyData.childrenData.length > 0) ? (
                                employee.familyData.childrenData.map((child, index) => (
                                    <div key={index} className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <UserIcon className="w-5 h-5 text-blue-500" />
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-800">{child.name}</p>
                                            <p className="text-xs text-slate-500">Lahir: {child.birthDate ? new Date(child.birthDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'}) : '-'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">Belum ada data anak.</p>
                            )}
                        </DetailSection>
                    </>
                )}

                {activeTab === 'pendidikan' && (
                    <DetailSection title="Detail Pendidikan Terakhir">
                        <InfoField label="Pendidikan Terakhir" value={employee.lastEducation} icon={<GraduationCap className="w-4 h-4" />} />
                        <InfoField label="Nama Sekolah/Universitas" value={employee.educationDetails?.universityName} icon={<Building className="w-4 h-4" />} />
                        <InfoField label="Jurusan" value={employee.educationDetails?.major} icon={<BookOpen className="w-4 h-4" />} />
                        {['D3', 'S1', 'S2', 'S3'].includes(employee.lastEducation || '') && (
                            <InfoField label="IPK" value={employee.educationDetails?.gpa} icon={<Award className="w-4 h-4" />} />
                        )}
                        <InfoField label="Tahun Masuk" value={employee.educationDetails?.entryYear} icon={<Calendar className="w-4 h-4" />} />
                        <InfoField label="Tahun Lulus" value={employee.educationDetails?.graduationYear} icon={<Calendar className="w-4 h-4" />} />
                    </DetailSection>
                )}

                {activeTab === 'pekerjaan' && (
                    <DetailSection title="Status Pekerjaan">
                        <InfoField label="Jabatan" value={employee.position} icon={<Briefcase className="w-4 h-4" />} />
                        <InfoField label="Penempatan Klien" value={clientMap.get(employee.clientId || '')} icon={<Building className="w-4 h-4" />} />
                        <InfoField label="Cabang" value={employee.branch} icon={<MapPin className="w-4 h-4" />} />
                        <InfoField label="Tanggal Bergabung" value={employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'} icon={<Calendar className="w-4 h-4" />} />
                        <InfoField label="Akhir Kontrak (EOC)" value={employee.endDate ? new Date(employee.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'} icon={<Calendar className="w-4 h-4" />} />
                        <InfoField label="Kontrak Ke-" value={String(employee.contractNumber)} icon={<FileText className="w-4 h-4" />} />
                        <div className="md:col-span-2">
                            <InfoField label="Catatan Surat Peringatan (SP)" value={employee.disciplinaryActions} icon={<Shield className="w-4 h-4" />} />
                        </div>
                    </DetailSection>
                )}

                {activeTab === 'finansial' && (
                    <>
                        <DetailSection title="Rekening Bank">
                            <MaskedField label="Nomor Rekening" value={employee.bankAccount?.number} icon={<CreditCard className="w-4 h-4" />} />
                            <InfoField label="Bank Penerima" value={employee.bankAccount?.bankName} icon={<Building className="w-4 h-4" />} />
                             <div className="md:col-span-2">
                                <InfoField label="Nama Pemilik Rekening" value={employee.bankAccount?.holderName} icon={<UserIcon className="w-4 h-4" />} />
                            </div>
                        </DetailSection>
                         <DetailSection title="Jaminan Sosial & Pajak">
                            <MaskedField label="BPJS Ketenagakerjaan" value={employee.bpjs?.ketenagakerjaan} icon={<Shield className="w-4 h-4" />} />
                            <MaskedField label="BPJS Kesehatan" value={employee.bpjs?.kesehatan} icon={<Shield className="w-4 h-4" />} />
                             <MaskedField label="NPWP Pribadi" value={employee.npwp} icon={<CreditCard className="w-4 h-4" />} />
                        </DetailSection>
                    </>
                )}

                {activeTab === 'dokumen' && (
                    <div className="space-y-10">
                        <DetailSection title="Tanda Tangan Digital (E-Signature)" grid={false}>
                            <div className="p-6 bg-blue-50/80 rounded-[1.5rem] border border-blue-200 text-center">
                                {signatureData ? (
                                    <div className="space-y-4">
                                        <div className="inline-block p-4 bg-white rounded-2xl shadow-lg border border-slate-100">
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
                                            className="px-8 py-3 bg-blue-600 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest"
                                        >
                                            Buat Sekarang
                                        </button>
                                    </div>
                                )}
                            </div>
                        </DetailSection>

                        <DetailSection title="Dokumen Resmi" grid={false}>
                            {[
                                {type: DocumentType.PKWT_NEW, url: employee.documents?.pkwtNewHire, name: "PKWT New Hire"}, 
                                {type: DocumentType.SP_LETTER, url: employee.documents?.spLetter, name: "Surat Peringatan (SP)"}
                            ].map(doc => (
                                <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-200" key={doc.type}>
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className="p-3 bg-white text-blue-600 rounded-xl shadow-sm border border-slate-100"><FileText className="w-6 h-6" /></div>
                                        <div>
                                            <span className="font-black text-sm text-slate-800 uppercase tracking-tight">{doc.name}</span>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dokumen Terverifikasi</p>
                                        </div>
                                    </div>
                                    <DocumentActionButton employeeId={employee.id} documentType={doc.type} documentIdentifier={doc.type} documentName={doc.name} fileUrl={doc.url} requests={documentRequests} onRequest={onRequestDocument} fullWidth={true} />
                                </div>
                            ))}
                        </DetailSection>
                         <DetailSection title="Dokumen Pribadi" grid={false}>
                            {renderDocumentLink("Foto KTP", employee.documents?.photoKtpUrl)}
                            {renderDocumentLink("Foto NPWP", employee.documents?.photoNpwpUrl)}
                            {renderDocumentLink("Foto Kartu Keluarga (KK)", employee.documents?.photoKkUrl)}
                        </DetailSection>
                    </div>
                )}

                {activeTab === 'slip gaji' && (
                    <DetailSection title={`Histori Slip Gaji Tahun ${selectedPayslipYear}`}>
                        {MONTH_NAMES.map((month, index) => { 
                            const period = `${selectedPayslipYear}-${(index + 1).toString().padStart(2, '0')}`; 
                            const payslipForMonth = employeePayslips.find(p => p.period === period);
                            return (
                                <div key={month} className={`p-4 rounded-2xl border-2 transition-all ${payslipForMonth ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
                                    <span className="font-black text-sm text-slate-400 mb-3 block">{month}</span>
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
                                        <div className="flex items-center justify-center space-x-2 w-full px-3 py-3 bg-slate-100 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest cursor-not-allowed">
                                            <FileX className="w-4 h-4" />
                                            <span>Tidak Tersedia</span>
                                        </div>
                                    )}
                                </div>
                            ); 
                        })}
                    </DetailSection>
                )}

                {activeTab === 'pengkinian data' && (
                    <>
                        {pendingSubmission ? (
                             <div className="text-center p-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-800">Data Anda Sedang Direview</h3>
                                <p className="text-slate-500 mt-2">
                                    Data yang Anda kirim pada {new Date(pendingSubmission.submitted_at).toLocaleString('id-ID')} sedang menunggu persetujuan dari PIC. 
                                    <br />
                                    Anda akan menerima notifikasi jika sudah disetujui.
                                </p>
                            </div>
                        ) : (
                           <DataUpdateForm 
                                employee={employee}
                                onCreateSubmission={onCreateSubmission}
                           />
                        )}
                    </>
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
    appSettings: AppSettings[]; // NEW
    employeeSubmissions: EmployeeDataSubmission[]; // NEW
    onRequestDocument: (request: Omit<DocumentRequest, 'id' | 'status' | 'requestTimestamp'>) => Promise<void>;
    onUpdateEmployee: (employee: Partial<Employee>) => Promise<void>;
    onCreateSubmission: (submission: Omit<EmployeeDataSubmission, 'id' | 'submitted_at' | 'status'>) => Promise<void>; // NEW
}

const EmployeePortal: React.FC<EmployeePortalProps> = ({ verifiedEmployee, onLogout, ...allData }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8">
            <header className="max-w-4xl mx-auto w-full flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <img src="https://i.imgur.com/P7t1bQy.png" alt="SWAPRO Logo" className="h-8" />
                    <span className="text-xl font-bold text-slate-800 tracking-tight">PORTAL KARYAWAN</span>
                </div>
                <button 
                    onClick={onLogout} 
                    className="p-3 bg-white text-red-600 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:bg-red-50 transition-all active:scale-90"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>
            
            <main className="max-w-4xl mx-auto w-full pb-10">
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
            </main>
        </div>
    );
};

export default EmployeePortal;
