
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
  Calendar,
  FileX,
  Clock, 
  CheckCircle,
  Mail,
  Heart,
  Home,
  Users,
  Flag,
  BookOpen,
  Award,
  EyeOff,
  MessageCircle,
} from 'lucide-react';
import { Employee, Client, EmployeeStatus, User, UserRole, Payslip, EDUCATION_LEVELS, ContractDocument } from '../types';
import { supabase } from '../services/supabaseClient';
import { useNotifier } from '../components/Notifier';


interface DatabaseProps {
  employees: Employee[];
  clients: Client[];
  payslips: Payslip[];
  onDataChange: (employees: Partial<Employee>[]) => Promise<void>; // for bulk import
  onAddEmployee: (employee: Employee) => Promise<void>;
  onUpdateEmployee: (employee: Partial<Employee>) => Promise<void>;
  onDeleteEmployee: (employeeId: string) => Promise<void>;
  onResetEmployees: () => Promise<boolean>;
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
const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];


// --- HELPER FUNCTIONS ---
const getFileNameFromUrl = (url?: string): string => {
    if (!url) return 'File tidak ditemukan';
    try {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/');
        const fileName = decodeURIComponent(pathSegments[pathSegments.length - 1]);
        return fileName.split('/').pop() || 'nama_file_tidak_valid.bin';
    } catch (e) {
        return 'nama_file_tidak_valid.bin';
    }
};

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

const formatWhatsApp = (phone?: string) => {
    if (!phone) return '#';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    }
    return `https://wa.me/${cleaned}`;
};


const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('id-ID', {
        month: 'long',
        year: 'numeric'
    });
};

// --- SUB-COMPONENTS ---
export const EmployeeCard: React.FC<{ 
  employee: Employee, 
  clientName: string, 
  onView: () => void, 
  onEdit?: () => void, 
  onDelete?: () => void,
  isViewOnly?: boolean,
  submissionStatus?: 'pending' | 'approved' | 'rejected' | 'not_submitted';
}> = ({ employee, clientName, onView, onEdit, onDelete, isViewOnly, submissionStatus }) => {
    
    const cardBorderClass = useMemo(() => {
        switch (submissionStatus) {
            case 'pending':
                return 'border-blue-500 border-2 shadow-blue-500/10';
            case 'approved':
                return 'border-emerald-500 border-2';
            default:
                return 'border-gray-200';
        }
    }, [submissionStatus]);
    
    return (
        <div className={`bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-5 group transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-300 relative ${cardBorderClass}`}>
            {/* Fix: Wrap Lucide icon in a div with the title attribute as the title prop is not supported directly */}
            {submissionStatus === 'pending' && (
                <div className="absolute top-4 right-4 text-blue-500" title="Menunggu Review">
                    <Clock className="w-5 h-5" />
                </div>
            )}
            {/* Fix: Wrap Lucide icon in a div with the title attribute as the title prop is not supported directly */}
            {submissionStatus === 'approved' && (
                <div className="absolute top-4 right-4 text-emerald-500" title="Sudah Disetujui">
                    <CheckCircle className="w-5 h-5" />
                </div>
            )}
            <div className="flex flex-col items-center text-center">
              <img src={employee.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=E0E7FF&color=4F46E5`} alt={employee.fullName} className="w-24 h-24 rounded-full flex-shrink-0 object-cover border-4 border-white shadow-md mb-4" />
              <div className="w-full flex-1 min-w-0">
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
};

// NEW: Redesigned InfoField component
const InfoField: React.FC<{ label: string; value: string | undefined | null; icon: React.ReactNode; className?: string; }> = ({ label, value, icon, className }) => (
    <div className={`flex items-start space-x-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 ${className}`}>
        <div className="flex-shrink-0 text-blue-500 mt-0.5">{icon}</div>
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-800 leading-none">{value || '-'}</p>
        </div>
    </div>
);

// NEW: Redesigned MaskedField component
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
                <input type="file" ref={inputRef} onChange={handleFileChange} className="hidden" />
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
    onSave: (employee: Partial<Employee>) => Promise<void>,
    onEdit: () => void,
    onDelete: () => void,
    currentUser: User
}> = ({ isOpen, onClose, mode, employeeData, clients, payslips, onSave, onEdit, onDelete, currentUser }) => {
    const [formData, setFormData] = useState<Partial<Employee>>({});
    const [filePayloads, setFilePayloads] = useState<Record<string, File | null>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profil');
    const [selectedPayslipYear, setSelectedPayslipYear] = useState(new Date().getFullYear());
    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
    const notifier = useNotifier();
    
    const employeePayslips = useMemo(() => {
        if (!employeeData?.id) return [];
        return payslips
            .filter(p => p.employeeId === employeeData.id)
            .sort((a, b) => b.period.localeCompare(a.period));
    }, [payslips, employeeData]);
    
    const payslipYears = useMemo(() => {
        const years = new Set<string>(employeePayslips.map(p => p.period.substring(0, 4)));
        const currentYear = new Date().getFullYear().toString();
        years.add(currentYear);
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [employeePayslips]);

    React.useEffect(() => {
        const initialData = employeeData || {
            gender: 'Laki-laki', status: EmployeeStatus.ACTIVE, lastEducation: 'SMA/SMK', contractNumber: 1,
            bankAccount: {}, bpjs: {}, documents: { contractHistory: [] }, familyData: { childrenData: [] },
            addressKtp: {}, addressDomicile: { isSameAsKtp: true }, educationDetails: {}, emergencyContact: {}
        };
        // Ensure all nested objects exist to prevent errors
        const requiredKeys: (keyof Employee)[] = ['bankAccount', 'bpjs', 'documents', 'familyData', 'addressKtp', 'addressDomicile', 'educationDetails', 'emergencyContact'];
        requiredKeys.forEach(key => {
            if (!initialData[key]) (initialData as any)[key] = {};
        });
        if (!initialData.documents!.contractHistory) initialData.documents!.contractHistory = [];
        if (!initialData.familyData!.childrenData) initialData.familyData!.childrenData = [];

        setFormData(JSON.parse(JSON.stringify(initialData))); // Deep copy
        setFilePayloads({});
        setActiveTab('profil');
        setSelectedPayslipYear(new Date().getFullYear());
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
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        const updatedFormData = { ...formData };
        
        // Handle nested properties
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            (updatedFormData as any)[parent] = {
                ...(updatedFormData as any)[parent],
                [child]: type === 'checkbox' ? checked : value,
            };
        } else {
            (updatedFormData as any)[name] = type === 'checkbox' ? checked : value;
        }

        // Conditional logic for GPA
        if (name === 'lastEducation' && !['D3', 'S1', 'S2', 'S3'].includes(value)) {
            if (updatedFormData.educationDetails) {
                updatedFormData.educationDetails.gpa = '';
            }
        }
        
        setFormData(updatedFormData);
    };
    
    const handlePhotoChange = (file: File | null) => {
        setFilePayloads(prev => ({ ...prev, profilePhoto: file }));
    };

    const handleFileChange = (name: string, file: File | null) => {
        setFilePayloads(prev => ({ ...prev, [name]: file }));
    };
    
    const updateLatestEoc = (history: ContractDocument[]) => {
        if (!history || history.length === 0) return;
        
        const latestContract = history.reduce((latest, current) => {
            const latestDate = new Date(latest.endDate);
            const currentDate = new Date(current.endDate);
            return currentDate > latestDate ? current : latest;
        });

        if (latestContract.endDate) {
            setFormData(prev => ({ ...prev, endDate: latestContract.endDate }));
        }
    };
    
    const handleContractChange = (id: string, field: keyof ContractDocument, value: string) => {
        const updatedHistory = (formData.documents?.contractHistory || []).map(doc => 
            doc.id === id ? { ...doc, [field]: value } : doc
        );
        setFormData(prev => ({...prev, documents: {...prev.documents, contractHistory: updatedHistory}}));
        
        if(field === 'endDate') {
            updateLatestEoc(updatedHistory);
        }
    };

    const handleContractFileChange = (id: string, file: File | null) => {
        setFilePayloads(prev => ({ ...prev, [`contract-${id}`]: file }));
    };
    
    const addContractRow = () => {
        const newContract: ContractDocument = {
            id: `new-${Date.now()}`,
            name: '',
            startDate: '',
            endDate: '',
            fileUrl: '',
        };
        const updatedHistory = [...(formData.documents?.contractHistory || []), newContract];
        setFormData(prev => ({...prev, documents: {...prev.documents, contractHistory: updatedHistory}}));
    };

    const removeContractRow = (id: string) => {
         const updatedHistory = (formData.documents?.contractHistory || []).filter(doc => doc.id !== id);
         setFormData(prev => ({...prev, documents: {...prev.documents, contractHistory: updatedHistory}}));
         updateLatestEoc(updatedHistory);
    };
    
    const handleChildChange = (index: number, field: 'name' | 'birthDate', value: string) => {
        const updatedChildren = [...(formData.familyData?.childrenData || [])];
        if (!updatedChildren[index]) updatedChildren[index] = { name: '', birthDate: '' };
        updatedChildren[index][field] = value;
        setFormData(prev => ({ ...prev, familyData: { ...prev.familyData, childrenData: updatedChildren }}));
    };

    const addChild = () => {
        const updatedChildren = [...(formData.familyData?.childrenData || []), { name: '', birthDate: '' }];
        setFormData(prev => ({ ...prev, familyData: { ...prev.familyData, childrenData: updatedChildren }}));
    };
    
    const removeChild = (index: number) => {
        const updatedChildren = (formData.familyData?.childrenData || []).filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, familyData: { ...prev.familyData, childrenData: updatedChildren }}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const employeeId = formData.id;
            if (!employeeId) throw new Error("NIK Karyawan wajib diisi.");

            const finalData = { ...formData };
            if (!finalData.documents) finalData.documents = {};
            
            // Handle profile photo upload
            if (filePayloads.profilePhoto) {
                const file = filePayloads.profilePhoto;
                const filePath = `profile-photos/${employeeId}-${Date.now()}.${file.name.split('.').pop()}`;
                finalData.profilePhotoUrl = await uploadFile('swapro_files', filePath, file);
            }
            
            // Handle static document uploads
            const staticDocs = ['pkwtNewHire', 'spLetter'];
            for (const docKey of staticDocs) {
                const payloadKey = `documents.${docKey}`;
                if (filePayloads[payloadKey]) {
                    const file = filePayloads[payloadKey]!;
                    const filePath = `documents/${employeeId}/${file.name}`;
                    (finalData.documents as any)[docKey] = await uploadFile('swapro_files', filePath, file);
                }
            }
            
            // Handle new personal document uploads
            const personalDocs = ['photoKtp', 'photoNpwp', 'photoKk'];
            for (const docKey of personalDocs) {
                if (filePayloads[docKey]) {
                    const file = filePayloads[docKey]!;
                    const filePath = `documents/${employeeId}/personal/${docKey}-${file.name}`;
                    const url = await uploadFile('swapro_files', filePath, file);
                    if (!finalData.documents) finalData.documents = {};
                    (finalData.documents as any)[`${docKey}Url`] = url;
                }
            }

            // Handle contract history uploads
            if (finalData.documents.contractHistory) {
                for (let i = 0; i < finalData.documents.contractHistory.length; i++) {
                    const contract = finalData.documents.contractHistory[i];
                    const filePayloadKey = `contract-${contract.id}`;
                    if (filePayloads[filePayloadKey]) {
                        const file = filePayloads[filePayloadKey]!;
                        const filePath = `documents/${employeeId}/contracts/${contract.id}-${file.name}`;
                        contract.fileUrl = await uploadFile('swapro_files', filePath, file);
                    }
                }
            }
            
            await onSave(finalData as Partial<Employee>);
        } catch (error: any) {
            console.error("Failed to save employee:", error);
            if (error.message && error.message.toLowerCase().includes('bucket not found')) {
                notifier.addNotification('Gagal Unggah: "swapro_files" bucket untuk file tidak ditemukan di Supabase Storage.', 'error');
            } else {
                notifier.addNotification(`Error: ${error.message}`, 'error');
            }
        } finally {
            setIsSaving(false);
        }
    };
    
    const title = mode === 'add' ? 'Tambah Karyawan' : (mode === 'edit' ? 'Edit Data' : 'Detail Data');

    const renderDocumentLink = (label: string, url?: string) => (
        url ? (
            <a href={url} download={getFileNameFromUrl(url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200">
                <div className="flex items-center space-x-3 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="font-semibold text-sm text-slate-700 truncate">{label}</span>
                </div>
                <Download className="w-5 h-5 text-slate-400 ml-2" />
            </a>
        ) : (
             <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg opacity-60 border border-slate-100">
                <FileText className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-500 italic">{label} belum tersedia</span>
            </div>
        )
    );
    
    const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
      <div className="mb-10 last:mb-0">
        <h4 className="text-base font-black text-slate-800 mb-4 pb-2 border-b-2 border-slate-100 uppercase tracking-tight">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children}
        </div>
      </div>
    );
    
    const tabs = [
        { id: 'profil', label: 'Profil', icon: <UserIcon className="w-4 h-4" /> },
        { id: 'alamat', label: 'Alamat', icon: <Home className="w-4 h-4" /> },
        { id: 'keluarga', label: 'Keluarga', icon: <Heart className="w-4 h-4" /> },
        { id: 'pendidikan', label: 'Pendidikan', icon: <GraduationCap className="w-4 h-4" /> },
        { id: 'pekerjaan', label: 'Kerja', icon: <Briefcase className="w-4 h-4" /> },
        { id: 'finansial', label: 'Bank', icon: <CreditCard className="w-4 h-4" /> },
        { id: 'dokumen', label: 'Dokumen', icon: <FileText className="w-4 h-4" /> },
        { id: 'slip gaji', label: 'Slip Gaji', icon: <Calendar className="w-4 h-4" /> }
    ];

    if (isViewMode && employeeData) {
        const contractHistory = employeeData.documents?.contractHistory || [];
        const payslipsForSelectedYear = employeePayslips.filter(p => p.period.startsWith(selectedPayslipYear.toString()));

        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-4 animate-fadeIn">
                <div className="bg-white rounded-none md:rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh] border border-slate-200 animate-scaleIn overflow-hidden">
                    {/* Header */}
                    <header className="p-6 bg-slate-50/70 border-b border-slate-200/80 flex flex-col md:flex-row items-center gap-5 text-center md:text-left relative">
                        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors"><X className="w-5 h-5" /></button>
                        <img src={employeeData.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeData.fullName || ' ')}&background=E0E7FF&color=4F46E5`} alt={employeeData.fullName || 'Foto Profil'} className="w-28 h-28 rounded-full object-cover ring-4 ring-white shadow-lg shrink-0" />
                        <div className="min-w-0 flex-1">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{employeeData.fullName}</h2>
                            <p className="text-base text-slate-500 font-mono mt-1">{employeeData.id}</p>
                            <div className={`mt-3 inline-block text-xs font-bold uppercase px-3 py-1.5 rounded-full ${employeeData.status === EmployeeStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                                {employeeData.status}
                            </div>
                        </div>
                        <div className="hidden md:flex items-center space-x-2 shrink-0 self-start">
                            {isPicUser && (<>
                                <button onClick={onEdit} className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold text-sm text-slate-700 hover:bg-gray-100 transition whitespace-nowrap"><Edit className="w-4 h-4" /><span>Edit</span></button>
                                <button onClick={onDelete} className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition whitespace-nowrap"><Trash2 className="w-4 h-4" /><span>Hapus</span></button>
                            </>)}
                        </div>
                    </header>
                    {/* Tabs */}
                    <div className="px-4 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-100">
                        <nav className="flex space-x-1 justify-center overflow-x-auto no-scrollbar py-2">
                            {tabs.map(tab => (
                                <button 
                                    key={tab.id} 
                                    onClick={() => setActiveTab(tab.id)} 
                                    className={`flex items-center space-x-2.5 py-2 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                                        activeTab === tab.id 
                                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10' 
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                    }`}
                                >
                                    {tab.icon}
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-8 overflow-y-auto bg-white flex-1">
                        {/* --- HUBUNGI KARYAWAN SECTION --- */}
                        <div className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 text-center md:text-left">Aksi Cepat</h4>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <a 
                                    href={formatWhatsApp(employeeData.whatsapp)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-[#25D366] text-white font-black rounded-xl hover:bg-[#20bd5a] transition-all shadow-lg shadow-green-500/20 active:scale-95"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    <span>WhatsApp</span>
                                </a>
                                {employeeData.email && (
                                    <a 
                                        href={`mailto:${employeeData.email}`}
                                        className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                    >
                                        <Mail className="w-5 h-5" />
                                        <span>Email Pribadi</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {activeTab === 'profil' && (
                            <DetailSection title="Data Pribadi">
                                <MaskedField label="NIK KTP" value={employeeData.ktpId || ''} icon={<UserIcon className="w-4 h-4" />} />
                                <InfoField label="NIK SWAPRO" value={employeeData.swaproId} icon={<UserIcon className="w-4 h-4" />} />
                                <InfoField label="No. WhatsApp" value={employeeData.whatsapp} icon={<Phone className="w-4 h-4" />} />
                                <InfoField label="Email Pribadi" value={employeeData.email} icon={<Mail className="w-4 h-4" />} />
                                <InfoField label="Jenis Kelamin" value={employeeData.gender} icon={<Users className="w-4 h-4" />} />
                                <InfoField label="Tempat Lahir" value={employeeData.birthPlace} icon={<MapPin className="w-4 h-4" />} />
                                <InfoField label="Tanggal Lahir" value={employeeData.birthDate ? new Date(employeeData.birthDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'}) : '-'} icon={<Cake className="w-4 h-4" />} />
                                <InfoField label="Usia" value={calculateAge(employeeData.birthDate)} icon={<Calendar className="w-4 h-4" />} />
                                <InfoField label="Status Pernikahan" value={employeeData.maritalStatus} icon={<Heart className="w-4 h-4" />} />
                                <InfoField label="Kewarganegaraan" value={employeeData.nationality} icon={<Flag className="w-4 h-4" />} />
                            </DetailSection>
                        )}
                        {activeTab === 'alamat' && (<>
                            <DetailSection title="Alamat KTP">
                                <InfoField className="md:col-span-2" label="Alamat" value={employeeData.addressKtp?.address} icon={<Home className="w-4 h-4" />} />
                                <InfoField label="RT/RW" value={`${employeeData.addressKtp?.rt || '-'} / ${employeeData.addressKtp?.rw || '-'}`} icon={<Home className="w-4 h-4" />} />
                                <InfoField label="Kel/Desa" value={employeeData.addressKtp?.village} icon={<Home className="w-4 h-4" />} />
                                <InfoField label="Kecamatan" value={employeeData.addressKtp?.district} icon={<Home className="w-4 h-4" />} />
                                <InfoField label="Kota/Kab" value={employeeData.addressKtp?.city} icon={<Home className="w-4 h-4" />} />
                                <InfoField label="Provinsi" value={employeeData.addressKtp?.province} icon={<Home className="w-4 h-4" />} />
                                <InfoField label="Kode Pos" value={employeeData.addressKtp?.postalCode} icon={<Home className="w-4 h-4" />} />
                            </DetailSection>
                            <DetailSection title="Alamat Domisili">
                                {employeeData.addressDomicile?.isSameAsKtp ? <p className="md:col-span-2 text-slate-500 italic p-4 bg-slate-50 rounded-xl">Sama dengan alamat KTP.</p> : <>
                                    <InfoField className="md:col-span-2" label="Alamat" value={employeeData.addressDomicile?.address} icon={<MapPin className="w-4 h-4" />} />
                                    <InfoField label="RT/RW" value={`${employeeData.addressDomicile?.rt || '-'} / ${employeeData.addressDomicile?.rw || '-'}`} icon={<MapPin className="w-4 h-4" />} />
                                    <InfoField label="Kel/Desa" value={employeeData.addressDomicile?.village} icon={<MapPin className="w-4 h-4" />} />
                                    <InfoField label="Kecamatan" value={employeeData.addressDomicile?.district} icon={<MapPin className="w-4 h-4" />} />
                                    <InfoField label="Kota/Kab" value={employeeData.addressDomicile?.city} icon={<MapPin className="w-4 h-4" />} />
                                    <InfoField label="Provinsi" value={employeeData.addressDomicile?.province} icon={<MapPin className="w-4 h-4" />} />
                                    <InfoField label="Kode Pos" value={employeeData.addressDomicile?.postalCode} icon={<MapPin className="w-4 h-4" />} />
                                </>}
                            </DetailSection>
                        </>)}
                        {activeTab === 'keluarga' && (<>
                             <DetailSection title="Orang Tua & Kontak Darurat">
                                <InfoField label="Nama Ibu Kandung" value={employeeData.familyData?.motherName} icon={<UserIcon className="w-4 h-4" />} />
                                <InfoField label="Nama Ayah Kandung" value={employeeData.familyData?.fatherName} icon={<UserIcon className="w-4 h-4" />} />
                                <InfoField label="Kontak Darurat" value={employeeData.emergencyContact?.name} icon={<UserIcon className="w-4 h-4" />} />
                                <InfoField label="No. HP Darurat" value={employeeData.emergencyContact?.phone} icon={<Phone className="w-4 h-4" />} />
                             </DetailSection>
                             <div className="mt-10">
                                <h4 className="text-base font-black text-slate-800 mb-4 pb-2 border-b-2 border-slate-100 uppercase tracking-tight">Data Anak</h4>
                                <div className="space-y-3">
                                {(employeeData.familyData?.childrenData && employeeData.familyData.childrenData.length > 0) ? employeeData.familyData.childrenData.map((child, i) =>
                                    <InfoField key={i} label={`Anak Ke-${i+1}`} value={`${child.name} (Lahir: ${new Date(child.birthDate).toLocaleDateString('id-ID')})`} icon={<Users className="w-4 h-4"/>} />
                                ) : <p className="text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">Belum ada data anak.</p>}
                                </div>
                             </div>
                        </>)}
                        {activeTab === 'pendidikan' && (
                            <DetailSection title="Pendidikan Terakhir">
                                <InfoField label="Tingkat" value={employeeData.lastEducation} icon={<GraduationCap className="w-4 h-4" />} />
                                <InfoField label="Institusi" value={employeeData.educationDetails?.universityName} icon={<Building className="w-4 h-4" />} />
                                <InfoField label="Jurusan" value={employeeData.educationDetails?.major} icon={<BookOpen className="w-4 h-4" />} />
                                {['D3', 'S1', 'S2', 'S3'].includes(employeeData.lastEducation || '') && <InfoField label="IPK" value={employeeData.educationDetails?.gpa} icon={<Award className="w-4 h-4" />} />}
                                <InfoField label="Tahun Masuk" value={employeeData.educationDetails?.entryYear} icon={<Calendar className="w-4 h-4" />} />
                                <InfoField label="Tahun Lulus" value={employeeData.educationDetails?.graduationYear} icon={<Calendar className="w-4 h-4" />} />
                            </DetailSection>
                        )}
                        {activeTab === 'pekerjaan' && (<>
                            <DetailSection title="Informasi Posisi & Status">
                                <InfoField label="Klien" value={clientMap.get(employeeData.clientId || '')} icon={<Building className="w-4 h-4" />} />
                                <InfoField label="Jabatan" value={employeeData.position} icon={<Briefcase className="w-4 h-4" />} />
                                <InfoField label="Cabang" value={employeeData.branch} icon={<MapPin className="w-4 h-4" />} />
                                <InfoField label="Tanggal Join" value={employeeData.joinDate ? new Date(employeeData.joinDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'} icon={<Calendar className="w-4 h-4" />} />
                                <InfoField label="End of Contract" value={employeeData.endDate ? new Date(employeeData.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'} icon={<Calendar className="w-4 h-4" />} />
                                <InfoField label="Tanggal Resign" value={employeeData.resignDate ? new Date(employeeData.resignDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'} icon={<Calendar className="w-4 h-4" />} />
                                <InfoField label="Kontrak Ke" value={String(employeeData.contractNumber)} icon={<FileText className="w-4 h-4" />} />
                                <InfoField className="md:col-span-2" label="Catatan SP" value={employeeData.disciplinaryActions} icon={<Shield className="w-4 h-4" />} />
                            </BeijDetailSection>
                        </>)}
                         {activeTab === 'finansial' && (<>
                            <DetailSection title="Rekening Bank & Pajak">
                                <MaskedField label="NPWP" value={employeeData.npwp || ''} icon={<CreditCard className="w-4 h-4" />} />
                                <InfoField label="Bank" value={employeeData.bankAccount?.bankName} icon={<Building className="w-4 h-4" />} />
                                <MaskedField label="No. Rekening" value={employeeData.bankAccount?.number || ''} icon={<CreditCard className="w-4 h-4" />} />
                                <InfoField label="Nama Pemilik Rekening" value={employeeData.bankAccount?.holderName} icon={<UserIcon className="w-4 h-4" />} />
                            </DetailSection>
                            <DetailSection title="Jaminan Sosial">
                                <MaskedField label="BPJS Ketenagakerjaan" value={employeeData.bpjs?.ketenagakerjaan || ''} icon={<Shield className="w-4 h-4" />} />
                                <MaskedField label="BPJS Kesehatan" value={employeeData.bpjs?.kesehatan || ''} icon={<Shield className="w-4 h-4" />} />
                            </DetailSection>
                        </>)}
                        {activeTab === 'dokumen' && (<>
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-base font-black text-slate-800 mb-4 pb-2 border-b-2 border-slate-100 uppercase tracking-tight">Dokumen Pribadi</h4>
                                    <div className="space-y-3">{renderDocumentLink("Foto KTP", employeeData.documents?.photoKtpUrl)} {renderDocumentLink("Foto NPWP", employeeData.documents?.photoNpwpUrl)} {renderDocumentLink("Foto Kartu Keluarga (KK)", employeeData.documents?.photoKkUrl)}</div>
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-slate-800 mb-4 pb-2 border-b-2 border-slate-100 uppercase tracking-tight">Riwayat Kontrak</h4>
                                    <div className="space-y-3">
                                    {contractHistory.length > 0 ? contractHistory.map(doc => (<a key={doc.id} href={doc.fileUrl} download={getFileNameFromUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"><div className="flex items-center space-x-3 min-w-0"><FileText className="w-5 h-5 text-blue-600 shrink-0" /><div><p className="font-semibold text-sm text-slate-700 truncate">{doc.name}</p><p className="text-xs text-slate-500">{new Date(doc.startDate).toLocaleDateString('id-ID')} - {new Date(doc.endDate).toLocaleDateString('id-ID')}</p></div></div><Download className="w-5 h-5 text-slate-400 ml-2" /></a>)) : <p className="text-center text-sm text-slate-400 italic py-4">Belum ada riwayat kontrak.</p>}
                                    </div>
                                </div>
                            </div>
                        </>)}
                        {activeTab === 'slip gaji' && (<div>
                           <div className="flex justify-between items-center mb-6"><h4 className="text-base font-black text-slate-800 uppercase tracking-tight">Histori Slip Gaji</h4><select value={selectedPayslipYear} onChange={e => setSelectedPayslipYear(Number(e.target.value))} className="font-semibold text-sm bg-slate-100 border-slate-200 border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500">{payslipYears.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{MONTH_NAMES.map((month, index) => {const period = `${selectedPayslipYear}-${(index + 1).toString().padStart(2, '0')}`; const payslipForMonth = employeePayslips.find(p => p.period === period); if (payslipForMonth) {return (<a key={month} href={payslipForMonth.fileUrl} download={`slipgaji-${employeeData.id}-${period}.pdf`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center text-center p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl transition-colors group"><Download className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" /><span className="font-black text-sm text-blue-800">{month}</span></a>);} else {return (<div key={month} className="flex flex-col items-center justify-center text-center p-4 bg-slate-50 border-2 border-slate-200 rounded-xl cursor-not-allowed opacity-70"><FileX className="w-6 h-6 text-slate-400 mb-2" /><span className="font-semibold text-sm text-slate-500">{month}</span></div>);}})}</div>
                           {payslipsForSelectedYear.length === 0 && <p className="text-center text-base text-slate-400 italic py-8">Tidak ada data slip gaji untuk tahun {selectedPayslipYear}.</p>}
                        </div>)}
                    </div>
                     <footer className="p-3 flex md:hidden items-center justify-around gap-2 bg-slate-100 border-t border-gray-200">
                         {isPicUser && (<>
                            <button onClick={onEdit} className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg font-semibold text-sm text-slate-700 hover:bg-gray-100 transition whitespace-nowrap"><Edit className="w-4 h-4"/><span>Edit</span></button>
                            <button onClick={onDelete} className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition whitespace-nowrap"><Trash2 className="w-4 h-4"/><span>Hapus</span></button>
                         </>)}
                     </footer>
                </div>
                 <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } } .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; } .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; } .no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
            </div>
        );
    }

    const renderFormField = (label: string, name: string, value: any, options: any = {}) => (
        <div className={options.className}>
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
          <form onSubmit={handleSubmit} className="bg-white rounded-none md:rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh] border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 md:p-8 overflow-y-auto flex-1 space-y-8">
                  
                  <ProfilePhotoUpload value={formData.profilePhotoUrl} onChange={handlePhotoChange} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {/* --- SECTIONS --- */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-blue-600 text-base border-b border-blue-100 pb-2">Profil Pribadi</h4>
                        {renderFormField("Nama Lengkap", "fullName", formData.fullName)}
                        <div className="grid grid-cols-2 gap-4">
                          {renderFormField("NIK Karyawan", "id", formData.id, {disabled: mode === 'edit'})}
                          {renderFormField("NIK SWAPRO", "swaproId", formData.swaproId)}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {renderFormField("No. KTP", "ktpId", formData.ktpId)}
                          {renderFormField("WhatsApp", "whatsapp", formData.whatsapp)}
                        </div>
                        {renderFormField("Email Pribadi", "email", formData.email, {type: "email"})}
                        <div className="grid grid-cols-3 gap-4">
                          {renderFormField("Tempat Lahir", "birthPlace", formData.birthPlace, { className: 'col-span-1' })}
                          {renderFormField("Tanggal Lahir", "birthDate", formData.birthDate, { type: 'date', className: 'col-span-1' })}
                          {renderFormField("Usia", "age", calculateAge(formData.birthDate), { disabled: true, className: 'col-span-1' })}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {renderFormField("Jenis Kelamin", "gender", formData.gender, {type: 'select', options: ['Laki-laki', 'Perempuan']})}
                          {renderFormField("Status Pernikahan", "maritalStatus", formData.maritalStatus, {type: 'select', options: [{value:'', label:'Pilih'},'Belum Menikah', 'Menikah', 'Cerai Hidup', 'Cerai Mati']})}
                        </div>
                        {renderFormField("Kewarganegaraan", "nationality", formData.nationality)}
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-bold text-blue-600 text-base border-b border-blue-100 pb-2">Informasi Kerja</h4>
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

                  {/* --- ADDRESS SECTION --- */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-4">
                          <h4 className="font-bold text-blue-600 text-base border-b border-blue-100 pb-2">Alamat KTP</h4>
                          {renderFormField("Alamat", "addressKtp.address", formData.addressKtp?.address, {type: 'textarea'})}
                          <div className="grid grid-cols-2 gap-4">{renderFormField("RT", "addressKtp.rt", formData.addressKtp?.rt)} {renderFormField("RW", "addressKtp.rw", formData.addressKtp?.rw)}</div>
                          {renderFormField("Kel/Desa", "addressKtp.village", formData.addressKtp?.village)}
                          {renderFormField("Kecamatan", "addressKtp.district", formData.addressKtp?.district)}
                          {renderFormField("Kota/Kab", "addressKtp.city", formData.addressKtp?.city)}
                          {renderFormField("Provinsi", "addressKtp.province", formData.addressKtp?.province)}
                          {renderFormField("Kode Pos", "addressKtp.postalCode", formData.addressKtp?.postalCode)}
                      </div>
                      <div className="space-y-4">
                          <h4 className="font-bold text-blue-600 text-base border-b border-blue-100 pb-2">Alamat Domisili</h4>
                          <div className="flex items-center gap-2"><input type="checkbox" id="isSameAsKtp" name="addressDomicile.isSameAsKtp" checked={formData.addressDomicile?.isSameAsKtp || false} onChange={handleChange} className="h-4 w-4"/> <label htmlFor="isSameAsKtp">Sama dengan alamat KTP</label></div>
                          {!formData.addressDomicile?.isSameAsKtp && (<div className="space-y-4 animate-fadeIn">
                            {renderFormField("Alamat", "addressDomicile.address", formData.addressDomicile?.address, {type: 'textarea'})}
                            <div className="grid grid-cols-2 gap-4">{renderFormField("RT", "addressDomicile.rt", formData.addressDomicile?.rt)} {renderFormField("RW", "addressDomicile.rw", formData.addressDomicile?.rw)}</div>
                            {renderFormField("Kel/Desa", "addressDomicile.village", formData.addressDomicile?.village)}
                            {renderFormField("Kecamatan", "addressDomicile.district", formData.addressDomicile?.district)}
                            {renderFormField("Kota/Kab", "addressDomicile.city", formData.addressDomicile?.city)}
                            {renderFormField("Provinsi", "addressDomicile.province", formData.addressDomicile?.province)}
                            {renderFormField("Kode Pos", "addressDomicile.postalCode", formData.addressDomicile?.postalCode)}
                          </div>)}
                      </div>
                  </div>

                  {/* --- FAMILY & EDUCATION SECTION --- */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-4">
                        <h4 className="font-bold text-blue-600 text-base border-b border-blue-100 pb-2">Keluarga & Kontak Darurat</h4>
                        {renderFormField("Nama Ibu Kandung", "familyData.motherName", formData.familyData?.motherName)}
                        {renderFormField("Nama Ayah Kandung", "familyData.fatherName", formData.familyData?.fatherName)}
                        {renderFormField("Nama Kontak Darurat", "emergencyContact.name", formData.emergencyContact?.name)}
                        <div className="grid grid-cols-2 gap-4">
                            {renderFormField("Hubungan", "emergencyContact.relationship", formData.emergencyContact?.relationship)}
                            {renderFormField("No. HP", "emergencyContact.phone", formData.emergencyContact?.phone)}
                        </div>
                        <div>
                            <h5 className="font-semibold text-slate-700 mb-2">Data Anak</h5>
                            {(formData.familyData?.childrenData || []).map((child, index) => (
                                <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2 p-2 bg-slate-50 rounded-lg">
                                    <input type="text" placeholder="Nama Anak" value={child.name} onChange={(e) => handleChildChange(index, 'name', e.target.value)} className="w-full text-sm p-2 border border-slate-200 rounded"/>
                                    <input type="date" value={child.birthDate} onChange={(e) => handleChildChange(index, 'birthDate', e.target.value)} className="w-full text-sm p-2 border border-slate-200 rounded"/>
                                    <button type="button" onClick={() => removeChild(index)} className="p-2 text-red-500 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            ))}
                            <button type="button" onClick={addChild} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 mt-2"><Plus className="w-4 h-4"/> Tambah Anak</button>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <h4 className="font-bold text-blue-600 text-base border-b border-blue-100 pb-2">Pendidikan Terakhir</h4>
                        {renderFormField("Tingkat", "lastEducation", formData.lastEducation, {type: 'select', options: [{value: '', label: 'Pilih'}, ...EDUCATION_LEVELS.map(l => ({value: l, label: l}))]})}
                        {renderFormField("Institusi", "educationDetails.universityName", formData.educationDetails?.universityName)}
                        {renderFormField("Jurusan", "educationDetails.major", formData.educationDetails?.major)}
                        <div className="grid grid-cols-2 gap-4">
                            {renderFormField("Tahun Masuk", "educationDetails.entryYear", formData.educationDetails?.entryYear)}
                            {renderFormField("Tahun Lulus", "educationDetails.graduationYear", formData.educationDetails?.graduationYear)}
                        </div>
                        {['D3', 'S1', 'S2', 'S3'].includes(formData.lastEducation || '') && (
                            renderFormField("IPK", "educationDetails.gpa", formData.educationDetails?.gpa)
                        )}
                     </div>
                  </div>

                  {/* --- FINANCIAL & DOCUMENT SECTION --- */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-4">
                          <h4 className="font-bold text-blue-600 text-base border-b border-blue-100 pb-2">Finansial, Pajak, & BPJS</h4>
                          {renderFormField("Nama Bank", "bankAccount.bankName", formData.bankAccount?.bankName)}
                          {renderFormField("No. Rekening", "bankAccount.number", formData.bankAccount?.number)}
                          {renderFormField("Nama di Rekening", "bankAccount.holderName", formData.bankAccount?.holderName)}
                          {renderFormField("NPWP", "npwp", formData.npwp)}
                          {renderFormField("BPJS Ketenagakerjaan", "bpjs.ketenagakerjaan", formData.bpjs?.ketenagakerjaan)}
                          {renderFormField("BPJS Kesehatan", "bpjs.kesehatan", formData.bpjs?.kesehatan)}
                      </div>
                      <div className="space-y-4">
                          <h4 className="font-bold text-blue-600 text-base border-b border-blue-100 pb-2">Dokumen Pribadi</h4>
                          <FileUploadField label="Foto KTP" name="photoKtp" value={formData.documents?.photoKtpUrl} onChange={(name, file) => handleFileChange(name, file)} />
                          <FileUploadField label="Foto NPWP" name="photoNpwp" value={formData.documents?.photoNpwpUrl} onChange={(name, file) => handleFileChange(name, file)} />
                          <FileUploadField label="Foto Kartu Keluarga" name="photoKk" value={formData.documents?.photoKkUrl} onChange={(name, file) => handleFileChange(name, file)} />
                      </div>
                  </div>

                   {/* --- DYNAMIC CONTRACT HISTORY SECTION --- */}
                  <div>
                      <h4 className="font-bold text-blue-600 text-base mb-3 border-b border-blue-100 pb-2">Riwayat Kontrak (Termasuk PKWT & SP)</h4>
                      <div className="space-y-4">
                          {(formData.documents?.contractHistory || []).map((doc) => (
                              <div key={doc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative">
                                  <button type="button" onClick={() => removeContractRow(doc.id)} className="absolute top-2 right-2 p-1 text-slate-400 hover:bg-red-100 hover:text-red-600 rounded-full"><Trash2 className="w-4 h-4" /></button>
                                  <input type="text" placeholder="Nama Kontrak (e.g., Perpanjangan K2)" value={doc.name} onChange={e => handleContractChange(doc.id, 'name', e.target.value)} className="w-full text-sm font-semibold px-3 py-2 bg-white border border-gray-300 rounded-lg" />
                                  <div className="grid grid-cols-2 gap-3">
                                      <div><label className="text-xs font-medium text-slate-500">Tgl Mulai</label><input type="date" value={doc.startDate} onChange={e => handleContractChange(doc.id, 'startDate', e.target.value)} className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg"/></div>
                                      <div><label className="text-xs font-medium text-slate-500">Tgl Selesai</label><input type="date" value={doc.endDate} onChange={e => handleContractChange(doc.id, 'endDate', e.target.value)} className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg"/></div>
                                  </div>
                                  <FileUploadField label="File Kontrak" name={`contract-${doc.id}`} value={doc.fileUrl} onChange={(name, file) => handleContractFileChange(doc.id, file)} />
                              </div>
                          ))}
                           <button type="button" onClick={addContractRow} className="w-full flex items-center justify-center space-x-2 border-2 border-dashed border-slate-300 text-slate-500 font-semibold py-2.5 rounded-lg hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 transition-colors">
                              <Plus className="w-4 h-4" /><span>Tambah Riwayat Dokumen</span>
                          </button>
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

const ResetConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isResetting: boolean;
}> = ({ isOpen, onClose, onConfirm, isResetting }) => {
    const [confirmationText, setConfirmationText] = useState('');
    const CONFIRMATION_PHRASE = "HAPUS SEMUA DATA";
    const isConfirmed = confirmationText === CONFIRMATION_PHRASE;

    useEffect(() => {
        if (isOpen) {
            setConfirmationText('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-red-200 overflow-hidden">
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                        <Trash2 className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="mt-4 text-2xl font-extrabold text-slate-900">Reset Database Karyawan?</h3>
                    <p className="mt-2 text-base text-slate-500 leading-relaxed">
                        Anda akan <b className="text-red-600">menghapus seluruh data karyawan secara permanen</b>.
                        Tindakan ini tidak dapat dibatalkan. File yang sudah diunggah (foto, dokumen) tidak akan terhapus dari server.
                    </p>
                    <div className="mt-6 bg-red-50 p-3 rounded-lg">
                      <p className="text-sm text-slate-600">
                          Untuk melanjutkan, ketik frasa berikut di bawah ini:
                          <br />
                          <strong className="font-mono text-red-700 select-all tracking-widest">{CONFIRMATION_PHRASE}</strong>
                      </p>
                      <input
                          type="text"
                          value={confirmationText}
                          onChange={(e) => setConfirmationText(e.target.value)}
                          className="mt-2 w-full text-center text-base px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 transition shadow-sm"
                          placeholder="Ketik frasa di sini..."
                      />
                    </div>
                </div>
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={isResetting} className="px-6 py-2.5 rounded-lg font-bold text-slate-600 bg-white border border-slate-300 hover:bg-gray-100 transition">Batal</button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!isConfirmed || isResetting}
                        className="flex items-center justify-center px-6 py-2.5 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-lg shadow-red-500/20 disabled:bg-red-300 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {isResetting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Trash2 className="w-5 h-5 mr-2" />}
                        {isResetting ? 'Menghapus...' : 'Saya Mengerti, Hapus Semua Data'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
const Database: React.FC<DatabaseProps> = ({ employees, clients, payslips, onDataChange, onAddEmployee, onUpdateEmployee, onDeleteEmployee, onResetEmployees, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEoc, setFilterEoc] = useState('all');
  const [modalState, setModalState] = useState<{ isOpen: boolean, mode: 'add' | 'edit' | 'view', data: Partial<Employee> | null }>({ isOpen: false, mode: 'add', data: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notifier = useNotifier();

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

  const filteredEmployees = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return employees.filter(e => {
      // Search filter
      const searchMatch = (e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase()));
      // Client filter
      const clientMatch = filterClient === 'all' || e.clientId === filterClient;
      // Status filter
      const statusMatch = filterStatus === 'all' || e.status === filterStatus;
      // EOC filter
      let eocMatch = true;
      if (filterEoc !== 'all' && e.endDate) {
          const endDate = new Date(e.endDate);
          endDate.setHours(0,0,0,0);
          
          if (filterEoc === 'akan-bulan-ini') {
              eocMatch = endDate.getMonth() === today.getMonth() && endDate.getFullYear() === today.getFullYear() && endDate >= today;
          } else if (filterEoc === 'akan-bulan-depan') {
              const nextMonth = new Date(today);
              nextMonth.setMonth(today.getMonth() + 1);
              eocMatch = endDate.getMonth() === nextMonth.getMonth() && endDate.getFullYear() === nextMonth.getFullYear();
          } else if (filterEoc === 'dalam-30') {
              const thirtyDaysFromNow = new Date(today);
              thirtyDaysFromNow.setDate(today.getDate() + 30);
              eocMatch = endDate >= today && endDate <= thirtyDaysFromNow;
          } else if (filterEoc === 'dalam-90') {
              const ninetyDaysFromNow = new Date(today);
              ninetyDaysFromNow.setDate(today.getDate() + 90);
              eocMatch = endDate >= today && endDate <= ninetyDaysFromNow;
          } else if (filterEoc === 'sudah-lewat') {
              eocMatch = endDate < today;
          }
      } else if (filterEoc !== 'all' && !e.endDate) {
          eocMatch = false;
      }

      return searchMatch && clientMatch && statusMatch && eocMatch;

    }).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [employees, searchTerm, filterClient, filterStatus, filterEoc]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterClient, filterStatus, filterEoc]);
  
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
    const dataToExport = employees; // Export all employees, ignoring filters
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
    link.setAttribute("download", "karyawan_export_full.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifier.addNotification(`Seluruh ${dataToExport.length} baris data berhasil diekspor.`, 'success');
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

  const handleConfirmReset = async () => {
    setIsResetting(true);
    const success = await onResetEmployees();
    if (success) {
        setIsResetModalOpen(false);
    }
    setIsResetting(false);
  };
  
  const eocOptions = [
    { value: 'all', label: 'Semua End of Contract' },
    { value: 'akan-bulan-ini', label: 'Akan Berakhir Bulan Ini' },
    { value: 'akan-bulan-depan', label: 'Akan Berakhir Bulan Depan' },
    { value: 'dalam-30', label: 'Dalam 30 Hari' },
    { value: 'dalam-90', label: 'Dalam 90 Hari' },
    { value: 'sudah-lewat', label: 'Sudah Berakhir' },
  ];

  return (
    <div className="p-4 md:p-10">
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Database Karyawan</h1>
      <p className="text-base text-slate-500 mt-1">Kelola data terpusat secara efisien.</p>

      <div className="my-6 md:my-8 bg-white p-4 rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="relative lg:col-span-3">
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
             <select 
                className="px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-blue-500 text-base appearance-none"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
            >
                <option value="all">Semua Status</option>
                {Object.values(EmployeeStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
             <select 
                className="px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-blue-500 text-base appearance-none"
                value={filterEoc}
                onChange={e => setFilterEoc(e.target.value)}
            >
                {eocOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 items-stretch gap-3 pt-3 border-t border-dashed border-slate-200">
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
              <span className="text-base">Export (Full)</span>
            </button>
            <button 
                onClick={() => setIsResetModalOpen(true)} 
                className="flex items-center justify-center space-x-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-semibold transition-all hover:bg-red-100"
            >
                <Trash2 className="w-5 h-5" />
                <span className="text-base">Reset</span>
            </button>
        </div>
         <button 
            onClick={() => handleOpenModal('add')}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">
          <Plus className="w-5 h-5" />
          <span className="text-base">Tambah Karyawan Baru</span>
        </button>
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
          <p className="text-base text-slate-400 mt-1 px-4">Tidak ada karyawan yang cocok dengan filter yang diterapkan.</p>
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
       <ResetConfirmationModal
            isOpen={isResetModalOpen}
            onClose={() => setIsResetModalOpen(false)}
            onConfirm={handleConfirmReset}
            isResetting={isResetting}
        />
    </div>
  );
};

export default Database;
