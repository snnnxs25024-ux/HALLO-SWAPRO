
import React, { useState, useEffect, useRef } from 'react';
import { Employee, EmployeeDataSubmission, EDUCATION_LEVELS } from '../types';
import { useNotifier } from '../components/Notifier';
import { supabase } from '../services/supabaseClient';
import { Loader2, User, Home, Book, CreditCard, Shield, Heart, UploadCloud, FileCheck2, X, Plus, Trash2, Users as UsersIcon, Briefcase, Info } from 'lucide-react';

interface DataUpdateFormProps {
    employee: Employee;
    onCreateSubmission: (submission: Omit<EmployeeDataSubmission, 'id' | 'submitted_at' | 'status'>) => Promise<void>;
}

const FormSection: React.FC<{ icon: React.ReactNode; title: string; description: string; children: React.ReactNode; }> = ({ icon, title, description, children }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-start gap-4 pb-4 border-b border-slate-100 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">{icon}</div>
            <div>
                <h3 className="font-bold text-lg text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500">{description}</p>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {children}
        </div>
    </div>
);

const FormField: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; type?: string; options?: {value: string, label: string}[]; className?: string; disabled?: boolean; }> = ({ label, name, value, onChange, type = 'text', options, className, disabled = false }) => (
    <div className={className}>
        <label htmlFor={name} className="block text-sm font-semibold text-slate-600 mb-1">{label}</label>
        {type === 'select' ? (
            <select id={name} name={name} value={value || ''} onChange={onChange} className="w-full text-base px-3 py-2 bg-slate-50 border-slate-200 border rounded-lg focus:ring-2 focus:ring-blue-500" disabled={disabled}>
                <option value="">Pilih...</option>
                {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        ) : (
            <input type={type} id={name} name={name} value={value || ''} onChange={onChange} className="w-full text-base px-3 py-2 bg-slate-50 border-slate-200 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-200/70 disabled:cursor-not-allowed" disabled={disabled} />
        )}
    </div>
);

const FileUpload: React.FC<{ label: string; fileKey: string; onFileChange: (key: string, file: File | null) => void }> = ({ label, fileKey, onFileChange }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        onFileChange(fileKey, file);
        setFileName(file ? file.name : null);
    };

    return (
        <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">{label}</label>
            <div 
                className={`relative flex items-center p-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${fileName ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400'}`}
                onClick={() => inputRef.current?.click()}
            >
                <input type="file" ref={inputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf" />
                {fileName ? (
                    <>
                        <FileCheck2 className="w-5 h-5 text-blue-600" />
                        <p className="ml-2 text-sm font-semibold text-blue-800 truncate">{fileName}</p>
                    </>
                ) : (
                    <>
                        <UploadCloud className="w-5 h-5 text-gray-400" />
                        <p className="ml-2 text-sm text-gray-500">Unggah file baru</p>
                    </>
                )}
            </div>
        </div>
    );
};


const DataUpdateForm: React.FC<DataUpdateFormProps> = ({ employee, onCreateSubmission }) => {
    const [formData, setFormData] = useState<Partial<Employee>>({});
    const [files, setFiles] = useState<Record<string, File | null>>({});
    const [isLoading, setIsLoading] = useState(false);
    const notifier = useNotifier();

    useEffect(() => {
        const initialData = JSON.parse(JSON.stringify(employee));
        // Ensure nested objects exist to prevent runtime errors on form field access
        const requiredKeys: (keyof Employee)[] = ['bankAccount', 'bpjs', 'documents', 'familyData', 'addressKtp', 'addressDomicile', 'educationDetails', 'emergencyContact', 'atasanMH', 'atasanBM'];
        requiredKeys.forEach(key => {
            if (!initialData[key]) {
                (initialData as any)[key] = {};
            }
        });
        setFormData(initialData);
    }, [employee]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        const updatedFormData = { ...formData };

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            (updatedFormData as any)[parent] = {
                ...(updatedFormData as any)[parent],
                [child]: type === 'checkbox' ? checked : value,
            };
        } else {
            (updatedFormData as any)[name] = type === 'checkbox' ? checked : value;
        }

        if (name === 'addressDomicile.isSameAsKtp' && checked) {
            updatedFormData.addressDomicile = { ...updatedFormData.addressDomicile, isSameAsKtp: true };
        }
        
        if (name === 'lastEducation' && !['D3', 'S1', 'S2', 'S3'].includes(value)) {
            if (updatedFormData.educationDetails) {
                updatedFormData.educationDetails.gpa = '';
            }
        }

        setFormData(updatedFormData);
    };
    
    const handleFileChange = (name: string, file: File | null) => {
        setFiles(prev => ({...prev, [name]: file}));
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
        setIsLoading(true);

        try {
            let updatedData = { ...formData };

            for (const key in files) {
                const file = files[key];
                if (file) {
                    const filePath = `user-documents/${employee.id}/${key}-${Date.now()}-${file.name}`;
                    const { error: uploadError } = await supabase.storage.from('swapro_files').upload(filePath, file, { upsert: true });
                    if(uploadError) throw uploadError;
                    const { data: { publicUrl } } = supabase.storage.from('swapro_files').getPublicUrl(filePath);
                    
                    if(key === 'profilePhoto') {
                        updatedData.profilePhotoUrl = publicUrl;
                    } else {
                        if (!updatedData.documents) updatedData.documents = {};
                        (updatedData.documents as any)[`${key}Url`] = publicUrl;
                    }
                }
            }
            
            await onCreateSubmission({
                employee_id: employee.id,
                submitted_data: updatedData,
            });
            notifier.addNotification("Data berhasil dikirim untuk ditinjau.", "success");

        } catch(error: any) {
            notifier.addNotification(`Gagal mengirim data: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h2 className="font-bold text-lg text-blue-800">Formulir Pengkinian Data</h2>
                <p className="text-sm text-blue-700 mt-1">Harap periksa dan perbarui data Anda dengan informasi yang paling akurat. Data ini akan digunakan untuk keperluan administrasi dan kepegawaian.</p>
            </div>

            {/* Data Diri */}
            <FormSection icon={<User className="w-5 h-5"/>} title="Data Pribadi" description="Informasi dasar dan identitas diri Anda.">
                <FormField className="md:col-span-2" label="Nama Lengkap" name="fullName" value={formData.fullName} onChange={handleChange} />
                <FormField label="Email Pribadi" name="email" value={formData.email} onChange={handleChange} type="email"/>
                <FormField label="No. WhatsApp" name="whatsapp" value={formData.whatsapp} onChange={handleChange} />
                <FormField label="Tempat Lahir" name="birthPlace" value={formData.birthPlace} onChange={handleChange} />
                <FormField label="Tanggal Lahir" name="birthDate" value={formData.birthDate} onChange={handleChange} type="date" />
                <FormField label="Jenis Kelamin" name="gender" value={formData.gender} onChange={handleChange} type="select" options={[{value: 'Laki-laki', label: 'Laki-laki'}, {value: 'Perempuan', label: 'Perempuan'}]}/>
                <FormField label="Status Pernikahan" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} type="select" options={[{value: 'Belum Menikah', label: 'Belum Menikah'}, {value: 'Menikah', label: 'Menikah'}, {value: 'Cerai Hidup', label: 'Cerai Hidup'}, {value: 'Cerai Mati', label: 'Cerai Mati'}]} />
                <FormField label="Kewarganegaraan" name="nationality" value={formData.nationality} onChange={handleChange} />
            </FormSection>

            {/* Alamat */}
            <FormSection icon={<Home className="w-5 h-5"/>} title="Informasi Alamat" description="Alamat sesuai KTP dan domisili saat ini.">
                <h4 className="md:col-span-2 font-bold text-slate-700 text-sm">Alamat KTP</h4>
                <FormField className="md:col-span-2" label="Alamat Lengkap" name="addressKtp.address" value={formData.addressKtp?.address} onChange={handleChange} />
                <FormField label="RT" name="addressKtp.rt" value={formData.addressKtp?.rt} onChange={handleChange} />
                <FormField label="RW" name="addressKtp.rw" value={formData.addressKtp?.rw} onChange={handleChange} />
                <FormField label="Kelurahan / Desa" name="addressKtp.village" value={formData.addressKtp?.village} onChange={handleChange} />
                <FormField label="Kecamatan" name="addressKtp.district" value={formData.addressKtp?.district} onChange={handleChange} />
                <FormField label="Kota / Kabupaten" name="addressKtp.city" value={formData.addressKtp?.city} onChange={handleChange} />
                <FormField label="Provinsi" name="addressKtp.province" value={formData.addressKtp?.province} onChange={handleChange} />
                <FormField label="Kode Pos" name="addressKtp.postalCode" value={formData.addressKtp?.postalCode} onChange={handleChange} />
                
                <h4 className="md:col-span-2 font-bold text-slate-700 text-sm mt-4">Alamat Domisili</h4>
                <div className="md:col-span-2 flex items-center space-x-2">
                    <input type="checkbox" id="isSameAsKtp" name="addressDomicile.isSameAsKtp" checked={formData.addressDomicile?.isSameAsKtp || false} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor="isSameAsKtp" className="text-sm font-medium text-slate-700">Sama dengan alamat KTP</label>
                </div>
                {!formData.addressDomicile?.isSameAsKtp && (
                    <>
                        <FormField className="md:col-span-2" label="Alamat Lengkap" name="addressDomicile.address" value={formData.addressDomicile?.address} onChange={handleChange} />
                        <FormField label="RT" name="addressDomicile.rt" value={formData.addressDomicile?.rt} onChange={handleChange} />
                        <FormField label="RW" name="addressDomicile.rw" value={formData.addressDomicile?.rw} onChange={handleChange} />
                    </>
                )}
            </FormSection>

            {/* Keluarga */}
            <FormSection icon={<Heart className="w-5 h-5"/>} title="Keluarga & Kontak Darurat" description="Informasi anggota keluarga dan kontak penting.">
                <FormField label="Nama Ibu Kandung" name="familyData.motherName" value={formData.familyData?.motherName} onChange={handleChange} />
                <FormField label="Nama Ayah Kandung" name="familyData.fatherName" value={formData.familyData?.fatherName} onChange={handleChange} />
                <h4 className="md:col-span-2 font-bold text-slate-700 text-sm mt-4">Kontak Darurat</h4>
                <FormField label="Nama Kontak" name="emergencyContact.name" value={formData.emergencyContact?.name} onChange={handleChange} />
                <FormField label="Hubungan" name="emergencyContact.relationship" value={formData.emergencyContact?.relationship} onChange={handleChange} />
                <FormField label="No. Telepon" name="emergencyContact.phone" value={formData.emergencyContact?.phone} onChange={handleChange} />
                <h4 className="md:col-span-2 font-bold text-slate-700 text-sm mt-4">Data Anak</h4>
                {formData.familyData?.childrenData?.map((child, index) => (
                    <div key={index} className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 p-4 bg-slate-50/50 rounded-lg border border-slate-200 relative">
                        <FormField label={`Nama Anak ${index + 1}`} name={`child-${index}-name`} value={child.name} onChange={(e) => handleChildChange(index, 'name', e.target.value)} />
                        <FormField label="Tanggal Lahir Anak" name={`child-${index}-birthDate`} value={child.birthDate} onChange={(e) => handleChildChange(index, 'birthDate', e.target.value)} type="date" />
                        <button type="button" onClick={() => removeChild(index)} className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
                 <div className="md:col-span-2"><button type="button" onClick={addChild} className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg"><Plus className="w-4 h-4"/>Tambah Anak</button></div>
            </FormSection>

            {/* Pendidikan */}
            <FormSection icon={<Book className="w-5 h-5"/>} title="Pendidikan Terakhir" description="Detail riwayat pendidikan formal terakhir Anda.">
                <FormField label="Tingkat Pendidikan" name="lastEducation" value={formData.lastEducation} onChange={handleChange} type="select" options={EDUCATION_LEVELS.map(l => ({value: l, label: l}))}/>
                <FormField label="Nama Sekolah/Universitas" name="educationDetails.universityName" value={formData.educationDetails?.universityName} onChange={handleChange} />
                <FormField label="Jurusan" name="educationDetails.major" value={formData.educationDetails?.major} onChange={handleChange} />
                <FormField label="IPK" name="educationDetails.gpa" value={formData.educationDetails?.gpa} onChange={handleChange} disabled={!['D3', 'S1', 'S2', 'S3'].includes(formData.lastEducation || '')} />
                <FormField label="Tahun Masuk" name="educationDetails.entryYear" value={formData.educationDetails?.entryYear} onChange={handleChange} />
                <FormField label="Tahun Lulus" name="educationDetails.graduationYear" value={formData.educationDetails?.graduationYear} onChange={handleChange} />
            </FormSection>

             {/* Atasan */}
            <FormSection icon={<UsersIcon className="w-5 h-5"/>} title="Informasi Atasan" description="Nama dan kontak atasan langsung Anda.">
                <FormField label="Nama Atasan MH/ARHEAD" name="atasanMH.name" value={formData.atasanMH?.name} onChange={handleChange} />
                <FormField label="No. Telepon Atasan MH/ARHEAD" name="atasanMH.phone" value={formData.atasanMH?.phone} onChange={handleChange} />
                <FormField label="Nama BM/KACAB" name="atasanBM.name" value={formData.atasanBM?.name} onChange={handleChange} />
                <FormField label="No. Telepon BM/KACAB" name="atasanBM.phone" value={formData.atasanBM?.phone} onChange={handleChange} />
            </FormSection>

            {/* Finansial */}
            <FormSection icon={<CreditCard className="w-5 h-5"/>} title="Finansial & Legal" description="Data rekening, pajak, dan BPJS.">
                <FormField className="md:col-span-2" label="Nama Bank" name="bankAccount.bankName" value={formData.bankAccount?.bankName} onChange={handleChange} />
                <FormField label="Nomor Rekening" name="bankAccount.number" value={formData.bankAccount?.number} onChange={handleChange} />
                <FormField label="Nama Pemilik Rekening" name="bankAccount.holderName" value={formData.bankAccount?.holderName} onChange={handleChange} />
                <FormField label="No. BPJS Ketenagakerjaan" name="bpjs.ketenagakerjaan" value={formData.bpjs?.ketenagakerjaan} onChange={handleChange} />
                <FormField label="No. BPJS Kesehatan" name="bpjs.kesehatan" value={formData.bpjs?.kesehatan} onChange={handleChange} />
                <FormField label="NPWP" name="npwp" value={formData.npwp} onChange={handleChange} />
            </FormSection>
            
            {/* Dokumen */}
            <FormSection icon={<Shield className="w-5 h-5"/>} title="Unggah Dokumen" description="Unggah versi terbaru dari dokumen identitas Anda.">
                <FileUpload label="Foto KTP" fileKey="photoKtp" onFileChange={handleFileChange} />
                <FileUpload label="Foto Kartu NPWP" fileKey="photoNpwp" onFileChange={handleFileChange} />
                <FileUpload label="Foto Kartu Keluarga" fileKey="photoKk" onFileChange={handleFileChange} />
            </FormSection>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 font-semibold">
                    Data yang Anda kirimkan bersifat rahasia dan akan digunakan semata-mata untuk keperluan administrasi kepegawaian di PT SWAPRO INTERNATIONAL. Pastikan semua data yang diisi adalah benar dan dapat dipertanggungjawabkan.
                </p>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition disabled:bg-blue-300">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Kirim Perubahan untuk Review'}
                </button>
            </div>
        </form>
    );
};

export default DataUpdateForm;
