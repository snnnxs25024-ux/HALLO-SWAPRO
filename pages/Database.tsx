import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  User as UserIcon, 
  Briefcase, 
  Eye, 
  Edit, 
  Trash2,
  X,
  Phone,
  Building,
  CreditCard,
  FileText,
  Download,
  Shield,
  UploadCloud,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Upload,
  FileDown,
  Camera,
  FileUp,
  Receipt,
  Loader2,
  Cake,
  GraduationCap,
} from 'lucide-react';
import { Employee, Client, EmployeeStatus, User, UserRole, Payslip, EDUCATION_LEVELS } from '../types';
import { supabase } from '../services/supabaseClient';
import { useNotifier } from '../components/Notifier';


interface DatabaseProps {
  employees: Employee[];
  clients: Client[];
  payslips: Payslip[];
  onDataChange: (employees: Partial<Employee>[]) => Promise<void>; // for bulk import
  onAddEmployee: (employee: Employee) => Promise<void>;
  onUpdateEmployee: (employee: Employee) => Promise<void>;
  onDeleteEmployee: (employeeId: string) => Promise<void>;
  currentUser: User;
}

// --- CONSTANTS ---
const ITEMS_PER_PAGE = 8;
const CSV_HEADER_MAPPING: Record<string, string> = {
    'NIK KARYAWAN': 'id',
    'NIK SWAPRO': 'swaproId',
    'Nama Lengkap': 'fullName',
    'No KTP': 'ktpId',
    'No WhatsApp': 'whatsapp',
    'ID Klien': 'clientId',
    'Jabatan': 'position',
    'Cabang': 'branch',
    'Tanggal Join (YYYY-MM-DD)': 'joinDate',
    'Tanggal Akhir Kontrak (YYYY-MM-DD)': 'endDate',
    'Tanggal Resign (YYYY-MM-DD)': 'resignDate',
    'No Rekening': 'bankAccount.number',
    'Nama Pemilik Rekening': 'bankAccount.holderName',
    'Nama Bank': 'bankAccount.bankName',
    'No BPJS Ketenagakerjaan': 'bpjs.ketenagakerjaan',
    'No BPJS Kesehatan': 'bpjs.kesehatan',
    'NPWP': 'npwp',
    'Jenis Kelamin (Laki-laki/Perempuan)': 'gender',
    'Tanggal Lahir (YYYY-MM-DD)': 'birthDate',
    'Pendidikan Terakhir': 'lastEducation',
    'Kontrak Ke': 'contractNumber',
    'Catatan SP': 'disciplinaryActions',
    'Status (Active/Resigned/Terminated)': 'status',
    'URL Foto Profil': 'profilePhotoUrl'
};


// --- HELPER FUNCTIONS ---
const getFileNameFromUrl = (url?: string): string => {
    if (!url) return 'File tidak ditemukan';
    try {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/');
        return decodeURIComponent(pathSegments[pathSegments.length - 1]);
    } catch (e) {
        return 'nama_file_tidak_valid.bin';
    }
};

const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('id-ID', {
        month: 'long',
        year: 'numeric'
    });
};

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}


// --- SUB-COMPONENTS ---
export const EmployeeCard: React.FC<{ 
  employee: Employee, 
  clientName: string, 
  onView: () => void, 
  onEdit?: () => void, 
  onDelete?: () => void,
  isViewOnly?: boolean 
}> = ({ employee, clientName, onView, onEdit, onDelete, isViewOnly }) => (
  <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200 p-5 group transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-300">
    <div className="flex flex-col items-center text-center">
      <img src={employee.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=E0E7FF&color=4F46E5`} alt={employee.fullName} className="w-24 h-24 rounded-full flex-shrink-0 object-cover border-4 border-white shadow-md mb-4" />
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-lg text-slate-800 truncate">{employee.fullName}</h3>
        <p className="text-sm text-slate-400 font-mono">{employee.id}</p>
        <div className="flex items-center justify-center space-x-1.5 mt-1">
          <MapPin className="w-4 h-4 text-slate-400" />
          <p className="text-sm text-slate-500 truncate">{employee.branch}</p>
        </div>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
      <div className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${employee.status === EmployeeStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
          {employee.status}
      </div>
      <div className="flex space-x-1 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button onClick={onView} title="Lihat Detail" className="p-2 rounded-full hover:bg-blue-50 text-slate-400 hover:text-blue-600"><Eye className="w-5 h-5" /></button>
        {!isViewOnly && onEdit && onDelete && (
          <>
            <button onClick={onEdit} title="Edit" className="p-2 rounded-full hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"><Edit className="w-5 h-5" /></button>
            <button onClick={onDelete} title="Hapus" className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
          </>
        )}
      </div>
    </div>
  </div>
);

const ProfilePhotoUpload: React.FC<{
    value?: string;
    onChange: (file: File | null) => void;
}> = ({ value, onChange }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        setPreview(value || null);
    }, [value]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            onChange(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (inputRef.current) {
            inputRef.current.value = "";
        }
        onChange(null);
        setPreview(null);
    };

    return (
        <div className="flex flex-col items-center">
            <input type="file" accept="image/*" ref={inputRef} onChange={handleFileSelect} className="hidden" />
            <div 
                className="relative w-32 h-32 rounded-full cursor-pointer group bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-blue-400 transition-colors"
                onClick={() => inputRef.current?.click()}
            >
                {preview ? (
                    <>
                        <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-full" />
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                    </>
                ) : (
                    <div className="text-center text-slate-400">
                        <UserIcon className="w-10 h-10 mx-auto" />
                        <p className="text-xs font-semibold mt-1">Upload Foto</p>
                    </div>
                )}
            </div>
            {preview && (
                <button type="button" onClick={handleRemove} className="mt-2 text-sm text-red-500 hover:text-red-700 font-semibold">
                    Hapus Foto
                </button>
            )}
        </div>
    );
};


const FileUploadField: React.FC<{
    label: string;
    name: string;
    value?: string;
    onChange: (name: string, file: File | null, fileName: string | null) => void;
}> = ({ label, name, value, onChange }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    useEffect(() => {
        setFileName(value ? getFileNameFromUrl(value) : null);
    }, [value]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            onChange(name, file, file.name);
            setFileName(file.name);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (inputRef.current) inputRef.current.value = "";
        onChange(name, null, null);
        setFileName(null);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
            <div 
                className={`relative flex items-center p-3.5 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                    fileName ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50/50'
                }`}
                onClick={() => inputRef.current?.click()}
            >
                <input type="file" ref={inputRef} onChange={handleFileSelect} className="hidden" />
                {fileName ? (
                    <>
                        <FileCheck2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        <div className="ml-3 min-w-0 flex-1">
                            <p className="text-base font-semibold text-blue-800 truncate">{fileName}</p>
                        </div>
                        <button type="button" onClick={handleRemove} className="ml-2 p-1 rounded-full text-blue-500 hover:bg-blue-200 hover:text-blue-700">
                           <X className="w-5 h-5" />
                        </button>
                    </>
                ) : (
                    <>
                        <UploadCloud className="w-6 h-6 text-gray-400" />
                        <p className="ml-3 text-base text-gray-500">Unggah file</p>
                    </>
                )}
            </div>
        </div>
    );
};


export const EmployeeModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    mode: 'add' | 'edit' | 'view',
    employeeData: Partial<Employee> | null,
    clients: Client[],
    payslips: Payslip[],
    onSave: (employee: Employee) => Promise<void>,
    onEdit: () => void,
    onDelete: () => void,
    currentUser: User
}> = ({ isOpen, onClose, mode, employeeData, clients, payslips, onSave, onEdit, onDelete, currentUser }) => {
    const [formData, setFormData] = useState<Partial<Employee>>({});
    const [filePayloads, setFilePayloads] = useState<Record<string, File | null>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profil');
    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
    const notifier = useNotifier();
    
    const employeePayslips = useMemo(() => {
        if (!employeeData?.id) return [];
        return payslips
            .filter(p => p.employeeId === employeeData.id)
            .sort((a, b) => b.period.localeCompare(a.period));
    }, [payslips, employeeData]);

    React.useEffect(() => {
        setFormData(employeeData || {
            gender: 'Laki-laki',
            status: EmployeeStatus.ACTIVE,
            lastEducation: 'SMA/SMK',
            contractNumber: 1,
            bankAccount: { number: '', holderName: '', bankName: '' },
            bpjs: { ketenagakerjaan: '', kesehatan: '' },
            documents: {}
        });
        setFilePayloads({});
        setActiveTab('profil');
    }, [employeeData, isOpen]);

    if (!isOpen) return null;

    const isViewMode = mode === 'view';
    const isPicUser = currentUser.role === UserRole.PIC || currentUser.role === UserRole.ADMIN;
    
    const uploadFile = async (bucket: string, path: string, file: File): Promise<string> => {
        const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
            cacheControl: '3600',
            upsert: true,
        });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        return publicUrl;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...(prev as any)[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handlePhotoChange = (file: File | null) => {
        setFilePayloads(prev => ({ ...prev, profilePhoto: file }));
    };

    const handleFileChange = (name: string, file: File | null) => {
        setFilePayloads(prev => ({ ...prev, [name]: file }));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const employeeId = formData.id;
            if (!employeeId) throw new Error("NIK Karyawan wajib diisi.");

            const finalData = { ...formData };
            
            // Handle profile photo upload
            if (filePayloads.profilePhoto) {
                const file = filePayloads.profilePhoto;
                const filePath = `profile-photos/${employeeId}-${Date.now()}.${file.name.split('.').pop()}`;
                const publicUrl = await uploadFile('public', filePath, file);
                finalData.profilePhotoUrl = publicUrl;
            }

            // Handle document uploads
            const docUploads = ['documents.pkwtNewHire', 'documents.pkwtExtension', 'documents.spLetter'];
            for (const docName of docUploads) {
                if (filePayloads[docName]) {
                    const file = filePayloads[docName]!;
                    const filePath = `documents/${employeeId}/${file.name}`;
                    const publicUrl = await uploadFile('public', filePath, file);
                    const [parent, child] = docName.split('.');
                    if (!finalData.documents) finalData.documents = {};
                    finalData.documents[child as keyof Employee['documents']] = publicUrl;
                }
            }

            await onSave(finalData as Employee);
        } catch (error: any) {
            console.error("Failed to save employee:", error);
            notifier.addNotification(`Error: ${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const title = mode === 'add' ? 'Tambah Karyawan' : (mode === 'edit' ? 'Edit Data' : 'Detail Data');

    // --- RENDER FUNCTIONS FOR VIEW MODE ---
    const renderInfoItem = (icon: React.ReactNode, label: string, value: any) => (
        <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 text-slate-400 mt-1">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{label}</p>
                <p className="text-base font-semibold text-slate-800 break-words">{value || '-'}</p>
            </div>
        </div>
    );
    
    const renderDocumentLink = (label: string, url?: string) => (
        url ? (
            <a href={url} download={getFileNameFromUrl(url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-100 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200">
                <div className="flex items-center space-x-3 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="font-semibold text-sm text-slate-700 truncate">{getFileNameFromUrl(url)}</span>
                </div>
                <Download className="w-5 h-5 text-slate-400 ml-2" />
            </a>
        ) : (
             <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg opacity-60 border border-gray-100">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500 italic">{label} belum tersedia</span>
            </div>
        )
    );
    
    const tabs = ['profil', 'pekerjaan', 'finansial', 'dokumen', 'slip gaji'];

    if (isViewMode && employeeData) {
        const birthDate = employeeData.birthDate;
        const age = birthDate ? Math.floor((new Date().getTime() - new Date(birthDate).getTime()) / 31557600000) : null;
        const birthDateDisplay = birthDate ? `${new Date(birthDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}${age ? ` (${age} thn)` : ''}` : '-';

        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-4">
                <div className="bg-white rounded-none md:rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh] border border-slate-200">
                    {/* Header View */}
                    <div className="p-5 md:p-6 bg-slate-50 border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0">
                       <div className="flex items-center space-x-4">
                            <img src={employeeData.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeData.fullName || '')}&background=random`} alt={employeeData.fullName} className="w-20 h-20 md:w-24 md:h-24 rounded-full ring-4 ring-white shadow-md object-cover" />
                            <div className="min-w-0">
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 truncate pr-2">{employeeData.fullName}</h2>
                                <p className="text-sm md:text-base text-slate-500 font-mono">{employeeData.id}</p>
                                <div className={`mt-2 inline-block text-xs font-bold uppercase px-2.5 py-1 rounded-full ${employeeData.status === EmployeeStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {employeeData.status}
                                </div>
                            </div>
                       </div>
                        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            {isPicUser && (
                              <>
                                <button onClick={onEdit} className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg font-semibold text-sm text-slate-700 hover:bg-gray-100 transition whitespace-nowrap"><Edit className="w-4 h-4"/><span>Edit</span></button>
                                <button onClick={onDelete} className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500 text-white rounded-lg font-semibold text-sm hover:bg-red-600 transition whitespace-nowrap"><Trash2 className="w-4 h-4"/><span>Hapus</span></button>
                              </>
                            )}
                            <button type="button" onClick={onClose} className="p-3 rounded-lg hover:bg-gray-200"><X className="w-5 h-5" /></button>
                        </div>
                    </div>
                    {/* Tabs View */}
                     <div className="px-4 border-b border-gray-200 bg-white sticky top-[105px] md:top-0">
                        <nav className="-mb-px flex space-x-4 md:space-x-6 overflow-x-auto">
                            {tabs.map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-1 border-b-2 font-bold text-sm uppercase tracking-tight whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content View */}
                    <div className="p-5 md:p-6 overflow-y-auto bg-white flex-1">
                        {activeTab === 'profil' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderInfoItem(<UserIcon className="w-5 h-5" />, "NIK KTP", employeeData.ktpId)}
                                {renderInfoItem(<Phone className="w-5 h-5" />, "No. WhatsApp", employeeData.whatsapp)}
                                {renderInfoItem(<UserIcon className="w-5 h-5" />, "Jenis Kelamin", employeeData.gender)}
                                {renderInfoItem(<Cake className="w-5 h-5" />, "Tanggal Lahir", birthDateDisplay)}
                                {renderInfoItem(<GraduationCap className="w-5 h-5" />, "Pendidikan Terakhir", employeeData.lastEducation)}
                                {renderInfoItem(<CreditCard className="w-5 h-5" />, "NPWP", employeeData.npwp)}
                                {renderInfoItem(<UserIcon className="w-5 h-5" />, "NIK SWAPRO", employeeData.swaproId)}
                            </div>
                        )}
                        {activeTab === 'pekerjaan' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderInfoItem(<Building className="w-5 h-5" />, "Klien", clientMap.get(employeeData.clientId || ''))}
                                {renderInfoItem(<Briefcase className="w-5 h-5" />, "Jabatan", employeeData.position)}
                                {renderInfoItem(<Building className="w-5 h-5" />, "Cabang", employeeData.branch)}
                                {renderInfoItem(<UserIcon className="w-5 h-5" />, "Tanggal Join", employeeData.joinDate ? new Date(employeeData.joinDate).toLocaleDateString('id-ID') : '-')}
                                {renderInfoItem(<UserIcon className="w-5 h-5" />, "End of Contract", employeeData.endDate ? new Date(employeeData.endDate).toLocaleDateString('id-ID') : '-')}
                                {renderInfoItem(<UserIcon className="w-5 h-5" />, "Tanggal Resign", employeeData.resignDate ? new Date(employeeData.resignDate).toLocaleDateString('id-ID') : '-')}
                                {renderInfoItem(<FileText className="w-5 h-5" />, "Kontrak Ke", employeeData.contractNumber)}
                                <div className="md:col-span-2">
                                  {renderInfoItem(<Shield className="w-5 h-5" />, "Catatan SP", employeeData.disciplinaryActions)}
                                </div>
                            </div>
                        )}
                         {activeTab === 'finansial' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderInfoItem(<CreditCard className="w-5 h-5" />, "Bank", employeeData.bankAccount?.bankName)}
                                {renderInfoItem(<CreditCard className="w-5 h-5" />, "No. Rekening", employeeData.bankAccount?.number)}
                                {renderInfoItem(<UserIcon className="w-5 h-5" />, "Nama Rekening", employeeData.bankAccount?.holderName)}
                                {renderInfoItem(<Shield className="w-5 h-5" />, "BPJS TK", employeeData.bpjs?.ketenagakerjaan)}
                                {renderInfoItem(<Shield className="w-5 h-5" />, "BPJS KS", employeeData.bpjs?.kesehatan)}
                            </div>
                        )}
                        {activeTab === 'dokumen' && (
                            <div className="space-y-4 max-w-full">
                                {renderDocumentLink("PKWT New Hire", employeeData.documents?.pkwtNewHire)}
                                {renderDocumentLink("PKWT Perpanjangan", employeeData.documents?.pkwtExtension)}
                                {renderDocumentLink("Surat SP", employeeData.documents?.spLetter)}
                            </div>
                        )}
                        {activeTab === 'slip gaji' && (
                             <div className="space-y-3">
                                {employeePayslips.length > 0 ? (
                                    employeePayslips.map(slip => (
                                        <a key={slip.id} href={slip.fileUrl} download={`slip-gaji-${employeeData.fullName}-${slip.period}.pdf`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-100 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200">
                                            <div className="flex items-center space-x-3 min-w-0">
                                                <Receipt className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                <span className="font-semibold text-sm text-slate-700 truncate">Slip Gaji {formatPeriod(slip.period)}</span>
                                            </div>
                                            <Download className="w-5 h-5 text-slate-400 ml-2" />
                                        </a>
                                    ))
                                ) : (
                                    <p className="text-center text-base text-slate-400 italic py-8">Belum ada data slip gaji untuk karyawan ini.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const renderFormField = (label: string, name: string, value: any, options: any = {}) => (
        <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">{label}</label>
            {options.type === 'select' ? (
                <select name={name} value={value || ''} onChange={handleChange} className="w-full text-base px-3 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm appearance-none">
                    {options.options.map((opt: any) => <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>)}
                </select>
            ) : options.type === 'textarea' ? (
                <textarea name={name} value={value || ''} onChange={handleChange} rows={3} className="w-full text-base px-3 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"></textarea>
            ) : (
                <input type={options.type || "text"} name={name} value={value || ''} onChange={handleChange} className="w-full text-base px-3 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm disabled:bg-gray-100" disabled={options.disabled}/>
            )}
        </div>
    );
    
    // --- ADD/EDIT FORM ---
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-none md:rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh] border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 md:p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 flex-1">
                  {/* Column 1: Profile & Employment */}
                  <div className="space-y-6">
                      <ProfilePhotoUpload value={formData.profilePhotoUrl} onChange={handlePhotoChange} />
                      
                      <div>
                          <h4 className="font-bold text-blue-600 text-base mb-3 border-b border-blue-100 pb-2">Profil Pribadi</h4>
                          <div className="space-y-4">
                              {renderFormField("Nama Lengkap", "fullName", formData.fullName)}
                              <div className="grid grid-cols-2 gap-4">
                                  {renderFormField("NIK Karyawan", "id", formData.id, {disabled: mode === 'edit'})}
                                  {renderFormField("NIK SWAPRO", "swaproId", formData.swaproId)}
                              </div>
                              {renderFormField("NIK KTP", "ktpId", formData.ktpId)}
                              {renderFormField("WhatsApp", "whatsapp", formData.whatsapp)}
                               <div className="grid grid-cols-2 gap-4">
                                  {renderFormField("Jenis Kelamin", "gender", formData.gender, {type: 'select', options: ['Laki-laki', 'Perempuan']})}
                                  {renderFormField("Tanggal Lahir", "birthDate", formData.birthDate, {type: 'date'})}
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 {renderFormField("Pendidikan Terakhir", "lastEducation", formData.lastEducation, {type: 'select', options: [{value: '', label: 'Pilih Pendidikan'}, ...EDUCATION_LEVELS.map(l => ({value: l, label: l}))]})}
                                  {renderFormField("NPWP", "npwp", formData.npwp)}
                              </div>
                          </div>
                      </div>

                      <div>
                          <h4 className="font-bold text-blue-600 text-base mb-3 border-b border-blue-100 pb-2">Informasi Kerja</h4>
                          <div className="space-y-4">
                               <div className="grid grid-cols-2 gap-4">
                                  {renderFormField("Klien", "clientId", formData.clientId, {type: 'select', options: [{value: '', label: 'Pilih Klien'}, ...clients.map(c => ({value: c.id, label: c.name}))]})}
                                  {renderFormField("Jabatan", "position", formData.position)}
                              </div>
                              {renderFormField("Cabang", "branch", formData.branch)}
                              <div className="grid grid-cols-2 gap-4">
                                  {renderFormField("Tanggal Join", "joinDate", formData.joinDate, {type: 'date'})}
                                  {renderFormField("End of Contract", "endDate", formData.endDate, {type: 'date'})}
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  {renderFormField("Tanggal Resign", "resignDate", formData.resignDate, {type: 'date'})}
                                  {renderFormField("Kontrak Ke", "contractNumber", formData.contractNumber, {type: 'number'})}
                              </div>
                              {renderFormField("Status", "status", formData.status, {type: 'select', options: Object.values(EmployeeStatus)})}
                              {renderFormField("Catatan SP", "disciplinaryActions", formData.disciplinaryActions, {type: 'textarea'})}
                          </div>
                      </div>
                  </div>

                  {/* Column 2: Financial & Documents */}
                  <div className="space-y-6">
                      <div>
                          <h4 className="font-bold text-blue-600 text-base mb-3 border-b border-blue-100 pb-2">Finansial & BPJS</h4>
                          <div className="space-y-4">
                              {renderFormField("Nama Bank", "bankAccount.bankName", formData.bankAccount?.bankName)}
                              {renderFormField("No. Rekening", "bankAccount.number", formData.bankAccount?.number)}
                              {renderFormField("Nama di Rekening", "bankAccount.holderName", formData.bankAccount?.holderName)}
                              {renderFormField("BPJS Ketenagakerjaan", "bpjs.ketenagakerjaan", formData.bpjs?.ketenagakerjaan)}
                              {renderFormField("BPJS Kesehatan", "bpjs.kesehatan", formData.bpjs?.kesehatan)}
                          </div>
                      </div>
                      
                      <div>
                          <h4 className="font-bold text-blue-600 text-base mb-3 border-b border-blue-100 pb-2">Dokumen (Max 5MB)</h4>
                          <div className="space-y-4">
                              <FileUploadField label="PKWT New Hire" name="documents.pkwtNewHire" value={formData.documents?.pkwtNewHire} onChange={handleFileChange} />
                              <FileUploadField label="PKWT Perpanjangan" name="documents.pkwtExtension" value={formData.documents?.pkwtExtension} onChange={handleFileChange} />
                              <FileUploadField label="Surat SP" name="documents.spLetter" value={formData.documents?.spLetter} onChange={handleFileChange} />
                          </div>
                      </div>
                  </div>
              </div>
              
              <div className="p-5 border-t border-gray-200 flex flex-col md:flex-row justify-end gap-3 bg-slate-50 sticky bottom-0 z-10">
                <button type="button" onClick={onClose} className="w-full md:w-auto px-6 py-3 rounded-xl font-bold text-base text-slate-600 bg-white border border-slate-300 hover:bg-gray-100 transition order-2 md:order-1" disabled={isSaving}>Batal</button>
                <button type="submit" className="w-full md:w-auto px-6 py-3 rounded-xl font-bold text-base text-white bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition shadow-lg shadow-blue-500/20 order-1 md:order-2 flex items-center justify-center" disabled={isSaving}>
                  {isSaving && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
          </form>
        </div>
    );
};

export const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  const maxVisible = 3;
  let start = Math.max(1, currentPage - 1);
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex items-center justify-center space-x-2 mt-10 pb-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center justify-center p-2.5 rounded-lg bg-white border border-gray-300 text-slate-600 hover:bg-gray-100 disabled:opacity-40 transition"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      {start > 1 && <span className="text-slate-400 px-2">...</span>}
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`w-11 h-11 rounded-lg font-bold text-base transition ${
            currentPage === number
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white border border-gray-300 text-slate-500 hover:bg-gray-50'
          }`}
        >
          {number}
        </button>
      ))}
      {end < totalPages && <span className="text-slate-400 px-2">...</span>}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center p-2.5 rounded-lg bg-white border border-gray-300 text-slate-600 hover:bg-gray-100 disabled:opacity-40 transition"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </nav>
  );
};


// --- MAIN COMPONENT ---
const Database: React.FC<DatabaseProps> = ({ employees, clients, payslips, onDataChange, onAddEmployee, onUpdateEmployee, onDeleteEmployee, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [modalState, setModalState] = useState<{ isOpen: boolean, mode: 'add' | 'edit' | 'view', data: Partial<Employee> | null }>({ isOpen: false, mode: 'add', data: null });
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notifier = useNotifier();

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      (e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterClient === 'all' || e.clientId === filterClient)
    ).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [employees, searchTerm, filterClient]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterClient]);
  
  const paginatedEmployees = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);

  const handleOpenModal = (mode: 'add' | 'edit' | 'view', data: Partial<Employee> | null = null) => {
    setModalState({ isOpen: true, mode, data });
  };
  
  const handleCloseModal = () => {
    setModalState({ isOpen: false, mode: 'add', data: null });
  };
  
  const handleSave = async (employeeToSave: Employee) => {
    if (modalState.mode === 'add') {
      await onAddEmployee(employeeToSave);
    } else {
      await onUpdateEmployee(employeeToSave);
    }
    handleCloseModal();
  };

  const handleDelete = async (employeeId: string) => {
    if (window.confirm('Hapus data karyawan ini?')) {
        await onDeleteEmployee(employeeId);
        handleCloseModal();
    }
  };

  const handleDownloadTemplate = () => {
    const userFriendlyHeaders = Object.keys(CSV_HEADER_MAPPING);
    const csvContent = "data:text/csv;charset=utf-8," + userFriendlyHeaders.join(';');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_karyawan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getValueByPath = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const handleExportData = () => {
    const dataToExport = filteredEmployees; // Export based on current filters
    const userFriendlyHeaders = Object.keys(CSV_HEADER_MAPPING);
    const internalKeys = Object.values(CSV_HEADER_MAPPING);
    const csvRows = [userFriendlyHeaders.join(';')];

    dataToExport.forEach(employee => {
        const row = internalKeys.map(key => {
            let value = getValueByPath(employee, key);
            if (value === null || value === undefined) {
                value = '';
            }
            const stringValue = String(value);
            if (stringValue.includes(';')) {
                return `"${stringValue}"`;
            }
            return stringValue;
        });
        csvRows.push(row.join(';'));
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURI(csvRows.join('\n'));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "karyawan_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifier.addNotification(`${dataToExport.length} baris data berhasil diekspor.`, 'success');
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target?.result as string;
        try {
            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length <= 1) throw new Error("File CSV kosong atau hanya berisi header.");
            
            const userHeaders = lines[0].trim().split(';');
            const internalKeys = userHeaders.map(h => CSV_HEADER_MAPPING[h.trim()]);
            
            if (internalKeys.some(key => !key)) {
                throw new Error("Format header pada file CSV tidak valid. Gunakan template yang disediakan.");
            }
            
            const importedEmployees: Partial<Employee>[] = [];
            const dateKeys = ['joinDate', 'endDate', 'resignDate', 'birthDate'];

            lines.slice(1).forEach(line => {
                const values = line.trim().split(';');
                if (values.length !== internalKeys.length) return; // Skip malformed rows

                const importedObject: Record<string, any> = {};

                internalKeys.forEach((key, index) => {
                    if (!key) return;
                    
                    const rawValue = values[index];
                    
                    if (rawValue === undefined || rawValue.trim() === '') {
                        if (dateKeys.includes(key)) {
                             if (key.includes('.')) {
                                const [parent, child] = key.split('.');
                                if (!importedObject[parent]) importedObject[parent] = {};
                                (importedObject[parent] as any)[child] = null;
                            } else {
                                importedObject[key] = null;
                            }
                        }
                        return; 
                    }

                    const value = rawValue.trim();

                    if (key.includes('.')) {
                        const [parent, child] = key.split('.');
                        if (!importedObject[parent]) importedObject[parent] = {};
                        (importedObject[parent] as any)[child] = value;
                    } else {
                        importedObject[key] = value;
                    }
                });

                if (importedObject.id) {
                    if (importedObject.contractNumber) {
                        importedObject.contractNumber = parseInt(importedObject.contractNumber, 10) || 1;
                    }
                    importedEmployees.push(importedObject as Partial<Employee>);
                }
            });


            if(importedEmployees.length > 0) {
                await onDataChange(importedEmployees);
            } else {
                notifier.addNotification("Tidak ada data valid yang ditemukan untuk diimpor.", "info");
            }

        } catch (error: any) {
            console.error("Error parsing CSV:", error);
            notifier.addNotification(`Gagal mengimpor file: ${error.message}`, 'error');
        } finally {
            if(fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 md:p-10">
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Database Karyawan</h1>
      <p className="text-base text-slate-500 mt-1">Kelola data terpusat secara efisien.</p>

      <div className="my-6 md:my-8 bg-white p-4 rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Cari nama/NIK..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-blue-500 text-base"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
                className="px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-blue-500 text-base appearance-none"
                value={filterClient}
                onChange={e => setFilterClient(e.target.value)}
            >
                <option value="all">Semua Klien</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 items-stretch gap-3">
             <button 
                onClick={handleDownloadTemplate}
                className="flex items-center justify-center space-x-2 bg-white text-slate-600 border border-slate-300 px-4 py-2.5 rounded-xl font-semibold transition-all hover:bg-slate-50">
              <FileDown className="w-5 h-5" />
              <span className="text-base">Template</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".csv" />
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center space-x-2 bg-white text-slate-600 border border-slate-300 px-4 py-2.5 rounded-xl font-semibold transition-all hover:bg-slate-50">
              <Upload className="w-5 h-5" />
              <span className="text-base">Import</span>
            </button>
            <button 
                onClick={handleExportData}
                className="flex items-center justify-center space-x-2 bg-white text-slate-600 border border-slate-300 px-4 py-2.5 rounded-xl font-semibold transition-all hover:bg-slate-50">
              <FileUp className="w-5 h-5" />
              <span className="text-base">Export</span>
            </button>
            <button 
                onClick={() => handleOpenModal('add')}
                className="lg:col-span-1 col-span-2 flex items-center justify-center space-x-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">
              <Plus className="w-5 h-5" />
              <span className="text-base">Tambah Karyawan</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {paginatedEmployees.map(emp => (
          <EmployeeCard 
            key={emp.id} 
            employee={emp} 
            clientName={clientMap.get(emp.clientId) || 'N/A'}
            onView={() => handleOpenModal('view', emp)}
            onEdit={() => handleOpenModal('edit', emp)}
            onDelete={() => handleDelete(emp.id)}
          />
        ))}
      </div>
      
      {filteredEmployees.length > ITEMS_PER_PAGE && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
      )}

      {filteredEmployees.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm mt-4">
            <div className="bg-slate-50 p-4 rounded-full inline-block mb-4">
                <Search className="w-10 h-10 text-slate-300"/>
            </div>
          <p className="text-slate-500 font-bold text-lg">Tidak ada hasil</p>
          <p className="text-base text-slate-400 mt-1 px-4">Kata kunci "{searchTerm}" tidak ditemukan di database kami.</p>
        </div>
      )}
      
      <EmployeeModal 
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        employeeData={modalState.data}
        clients={clients}
        payslips={payslips}
        onSave={handleSave}
        onEdit={() => handleOpenModal('edit', modalState.data)}
        onDelete={() => handleDelete(modalState.data?.id as string)}
        currentUser={currentUser}
      />
    </div>
  );
};

export default Database;