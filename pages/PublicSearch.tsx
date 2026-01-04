import React, { useState, useMemo, useEffect } from 'react';
import { Search, Building, MapPin, Key, X, Info, User, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Employee, Client, User as AppUser, Payslip } from '../types';
import { useNavigate } from 'react-router-dom';


// --- SUB-COMPONENTS ---
const PasswordPromptModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (password: string) => void;
    error: string;
}> = ({ isOpen, onClose, onSubmit, error }) => {
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPassword('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(password);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Verifikasi Diri</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="bg-blue-50 text-blue-700 p-3 rounded-lg flex items-start space-x-3">
                        <Info className="w-5 h-5 mt-0.5 shrink-0" />
                        <p className="text-xs font-semibold">Untuk menjaga privasi, masukkan NIK Karyawan atau NIK SWAPRO Anda untuk melihat detail lengkap.</p>
                    </div>
                    {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-lg">{error}</p>}
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1" htmlFor="nikVerification">NIK Karyawan / NIK SWAPRO</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                id="nikVerification"
                                type="text"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Masukkan NIK..."
                                className="w-full pl-9 pr-3 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                                required
                                autoFocus
                            />
                        </div>
                    </div>
                </div>
                 <div className="p-5 border-t border-gray-200 bg-gray-50/50">
                    <button type="submit" className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20">
                        <span>Lanjutkan</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

const PublicEmployeeCard: React.FC<{ 
  employee: Employee, 
  clientName: string, 
  onView: () => void
}> = ({ employee, clientName, onView }) => (
  <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200 p-5 group transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-300 text-center">
      <img src={employee.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=E0E7FF&color=4F46E5`} alt={employee.fullName} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-4 mx-auto" />
      <h3 className="font-bold text-lg text-slate-800 truncate">{employee.fullName}</h3>
      <p className="text-sm text-slate-400 font-mono">{employee.id}</p>
      <div className="flex items-center justify-center space-x-1.5 mt-1">
          <MapPin className="w-4 h-4 text-slate-400" />
          <p className="text-sm text-slate-500 truncate">{employee.branch}</p>
      </div>
      <button onClick={onView} className="mt-4 w-full bg-blue-50 text-blue-600 font-bold py-2.5 px-4 rounded-lg hover:bg-blue-100 transition-colors">
          Lihat Detail
      </button>
  </div>
);

const Pagination: React.FC<{
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


interface PublicSearchProps {
  employees: Employee[];
  clients: Client[];
  payslips: Payslip[];
  currentUser: AppUser;
}

const ITEMS_PER_PAGE = 12;

const PublicSearch: React.FC<PublicSearchProps> = ({ employees, clients, payslips, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [hasSearched, setHasSearched] = useState(false);
  const [passwordPromptState, setPasswordPromptState] = useState<{ isOpen: boolean, targetEmployee: Employee | null, error: string }>({ isOpen: false, targetEmployee: null, error: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

  const uniqueBranches = useMemo(() => {
    const branches = new Set(employees.map(e => e.branch));
    return ['all', ...Array.from(branches).sort()];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (!hasSearched) return [];
    return employees.filter(e => 
      (e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterClient === 'all' || e.clientId === filterClient) &&
      (filterBranch === 'all' || e.branch === filterBranch)
    ).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [employees, searchTerm, filterClient, filterBranch, hasSearched]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterClient, filterBranch]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() || filterClient !== 'all' || filterBranch !== 'all') {
        setHasSearched(true);
        setCurrentPage(1);
    } else {
        setHasSearched(false);
    }
  };

  const paginatedEmployees = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);

  const handleRequestViewDetails = (employee: Employee) => {
    setPasswordPromptState({ isOpen: true, targetEmployee: employee, error: '' });
  };

  const handleClosePasswordPrompt = () => {
    setPasswordPromptState({ isOpen: false, targetEmployee: null, error: '' });
  };
  
  const handlePasswordSubmit = (nikInput: string) => {
    const targetEmployee = passwordPromptState.targetEmployee;
    if (targetEmployee && (nikInput === targetEmployee.id || nikInput === targetEmployee.swaproId)) {
        navigate('/employee-portal', { state: { employee: targetEmployee } });
        handleClosePasswordPrompt();
    } else {
        setPasswordPromptState(prev => ({ ...prev, error: 'NIK Karyawan atau NIK SWAPRO salah.' }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <img src="https://i.imgur.com/P7t1bQy.png" alt="SWAPRO Logo" className="h-8" />
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Portal Karyawan</h1>
            </div>
             <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Beranda</span>
            </button>
        </div>
      </header>
      
      <main className="p-6 md:p-10 max-w-6xl mx-auto">
        <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Cari Data Diri Anda</h1>
            <p className="text-lg text-slate-500 mt-2 max-w-2xl mx-auto">Gunakan NIK atau nama lengkap Anda untuk menemukan profil, slip gaji, dan informasi penting lainnya.</p>
        </div>

        <form onSubmit={handleSearch} className="my-8 bg-white p-4 md:p-5 rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative md:col-span-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Ketik Nama atau NIK..." 
                        className="w-full pl-12 pr-4 py-3 text-base bg-gray-50 border-gray-200 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                    <select 
                        className="w-full pl-12 pr-8 py-3 text-base bg-gray-50 border-gray-200 border rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={filterClient}
                        onChange={e => setFilterClient(e.target.value)}
                    >
                        <option value="all">Semua Klien</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                    <select 
                        className="w-full pl-12 pr-8 py-3 text-base bg-gray-50 border-gray-200 border rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={filterBranch}
                        onChange={e => setFilterBranch(e.target.value)}
                    >
                        {uniqueBranches.map(branch => (
                            <option key={branch} value={branch}>
                                {branch === 'all' ? 'Semua Cabang' : branch}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/20">
                Cari Karyawan
            </button>
        </form>

        {hasSearched && (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {paginatedEmployees.map(emp => (
                        <PublicEmployeeCard 
                            key={emp.id} 
                            employee={emp} 
                            clientName={clientMap.get(emp.clientId) || 'N/A'}
                            onView={() => handleRequestViewDetails(emp)}
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
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm mt-8">
                        <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                            <Search className="w-8 h-8 text-gray-400"/>
                        </div>
                        <p className="text-slate-500 font-semibold">Data Tidak Ditemukan</p>
                        <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">Pastikan Nama/NIK, Klien, dan Cabang yang Anda masukkan sudah benar.</p>
                    </div>
                )}
            </>
        )}

      </main>
      
      <PasswordPromptModal 
        isOpen={passwordPromptState.isOpen}
        onClose={handleClosePasswordPrompt}
        onSubmit={handlePasswordSubmit}
        error={passwordPromptState.error}
      />
    </div>
  );
};

export default PublicSearch;