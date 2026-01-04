import React from 'react';
import { LogOut } from 'lucide-react';
import { User } from '../types';

interface EmployeeHeaderProps {
  user: User;
  onLogout: () => void;
}

const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src="https://i.imgur.com/P7t1bQy.png" alt="SIM Group Logo" className="h-8" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">HALO SWAPRO</h1>
        </div>
        <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-3">
             <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama)}&background=E0E7FF&color=4F46E5`} 
                alt={user.nama} 
                className="w-9 h-9 rounded-full"
              />
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800 truncate">{user.nama}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</p>
              </div>
           </div>
           <button
             onClick={onLogout}
             title="Logout"
             className="p-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200"
           >
             <LogOut className="w-5 h-5" />
           </button>
        </div>
      </div>
    </header>
  );
};

export default EmployeeHeader;
