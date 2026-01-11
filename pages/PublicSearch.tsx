
import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Key, X, ArrowLeft, ChevronRight, ShieldCheck, AlertCircle, Lock } from 'lucide-react';
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
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 animate-scaleIn">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Verifikasi Identitas</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="bg-blue-50 text-blue-700 p-4 rounded-2xl flex items-start space-x-3 border border-blue-100">
                        <ShieldCheck className="w-6 h-6 shrink-0" />
                        <p className="text-xs font-bold leading-relaxed text-blue-800">
                            Masukkan NIK lengkap Anda untuk membuka portal mandiri. Data dilindungi oleh sistem enkripsi internal.
                        </p>
                    </div>
                    {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-lg">{error}</p>}
                    <div>
                        <label className="block text-sm font-black text-slate-600 mb-1" htmlFor="nikVerification">NIK (ID Karyawan)</label>
                        <div className="relative">
                            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                id="nikVerification"
                                type="text"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Contoh: MCF24XXXXX"
                                className="w-full pl-10 pr-3 py-4 text-base border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm font-mono font-bold"
                                required
                                autoFocus
                            />
                        </div>
                    </div>
                </div>
                 <div className="p-5 pt-0">
                    <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span>Akses Data Saya</span>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
};

// Fungsi untuk menyamarkan NIK demi privasi
const maskNIK = (nik: string) => {
    if (!nik || nik.length < 5) return nik;
    const visiblePart = nik.substring(0, 5);
    return `${visiblePart}${'*'.repeat(nik.length - 5)}`;
};

const PublicEmployeeCard: React.FC<{ 
  employee: Employee, 
  onView: () => void
}> = ({ employee, onView }) => (
  <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-gray-200 p-6 group transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-400 text-center flex flex-col items-center">
    <div className="relative mb-4">
        <img 
            src={employee.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=E0E7FF&color=4F46E5`} 
            alt={employee.fullName} 
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
        />
        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm border border-slate-100">
            <Lock className="w-4 h-4 text-blue-500" />
        </div>
    </div>
    <div className="w-full mb-6">
      <h3 className="font-black text-base text-slate-800 truncate tracking-tight">{employee.fullName}</h3>
      <div className="mt-1 flex items-center justify-center space-x-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID:</span>
          <p className="text-xs font-black text-blue-600 font-mono" title="ID disamarkan untuk keamanan">
            {maskNIK(employee.id)}
          </p>
      </div>
      <div className="flex items-center justify-center space-x-1.5 mt-3 bg-slate-50 py-1.5 px-3 rounded-full border border-slate-100">
          <MapPin className="w-3 h-3 text-slate-400" />
          <p className="text-[10px] font-bold text-slate-500 uppercase truncate">{employee.branch}</p>
      </div>
    </div>
    <button 
        onClick={onView} 
        className="w-full bg-slate-900 text-white font-black py-3 px-4 rounded-2xl hover:bg-blue-600 shadow-lg shadow-slate-900/10 transition-all active:scale-95 text-xs tracking-wider"
    >
        VERIFIKASI & AKSES
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
    // KEAMANAN: Jangan tampilkan hasil jika belum dicari atau kata kunci kurang dari 3 karakter
    if (!hasSearched || searchTerm.trim().length < 3) return [];
    
    return employees.filter(e => 
      (e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterClient === 'all' || e.clientId === filterClient) &&
      (filterBranch === 'all' || e.branch === filterBranch)
    ).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [employees, searchTerm, filterClient, filterBranch, hasSearched]);

  // Reset state pencarian jika input berubah
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
        setSearchError('Pencarian memerlukan minimal 3 karakter untuk meminimalkan paparan data identitas.');
        setHasSearched(false);
        return;
    }
    setSearchError('');
    setHasSearched(true);
  };

  const handlePasswordSubmit = (nikInput: string) => {
    const targetEmployee = passwordPromptState.targetEmployee;
    // Verifikasi bisa NIK Karyawan atau NIK SWAPRO
    if (targetEmployee && (nikInput === targetEmployee.id || nikInput === targetEmployee.swaproId)) {
        setVerifiedEmployee(targetEmployee);
        setPasswordPromptState({ isOpen: false, targetEmployee: null, error: '' });
    } else {
        setPasswordPromptState(prev => ({ ...prev, error: 'NIK tidak sesuai dengan data sistem.' }));
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <img src="https://i.imgur.com/P7t1bQy.png" alt="SWAPRO Logo" className="h-8" />
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                <h1 className="text-sm font-black tracking-widest text-slate-800 uppercase hidden sm:block">Employee Portal</h1>
            </div>
            <button 
                onClick={() => navigate('/')} 
                className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 transition-colors font-bold text-sm"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Beranda</span>
            </button>
        </div>
      </header>
      
      <main className="p-4 md:p-12 max-w-5xl mx-auto flex-1 w-full">
        <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full mb-4">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">Secure Data Access</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">Portal Mandiri Karyawan</h1>
            <p className="text-base text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
                Cari Nama atau NIK Anda untuk mengakses slip gaji, berkas kontrak, dan pengkinian data pribadi.
            </p>
        </div>
        
        <form onSubmit={handleSearch} className="mb-12 bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 space-y-5 animate-slideIn">
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6" />
                    <input 
                        type="text" 
                        placeholder="Ketik Nama Lengkap atau NIK (Min. 3 Huruf)..." 
                        className={`w-full pl-14 pr-6 py-5 text-lg bg-slate-50 border-2 rounded-3xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold placeholder:text-slate-300 ${searchError ? 'border-red-200' : 'border-slate-100'}`} 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <select className="w-full px-5 py-4 text-xs font-black bg-slate-50 border-2 border-slate-100 rounded-2xl appearance-none focus:bg-white focus:border-blue-500 transition-all uppercase tracking-widest text-slate-600 cursor-pointer" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
                            <option value="all">Pilih Klien (Opsional)</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select className="w-full px-5 py-4 text-xs font-black bg-slate-50 border-2 border-slate-100 rounded-2xl appearance-none focus:bg-white focus:border-blue-500 transition-all uppercase tracking-widest text-slate-600 cursor-pointer" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
                            <option value="all">Pilih Cabang (Opsional)</option>
                            {uniqueBranches.map(branch => (<option key={branch} value={branch}>{branch}</option>))}</select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none" />
                    </div>
                </div>
            </div>
            
            {searchError && (
                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-bold border border-red-100 animate-pulse">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{searchError}</span>
                </div>
            )}

            <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl hover:bg-blue-700 transition shadow-xl shadow-blue-500/30 active:scale-[0.98] uppercase tracking-[0.15em] text-sm">
                CARI DATA SAYA
            </button>
        </form>

        {hasSearched ? (
            <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-6 px-4">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Hasil Pencarian ({filteredEmployees.length})</h2>
                    <div className="h-px flex-1 bg-slate-100 ml-6"></div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEmployees.map(emp => (
                        <PublicEmployeeCard 
                            key={emp.id} 
                            employee={emp} 
                            onView={() => setPasswordPromptState({ isOpen: true, targetEmployee: emp, error: '' })} 
                        />
                    ))}
                </div>

                {filteredEmployees.length === 0 && (
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                        <div className="bg-slate-50 p-8 rounded-full inline-block shadow-inner mb-6">
                            <Search className="w-12 h-12 text-slate-200"/>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">Data Tidak Ditemukan</h3>
                        <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">
                            Harap masukkan Nama Lengkap atau NIK dengan ejaan yang benar agar sistem dapat melakukan identifikasi.
                        </p>
                    </div>
                )}
            </div>
        ) : (
             <div className="text-center py-20 opacity-30 select-none pointer-events-none">
                <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Keamanan data diaktifkan</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2">Masukkan kata kunci untuk melihat hasil terproteksi</p>
             </div>
        )}
      </main>

      <footer className="py-8 text-center bg-slate-50">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2025 PT SWAPRO International • Data Protection Verified</p>
      </footer>

      <PasswordPromptModal 
        isOpen={passwordPromptState.isOpen} 
        onClose={() => setPasswordPromptState({ isOpen: false, targetEmployee: null, error: '' })} 
        onSubmit={handlePasswordSubmit} 
        error={passwordPromptState.error} 
      />
      
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slideIn { animation: slideIn 0.5s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default PublicSearch;
