
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Employee, Client, User, ContractDocument } from '../types';
// Added FileCheck2 and UploadCloud to the lucide-react import list
import { Search, User as UserIcon, Upload, X, FileText, Plus, Signature, CheckCircle, Clock, Loader2, FileArchive, ChevronLeft, Building, AlertTriangle, Shield, FileCheck2, UploadCloud } from 'lucide-react';
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
    const hasSignature = !!employee.documents?.e_signature;

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

// --- UPLOAD DOCUMENT MODAL ---
const UploadDocumentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    employee?: Employee;
    allEmployees: Employee[];
    onUpdateEmployee: (employee: Partial<Employee>) => Promise<void>;
}> = ({ isOpen, onClose, employee, allEmployees, onUpdateEmployee }) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(employee?.id || '');
    const [docType, setDocType] = useState('ADDENDUM');
    const [docNumber, setDocNumber] = useState('');
    const [customName, setCustomName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const notifier = useNotifier();

    useEffect(() => {
        if (isOpen) {
            setSelectedEmployeeId(employee?.id || '');
            setDocType('ADDENDUM');
            setDocNumber('');
            setCustomName('');
            setStartDate('');
            setEndDate('');
            setFile(null);
        }
    }, [isOpen, employee]);

    const docTypes = [
        { value: 'PKWT_NEW_HIRE', label: 'PKWT New Hire' },
        { value: 'ADDENDUM', label: 'Addendum Perpanjangan Kontrak' },
        { value: 'SP', label: 'Surat Peringatan (SP)' },
        { value: 'LAINNYA', label: 'Dokumen Lainnya' },
    ];

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetEmployee = allEmployees.find(e => e.id === selectedEmployeeId);
        if (!targetEmployee) return;

        let finalDocName = '';
        switch (docType) {
            case 'PKWT_NEW_HIRE': finalDocName = 'PKWT New Hire'; break;
            case 'ADDENDUM': finalDocName = `Addendum Perpanjangan Ke-${docNumber}`; break;
            case 'SP': finalDocName = `Surat Peringatan Ke-${docNumber}`; break;
            case 'LAINNYA': finalDocName = customName.trim(); break;
        }

        if (!finalDocName || !startDate || !endDate || !file) {
            notifier.addNotification("Harap lengkapi semua field.", "error"); return;
        }

        setIsLoading(true);
        try {
            const docId = `doc-${Date.now()}`;
            const filePath = `documents/${targetEmployee.id}/contracts/${docId}-${file.name}`;
            await supabase.storage.from('swapro_files').upload(filePath, file);
            const { data: { publicUrl } } = supabase.storage.from('swapro_files').getPublicUrl(filePath);

            const newContract: ContractDocument = { id: docId, name: finalDocName, startDate, endDate, fileUrl: publicUrl, isSigned: false };
            const updatedHistory = [...(targetEmployee.documents?.contractHistory || []), newContract];
            await onUpdateEmployee({ id: targetEmployee.id, documents: { ...targetEmployee.documents, contractHistory: updatedHistory } });
            
            notifier.addNotification("Berhasil unggah dokumen.", "success");
            onClose();
        } catch (error: any) {
            notifier.addNotification(`Gagal: ${error.message}`, 'error');
        } finally { setIsLoading(false); }
    };
    
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Unggah Berkas Baru</h2>
            <button type="button" onClick={onClose} disabled={isLoading} className="p-2 rounded-xl hover:bg-white transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {!employee && (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pilih Karyawan</label>
                  <select value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)} className="w-full text-base px-3 py-3 bg-slate-50 border-slate-200 rounded-xl appearance-none font-semibold" required>
                      <option value="">-- Pilih Karyawan --</option>
                      {allEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.id})</option>)}
                  </select>
                </div>
            )}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Jenis Dokumen</label>
              <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full text-base px-3 py-3 bg-slate-50 border-slate-200 rounded-xl appearance-none font-semibold">
                  {docTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            {['ADDENDUM', 'SP'].includes(docType) && <input type="number" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder={docType === 'ADDENDUM' ? 'Perpanjangan Ke-' : 'SP Ke-'} className="w-full text-base px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold" required />}
            {docType === 'LAINNYA' && <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Nama Dokumen" className="w-full text-base px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold" required />}
            <div className="grid grid-cols-2 gap-4">
               <div><label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tgl Mulai</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full text-base px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold" required /></div>
               <div><label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tgl Selesai</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full text-base px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold" required /></div>
            </div>
            <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pilih File (.pdf)</label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer" onClick={() => (document.getElementById('file-upload') as HTMLInputElement)?.click()}>
                    <input id="file-upload" type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
                    {file ? (
                        <div className="flex items-center justify-center space-x-2 text-blue-600 font-bold"><FileCheck2 className="w-6 h-6" /><span>{file.name}</span></div>
                    ) : (
                        <div className="text-slate-400 font-medium"><UploadCloud className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Klik untuk pilih file</p></div>
                    )}
                </div>
            </div>
          </div>
          <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition">Batal</button>
            <button type="submit" disabled={isLoading} className="px-10 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition flex items-center justify-center min-w-[120px]">{isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Unggah'}</button>
          </div>
        </form>
      </div>
    );
};

// --- SIGNING MODAL ---
const SigningModal: React.FC<{
    isOpen: boolean; onClose: () => void; docToSign: ContractDocument; employee: Employee; picUser: User;
    onUpdateEmployee: (employee: Partial<Employee>) => Promise<void>;
}> = ({ isOpen, onClose, docToSign, employee, picUser, onUpdateEmployee }) => {
    const notifier = useNotifier();
    if (!isOpen) return null;

    const handleSign = async () => {
       if (!employee.documents?.e_signature) {
           notifier.addNotification("Karyawan belum memiliki E-Signature.", "error"); return;
       }
       if (window.confirm("Konfirmasi tanda tangan dokumen ini?")) {
           const updatedDoc = { ...docToSign, isSigned: true, signedAt: new Date().toISOString(), picId: picUser.id };
           const updatedHistory = (employee.documents?.contractHistory || []).map(d => d.id === updatedDoc.id ? updatedDoc : d);
           await onUpdateEmployee({ id: employee.id, documents: { ...(employee.documents || {}), contractHistory: updatedHistory } });
           notifier.addNotification("Berhasil ditandatangani.", "success");
           onClose();
       }
    };
    
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-4">
            <div className="bg-white rounded-none md:rounded-3xl w-full max-w-5xl h-full md:h-[90vh] shadow-2xl border border-slate-200 flex flex-col">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0 bg-slate-50"><h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Review Penandatanganan</h2><button type="button" onClick={onClose} className="p-2"><X className="w-5 h-5" /></button></div>
                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    <div className="flex-1 bg-slate-800"><iframe src={docToSign.fileUrl} className="w-full h-full" title={docToSign.name} /></div>
                    <div className="w-full md:w-80 p-6 space-y-6 shrink-0 bg-white border-l border-slate-100 flex flex-col">
                        <div className="flex-1 space-y-6">
                            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dokumen</p><p className="font-bold text-slate-800 text-lg leading-tight">{docToSign.name}</p></div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tanda Tangan Karyawan</p>
                                {employee.documents?.e_signature ? (
                                    <div className="bg-white p-2 rounded-xl shadow-sm"><img src={employee.documents.e_signature} alt="E-Signature" className="h-20 mx-auto object-contain" /></div>
                                ) : (
                                    <div className="py-4 text-center border-2 border-dashed border-red-200 rounded-xl text-red-500 font-bold text-xs">Karyawan belum membuat E-Signature</div>
                                )}
                            </div>
                             <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Perwakilan SWA PRO</p>
                                <p className="font-bold text-blue-900">{picUser.nama}</p>
                            </div>
                        </div>
                        <button onClick={handleSign} className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all"><Signature className="w-5 h-5" /><span>KONFIRMASI & TTD</span></button>
                    </div>
                </div>
            </div>
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
            const searchMatch = e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase());
            let eocMatch = true;
            if (filterEoc !== 'all' && e.endDate) {
                const endDate = new Date(e.endDate);
                if (filterEoc === 'akan-bulan-ini') eocMatch = endDate.getMonth() === today.getMonth() && endDate.getFullYear() === today.getFullYear() && endDate >= today;
                else if (filterEoc === 'sudah-lewat') eocMatch = endDate < today;
            } else if (filterEoc !== 'all' && !e.endDate) eocMatch = false;

            let docStatusMatch = true;
            if (filterDocStatus !== 'all') {
                if (filterDocStatus === 'perlu-ttd') docStatusMatch = (e.documents?.contractHistory || []).some(d => !d.isSigned);
                else if (filterDocStatus === 'no-esign') docStatusMatch = !e.documents?.e_signature;
            }
            return searchMatch && eocMatch && docStatusMatch;
        }).sort((a,b) => a.fullName.localeCompare(b.fullName));
    }, [employees, searchTerm, filterEoc, filterDocStatus]);
    
    useEffect(() => {
        if(selectedEmployee) {
            const updatedEmployee = employees.find(e => e.id === selectedEmployee.id);
            if (updatedEmployee && JSON.stringify(updatedEmployee) !== JSON.stringify(selectedEmployee)) setSelectedEmployee(updatedEmployee);
        }
    }, [employees, selectedEmployee]);

    if (selectedEmployee) {
        return (
            <div className="h-[calc(100vh-theme(space.24))] md:h-screen">
                <DocumentDetailView employee={selectedEmployee} onBack={() => setSelectedEmployee(null)} onUploadClick={() => setModal('upload')} onSignClick={(doc) => { setDocToSign(doc); setModal('sign'); }} />
                 {modal === 'upload' && <UploadDocumentModal isOpen={modal === 'upload'} onClose={() => setModal(null)} employee={selectedEmployee} allEmployees={employees} onUpdateEmployee={onUpdateEmployee} />}
                 {modal === 'sign' && docToSign && <SigningModal isOpen={modal === 'sign'} onClose={() => { setModal(null); setDocToSign(null); }} docToSign={docToSign} employee={selectedEmployee} picUser={currentUser} onUpdateEmployee={onUpdateEmployee} />}
            </div>
        );
    }
    
    return (
        <>
            <div className="p-4 md:p-10 min-h-screen bg-slate-50/30">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Pemberkasan Digital</h1>
                <p className="text-base text-slate-500 mt-1">Arsip resmi dan manajemen kontrak instan.</p>
                
                <div className="my-6 md:my-8 bg-white p-5 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="relative lg:col-span-3">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                            <input type="text" placeholder="Cari nama atau NIK karyawan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-slate-100 border rounded-2xl focus:bg-white font-semibold transition-all" />
                        </div>
                        <select className="w-full px-4 py-3 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-slate-600 uppercase text-xs tracking-widest appearance-none" value={filterDocStatus} onChange={e => setFilterDocStatus(e.target.value)}><option value="all">Semua Status Dokumen</option><option value="perlu-ttd">Butuh TTD PIC</option><option value="no-esign">Tanpa E-Signature</option></select>
                        <select className="w-full lg:col-span-2 px-4 py-3 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-slate-600 uppercase text-xs tracking-widest appearance-none" value={filterEoc} onChange={e => setFilterEoc(e.target.value)}><option value="all">Semua Masa Kontrak</option><option value="akan-bulan-ini">Kontrak Berakhir Bulan Ini</option><option value="sudah-lewat">Sudah Melewati EOC</option></select>
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-50">
                        <button onClick={() => setModal('upload')} className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-transform"><Plus className="w-5 h-5" /><span>Unggah PKWT / SP Baru</span></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredEmployees.map(emp => <DossierEmployeeCard key={emp.id} employee={emp} clientName={clientMap.get(emp.clientId) || 'N/A'} onSelect={() => setSelectedEmployee(emp)} />)}
                </div>
                {filteredEmployees.length === 0 && <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm mt-8"><div className="bg-slate-50 p-6 rounded-full inline-block mb-4"><Search className="w-10 h-10 text-slate-200"/></div><p className="text-slate-500 font-bold text-lg">Karyawan Tidak Ditemukan</p><p className="text-slate-400 text-sm">Gunakan NIK atau nama lain untuk pencarian.</p></div>}
            </div>
            <UploadDocumentModal isOpen={modal === 'upload' && !selectedEmployee} onClose={() => setModal(null)} allEmployees={employees} onUpdateEmployee={onUpdateEmployee} />
            {selectedEmployee && modal === 'sign' && docToSign && <SigningModal isOpen={modal === 'sign'} onClose={() => { setModal(null); setDocToSign(null); }} docToSign={docToSign} employee={selectedEmployee} picUser={currentUser} onUpdateEmployee={onUpdateEmployee} />}
        </>
    );
};

export default Dossier;
