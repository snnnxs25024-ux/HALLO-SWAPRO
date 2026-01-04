import React, { useState } from 'react';
import { ArrowLeft, User, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmployeeLoginProps {
  onLogin: (id: string, pass: string) => boolean;
}

const EmployeeLogin: React.FC<EmployeeLoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!onLogin(employeeId, password)) {
        setError('ID Karyawan atau Password salah.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative">
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors group z-10"
      >
        <div className="p-2 bg-white rounded-full shadow border border-slate-200 group-hover:shadow-md">
            <ArrowLeft className="w-5 h-5" />
        </div>
        <span className="font-semibold text-sm hidden sm:block">Kembali ke Beranda</span>
      </button>

      <div className="w-full max-w-sm lg:max-w-4xl">
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-300/40 border border-slate-200 overflow-hidden lg:grid lg:grid-cols-2">
            <div className="flex flex-col items-center justify-center p-8 lg:p-10 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center">
                <img src="https://i.imgur.com/P7t1bQy.png" alt="SWAPRO Logo" className="h-16 mb-4" />
                <h1 className="text-2xl lg:text-3xl font-black tracking-tight">HALO SWAPRO</h1>
                <p className="mt-2 text-blue-200 font-medium text-sm lg:text-base">Portal Karyawan</p>
                <p className="hidden lg:block mt-8 text-sm text-blue-300 leading-relaxed">Akses data personalia, slip gaji, dan informasi penting lainnya melalui portal aman ini.</p>
            </div>

            <form onSubmit={handleLogin} className="p-8 md:p-12">
                <div className="text-center lg:text-left mb-8">
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Login Karyawan</h2>
                    <p className="text-sm lg:text-base text-slate-500 mt-2">Masukkan ID (NIK) dan password Anda.</p>
                </div>
                
                {error && <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-3 rounded-lg mb-4">{error}</p>}
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1" htmlFor="employeeId">ID Karyawan (NIK)</label>
                        <div className="relative">
                           <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                id="employeeId"
                                type="text"
                                value={employeeId}
                                onChange={e => setEmployeeId(e.target.value)}
                                placeholder="Contoh: K001"
                                className="w-full pl-10 pr-3 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                                required
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1" htmlFor="password">Password</label>
                        <div className="relative">
                           <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-3 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                     <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 active:scale-95">
                        Login
                    </button>
                </div>
                 <div className="text-center mt-6">
                    <button type="button" onClick={() => navigate('/search')} className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition">
                        Lupa password atau ingin mencari rekan kerja?
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;