
import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Key, X, ArrowLeft, ChevronRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Employee, Client, Payslip, DocumentRequest, AppSettings, EmployeeDataSubmission } from '../types';
import { useNavigate } from 'react-router-dom';
import EmployeePortal from './EmployeePortal';

const PasswordPromptModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (password: string) => void;
    error: string;
}> = ({ isOpen, onClose, onSubmit, error }) => {
    const [password, setPassword] = useState('');

    useEffect(() => { if (isOpen) setPassword(''); }, [isOpen]);
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(password);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Verifikasi NIK</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="bg-blue-50 text-blue-700 p-4 rounded-2xl flex items-start space-x-3 border border-blue-100">
                        <ShieldCheck className="w-6 h-6 shrink-0" />
                        <p className="text-xs font-bold leading-relaxed">Sistem Keamanan Berbasis NIK. Masukkan NIK Karyawan atau NIK SWAPRO untuk identifikasi Anda.</p>
                    </div>
                    {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-lg">{error}</p>}
                    <div>
                        <label className="block text-sm font-black text-slate-600 mb-1" htmlFor="nikVerification">NIK Identitas</label>
                        <div className="relative">
                            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                id="nikVerification"
                                type="text"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Masukkan NIK Anda..."
                                className="w-full pl-10 pr-3 py-4 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 transition shadow-sm font-bold"
                                required
                                autoFocus
                            />
                        </div>
                    </div>
                </div>
                 <div className="p-5 pt-0">
                    <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span>Buka Portal</span>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
};

const maskNIK = (nik: string) => {
    if (!nik || nik.length < 5) return nik;
    const prefix = nik.substring(0, 5);
    return `${prefix}${'*'.repeat(nik.length - 5)}`;
};

const PublicEmployeeCard: React.FC<{ 
  employee: Employee, 
  onView: () => void
}> = ({ employee, onView }) => (
  <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-gray-200 p-6 group transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-300 text-center">
    <div className="relative inline-block mb-4">
        <img src={employee.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=E0E7FF&color=4F46E5`} alt={employee.fullName} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mx-auto" />
        <div className="absolute bottom-0 right-0 bg-emerald-500 border-2 border-white w-6 h-6 rounded-full"></div>
    </div>
    <div className="w-full">
      <h3 className="font-black text-lg text-slate-800 truncate tracking-tight">{employee.fullName}</h3>
      <p className="text-xs font-black text-blue-600 uppercase tracking-widest font-mono" title="NIK disamarkan demi keamanan">
        {maskNIK(employee.id)}
      </p>
      <div className="flex items-center justify-center space-x-1.5 mt-2 bg-slate-50 py-1 rounded-full">
          <MapPin className="w-3 h-3 text-slate-400" />
          <p className="text-[10px] font-bold text-slate-500 uppercase">{employee.branch}</p>
      </div>
    </div>
    <button onClick={onView} className="mt-6 w-full bg-blue-600 text-white font-black py-3 px-4 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/10 transition-all active:scale-95">
        Akses Portal
    </button>
  </div>
);

const PublicSearch: React.FC<{
  employees: Employee[];
  clients: Client[];
  payslips: Payslip[];
  documentRequests: DocumentRequest[];
  onRequestDocument: (request: Omit<DocumentRequest, 'id' | 'requestTimestamp' | 'status'>) => Promise<void>;
  onUpdateEmployee: (employee: Partial<Employee>) => Promise<void>;
  appSettings: AppSettings[];
  employeeSubmissions: EmployeeDataSubmission[];
  onCreateSubmission: (submission: Omit<EmployeeDataSubmission, 'id' | 'submitted_at' | 'status'>) => Promise<void>;
}> = (props) => {
  const { employees, clients } = props;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [passwordPromptState, setPasswordPromptState] = useState<{ isOpen: boolean, targetEmployee: Employee | null, error: string }>({ isOpen: false, targetEmployee: null, error: '' });
  const [verifiedEmployee, setVerifiedEmployee] = useState<Employee | null>(null);
  const navigate = useNavigate();

  const uniqueBranches = useMemo(() => Array.from(new Set(employees.map(e => e.branch))).sort(), [employees]);

  const filteredEmployees = useMemo(() => {
    // SECURITY FIX: Do not show results if no search term is provided, even if client filter is used
    if (!hasSearched || searchTerm.trim().length < 3) return [];
    
    return employees.filter(e => 
      (e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterClient === 'all' || e.clientId === filterClient) &&
      (filterBranch === 'all' || e.branch === filterBranch)
    ).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [employees, searchTerm, filterClient, filterBranch, hasSearched]);

  useEffect(() => { 
    setHasSearched(false); 
    setSearchError('');
  }, [searchTerm, filterClient, filterBranch]);
  
  useEffect(() => {
    if (verifiedEmployee) {
      const updatedEmployee = employees.find(e => e.id === verifiedEmployee.id);
      if (updatedEmployee && JSON.stringify(updatedEmployee) !== JSON.stringify(verifiedEmployee)) {
        setVerifiedEmployee(updatedEmployee);
      }
    }
  }, [employees, verifiedEmployee]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length < 3) {
        setSearchError('Harap masukkan minimal 3 karakter Nama atau NIK untuk memulai pencarian demi alasan keamanan.');
        setHasSearched(false);
        return;
    }
    setSearchError('');
    setHasSearched(true);
  };

  const handlePasswordSubmit = (nikInput: string) => {
    const targetEmployee = passwordPromptState.targetEmployee;
    if (targetEmployee && (nikInput === targetEmployee.id || nikInput === targetEmployee.swaproId)) {
        setVerifiedEmployee(targetEmployee);
        setPasswordPromptState({ isOpen: false, targetEmployee: null, error: '' });
    } else {
        setPasswordPromptState(prev => ({ ...prev, error: 'NIK Karyawan atau NIK SWAPRO salah.' }));
    }
  };

  if (verifiedEmployee) {
    return (
      <EmployeePortal
        verifiedEmployee={verifiedEmployee}
        onLogout={() => setVerifiedEmployee(null)}
        {...props}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <img src="https://i.imgur.com/P7t1bQy.png" alt="SWAPRO Logo" className="h-8" />
                <h1 className="text-lg font-black tracking-tighter text-slate-900 uppercase">Portal Karyawan</h1>
            </div>
            <button onClick={() => navigate('/')} className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        </div>
      </header>
      
      <main className="p-4 md:p-10 max-w-6xl mx-auto flex-1 w-full">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Akses Portal Mandiri</h1>
            <p className="text-sm text-slate-500 font-medium">Cari data Anda secara spesifik untuk mulai mengelola administrasi kepegawaian.</p>
        </div>
        
        <form onSubmit={handleSearch} className="mb-10 bg-white p-5 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 space-y-4">
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Ketik Nama Lengkap atau NIK Anda..." 
                        className={`w-full pl-12 pr-4 py-4 text-base bg-slate-50 border-2 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-bold ${searchError ? 'border-red-200' : 'border-transparent'}`} 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <select className="w-full px-4 py-4 text-xs font-black bg-slate-50 border-transparent rounded-2xl appearance-none focus:bg-white transition-all uppercase tracking-widest text-slate-600" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
                        <option value="all">Filter Klien (Opsional)</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select className="w-full px-4 py-4 text-xs font-black bg-slate-50 border-transparent rounded-2xl appearance-none focus:bg-white transition-all uppercase tracking-widest text-slate-600" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
                        <option value="all">Filter Cabang (Opsional)</option>
                        {uniqueBranches.map(branch => (<option key={branch} value={branch}>{branch}</option>))}</select>
                </div>
            </div>
            
            {searchError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold animate-pulse">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{searchError}</span>
                </div>
            )}

            <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition shadow-xl active:scale-95">MULAI PENCARIAN DATA</button>
        </form>

        {hasSearched && (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredEmployees.map(emp => (<PublicEmployeeCard key={emp.id} employee={emp} onView={() => setPasswordPromptState({ isOpen: true, targetEmployee: emp, error: '' })} />))}
                </div>
                {filteredEmployees.length === 0 && (
                    <div className="text-center py-20">
                        <div className="bg-white p-6 rounded-full inline-block shadow-lg mb-4 border border-slate-100">
                            <Search className="w-10 h-10 text-slate-200"/>
                        </div>
                        <h3 className="text-lg font-black text-slate-800">Data Tidak Ditemukan</h3>
                        <p className="text-sm text-slate-400 font-medium">Pastikan pencarian Anda spesifik (Nama Lengkap atau NIK yang tepat).</p>
                    </div>
                )}
            </>
        )}
        
        {!hasSearched && !searchError && (
             <div className="text-center py-10 opacity-60">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Masukkan kata kunci untuk melihat hasil</p>
             </div>
        )}
      </main>

      <PasswordPromptModal 
        isOpen={passwordPromptState.isOpen} 
        onClose={() => setPasswordPromptState({ isOpen: false, targetEmployee: null, error: '' })} 
        onSubmit={handlePasswordSubmit} 
        error={passwordPromptState.error} 
      />
    </div>
  );
};

export default PublicSearch;
