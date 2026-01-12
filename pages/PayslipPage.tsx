
import React, { useState, useMemo, useRef } from 'react';
import { Payslip, Employee, Client } from '../types';
import { UploadCloud, Calendar, Search, Download, User, Trash2, Edit, Check, X, Loader2, FileCheck2, Replace } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useNotifier } from '../components/Notifier';

interface PayslipPageProps {
    payslips: Payslip[];
    employees: Employee[];
    clients: Client[];
    onPayslipsChange: (payslips: Payslip[]) => Promise<boolean>;
    onDeletePayslip: (payslipId: string) => Promise<boolean>;
}

const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('id-ID', {
        month: 'long',
        year: 'numeric'
    });
};

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const ManagementModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    period: string;
    employees: Employee[];
    payslips: Payslip[];
    onPayslipsChange: (payslips: Payslip[]) => Promise<boolean>;
    onDeletePayslip: (payslipId: string) => Promise<boolean>;
}> = ({ isOpen, onClose, period, employees, payslips, onPayslipsChange, onDeletePayslip }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const notifier = useNotifier();

    if (!isOpen) return null;

    const payslipsForPeriod = payslips.filter(p => p.period === period);
    // Fixed: Explicitly typed the Map to avoid inference issues that lead to '{}' errors when accessing entries.
    const payslipMap = new Map<string, Payslip>(payslipsForPeriod.map(p => [p.employeeId, p]));

    const filteredEmployees = employees.filter(e => e.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, employee: Employee) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(prev => ({ ...prev, [employee.id]: true }));
        try {
            const filePath = `payslips/${period}/${employee.id}.pdf`;
            const { error: uploadError } = await supabase.storage.from('swapro_files').upload(filePath, file, { upsert: true });
            if(uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('swapro_files').getPublicUrl(filePath);

            const newPayslip: Payslip = {
                id: `${employee.id}-${period}`,
                employeeId: employee.id,
                period: period,
                fileUrl: publicUrl,
            };

            const success = await onPayslipsChange([newPayslip]);
            if (success) {
                notifier.addNotification(`Slip gaji untuk ${employee.fullName} berhasil diunggah.`, 'success');
            }
        } catch (error: any) {
            notifier.addNotification(`Gagal mengunggah file: ${error.message}`, 'error');
        } finally {
            setUploading(prev => ({ ...prev, [employee.id]: false }));
            if (fileInputRefs.current[employee.id]) {
                fileInputRefs.current[employee.id]!.value = "";
            }
        }
    };
    
    const handleDelete = async (payslip: Payslip, employee: Employee) => {
      if (window.confirm(`Hapus slip gaji untuk ${employee.fullName} periode ${formatPeriod(period)}?`)) {
        await onDeletePayslip(payslip.id);
      }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col h-[90vh] border border-slate-200">
                <header className="p-5 border-b border-gray-200 flex items-start justify-between bg-slate-50 sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Kelola Slip Gaji</h2>
                        <p className="text-base text-blue-600 font-semibold">{formatPeriod(period)}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
                </header>
                <div className="p-5 border-b border-gray-200">
                     <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input type="text" placeholder="Cari karyawan..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-100 border-slate-200 border rounded-xl focus:ring-2 focus:ring-blue-500 text-base" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {filteredEmployees.map(employee => {
                        // Fixed: Explicitly typed the Map and assigned the result to a typed Payslip variable to fix line 105 error.
                        const payslip: Payslip | undefined = payslipMap.get(employee.id);
                        return (
                             <div key={employee.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                                <div className="flex items-center space-x-3 min-w-0">
                                    <img src={employee.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=E0E7FF&color=4F46E5`} className="w-10 h-10 rounded-full object-cover shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-800 text-base truncate">{employee.fullName}</p>
                                        <p className="text-sm text-slate-500 font-mono truncate">{employee.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 shrink-0">
                                    {/* Fix: Wrap the ref assignment in a code block to ensure the element is not returned, satisfying TypeScript's expectation of void or a cleanup function */}
                                    <input type="file" accept=".pdf" className="hidden" ref={el => { fileInputRefs.current[employee.id] = el; }} onChange={(e) => handleFileUpload(e, employee)} />
                                    {uploading[employee.id] ? (
                                        <div className="p-2 text-slate-500"><Loader2 className="w-5 h-5 animate-spin" /></div>
                                    ) : payslip ? (
                                        <>
                                            <a href={payslip.fileUrl} download={`slipgaji-${employee.id}-${period}.pdf`} target="_blank" rel="noopener noreferrer" title="Unduh" className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600">
                                                <Download className="w-5 h-5" />
                                            </a>
                                            <button onClick={() => fileInputRefs.current[employee.id]?.click()} title="Ganti File" className="p-2 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600">
                                                <Replace className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(payslip, employee)} title="Hapus" className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => fileInputRefs.current[employee.id]?.click()} className="flex items-center space-x-2 bg-white text-slate-600 border border-slate-300 px-3 py-1.5 rounded-lg font-semibold transition-all hover:bg-slate-50 text-sm">
                                            <UploadCloud className="w-4 h-4" />
                                            <span>Upload</span>
                                        </button>
                                    )}
                                </div>
                             </div>
                        )
                    })}
                </div>
                <footer className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="px-6 py-3 rounded-lg font-bold text-base text-slate-600 bg-white border border-slate-300 hover:bg-gray-100 transition">Selesai</button>
                </footer>
            </div>
        </div>
    );
};


const PayslipPage: React.FC<PayslipPageProps> = ({ payslips, employees, clients, onPayslipsChange, onDeletePayslip }) => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [modalState, setModalState] = useState<{isOpen: boolean, period: string | null}>({isOpen: false, period: null});
    
    const payslipsByPeriod = useMemo(() => {
        const counts: Record<string, number> = {};
        payslips.forEach(p => {
            counts[p.period] = (counts[p.period] || 0) + 1;
        });
        return counts;
    }, [payslips]);
    
    const uniqueYears = useMemo(() => {
        const years = new Set<string>(payslips.map(p => p.period.substring(0,4)));
        const currentYear = new Date().getFullYear().toString();
        years.add(currentYear);
        return Array.from(years).sort((a,b) => b.localeCompare(a));
    }, [payslips]);
    
    const handleOpenModal = (period: string) => {
        setModalState({isOpen: true, period});
    };

    return (
        <div className="p-4 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Manajemen Slip Gaji</h1>
                    <p className="text-lg text-slate-500 mt-1">Kelola slip gaji karyawan per periode secara manual.</p>
                </div>
                <div className="relative self-start md:self-center">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                    <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="w-full sm:w-auto pl-12 pr-8 py-3 bg-white border-slate-300 border rounded-xl focus:ring-2 focus:ring-blue-500 text-base font-semibold appearance-none">
                       {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="my-6 md:my-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {MONTH_NAMES.map((monthName, index) => {
                    const month = (index + 1).toString().padStart(2, '0');
                    const period = `${selectedYear}-${month}`;
                    const count = payslipsByPeriod[period] || 0;
                    const isFutureMonth = new Date(selectedYear, index) > new Date();

                    return (
                        <div key={period} className={`bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-gray-200 flex flex-col transition-all duration-300 ${isFutureMonth ? 'opacity-50' : 'hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1'}`}>
                           <div className="flex-1">
                             <h3 className="text-2xl font-bold text-slate-800">{monthName}</h3>
                             <p className="text-sm font-semibold text-slate-400">{selectedYear}</p>
                             <div className="mt-4 flex items-center space-x-2 text-base">
                                <div className={`p-1.5 rounded-full ${count > 0 ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                    {count > 0 ? <Check className="w-4 h-4 text-emerald-600"/> : <X className="w-4 h-4 text-slate-400"/>}
                                </div>
                                <span className="font-semibold text-slate-600">{count} Slip Gaji</span>
                             </div>
                           </div>
                           <button 
                             onClick={() => handleOpenModal(period)}
                             disabled={isFutureMonth}
                             className="mt-6 w-full bg-blue-50 text-blue-600 font-bold py-2.5 px-4 rounded-lg hover:bg-blue-100 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                           >
                            Kelola
                           </button>
                        </div>
                    );
                })}
            </div>
            
            {modalState.isOpen && modalState.period && (
                <ManagementModal 
                    isOpen={modalState.isOpen}
                    onClose={() => setModalState({isOpen: false, period: null})}
                    period={modalState.period}
                    employees={employees}
                    payslips={payslips}
                    onPayslipsChange={onPayslipsChange}
                    onDeletePayslip={onDeletePayslip}
                />
            )}
        </div>
    );
};

export default PayslipPage;
