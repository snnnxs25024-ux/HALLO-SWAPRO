import React, { useState, useMemo } from 'react';
import { DocumentRequest, Employee, DocumentRequestStatus } from '../types';
import { ShieldCheck, Clock, Check, X, User, FileText, Calendar, Loader2 } from 'lucide-react';
import { useNotifier } from '../components/Notifier';

interface ApprovalCenterProps {
    allRequests: DocumentRequest[];
    employees: Employee[];
    onRespondToRequest: (requestId: string, approved: boolean, durationMinutes?: number, rejectionReason?: string) => Promise<void>;
}

const ApprovalModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onConfirm: (duration: number) => void
}> = ({ isOpen, onClose, onConfirm }) => {
    const [duration, setDuration] = useState(1440); // Default 24 hours
    const [customMinutes, setCustomMinutes] = useState('');

    const durationOptions = [
        { label: '30 Menit', value: 30 },
        { label: '1 Jam', value: 60 },
        { label: '24 Jam', value: 1440 },
        { label: '3 Hari', value: 4320 },
        { label: '7 Hari', value: 10080 },
    ];

    if (!isOpen) return null;

    const handleConfirm = () => {
        const finalDuration = duration === -1 ? parseInt(customMinutes, 10) : duration;
        if (finalDuration > 0) {
            onConfirm(finalDuration);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200">
                <div className="p-5 border-b border-gray-200"><h2 className="text-lg font-bold text-slate-900">Setujui & Beri Akses</h2></div>
                <div className="p-5 space-y-4">
                    <p className="text-sm text-slate-600">Pilih berapa lama karyawan dapat mengakses dokumen ini.</p>
                    <div className="space-y-2">
                        {durationOptions.map(opt => (
                            <button key={opt.value} onClick={() => { setDuration(opt.value); setCustomMinutes(''); }} className={`w-full text-left p-3 rounded-lg border-2 text-sm font-semibold transition ${duration === opt.value ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 hover:border-slate-400'}`}>
                                {opt.label}
                            </button>
                        ))}
                        <button onClick={() => setDuration(-1)} className={`w-full text-left p-3 rounded-lg border-2 text-sm font-semibold transition ${duration === -1 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 hover:border-slate-400'}`}>
                            Kustom (menit)
                        </button>
                        {duration === -1 && (
                            <input type="number" value={customMinutes} onChange={e => setCustomMinutes(e.target.value)} placeholder="Masukkan menit" className="w-full mt-2 text-base px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" autoFocus />
                        )}
                    </div>
                </div>
                <div className="p-5 border-t border-gray-200 bg-gray-50/50 flex justify-end gap-3">
                    <button onClick={onClose} type="button" className="px-5 py-2.5 rounded-lg font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-gray-100">Batal</button>
                    <button onClick={handleConfirm} type="button" className="px-5 py-2.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition">Konfirmasi</button>
                </div>
            </div>
        </div>
    );
};

const RejectionModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onConfirm: (reason: string) => void
}> = ({ isOpen, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200">
                <div className="p-5 border-b border-gray-200"><h2 className="text-lg font-bold text-slate-900">Tolak Permintaan</h2></div>
                <div className="p-5 space-y-2">
                    <label htmlFor="rejectionReason" className="text-sm font-semibold text-slate-700">Alasan Penolakan (Wajib)</label>
                    <textarea id="rejectionReason" value={reason} onChange={e => setReason(e.target.value)} rows={4} className="w-full text-base p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                <div className="p-5 border-t border-gray-200 bg-gray-50/50 flex justify-end gap-3">
                    <button onClick={onClose} type="button" className="px-5 py-2.5 rounded-lg font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-gray-100">Batal</button>
                    <button onClick={() => onConfirm(reason)} disabled={!reason.trim()} type="button" className="px-5 py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:bg-red-300">Tolak</button>
                </div>
            </div>
        </div>
    );
};

const ApprovalCenter: React.FC<ApprovalCenterProps> = ({ allRequests, employees, onRespondToRequest }) => {
    const [activeTab, setActiveTab] = useState<DocumentRequestStatus>(DocumentRequestStatus.PENDING);
    const [modalState, setModalState] = useState<{ type: 'approve' | 'reject' | null, request: DocumentRequest | null }>({ type: null, request: null });
    const [isResponding, setIsResponding] = useState(false);
    const notifier = useNotifier();

    const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

    const filteredRequests = useMemo(() => {
        return allRequests
            .filter(r => r.status === activeTab)
            .sort((a, b) => new Date(b.requestTimestamp).getTime() - new Date(a.requestTimestamp).getTime());
    }, [allRequests, activeTab]);

    const handleApprove = async (duration: number) => {
        if (!modalState.request) return;
        setIsResponding(true);
        await onRespondToRequest(modalState.request.id, true, duration);
        setIsResponding(false);
        setModalState({ type: null, request: null });
    };

    const handleReject = async (reason: string) => {
        if (!modalState.request) return;
        setIsResponding(true);
        await onRespondToRequest(modalState.request.id, false, undefined, reason);
        setIsResponding(false);
        setModalState({ type: null, request: null });
    };

    const tabs = Object.values(DocumentRequestStatus).filter(s => s !== DocumentRequestStatus.EXPIRED);

    return (
        <>
            <div className="p-4 md:p-10">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Pusat Persetujuan Dokumen</h1>
                <p className="text-lg text-slate-500 mt-1">Kelola semua permintaan akses dokumen dari karyawan.</p>
                <div className="my-6 border-b border-slate-200"><div className="flex space-x-2">{tabs.map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors ${activeTab === tab ? 'bg-white border border-b-white -mb-px border-slate-200 text-blue-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{tab}</button>))}</div></div>
                <div className="space-y-4">
                    {filteredRequests.map(req => {
                        const employee = employeeMap.get(req.employeeId);
                        return (
                            <div key={req.id} className="bg-white p-4 rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <img src={employee?.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee?.fullName || '')}&background=E0E7FF&color=4F46E5`} className="w-12 h-12 rounded-full object-cover" />
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-base truncate flex items-center gap-2"><User className="w-4 h-4 text-slate-400" />{employee?.fullName || 'Nama Tidak Ditemukan'}</p>
                                        <p className="font-semibold text-slate-500 text-sm truncate flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" />{req.documentName}</p>
                                        <p className="text-slate-400 text-xs truncate flex items-center gap-2 mt-1"><Calendar className="w-4 h-4" />{new Date(req.requestTimestamp).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
                                    </div>
                                </div>
                                {activeTab === DocumentRequestStatus.PENDING && (
                                    <div className="flex gap-2 self-stretch md:self-center w-full md:w-auto">
                                        <button onClick={() => setModalState({ type: 'reject', request: req })} disabled={isResponding} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-200 transition"><X className="w-4 h-4" /><span>Tolak</span></button>
                                        <button onClick={() => setModalState({ type: 'approve', request: req })} disabled={isResponding} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition"><Check className="w-4 h-4" /><span>Setujui</span></button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {filteredRequests.length === 0 && <div className="text-center py-20 bg-white rounded-2xl border border-gray-200"><div className="bg-slate-50 p-4 rounded-full inline-block mb-4"><ShieldCheck className="w-10 h-10 text-slate-300"/></div><p className="text-slate-500 font-bold text-lg">Tidak ada permintaan</p><p className="text-base text-slate-400 mt-1">Tidak ada permintaan dengan status "{activeTab}" saat ini.</p></div>}
                </div>
            </div>
            <ApprovalModal isOpen={modalState.type === 'approve'} onClose={() => setModalState({ type: null, request: null })} onConfirm={handleApprove} />
            <RejectionModal isOpen={modalState.type === 'reject'} onClose={() => setModalState({ type: null, request: null })} onConfirm={handleReject} />
        </>
    );
};

export default ApprovalCenter;