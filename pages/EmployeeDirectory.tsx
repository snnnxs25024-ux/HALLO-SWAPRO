import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Employee, Client, User, Payslip } from '../types';
import { EmployeeCard, EmployeeModal, Pagination } from './Database';

interface EmployeeDirectoryProps {
  currentUser: User;
  employees: Employee[];
  clients: Client[];
}

const ITEMS_PER_PAGE = 12;

const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({ currentUser, employees, clients }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [modalState, setModalState] = useState<{ isOpen: boolean, data: Partial<Employee> | null }>({ isOpen: false, data: null });
  const [currentPage, setCurrentPage] = useState(1);
  
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

  const filteredEmployees = useMemo(() => {
    // Show all employees except the current user
    return employees.filter(e => 
      e.id !== currentUser.id &&
      (e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterClient === 'all' || e.clientId === filterClient)
    ).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [employees, searchTerm, filterClient, currentUser.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterClient]);

  const paginatedEmployees = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);

  const handleOpenModal = (data: Partial<Employee>) => {
    setModalState({ isOpen: true, data });
  };
  
  const handleCloseModal = () => {
    setModalState({ isOpen: false, data: null });
  };

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Direktori Karyawan</h1>
      <p className="text-slate-500 mt-1">Cari dan lihat profil rekan kerja Anda.</p>

      <div className="my-8 bg-white p-4 rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari nama karyawan..." 
            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border-gray-200 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
            className="w-full md:w-auto px-4 py-2.5 bg-gray-50 border-gray-200 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            value={filterClient}
            onChange={e => setFilterClient(e.target.value)}
        >
            <option value="all">Semua Klien</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedEmployees.map(emp => (
          <EmployeeCard 
            key={emp.id} 
            employee={emp} 
            clientName={clientMap.get(emp.clientId) || 'N/A'}
            onView={() => handleOpenModal(emp)}
            isViewOnly={true}
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
        <div className="text-center py-20 col-span-full bg-white rounded-2xl border border-gray-200 shadow-lg shadow-slate-200/50">
            <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                <Search className="w-8 h-8 text-gray-400"/>
            </div>
          <p className="text-slate-500 font-semibold">Karyawan Tidak Ditemukan</p>
          <p className="text-sm text-slate-400 mt-1">Tidak ada rekan kerja yang cocok dengan pencarian Anda.</p>
        </div>
      )}

      {/* Fix: Added the required 'payslips' prop, passing an empty array as this component does not handle payslip data. */}
      <EmployeeModal 
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode="view"
        employeeData={modalState.data}
        clients={clients}
        payslips={[]}
        // Fix: Changed onSave to an async function to match the expected prop type `(employee: Employee) => Promise<void>`.
        onSave={async () => {}} // Not used in view-only
        onEdit={() => {}} // Not used in view-only
        onDelete={() => {}} // Not used in view-only
        currentUser={currentUser}
      />
    </div>
  );
};

export default EmployeeDirectory;