
import React, { useState, useMemo, useEffect } from 'react';
import { AppSettings, Client, EmployeeDataSubmission, SubmissionStatus, Employee, User } from '../types';
import { useNotifier } from '../components/Notifier';
import { Settings, ListChecks, Loader2, ToggleLeft, ToggleRight, X, User as UserIcon, Check, Eye, Search, Filter, CheckCircle, Clock } from 'lucide-react';
import { isObject, mergeWith } from '../utils';
import { EmployeeCard, EmployeeModal, Pagination } from './Database';

interface DataUpdateProps {
    settings: AppSettings[];
    submissions: EmployeeDataSubmission[];
    employees: Employee[];
    clients: Client[];
    currentUser: User;
    onUpdateSettings: (settings: AppSettings) => Promise<void>;
    onUpdateSubmissionStatus: (submissionId: string, status: SubmissionStatus, notes?: string) => Promise<void>;
    onUpdateEmployee: (employee: Partial<Employee>) => Promise<void>;
    onDeleteEmployee: (employeeId: string) => Promise<void>;
}

const getSettingValue = (settings: AppSettings[], key: string, defaultValue: any) => {
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
};

// Function to find differences between two objects
const getDifference = (oldData: Record<string, any>, newData: Record<string, any>) => {
    const changes: Record<string, { old: any; new: any }> = {};
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    allKeys.forEach(key => {
        const k = key as keyof Employee;
        const oldValue = oldData[k];
        const newValue = newData[k];

        if (isObject(oldValue) && isObject(newValue) && !Array.isArray(oldValue)) {
            const nestedChanges = getDifference(oldValue, newValue);
            Object.keys(nestedChanges).forEach(nestedKey => {
                changes[`${k}.${nestedKey}`] = nestedChanges[nestedKey];
            });
        } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes[k] = { old: oldValue, new: newValue };
        }
    });
    return changes;
};

const ReviewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    submission: EmployeeDataSubmission;
    employee: Employee;
    onApprove: (approvedData: Partial<Employee>) => Promise<void>;
    onReject: (notes: string) => Promise<void>;
}> = ({ isOpen, onClose, submission, employee, onApprove, onReject }) => {
    const [approvedChanges, setApprovedChanges] = useState<Record<string, any>>({});
    const [rejectionNotes, setRejectionNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const notifier = useNotifier();

    const differences = useMemo(() => getDifference(employee, submission.submitted_data), [employee, submission]);

    useEffect(() => {
        if (isOpen) {
            const initialApprovals: Record<string, any> = {};
            Object.keys(differences).forEach(key => {
                initialApprovals[key] = true;
            });
            setApprovedChanges(initialApprovals);
            setRejectionNotes('');
        }
    }, [isOpen, differences]);

    if (!isOpen) return null;

    const handleToggleApproval = (key: string) => {
        setApprovedChanges(prev => ({...prev, [key]: !prev[key]}));
    };

    const handleFinalize = async (isApproval: boolean) => {
        setIsSubmitting(true);
        if (isApproval) {
            const dataToUpdate: Partial<Employee> = { id: employee.id };
            Object.keys(approvedChanges).forEach(key => {
                if (approvedChanges[key] && differences[key]) {
                     const keys = key.split('.');
                     let current: any = dataToUpdate;
                     keys.forEach((k, index) => {
                         if (index === keys.length - 1) {
                             current[k] = differences[key].new;
                         } else {
                            if (!current[k as keyof typeof current]) {
                                (current as any)[k] = {};
                            }
                            current = current[k as keyof typeof current] as any;
                         }
                     });
                }
            });
            try {
                await onApprove(dataToUpdate);
            } catch (e) { /* Error handled in onApprove */ }
        } else {
            if (!rejectionNotes.trim()) {
                notifier.addNotification('Alasan penolakan wajib diisi.', 'error');
                setIsSubmitting(false);
                return;
            }
            try {
                 await onReject(rejectionNotes);
            } catch(e) { /* Error handled in onReject */ }
        }
        setIsSubmitting(false);
    };

    const renderValue = (value: any) => {
        if (value === null || value === undefined || value === '') return <i className="text-slate-400">Kosong</i>;
        if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
        if (Array.isArray(value)) return `[${value.length} item]`;
        if (isObject(value)) return JSON.stringify(value);
        return String(value);
    };
    
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] shadow-2xl flex flex-col border border-slate-200">
                <header className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Review Perubahan Data</h2>
                        <p className="text-sm text-slate-500">{employee.fullName}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
                </header>
                <div className="flex-1 overflow-y-auto p-6">
                    <table className="w-full text-sm">
                        <thead className="text-left">
                            <tr className="border-b border-slate-200">
                                <th className="p-2 w-10">Setuju</th>
                                <th className="p-2">Field</th>
                                <th className="p-2">Data Lama</th>
                                <th className="p-2">Data Baru</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(differences).map(key => (
                                <tr key={key} className="border-b border-slate-100">
                                    <td className="p-2 align-top text-center"><input type="checkbox" checked={!!approvedChanges[key]} onChange={() => handleToggleApproval(key)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/></td>
                                    <td className="p-2 align-top font-semibold text-slate-600 capitalize">{key.replace(/\./g, ' ')}</td>
                                    <td className="p-2 align-top text-slate-500 font-mono text-xs">{renderValue(differences[key].old)}</td>
                                    <td className="p-2 align-top font-semibold text-slate-800 font-mono text-xs">{renderValue(differences[key].new)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {Object.keys(differences).length === 0 && <p className="text-center py-10 text-slate-500">Tidak ada perubahan data yang dikirimkan.</p>}
                </div>
                <footer className="p-4 border-t border-gray-200 bg-gray-50 shrink-0 space-y-3">
                    <div>
                         <label className="text-sm font-semibold text-slate-700">Catatan Penolakan (opsional jika menyetujui)</label>
                         <textarea value={rejectionNotes} onChange={e => setRejectionNotes(e.target.value)} rows={2} className="w-full mt-1 text-sm p-2 border border-slate-300 rounded-lg"></textarea>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => handleFinalize(false)} disabled={isSubmitting} className="px-5 py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:bg-red-300">Tolak</button>
                        <button onClick={() => handleFinalize(true)} disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:bg-blue-300">
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin"/>}
                            Setujui & Perbarui Data
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

type SubmissionStatusType = 'pending' | 'approved' | 'rejected' | 'not_submitted';

const DataUpdate: React.FC<DataUpdateProps> = ({ settings, submissions, employees, clients, currentUser, onUpdateSettings, onUpdateSubmissionStatus, onUpdateEmployee, onDeleteEmployee }) => {
    const [activeTab, setActiveTab] = useState<'settings' | 'review'>('review');
    const [formSettings, setFormSettings] = useState({ is_active: false });
    const [isLoading, setIsLoading] = useState(false);
    const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; submission: EmployeeDataSubmission | null }>({ isOpen: false, submission: null });
    
    // States for card view
    const [filterStatus, setFilterStatus] = useState<SubmissionStatusType | 'all'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [employeeModal, setEmployeeModal] = useState<{ isOpen: boolean, mode: 'add' | 'edit' | 'view', data: Partial<Employee> | null }>({ isOpen: false, mode: 'view', data: null });
    const ITEMS_PER_PAGE = 8;
    const notifier = useNotifier();

    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
    const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

    const { filteredEmployees, submissionStatusMap } = useMemo(() => {
        const statusMap = new Map<string, { status: SubmissionStatusType, submissionId?: string }>();
        const sortedSubmissions = [...submissions].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

        for (const sub of sortedSubmissions) {
            if (!statusMap.has(sub.employee_id)) {
                if (sub.status === SubmissionStatus.PENDING_REVIEW) statusMap.set(sub.employee_id, { status: 'pending', submissionId: sub.id });
                else if (sub.status === SubmissionStatus.APPROVED) statusMap.set(sub.employee_id, { status: 'approved', submissionId: sub.id });
                else if (sub.status === SubmissionStatus.REJECTED) statusMap.set(sub.employee_id, { status: 'rejected', submissionId: sub.id });
            }
        }
        employees.forEach(emp => { if (!statusMap.has(emp.id)) statusMap.set(emp.id, { status: 'not_submitted' }); });

        const filtered = employees.filter(emp => {
            const searchMatch = emp.fullName.toLowerCase().includes(searchTerm.toLowerCase());
            const statusInfo = statusMap.get(emp.id);
            const statusMatch = filterStatus === 'all' || statusInfo?.status === filterStatus;
            return searchMatch && statusMatch;
        });

        return { filteredEmployees: filtered, submissionStatusMap: statusMap };
    }, [submissions, employees, searchTerm, filterStatus]);

    const paginatedEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredEmployees, currentPage]);

    useEffect(() => {
        const formSetting = getSettingValue(settings, 'data_update_form', { is_active: false });
        setFormSettings(formSetting);
    }, [settings]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, searchTerm]);


    const handleSettingsSave = async () => {
        setIsLoading(true);
        await onUpdateSettings({ key: 'data_update_form', value: formSettings });
        setIsLoading(false);
    };

    const handleApprove = async (approvedData: Partial<Employee>) => {
        if (!reviewModal.submission) return;
        await onUpdateEmployee(approvedData);
        await onUpdateSubmissionStatus(reviewModal.submission.id, SubmissionStatus.APPROVED);
        setReviewModal({ isOpen: false, submission: null });
    };

    const handleReject = async (notes: string) => {
        if (!reviewModal.submission) return;
        await onUpdateSubmissionStatus(reviewModal.submission.id, SubmissionStatus.REJECTED, notes);
        setReviewModal({ isOpen: false, submission: null });
    };

    const handleOpenEmployeeModal = (mode: 'view' | 'edit', data: Employee) => setEmployeeModal({ isOpen: true, mode, data });
    const handleCloseEmployeeModal = () => setEmployeeModal({ isOpen: false, mode: 'view', data: null });
    
    const handleDelete = async (employeeId: string) => {
        if (window.confirm('Hapus data karyawan ini?')) {
            await onDeleteEmployee(employeeId);
            if (employeeModal.data?.id === employeeId) handleCloseEmployeeModal();
            if (reviewModal.submission?.employee_id === employeeId) setReviewModal({ isOpen: false, submission: null });
        }
    };
    
    const handleView = (employee: Employee) => {
        const statusInfo = submissionStatusMap.get(employee.id);
        if (statusInfo?.status === 'pending' && statusInfo.submissionId) {
            const submission = submissions.find(s => s.id === statusInfo.submissionId);
            if (submission) setReviewModal({ isOpen: true, submission });
        } else {
            handleOpenEmployeeModal('view', employee);
        }
    };

    const handleSaveEmployee = async (empData: Partial<Employee>) => {
        await onUpdateEmployee(empData);
        handleCloseEmployeeModal();
    };

    const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);

    return (
        <div className="p-4 md:p-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Pusat Kontrol Pengkinian Data</h1>
            <p className="text-lg text-slate-500 mt-1">Atur formulir dan pantau progres pengkinian data karyawan.</p>
            <div className="my-6 border-b border-slate-200"><div className="flex space-x-2"><button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold text-sm ${activeTab === 'settings' ? 'bg-white border border-b-white -mb-px border-slate-200 text-blue-600' : 'bg-slate-50 text-slate-500'}`}><Settings className="w-4 h-4"/>Pengaturan</button><button onClick={() => setActiveTab('review')} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold text-sm ${activeTab === 'review' ? 'bg-white border border-b-white -mb-px border-slate-200 text-blue-600' : 'bg-slate-50 text-slate-500'}`}><ListChecks className="w-4 h-4"/>Status Karyawan</button></div></div>

            {activeTab === 'settings' && (
                <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200 max-w-xl animate-fadeIn">
                    <h2 className="text-xl font-bold text-slate-800">Status Formulir</h2>
                    <p className="text-slate-500 mt-1 mb-6">Aktifkan formulir agar dapat diakses oleh karyawan melalui portal mereka.</p>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"><div className="font-semibold text-slate-700">Formulir Pengkinian Data</div><button onClick={() => setFormSettings(prev => ({...prev, is_active: !prev.is_active}))}>{formSettings.is_active ? <ToggleRight className="w-10 h-10 text-blue-600"/> : <ToggleLeft className="w-10 h-10 text-slate-400"/>}</button></div>
                    <div className="mt-6 flex justify-end"><button onClick={handleSettingsSave} disabled={isLoading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300">{isLoading && <Loader2 className="w-5 h-5 animate-spin"/>}Simpan Pengaturan</button></div>
                </div>
            )}
            
            {activeTab === 'review' && (
                 <div className="animate-fadeIn">
                    <div className="mb-6 bg-white p-4 rounded-xl shadow-lg shadow-slate-200/50 border border-gray-200 space-y-3">
                        <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" /><input type="text" placeholder="Cari nama karyawan..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-blue-500 text-base" /></div>
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl"><Filter className="w-4 h-4 text-slate-500 ml-2" />{[{label: 'Semua', value: 'all'}, {label: 'Menunggu Review', value: 'pending'}, {label: 'Sudah Disetujui', value: 'approved'}, {label: 'Belum Mengisi', value: 'not_submitted'}].map(opt => <button key={opt.value} onClick={() => setFilterStatus(opt.value as any)} className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${filterStatus === opt.value ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{opt.label}</button>)}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {paginatedEmployees.map(emp => (
                            <EmployeeCard key={emp.id} employee={emp} clientName={clientMap.get(emp.clientId) || 'N/A'} submissionStatus={submissionStatusMap.get(emp.id)?.status} onView={() => handleView(emp)} onEdit={() => handleOpenEmployeeModal('edit', emp)} onDelete={() => handleDelete(emp.id)} />
                        ))}
                    </div>
                    {filteredEmployees.length > ITEMS_PER_PAGE && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
                    {filteredEmployees.length === 0 && <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm mt-4"><div className="bg-slate-50 p-4 rounded-full inline-block mb-4"><Search className="w-10 h-10 text-slate-300"/></div><p className="text-slate-500 font-bold text-lg">Tidak ada hasil</p><p className="text-base text-slate-400 mt-1 px-4">Tidak ada karyawan yang cocok dengan filter.</p></div>}
                 </div>
            )}
            
            {reviewModal.isOpen && reviewModal.submission && <ReviewModal isOpen={reviewModal.isOpen} onClose={() => setReviewModal({isOpen: false, submission: null})} submission={reviewModal.submission} employee={employeeMap.get(reviewModal.submission.employee_id)!} onApprove={handleApprove} onReject={handleReject}/>}
            {employeeModal.isOpen && <EmployeeModal isOpen={employeeModal.isOpen} onClose={handleCloseEmployeeModal} mode={employeeModal.mode} employeeData={employeeModal.data} clients={clients} payslips={[]} onSave={handleSaveEmployee} onEdit={() => handleOpenEmployeeModal('edit', employeeModal.data as Employee)} onDelete={() => handleDelete(employeeModal.data!.id!)} currentUser={currentUser} />}
        </div>
    );
};

export default DataUpdate;
