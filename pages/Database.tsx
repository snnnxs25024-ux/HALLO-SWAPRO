
import React, { useState, useMemo, useRef, useEffect, memo } from 'react';
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
  XCircle,
  FilePlus,
  Image as ImageIcon
} from 'lucide-react';
import { Employee, Client, EmployeeStatus, User, UserRole, Payslip, EDUCATION_LEVELS, ContractDocument } from '../types';
import { supabase } from '../services/supabaseClient';
import { useNotifier } from '../components/Notifier';
import * as XLSX from 'xlsx';


interface DatabaseProps {
  employees: Employee[];
  clients: Client[];
  payslips: Payslip[];
  onDataChange: (employees: Partial<Employee>[]) => Promise<void>; 
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
    'Email': 'email',
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
    'Tempat Lahir': 'birthPlace',
    'Tanggal Lahir (YYYY-MM-DD)': 'birthDate',
    'Status Pernikahan': 'maritalStatus',
    'Kewarganegaraan': 'nationality',
    'Nama Ibu Kandung': 'familyData.motherName',
    'Nama Ayah Kandung': 'familyData.fatherName',
    'Alamat KTP': 'addressKtp.address',
    'RT KTP': 'addressKtp.rt',
    'RW KTP': 'addressKtp.rw',
    'Kelurahan KTP': 'addressKtp.village',
    'Kecamatan KTP': 'addressKtp.district',
    'Kota KTP': 'addressKtp.city',
    'Provinsi KTP': 'addressKtp.province',
    'Kode Pos KTP': 'addressKtp.postalCode',
    'Domisili Sama KTP (true/false)': 'addressDomicile.isSameAsKtp',
    'Alamat Domisili': 'addressDomicile.address',
    'RT Domisili': 'addressDomicile.rt',
    'RW Domisili': 'addressDomicile.rw',
    'Pendidikan Terakhir': 'lastEducation',
    'Nama Universitas': 'educationDetails.universityName',
    'Jurusan': 'educationDetails.major',
    'IPK': 'educationDetails.gpa',
    'Tahun Masuk': 'educationDetails.entryYear',
    'Tahun Lulus': 'educationDetails.graduationYear',
    'Kontak Darurat Nama': 'emergencyContact.name',
    'Kontak Darurat Hubungan': 'emergencyContact.relationship',
    'Kontak Darurat Telepon': 'emergencyContact.phone',
    'Nama Atasan MH': 'atasanMH.name',
    'Telepon Atasan MH': 'atasanMH.phone',
    'Nama Atasan BM': 'atasanBM.name',
    'Telepon Atasan BM': 'atasanBM.phone',
    'Kontrak Ke': 'contractNumber',
    'Catatan SP': 'disciplinaryActions',
    'Status (Active/Resigned/Terminated)': 'status'
};

// --- HELPER FUNCTIONS ---
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

// --- SUB-COMPONENTS ---

export const EmployeeCard = memo(({ 
  employee, 
  clientName, 
  onView, 
  onEdit, 
  onDelete, 
  isViewOnly, 
  submissionStatus 
}: { 
  employee: Employee, 
  clientName: string, 
  onView: () => void, 
  onEdit?: () => void, 
  onDelete?: () => void,
  isViewOnly?: boolean,
  submissionStatus?: 'pending' | 'approved' | 'rejected' | 'not_submitted';
}) => {
    const cardVisuals = useMemo(() => {
        switch (submissionStatus) {
            case 'pending':
                return { className: 'border-blue-500 border-2 shadow-blue-500/10', icon: <Clock className="absolute top-4 right-4 text-blue-500 w-5 h-5" title="Menunggu Review"/> };
            case 'approved':
                return { className: 'border-emerald-500 border-2', icon: <CheckCircle className="absolute top-4 right-4 text-emerald-500 w-5 h-5" title="Sudah Disetujui"/> };
            case 'rejected':
                return { className: 'border-red-200 opacity-80 hover:opacity-100', icon: <XCircle className="absolute top-4 right-4 text-red-500 w-5 h-5" title="Ditolak"/> };
            default:
                return { className: 'border-gray-200', icon: null };
        }
    }, [submissionStatus]);
    
    return (
        <div className={`bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-5 group transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 relative ${cardVisuals.className}`}>
            {cardVisuals.icon}
            <div className="flex flex-col items-center text-center">
              <img 
                loading="lazy"
                src={employee.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=E0E7FF&color=4F46E5`} 
                alt={employee.fullName} 
                className="w-24 h-24 rounded-full flex-shrink-0 object-cover border-4 border-white shadow-md mb-4" 
              />
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
});

const InfoField: React.FC<{ label: string; value: string | undefined | null; icon: React.ReactNode; className?: string; }> = ({ label, value, icon, className }) => (
    <div className={`flex items-start space-x-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 ${className}`}>
        <div className="flex-shrink-0 text-blue-500 mt-0.5">{icon}</div>
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-800 leading-none">{value || '-'}</p>
        </div>
    </div>
);

const MaskedField: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => {
    const [isVisible, setIsVisible] = useState(false);
    const maskValue = (str: string) => (!str || str.length < 8) ? str : str.substring(0, 4) + '*'.repeat(Math.max(0, str.length - 8)) + str.slice(-4);
    return (
        <div className="flex items-start space-x-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 relative group">
            <div className="flex-shrink-0 text-blue-500 mt-0.5">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-800 break-all leading-none font-mono tracking-tight">{isVisible ? value : maskValue(value)}</p>
            </div>
            <button onClick={() => setIsVisible(!isVisible)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">{isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
        </div>
    );
};

const FormField: React.FC<{ label: string; name: string; value?: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; type?: string; options?: {value: string; label: string}[]; as?: 'textarea' }> = ({ label, name, value, onChange, type = 'text', options, as }) => (
    <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</label>
        {as === 'textarea' ? (
             <textarea name={name} value={value || ''} onChange={onChange} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-800"></textarea>
        ) : type === 'select' ? (
            <select name={name} value={value || ''} onChange={onChange} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none font-semibold text-slate-800">
                <option value="">Pilih...</option>
                {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        ) : (
            <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={label} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-800" />
        )}
    </div>
);

const FileUploadField: React.FC<{ label: string; value?: string; onFileSelect: (file: File | null) => void }> = ({ label, value, onFileSelect }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFileName(file.name);
            onFileSelect(file);
        }
    };

    return (
        <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 transition-colors cursor-pointer" onClick={() => inputRef.current?.click()}>
            <input type="file" ref={inputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf" />
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400 group-hover:text-blue-500">
                    <UploadCloud className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{fileName || (value ? 'Ganti File' : 'Klik untuk upload')}</p>
                </div>
                {value && !fileName && <div className="text-emerald-500"><CheckCircle className="w-4 h-4" /></div>}
            </div>
        </div>
    );
};

const ProfilePhotoUpload: React.FC<{ value?: string; onChange: (file: File | null) => void; }> = ({ value, onChange }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    useEffect(() => { setPreview(value || null); }, [value]);
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            onChange(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    return (
        <div className="flex flex-col items-center">
            <input type="file" accept="image/*" ref={inputRef} onChange={handleFileSelect} className="hidden" />
            <div className="relative w-28 h-28 rounded-full cursor-pointer group bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center hover:border-blue-400 transition-colors" onClick={() => inputRef.current?.click()}>
                {preview ? (
                    <>
                        <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-full" />
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-6 h-6 text-white" /></div>
                    </>
                ) : (
                    <div className="text-center text-slate-400"><UserIcon className="w-8 h-8 mx-auto" /><p className="text-[10px] font-bold mt-1">Upload</p></div>
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
    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
    const notifier = useNotifier();

    useEffect(() => {
        if (!isOpen) return;
        const initialData = employeeData || {
            gender: 'Laki-laki', status: EmployeeStatus.ACTIVE, lastEducation: 'SMA/SMK', contractNumber: 1,
            bankAccount: { number: '', holderName: '', bankName: '' }, 
            bpjs: { ketenagakerjaan: '', kesehatan: '' }, 
            familyData: { motherName: '', fatherName: '', childrenData: [] },
            addressKtp: { address: '', rt: '', rw: '', village: '', district: '', city: '', province: '', postalCode: '' }, 
            addressDomicile: { isSameAsKtp: true, address: '' }, 
            educationDetails: { universityName: '', major: '', gpa: '', entryYear: '', graduationYear: '' }, 
            emergencyContact: { name: '', relationship: '', phone: '' }, 
            atasanMH: { name: '', phone: '' }, 
            atasanBM: { name: '', phone: '' }, 
            documents: { contractHistory: [] }
        };
        setFormData(JSON.parse(JSON.stringify(initialData)));
        setFilePayloads({});
        setActiveTab('profil');
    }, [employeeData, isOpen]);

    if (!isOpen) return null;

    const isViewMode = mode === 'view';
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const updated = { ...formData };
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            (updated as any)[parent] = { ...(updated as any)[parent], [child]: type === 'checkbox' ? checked : value };
        } else (updated as any)[name] = type === 'checkbox' ? checked : value;
        setFormData(updated);
    };

    const handleFileChange = (key: string, file: File | null) => {
        setFilePayloads(prev => ({ ...prev, [key]: file }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (!formData.id) throw new Error("NIK Karyawan wajib diisi.");
            const finalData = { ...formData };
            
            // Fix: Cast Object.entries to correct type to resolve "Property 'name' does not exist on type 'unknown'"
            const uploadPromises = (Object.entries(filePayloads) as [string, File | null][]).map(async ([key, file]) => {
                if (!file) return;
                const path = `${key === 'profilePhoto' ? 'profile-photos' : 'identity-docs'}/${formData.id}-${key}-${Date.now()}.${file.name.split('.').pop()}`;
                const { error } = await supabase.storage.from('swapro_files').upload(path, file);
                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage.from('swapro_files').getPublicUrl(path);
                
                if (key === 'profilePhoto') finalData.profilePhotoUrl = publicUrl;
                else {
                    if (!finalData.documents) finalData.documents = {};
                    (finalData.documents as any)[`${key}Url`] = publicUrl;
                }
            });

            await Promise.all(uploadPromises);
            await onSave(finalData as Partial<Employee>);
        } catch (error: any) {
            notifier.addNotification(`Error: ${error.message}`, 'error');
        } finally { setIsSaving(false); }
    };
    
    const tabs = [
        { id: 'profil', label: 'Profil', icon: <UserIcon className="w-4 h-4" /> },
        { id: 'alamat', label: 'Alamat', icon: <Home className="w-4 h-4" /> },
        { id: 'keluarga', label: 'Keluarga', icon: <Heart className="w-4 h-4" /> },
        { id: 'pendidikan', label: 'Pendidikan', icon: <GraduationCap className="w-4 h-4" /> },
        { id: 'pekerjaan', label: 'Kerja', icon: <Briefcase className="w-4 h-4" /> },
        { id: 'finansial', label: 'Bank', icon: <CreditCard className="w-4 h-4" /> }
    ];

    const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
      <div className="mb-10 last:mb-0">
        <h4 className="text-base font-black text-slate-800 mb-4 pb-2 border-b-2 border-slate-100 uppercase tracking-tight">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
      </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-4 animate-fadeIn">
            <div className="bg-white rounded-none md:rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh] border border-slate-200 overflow-hidden">
                <header className="p-6 bg-slate-50/70 border-b border-slate-200/80 flex flex-col md:flex-row items-center gap-5 relative">
                    <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                    {isViewMode ? (
                        <img src={formData.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || ' ')}&background=E0E7FF&color=4F46E5`} alt="Ava" className="w-28 h-28 rounded-full object-cover ring-4 ring-white shadow-lg" />
                    ) : (
                        <ProfilePhotoUpload value={formData.profilePhotoUrl} onChange={f => handleFileChange('profilePhoto', f)} />
                    )}
                    <div className="min-w-0 flex-1 text-center md:text-left">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{formData.fullName || 'Nama Baru'}</h2>
                        <p className="text-base text-slate-500 font-mono mt-1">{formData.id || 'NIK Belum Terisi'}</p>
                    </div>
                </header>
                <div className="px-4 bg-white border-b border-slate-100 overflow-x-auto no-scrollbar">
                    <nav className="flex space-x-1 py-2">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2.5 py-2.5 px-5 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>{tab.icon}<span>{tab.label}</span></button>
                        ))}
                    </nav>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto bg-white flex-1">
                    {isViewMode ? (
                        <>
                            {activeTab === 'profil' && (
                                <DetailSection title="Data Pribadi">
                                    <MaskedField label="NIK KTP" value={formData.ktpId} icon={<UserIcon className="w-4 h-4" />} />
                                    <InfoField label="NIK SWAPRO" value={formData.swaproId} icon={<UserIcon className="w-4 h-4" />} />
                                    <InfoField label="WhatsApp" value={formData.whatsapp} icon={<Phone className="w-4 h-4" />} />
                                    <InfoField label="Email" value={formData.email} icon={<Mail className="w-4 h-4" />} />
                                    <InfoField label="Tgl Lahir" value={formData.birthDate} icon={<Cake className="w-4 h-4" />} />
                                    <InfoField label="Tempat Lahir" value={formData.birthDate} icon={<MapPin className="w-4 h-4" />} />
                                    <InfoField label="Gender" value={formData.gender} icon={<Users className="w-4 h-4" />} />
                                    <InfoField label="Status Nikah" value={formData.maritalStatus} icon={<Heart className="w-4 h-4" />} />
                                </DetailSection>
                            )}
                            {activeTab === 'alamat' && (
                                <DetailSection title="Informasi Alamat">
                                    <InfoField className="md:col-span-2" label="Alamat KTP" value={formData.addressKtp?.address} icon={<Home className="w-4 h-4" />} />
                                    <InfoField label="Kota/Provinsi" value={`${formData.addressKtp?.city || '-'}, ${formData.addressKtp?.province || '-'}`} icon={<MapPin className="w-4 h-4" />} />
                                    <InfoField label="Alamat Domisili" value={formData.addressDomicile?.isSameAsKtp ? 'Sama dengan KTP' : formData.addressDomicile?.address} icon={<MapPin className="w-4 h-4" />} />
                                </DetailSection>
                            )}
                            {activeTab === 'keluarga' && (
                                <DetailSection title="Informasi Keluarga">
                                    <InfoField label="Ibu Kandung" value={formData.familyData?.motherName} icon={<UserIcon className="w-4 h-4" />} />
                                    <InfoField label="Ayah Kandung" value={formData.familyData?.fatherName} icon={<UserIcon className="w-4 h-4" />} />
                                    <InfoField label="Kontak Darurat" value={formData.emergencyContact?.name} icon={<Phone className="w-4 h-4" />} />
                                    <InfoField label="Hubungan & Telp" value={`${formData.emergencyContact?.relationship || '-'} (${formData.emergencyContact?.phone || '-'})`} icon={<Users className="w-4 h-4" />} />
                                </DetailSection>
                            )}
                            {activeTab === 'pendidikan' && (
                                <DetailSection title="Riwayat Pendidikan">
                                    <InfoField label="Pendidikan Terakhir" value={formData.lastEducation} icon={<GraduationCap className="w-4 h-4" />} />
                                    <InfoField label="Universitas/Sekolah" value={formData.educationDetails?.universityName} icon={<Building className="w-4 h-4" />} />
                                    <InfoField label="Jurusan" value={formData.educationDetails?.major} icon={<BookOpen className="w-4 h-4" />} />
                                    <InfoField label="Tahun Lulus" value={formData.educationDetails?.graduationYear} icon={<Calendar className="w-4 h-4" />} />
                                </DetailSection>
                            )}
                            {activeTab === 'pekerjaan' && (
                                <DetailSection title="Kepegawaian">
                                    <InfoField label="Jabatan" value={formData.position} icon={<Briefcase className="w-4 h-4" />} />
                                    <InfoField label="Klien" value={clientMap.get(formData.clientId || '')} icon={<Building className="w-4 h-4" />} />
                                    <InfoField label="Cabang" value={formData.branch} icon={<MapPin className="w-4 h-4" />} />
                                    <InfoField label="Tgl Join" value={formData.joinDate} icon={<Calendar className="w-4 h-4" />} />
                                    <InfoField label="EOC (Akhir Kontrak)" value={formData.endDate} icon={<Calendar className="w-4 h-4" />} />
                                    <InfoField label="Tgl Resign" value={formData.resignDate} icon={<Calendar className="w-4 h-4" />} />
                                    <div className="md:col-span-2"><InfoField label="Catatan Kedisiplinan / SP" value={formData.disciplinaryActions} icon={<Shield className="w-4 h-4" />} /></div>
                                    <InfoField label="Atasan MH" value={formData.atasanMH?.name} icon={<UserIcon className="w-4 h-4" />} />
                                    <InfoField label="Atasan BM" value={formData.atasanBM?.name} icon={<UserIcon className="w-4 h-4" />} />
                                </DetailSection>
                            )}
                            {activeTab === 'finansial' && (
                                <DetailSection title="Data Keuangan">
                                    <InfoField label="Nama Bank" value={formData.bankAccount?.bankName} icon={<Building className="w-4 h-4" />} />
                                    <InfoField label="No Rekening" value={formData.bankAccount?.number} icon={<CreditCard className="w-4 h-4" />} />
                                    <InfoField label="BPJS Ketenagakerjaan" value={formData.bpjs?.ketenagakerjaan} icon={<Shield className="w-4 h-4" />} />
                                    <InfoField label="BPJS Kesehatan" value={formData.bpjs?.kesehatan} icon={<Shield className="w-4 h-4" />} />
                                    <InfoField label="NPWP" value={formData.npwp} icon={<FileText className="w-4 h-4" />} />
                                </DetailSection>
                            )}
                        </>
                    ) : (
                        <div className="space-y-8">
                             {activeTab === 'profil' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField label="Nama Lengkap" name="fullName" value={formData.fullName} onChange={handleChange} />
                                    <FormField label="NIK Karyawan" name="id" value={formData.id} onChange={handleChange} />
                                    <FormField label="NIK SWAPRO" name="swaproId" value={formData.swaproId} onChange={handleChange} />
                                    <FormField label="No KTP" name="ktpId" value={formData.ktpId} onChange={handleChange} />
                                    <FormField label="Email" name="email" value={formData.email} onChange={handleChange} />
                                    <FormField label="No WhatsApp" name="whatsapp" value={formData.whatsapp} onChange={handleChange} />
                                    <FormField label="Tempat Lahir" name="birthPlace" value={formData.birthPlace} onChange={handleChange} />
                                    <FormField label="Tanggal Lahir" name="birthDate" value={formData.birthDate} onChange={handleChange} type="date" />
                                    <FormField label="Jenis Kelamin" name="gender" value={formData.gender} onChange={handleChange} type="select" options={[{value: 'Laki-laki', label: 'Laki-laki'}, {value: 'Perempuan', label: 'Perempuan'}]} />
                                    <FormField label="Status Nikah" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} type="select" options={[{value: 'Belum Menikah', label: 'Belum Menikah'}, {value: 'Menikah', label: 'Menikah'}, {value: 'Cerai Hidup', label: 'Cerai Hidup'}, {value: 'Cerai Mati', label: 'Cerai Mati'}]} />
                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                                        <FileUploadField label="Foto KTP" value={formData.documents?.photoKtpUrl} onFileSelect={f => handleFileChange('photoKtp', f)} />
                                        <FileUploadField label="Foto NPWP" value={formData.documents?.photoNpwpUrl} onFileSelect={f => handleFileChange('photoNpwp', f)} />
                                        <FileUploadField label="Foto KK" value={formData.documents?.photoKkUrl} onFileSelect={f => handleFileChange('photoKk', f)} />
                                    </div>
                                </div>
                             )}
                             {activeTab === 'pekerjaan' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField label="Jabatan" name="position" value={formData.position} onChange={handleChange} />
                                    <FormField label="Klien" name="clientId" value={formData.clientId} onChange={handleChange} type="select" options={clients.map(c => ({value: c.id, label: c.name}))} />
                                    <FormField label="Cabang" name="branch" value={formData.branch} onChange={handleChange} />
                                    <FormField label="Status" name="status" value={formData.status} onChange={handleChange} type="select" options={Object.values(EmployeeStatus).map(s => ({value: s, label: s}))} />
                                    <FormField label="Tanggal Join" name="joinDate" value={formData.joinDate} onChange={handleChange} type="date" />
                                    <FormField label="End of Contract (EOC)" name="endDate" value={formData.endDate} onChange={handleChange} type="date" />
                                    <FormField label="Tanggal Resign" name="resignDate" value={formData.resignDate} onChange={handleChange} type="date" />
                                    <FormField label="Kontrak Ke-" name="contractNumber" value={formData.contractNumber} onChange={handleChange} type="number" />
                                    <div className="md:col-span-2"><FormField label="Catatan Kedisiplinan / SP" name="disciplinaryActions" value={formData.disciplinaryActions} onChange={handleChange} as="textarea" /></div>
                                    <FormField label="Nama Atasan MH" name="atasanMH.name" value={formData.atasanMH?.name} onChange={handleChange} />
                                    <FormField label="Nama Atasan BM" name="atasanBM.name" value={formData.atasanBM?.name} onChange={handleChange} />
                                </div>
                             )}
                             {activeTab === 'alamat' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                     <div className="md:col-span-2"><FormField label="Alamat KTP" name="addressKtp.address" value={formData.addressKtp?.address} onChange={handleChange} as="textarea" /></div>
                                     <FormField label="Kota KTP" name="addressKtp.city" value={formData.addressKtp?.city} onChange={handleChange} />
                                     <FormField label="Provinsi KTP" name="addressKtp.province" value={formData.addressKtp?.province} onChange={handleChange} />
                                     <div className="md:col-span-2 flex items-center space-x-2 pt-4 border-t border-slate-100">
                                         <input type="checkbox" name="addressDomicile.isSameAsKtp" checked={formData.addressDomicile?.isSameAsKtp} onChange={handleChange} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                         <label className="text-sm font-bold text-slate-600 uppercase tracking-widest">Domisili sama dengan KTP</label>
                                     </div>
                                     {!formData.addressDomicile?.isSameAsKtp && (
                                        <div className="md:col-span-2 pt-2 grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
                                            <div className="md:col-span-2"><FormField label="Alamat Domisili" name="addressDomicile.address" value={formData.addressDomicile?.address} onChange={handleChange} as="textarea" /></div>
                                        </div>
                                     )}
                                </div>
                             )}
                             {activeTab === 'keluarga' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField label="Nama Ibu Kandung" name="familyData.motherName" value={formData.familyData?.motherName} onChange={handleChange} />
                                    <FormField label="Nama Ayah Kandung" name="familyData.fatherName" value={formData.familyData?.fatherName} onChange={handleChange} />
                                    <FormField label="Nama Kontak Darurat" name="emergencyContact.name" value={formData.emergencyContact?.name} onChange={handleChange} />
                                    <FormField label="Hubungan Kontak" name="emergencyContact.relationship" value={formData.emergencyContact?.relationship} onChange={handleChange} />
                                    <FormField label="Telepon Kontak" name="emergencyContact.phone" value={formData.emergencyContact?.phone} onChange={handleChange} />
                                </div>
                             )}
                             {activeTab === 'pendidikan' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField label="Tingkat Pendidikan" name="lastEducation" value={formData.lastEducation} onChange={handleChange} type="select" options={EDUCATION_LEVELS.map(e => ({value: e, label: e}))} />
                                    <FormField label="Nama Universitas/Sekolah" name="educationDetails.universityName" value={formData.educationDetails?.universityName} onChange={handleChange} />
                                    <FormField label="Jurusan" name="educationDetails.major" value={formData.educationDetails?.major} onChange={handleChange} />
                                    <FormField label="IPK" name="educationDetails.gpa" value={formData.educationDetails?.gpa} onChange={handleChange} />
                                    <FormField label="Tahun Masuk" name="educationDetails.entryYear" value={formData.educationDetails?.entryYear} onChange={handleChange} />
                                    <FormField label="Tahun Lulus" name="educationDetails.graduationYear" value={formData.educationDetails?.graduationYear} onChange={handleChange} />
                                </div>
                             )}
                             {activeTab === 'finansial' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormField label="Nama Bank" name="bankAccount.bankName" value={formData.bankAccount?.bankName} onChange={handleChange} />
                                    <FormField label="No Rekening" value={formData.bankAccount?.number} onChange={handleChange} />
                                    <FormField label="Atas Nama" name="bankAccount.holderName" value={formData.bankAccount?.holderName} onChange={handleChange} />
                                    <FormField label="NPWP" name="npwp" value={formData.npwp} onChange={handleChange} />
                                    <FormField label="BPJS Ketenagakerjaan" name="bpjs.ketenagakerjaan" value={formData.bpjs?.ketenagakerjaan} onChange={handleChange} />
                                    <FormField label="BPJS Kesehatan" name="bpjs.kesehatan" value={formData.bpjs?.kesehatan} onChange={handleChange} />
                                </div>
                             )}
                        </div>
                    )}
                </div>
                
                <footer className="p-6 border-t bg-slate-50 flex items-center justify-between">
                    <div className="flex gap-2">
                        {isViewMode && (
                           <>
                             <button onClick={onEdit} className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition active:scale-95 shadow-lg shadow-emerald-600/20"><Edit className="w-4 h-4" /><span>Edit Data</span></button>
                             <button onClick={() => { if(window.confirm('Hapus karyawan ini?')) onDelete(); }} className="flex items-center space-x-2 px-6 py-3 bg-white text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-50 transition active:scale-95"><Trash2 className="w-4 h-4" /><span>Hapus</span></button>
                           </>
                        )}
                    </div>
                    {!isViewMode && (
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-100 transition active:scale-95">Batal</button>
                            <button onClick={handleSubmit} disabled={isSaving} className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition active:scale-95 shadow-lg shadow-blue-600/20 disabled:bg-blue-300">
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                <span>{isSaving ? 'Menyimpan...' : 'Simpan Data'}</span>
                            </button>
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
};

export const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; }> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({length: totalPages}, (_, i) => i + 1);
  return (
    <nav className="flex items-center justify-center space-x-2 mt-10 pb-4">
      {pages.map(n => (<button key={n} onClick={() => onPageChange(n)} className={`w-11 h-11 rounded-lg font-bold transition ${currentPage === n ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-300 text-slate-500'}`}>{n}</button>))}
    </nav>
  );
};

const Database: React.FC<DatabaseProps> = ({ employees, clients, payslips, onDataChange, onAddEmployee, onUpdateEmployee, onDeleteEmployee, onResetEmployees, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalState, setModalState] = useState<{ isOpen: boolean, mode: 'add' | 'edit' | 'view', data: Partial<Employee> | null }>({ isOpen: false, mode: 'add', data: null });
  const [currentPage, setCurrentPage] = useState(1);
  const notifier = useNotifier();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const searchMatch = (e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase()));
      const clientMatch = filterClient === 'all' || e.clientId === filterClient;
      const statusMatch = filterStatus === 'all' || e.status === filterStatus;
      return searchMatch && clientMatch && statusMatch;
    }).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [employees, searchTerm, filterClient, filterStatus]);
  
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterClient, filterStatus]);
  
  const paginatedEmployees = useMemo(() => {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                const employeesToUpsert = json.map(row => {
                    const partialEmployee: Partial<Employee> = {};
                    for (const header of Object.keys(CSV_HEADER_MAPPING)) {
                        if (row[header] !== undefined) {
                            const employeeKeyPath = CSV_HEADER_MAPPING[header];
                            const keys = employeeKeyPath.split('.');
                            let currentLevel: any = partialEmployee;
                            for (let i = 0; i < keys.length - 1; i++) {
                                if (!currentLevel[keys[i]]) currentLevel[keys[i]] = {};
                                currentLevel = currentLevel[keys[i]];
                            }
                            currentLevel[keys[keys.length - 1]] = row[header];
                        }
                    }
                    return partialEmployee;
                }).filter(e => e.id);
                if (employeesToUpsert.length > 0) onDataChange(employeesToUpsert);
                else notifier.addNotification('File tidak valid.', 'error');
            } catch (error) { notifier.addNotification('Gagal import.', 'error'); }
        };
        reader.readAsArrayBuffer(file);
    }
  };

  const downloadTemplate = () => {
    const headers = Object.keys(CSV_HEADER_MAPPING).join(',');
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'template_lengkap_swapro.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const reverseMap: { [key: string]: string } = {};
    for (const key in CSV_HEADER_MAPPING) reverseMap[CSV_HEADER_MAPPING[key]] = key;
    const dataToExport = filteredEmployees.map(emp => {
        const row: { [key: string]: any } = {};
        for (const keyPath in reverseMap) {
            const keys = keyPath.split('.');
            let value: any = emp;
            for (const key of keys) { if (value && typeof value === 'object' && key in value) value = value[key]; else { value = undefined; break; } }
            row[reverseMap[keyPath]] = value;
        }
        return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Karyawan");
    XLSX.writeFile(workbook, "Data_Karyawan_Lengkap.xlsx");
  };

  return (
    <div className="p-4 md:p-10 min-h-screen bg-slate-50/30">
      <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Database Karyawan</h1>
      <p className="text-base text-slate-500 mt-1">Kelola arsip kepegawaian pusat.</p>

      <div className="my-6 md:my-8 bg-white p-5 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative lg:col-span-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
              <input type="text" placeholder="Cari nama atau NIK..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border-slate-100 border rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <select className="px-4 py-3 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-slate-600 uppercase text-xs tracking-widest" value={filterClient} onChange={e => setFilterClient(e.target.value)}><option value="all">Semua Klien</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select className="px-4 py-3 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-slate-600 uppercase text-xs tracking-widest" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="all">Semua Status</option>{Object.values(EmployeeStatus).map(s => <option key={s} value={s}>{s}</option>)}</select>
        </div>
         <div className="pt-4 border-t border-slate-50 flex flex-col md:flex-row gap-3">
            <button onClick={() => setModalState({isOpen: true, mode: 'add', data: null})} className="w-full md:w-auto flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-transform"><Plus className="w-5 h-5" /><span>Tambah Baru</span></button>
            <div className="w-full md:w-auto flex-1 grid grid-cols-3 gap-3">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".csv, .xlsx" />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center space-x-2 bg-slate-50 text-slate-600 border border-slate-200 px-4 py-3 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-sm"><Upload className="w-4 h-4"/><span>Import</span></button>
                <button onClick={downloadTemplate} className="flex items-center justify-center space-x-2 bg-slate-50 text-slate-600 border border-slate-200 px-4 py-3 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-sm"><FileDown className="w-4 h-4"/><span>Template</span></button>
                <button onClick={exportToExcel} className="flex items-center justify-center space-x-2 bg-slate-50 text-slate-600 border border-slate-200 px-4 py-3 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-sm"><FileDown className="w-4 h-4"/><span>Export</span></button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedEmployees.map(emp => (
          <EmployeeCard 
            key={emp.id} 
            employee={emp} 
            clientName={clients.find(c => c.id === emp.clientId)?.name || 'N/A'}
            onView={() => setModalState({ isOpen: true, mode: 'view', data: emp })}
            onEdit={() => setModalState({ isOpen: true, mode: 'edit', data: emp })}
            onDelete={() => onDeleteEmployee(emp.id)}
          />
        ))}
      </div>
      
      {filteredEmployees.length > ITEMS_PER_PAGE && (
          <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE)} onPageChange={setCurrentPage} />
      )}
      
      {modalState.isOpen && (
        <EmployeeModal 
          isOpen={modalState.isOpen}
          onClose={() => setModalState({isOpen: false, mode: 'add', data: null})}
          mode={modalState.mode}
          employeeData={modalState.data}
          clients={clients}
          payslips={payslips}
          onSave={async (d) => { if(modalState.mode === 'add') await onAddEmployee(d as Employee); else await onUpdateEmployee(d); setModalState({isOpen: false, mode: 'add', data: null}); }}
          onEdit={() => setModalState(p => ({...p, mode: 'edit'}))}
          onDelete={() => { onDeleteEmployee(modalState.data?.id as string); setModalState({isOpen: false, mode: 'add', data: null}); }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default Database;
