import React, { useState, useMemo } from 'react';
import { Client, Employee } from '../types';
import { Search, Plus, Edit, Trash2, Building, Users, X } from 'lucide-react';
import { useNotifier } from '../components/Notifier';

interface ClientManagementProps {
    clients: Client[];
    employees: Employee[];
    onAddClient: (client: Client) => Promise<void>;
    onUpdateClient: (client: Client) => Promise<void>;
    onDeleteClient: (clientId: string) => Promise<void>;
}

const ClientModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (client: Client) => void;
    clientData: Partial<Client> | null;
}> = ({ isOpen, onClose, onSave, clientData }) => {
    const [name, setName] = useState(clientData?.name || '');
    const [id, setId] = useState(clientData?.id || '');
    const notifier = useNotifier();

    React.useEffect(() => {
        setName(clientData?.name || '');
        setId(clientData?.id || `client-${Date.now()}`);
    }, [clientData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !id.trim()) {
            notifier.addNotification("ID dan Nama Klien tidak boleh kosong.", 'error');
            return;
        };
        onSave({ id, name });
    };

    const isEditMode = !!clientData?.id;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">{isEditMode ? 'Edit Klien' : 'Tambah Klien Baru'}</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1" htmlFor="clientId">ID Klien</label>
                        <input id="clientId" type="text" value={id} onChange={e => setId(e.target.value)} disabled={isEditMode} placeholder="e.g., client-4" className="w-full text-base px-3 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1" htmlFor="clientName">Nama Klien</label>
                        <input id="clientName" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Perusahaan Sejahtera" className="w-full text-base px-3 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition shadow-sm" required autoFocus/>
                    </div>
                </div>
                <div className="p-5 border-t border-gray-200 bg-gray-50/50 flex justify-end gap-3">
                     <button type="button" onClick={onClose} className="px-6 py-3 rounded-lg font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-gray-100 transition text-base">Batal</button>
                    <button type="submit" className="px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 text-base">Simpan</button>
                </div>
            </form>
        </div>
    );
};

const ClientManagement: React.FC<ClientManagementProps> = ({ clients, employees, onAddClient, onUpdateClient, onDeleteClient }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [modalState, setModalState] = useState<{ isOpen: boolean; data: Partial<Client> | null }>({ isOpen: false, data: null });
    const notifier = useNotifier();

    const employeeCounts = useMemo(() => {
        const counts = new Map<string, number>();
        employees.forEach(emp => {
            counts.set(emp.clientId, (counts.get(emp.clientId) || 0) + 1);
        });
        return counts;
    }, [employees]);

    const filteredClients = useMemo(() => {
        return clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [clients, searchTerm]);
    
    const handleOpenModal = (data: Partial<Client> | null = null) => {
        setModalState({ isOpen: true, data });
    };

    const handleCloseModal = () => {
        setModalState({ isOpen: false, data: null });
    };
    
    const handleSave = async (clientToSave: Client) => {
        if (modalState.data?.id) { // Edit mode
            await onUpdateClient(clientToSave);
        } else { // Add mode
            if (clients.some(c => c.id === clientToSave.id)) {
                notifier.addNotification(`Error: ID Klien "${clientToSave.id}" sudah ada.`, 'error');
                return;
            }
            await onAddClient(clientToSave);
        }
        handleCloseModal();
    };

    const handleDelete = async (clientId: string) => {
        const employeesInClient = employeeCounts.get(clientId) || 0;
        if (employeesInClient > 0) {
            notifier.addNotification(`Klien ini tidak dapat dihapus karena masih memiliki ${employeesInClient} karyawan.`, 'error');
            return;
        }

        if (window.confirm("Apakah Anda yakin ingin menghapus klien ini? Tindakan ini tidak dapat dibatalkan.")) {
            await onDeleteClient(clientId);
        }
    };


    return (
        <>
            <div className="p-4 md:p-10">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Kelola Klien</h1>
                <p className="text-lg text-slate-500 mt-1">Tambah, edit, atau hapus data klien partner.</p>

                <div className="my-6 md:my-8 bg-white p-4 rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200 flex flex-col md:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Cari nama klien..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-blue-500 text-base"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="w-full md:w-auto flex items-center justify-center space-x-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                        <Plus className="w-5 h-5" />
                        <span className="text-base">Tambah Klien</span>
                    </button>
                </div>
                
                {/* Client Table */}
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-base tracking-wider">
                                <tr>
                                    <th className="p-4 font-bold text-left">Nama Klien</th>
                                    <th className="p-4 font-bold text-left">ID Klien</th>
                                    <th className="p-4 font-bold text-left">Jumlah Karyawan</th>
                                    <th className="p-4 font-bold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredClients.map(client => (
                                    <tr key={client.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-semibold text-slate-800 text-base">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2.5 bg-slate-100 rounded-lg">
                                                    <Building className="w-5 h-5 text-slate-500" />
                                                </div>
                                                <span>{client.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-500 font-mono text-base">{client.id}</td>
                                        <td className="p-4 text-slate-600 font-semibold text-base">
                                            <div className="flex items-center space-x-1.5">
                                                <Users className="w-5 h-5 text-blue-500" />
                                                <span>{employeeCounts.get(client.id) || 0}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end space-x-2">
                                                <button onClick={() => handleOpenModal(client)} title="Edit" className="p-2 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDelete(client.id)} title="Hapus" className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     {filteredClients.length === 0 && (
                        <div className="text-center p-12">
                            <p className="text-slate-500 font-semibold text-lg">Tidak ada klien ditemukan</p>
                            <p className="text-base text-slate-400 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
                        </div>
                    )}
                </div>
            </div>
            <ClientModal 
                isOpen={modalState.isOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                clientData={modalState.data}
            />
        </>
    );
};

export default ClientManagement;