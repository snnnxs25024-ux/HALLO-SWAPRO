import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  LogOut, 
  MessagesSquare,
  Building2,
  Receipt, // Icon baru
  Menu,
  X
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/database', icon: <Database className="w-5 h-5" />, label: 'Data Base' },
    { to: '/clients', icon: <Building2 className="w-5 h-5" />, label: 'Kelola Klien' },
    { to: '/payslips', icon: <Receipt className="w-5 h-5" />, label: 'Slip Gaji' },
    { to: '/chat', icon: <MessagesSquare className="w-5 h-5" />, label: 'Pesan' },
  ];

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <img src="https://i.imgur.com/P7t1bQy.png" alt="SIM Group Logo" className="h-7" />
          <span className="font-bold text-slate-900 tracking-tight">HALO SWAPRO</span>
        </div>
        <button onClick={() => setIsOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white text-slate-800 flex flex-col shrink-0 border-r border-slate-200 z-[70] transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <img src="https://i.imgur.com/P7t1bQy.png" alt="SIM Group Logo" className="h-8" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">HALO SWAPRO</h1>
          </div>
          <button onClick={closeSidebar} className="md:hidden p-2 text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 relative group text-base ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-50 to-white text-blue-600 font-semibold shadow-sm border border-blue-100' 
                    : 'text-slate-500 hover:bg-gray-100 hover:text-slate-900'
                }`
              }
            >
               {({isActive}) => (
                  <>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-blue-600 rounded-r-full"></div>}
                    {link.icon}
                    <span className="font-medium">{link.label}</span>
                  </>
               )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center space-x-3">
            <img 
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama)}&background=E0E7FF&color=4F46E5`} 
              alt={user.nama} 
              className="w-10 h-10 rounded-lg object-contain p-1 bg-white shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-slate-800 truncate">{user.nama}</p>
              <p className="text-sm text-slate-500 capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              closeSidebar();
              onLogout();
            }}
            className="mt-2 flex items-center space-x-3 w-full px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-base">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;