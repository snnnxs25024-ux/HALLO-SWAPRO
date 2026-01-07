
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Employee, Client, User, ContractDocument } from '../types';
import { Search, User as UserIcon, Upload, X, FileText, Plus, Signature, CheckCircle, Clock, Loader2, FileArchive, ChevronLeft, Building, AlertTriangle } from 'lucide-react';
import { useNotifier } from '../components/Notifier';
import { supabase } from '../services/supabaseClient';

// --- SUB-COMPONENTS ---

const DossierEmployeeCard: React.FC<{
    employee: Employee;
    clientName: string;
    onSelect: () => void;
}> = ({ employee, clientName, onSelect }) => {
    const docCount = employee.documents?.contractHistory?.length || 0;
    const pendingDocsCount = employee.documents?.contractHistory?.filter(d => !d.isSigned).length || 0;
    const hasSignature = !!employee.e_signature;

    return (
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200 p-5 group transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-300 flex flex-col text-center relative">
            {pendingDocsCount > 0 && (
                <div className="absolute top-3 right-3 bg-amber-400 text-amber-900 w-7 h-7 flex items-center justify-center rounded-full font-bold text-sm shadow-md border-2 border-white" title={`${pendingDocsCount} dokumen perlu ditandatangani`}>
                    {pendingDocsCount}
                </div>
            )}
            <img 
                src={employee.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=E0E7FF&color=4F46E5`} 
                alt={employee.fullName} 
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-3 mx-auto"
            />
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-slate-800 truncate">{employee.fullName}</h3>
                <p className="text-sm text-slate-400 font-mono">{employee.id}</p>
                <div className="flex items-center justify-center space-x-1.5 mt-1">
                    <Building className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-500 truncate">{clientName}</p>
                </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                 <div className={`flex items-center justify-center gap-2 text-xs font-bold uppercase px-3 py-1.5 rounded-full ${hasSignature ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {hasSignature ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span>E-Signature {hasSignature ? 'Tersedia' : 'Belum Ada'}</span>
                </div>
                 <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase px-3 py-1.5 rounded-full bg-blue-50 text-blue-700">
                    <FileArchive className="w-4 h-4" />
                    <span>{docCount} Dokumen</span>
                </div>
            </div>

            <button onClick={onSelect} className="mt-5 w-full bg-slate-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-600 shadow-lg shadow-slate-900/10 transition-all active:scale-95">
                Kelola Dokumen
            </button>
        </div>
    );
};

const DocumentDetailView: React.FC<{
    employee: Employee;
    onBack: () => void;
    onUploadClick: () => void;
    onSignClick: (doc: ContractDocument) => void;
}> = ({ employee, onBack, onUploadClick, onSignClick }) => {
    const sortedHistory = useMemo(() => 
        (employee.documents?.contractHistory || []).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
        [employee.documents?.contractHistory]
    );

    return (
        <div className="flex flex-col h-full bg-white animate-fadeIn">
            <header className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                   <button onClick={onBack} className="p-2 text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                   <img src={employee.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=E0E7FF&color=4F46E5`} alt={employee.fullName} className="w-10 h-10 rounded-full" />
                   <div>
                      <h2 className="font-bold text-lg text-slate-800">{employee.fullName}</h2>
                      <p className="text-sm text-slate-500 font-mono">{employee.id}</p>
                   </div>
                </div>
                <button onClick={onUploadClick} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition"><Upload className="w-4 h-4" /><span>Unggah</span></button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {sortedHistory.length > 0 ? sortedHistory.map(doc => (
                    <div key={doc.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <FileText className="w-8 h-8 text-blue-500 shrink-0" />
                            <div className="min-w-0">
                                <p className="font-bold text-slate-800 truncate">{doc.name}</p>
                                <p className="text-xs text-slate-500 font-medium">{new Date(doc.startDate).toLocaleDateString('id-ID')} - {new Date(doc.endDate).toLocaleDateString('id-ID')}</p>
                            </div>
                        </div>
                        {doc.isSigned ? (
                            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-full md:w-auto justify-center">
                                <CheckCircle className="w-4 h-4" />
                                <span>Telah Ditandatangani</span>
                            </div>
                        ) : (
                            <button onClick={() => onSignClick(doc)} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-amber-400 text-amber-900 rounded-lg font-bold text-sm hover:bg-amber-500 transition">
                                <Signature className="w-4 h-4" />
                                <span>Tanda Tangani</span>
                            </button>
                        )}
                    </div>
                )) : (
                    <div className="text-center py-20 text-slate-400">
                        <FileArchive className="w-12 h-12 mx-auto mb-4" />
                        <p className="font-semibold">Belum ada dokumen</p>
                        <p className="text-sm">Unggah dokumen pertama untuk karyawan ini.</p>
                    </div>
                )}
            </div>
             <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

// --- MAIN COMPONENT ---
interface DossierProps {
    employees: Employee[];
    clients: Client[];
    currentUser: User;
    onUpdateEmployee: (employee: Partial<Employee>) => Promise<void>;
}

const Dossier: React.FC<DossierProps> = ({ employees, clients, currentUser, onUpdateEmployee }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEoc, setFilterEoc] = useState('all');
    const [filterDocStatus, setFilterDocStatus] = useState('all');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [modal, setModal] = useState<'upload' | 'sign' | null>(null);
    const [docToSign, setDocToSign] = useState<ContractDocument | null>(null);
    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

    const filteredEmployees = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return employees.filter(e => {
            // Search filter
            const searchMatch = e.fullName.toLowerCase().includes(searchTerm.toLowerCase());
            
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

            // Document Status filter
            let docStatusMatch = true;
            if (filterDocStatus !== 'all') {
                const contractHistory = e.documents?.contractHistory || [];
                if (filterDocStatus === 'perlu-ttd') {
                    docStatusMatch = contractHistory.some(d => !d.isSigned);
                } else if (filterDocStatus === 'lengkap') {
                    docStatusMatch = contractHistory.length > 0 && contractHistory.every(d => d.isSigned);
                } else if (filterDocStatus === 'no-esign') {
                    docStatusMatch = !e.e_signature;
                }
            }

            return searchMatch && eocMatch && docStatusMatch;
        }).sort((a,b) => a.fullName.localeCompare(b.fullName));
    }, [employees, searchTerm, filterEoc, filterDocStatus]);
    
    // Synchronize selected employee data if the main state updates
    useEffect(() => {
        if(selectedEmployee) {
            const updatedEmployee = employees.find(e => e.id === selectedEmployee.id);
            if (updatedEmployee && JSON.stringify(updatedEmployee) !== JSON.stringify(selectedEmployee)) {
                setSelectedEmployee(updatedEmployee);
            }
        }
    }, [employees, selectedEmployee]);

    const handleUpdateAndReselect = async (employeeData: Partial<Employee>) => {
        await onUpdateEmployee(employeeData);
        // The useEffect hook above will handle re-selection.
    };
    
    if (selectedEmployee) {
        return (
            <div className="h-[calc(100vh-theme(space.24))] md:h-screen">
                <DocumentDetailView 
                    employee={selectedEmployee}
                    onBack={() => setSelectedEmployee(null)}
                    onUploadClick={() => setModal('upload')}
                    onSignClick={(doc) => { setDocToSign(doc); setModal('sign'); }}
                />
                 {modal === 'upload' && (
                    <UploadDocumentModal 
                        isOpen={modal === 'upload'}
                        onClose={() => setModal(null)} 
                        employee={selectedEmployee}
                        onUpdateEmployee={handleUpdateAndReselect}
                    />
                )}
                {modal === 'sign' && docToSign && (
                    <SigningModal
                      isOpen={modal === 'sign'}
                      onClose={() => { setModal(null); setDocToSign(null); }}
                      docToSign={docToSign}
                      employee={selectedEmployee}
                      picUser={currentUser}
                      onUpdateEmployee={handleUpdateAndReselect}
                    />
                )}
            </div>
        );
    }
    
    const eocOptions = [
        { value: 'all', label: 'Semua End of Contract' },
        { value: 'akan-bulan-ini', label: 'Akan Berakhir Bulan Ini' },
        { value: 'akan-bulan-depan', label: 'Akan Berakhir Bulan Depan' },
        { value: 'dalam-30', label: 'Dalam 30 Hari' },
        { value: 'dalam-90', label: 'Dalam 90 Hari' },
        { value: 'sudah-lewat', label: 'Sudah Berakhir' },
    ];

    const docStatusOptions = [
        { value: 'all', label: 'Semua Status Dokumen' },
        { value: 'perlu-ttd', label: 'Perlu Ditandatangani' },
        { value: 'lengkap', label: 'Dokumen Lengkap' },
        { value: 'no-esign', label: 'Belum Punya E-Signature' },
    ];
    
    return (
        <div className="p-4 md:p-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Pemberkasan Digital</h1>
            <p className="text-lg text-slate-500 mt-1">Kelola arsip dan penandatanganan dokumen karyawan.</p>

            <div className="my-6 md:my-8 bg-white p-4 rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="relative lg:col-span-3">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input type="text" placeholder="Cari karyawan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-blue-500 text-base" />
                    </div>
                    <select 
                        className="w-full px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-blue-500 text-base appearance-none"
                        value={filterDocStatus}
                        onChange={e => setFilterDocStatus(e.target.value)}
                    >
                        {docStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <select 
                        className="w-full lg:col-span-2 px-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-blue-500 text-base appearance-none"
                        value={filterEoc}
                        onChange={e => setFilterEoc(e.target.value)}
                    >
                        {eocOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredEmployees.map(emp => (
                    <DossierEmployeeCard 
                        key={emp.id}
                        employee={emp}
                        clientName={clientMap.get(emp.clientId) || 'N/A'}
                        onSelect={() => setSelectedEmployee(emp)}
                    />
                ))}
            </div>

            {filteredEmployees.length === 0 && (
                 <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm mt-4">
                    <div className="bg-slate-50 p-4 rounded-full inline-block mb-4">
                        <Search className="w-10 h-10 text-slate-300"/>
                    </div>
                    <p className="text-slate-500 font-bold text-lg">Tidak ada hasil</p>
                    <p className="text-base text-slate-400 mt-1 px-4">Tidak ada karyawan yang cocok dengan filter yang diterapkan.</p>
                </div>
            )}
        </div>
    );
};

// --- UPLOAD DOCUMENT MODAL ---
const UploadDocumentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    employee: Employee;
    onUpdateEmployee: (employee: Partial<Employee>) => Promise<void>;
}> = ({ isOpen, onClose, employee, onUpdateEmployee }) => {
    const [docType, setDocType] = useState('PKWT_NEW_HIRE');
    const [docNumber, setDocNumber] = useState('');
    const [customName, setCustomName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const notifier = useNotifier();

    const docTypes = [
        { value: 'PKWT_NEW_HIRE', label: 'PKWT New Hire' },
        { value: 'ADDENDUM', label: 'Addendum Perpanjangan Kontrak' },
        { value: 'SP', label: 'Surat Peringatan (SP)' },
        { value: 'LAINNYA', label: 'Dokumen Lainnya' },
    ];

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalDocName = '';
        switch (docType) {
            case 'PKWT_NEW_HIRE':
                finalDocName = 'PKWT New Hire';
                break;
            case 'ADDENDUM':
                if (!docNumber) { notifier.addNotification("Nomor perpanjangan wajib diisi.", "error"); return; }
                finalDocName = `Addendum Perpanjangan Kontrak ke-${docNumber}`;
                break;
            case 'SP':
                if (!docNumber) { notifier.addNotification("Nomor SP wajib diisi.", "error"); return; }
                finalDocName = `Surat Peringatan (SP) ke-${docNumber}`;
                break;
            case 'LAINNYA':
                if (!customName.trim()) { notifier.addNotification("Nama dokumen kustom wajib diisi.", "error"); return; }
                finalDocName = customName.trim();
                break;
        }

        if (!finalDocName || !startDate || !endDate || !file) {
            notifier.addNotification("Semua field wajib diisi.", "error");
            return;
        }

        setIsLoading(true);
        try {
            const docId = `doc-${Date.now()}`;
            const filePath = `documents/${employee.id}/contracts/${docId}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from('swapro_files').upload(filePath, file);
            if(uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('swapro_files').getPublicUrl(filePath);

            const newContract: ContractDocument = {
                id: docId,
                name: finalDocName,
                startDate,
                endDate,
                fileUrl: publicUrl,
                isSigned: false,
            };
            
            const updatedHistory = [...(employee.documents?.contractHistory || []), newContract];
            await onUpdateEmployee({ id: employee.id, documents: { ...employee.documents, contractHistory: updatedHistory } });
            
            notifier.addNotification("Dokumen berhasil diunggah.", "success");
            onClose();
        } catch (error: any) {
            notifier.addNotification(`Gagal mengunggah: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Unggah Dokumen Baru</h2>
            <button type="button" onClick={onClose} disabled={isLoading} className="p-2 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Jenis Dokumen</label>
              <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full text-base px-3 py-2 bg-white border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500">
                  {docTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            {(docType === 'ADDENDUM' || docType === 'SP') && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  {docType === 'ADDENDUM' ? 'Perpanjangan Ke-' : 'SP Ke-'}
                </label>
                <input type="number" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="e.g., 2" className="w-full text-base px-3 py-2 bg-white border border-gray-300 rounded-lg" required />
              </div>
            )}
            
            {docType === 'LAINNYA' && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-slate-600 mb-1">Nama Dokumen Kustom</label>
                <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g., Surat Keterangan Kerja" className="w-full text-base px-3 py-2 bg-white border border-gray-300 rounded-lg" required />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">Tanggal Mulai</label>
                 <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full text-base px-3 py-2 bg-white border border-gray-300 rounded-lg" required />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">Tanggal Selesai</label>
                 <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full text-base px-3 py-2 bg-white border border-gray-300 rounded-lg" required />
               </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">File Dokumen (.pdf)</label>
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" required />
            </div>
          </div>
          <div className="p-5 border-t border-gray-200 bg-gray-50/50 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-5 py-2.5 rounded-lg font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-gray-100">Batal</button>
            <button type="submit" disabled={isLoading} className="px-5 py-2.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center justify-center w-32">
                {isLoading ? <Loader2 className="animate-spin" /> : 'Unggah'}
            </button>
          </div>
        </form>
      </div>
    );
};

// --- SIGNING MODAL ---
const SigningModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    docToSign: ContractDocument;
    employee: Employee;
    picUser: User;
    onUpdateEmployee: (employee: Partial<Employee>) => Promise<void>;
}> = ({ isOpen, onClose, docToSign, employee, picUser, onUpdateEmployee }) => {
    const notifier = useNotifier();

    if (!isOpen) return null;

    const handleSign = async () => {
       if (!employee.e_signature) {
           notifier.addNotification("Karyawan belum memiliki E-Signature. Harap minta karyawan untuk membuatnya di portal mereka.", "error");
           return;
       }
       if (window.confirm("Apakah Anda yakin ingin menandatangani dokumen ini? Tindakan ini akan final.")) {
           const updatedDoc = { ...docToSign, isSigned: true, signedAt: new Date().toISOString(), picId: picUser.id };
           const updatedHistory = (employee.documents?.contractHistory || []).map(d => d.id === updatedDoc.id ? updatedDoc : d);
           await onUpdateEmployee({ id: employee.id, documents: { ...employee.documents, contractHistory: updatedHistory } });
           notifier.addNotification("Dokumen berhasil ditandatangani.", "success");
           onClose();
       }
    };
    
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] shadow-2xl border border-slate-200 flex flex-col">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Tanda Tangan Dokumen</h2>
                        <p className="text-sm text-slate-500">{docToSign.name}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    <div className="flex-1 border-r border-gray-200">
                        <iframe src={docToSign.fileUrl} className="w-full h-full" title={docToSign.name} />
                    </div>
                    <div className="w-full md:w-64 p-4 space-y-4 shrink-0 bg-slate-50">
                        <h3 className="text-sm font-bold text-slate-600">Pihak Penandatangan</h3>
                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                           <p className="text-xs font-semibold text-slate-400">Karyawan</p>
                           <p className="font-bold text-slate-800">{employee.fullName}</p>
                           {employee.e_signature ? (
                            <img src={employee.e_signature} alt="Tanda Tangan Karyawan" className="h-16 mt-2 bg-slate-100 p-1 rounded" />
                           ) : (
                            <p className="text-xs text-red-500 font-semibold mt-1">Belum ada tanda tangan</p>
                           )}
                        </div>
                         <div className="p-3 bg-white rounded-lg border border-slate-200">
                           <p className="text-xs font-semibold text-slate-400">Perusahaan (PIC)</p>
                           <p className="font-bold text-slate-800">{picUser.nama}</p>
                           <div className="mt-2 text-center text-xs text-slate-500 bg-slate-100 p-2 rounded">
                               <p>Tanda tangan PIC akan ditambahkan secara sistem.</p>
                           </div>
                        </div>
                        <button onClick={handleSign} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700">
                            <Signature className="w-4 h-4" />
                            <span>Konfirmasi & Tandatangani</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default Dossier;
