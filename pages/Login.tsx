import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onPicLogin: (userId: string) => boolean;
  picUsers: User[];
}

const PicLogin: React.FC<{ users: User[], onLogin: (id: string) => boolean }> = ({ users, onLogin }) => (
    <div className="space-y-3">
        {users.map((user) => (
            <button
                key={user.id}
                onClick={() => onLogin(user.id)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10 rounded-2xl transition-all group"
            >
                <div className="flex items-center space-x-4">
                    <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama)}&background=E0E7FF&color=4F46E5`} 
                        alt={user.nama}
                        className="w-12 h-12 rounded-lg object-contain p-1 bg-white shadow-sm ring-2 ring-white group-hover:ring-blue-100 transition-all"
                    />
                    <div className="text-left">
                        <p className="font-bold text-base text-slate-800">{user.nama}</p>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 uppercase tracking-tighter">
                            {user.role}
                        </span>
                    </div>
                </div>
                <div className="bg-white p-2 rounded-full shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100">
                    <ArrowRight className="w-5 h-5" />
                </div>
            </button>
        ))}
    </div>
);


const Login: React.FC<LoginProps> = ({ onPicLogin, picUsers }) => {
  const navigate = useNavigate();
  const title = 'Portal Login PIC/Admin';
  const description = 'Pilih akun Anda untuk masuk ke dashboard utama.';

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
            {/* Visual Panel */}
            <div className="flex flex-col items-center justify-center p-8 lg:p-10 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center">
                <img src="https://i.imgur.com/P7t1bQy.png" alt="SWAPRO Logo" className="h-16 mb-4" />
                <h1 className="text-2xl lg:text-3xl font-black tracking-tight">HALO SWAPRO</h1>
                <p className="mt-2 text-blue-200 font-medium text-sm lg:text-base">Sistem Pintar Karyawan</p>
                <p className="hidden lg:block mt-8 text-sm text-blue-300 leading-relaxed">Platform terintegrasi untuk manajemen sumber daya manusia yang lebih efisien dan modern.</p>
            </div>

            {/* Form Panel */}
            <div className="p-8 md:p-12">
                <div className="text-center lg:text-left mb-8">
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
                    <p className="text-sm lg:text-base text-slate-500 mt-2">{description}</p>
                </div>
                
                <PicLogin users={picUsers} onLogin={onPicLogin} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
