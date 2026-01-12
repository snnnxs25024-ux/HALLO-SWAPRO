
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole, AppState, Client, Employee, EmployeeStatus, Message, Chat, Payslip, DocumentRequest, DocumentRequestStatus, AppSettings, EmployeeDataSubmission, SubmissionStatus } from './types';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import Database from './pages/Database';
import ChatPage from './pages/ChatPage';
import ClientManagement from './pages/ClientManagement';
import { generateChatReply } from './services/geminiService';
import PublicSearch from './pages/PublicSearch';
import PayslipPage from './pages/PayslipPage';
import ApprovalCenter from './pages/ApprovalCenter';
import { supabase } from './services/supabaseClient';
import { Loader } from 'lucide-react';
import { useNotifier } from './components/Notifier';
import AudioPlayer from './components/AudioPlayer';
import Dossier from './pages/Dossier';
import DataUpdate from './pages/DataUpdate'; // NEW
import { isObject, mergeWith } from './utils'; // NEW

// --- MOCK USER DATA (Authentication kept local) ---
const MOCK_PIC_USER: User[] = [
  { id: 'pic-1', nama: 'PIC SWAPRO', role: UserRole.PIC, avatar: 'https://i.imgur.com/P7t1bQy.png', password: 'admin123' },
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    clients: [],
    employees: [],
    employeeChats: {},
    payslips: [],
    documentRequests: [],
    appSettings: [], // NEW
    employeeSubmissions: [], // NEW
  });
  const [loading, setLoading] = useState(true);
  const notifier = useNotifier();

  // --- DATA FETCHING FROM SUPABASE ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [
          { data: clientsData, error: clientsError },
          { data: employeesData, error: employeesError },
          { data: payslipsData, error: payslipsError },
          { data: requestsData, error: requestsError },
          { data: settingsData, error: settingsError }, // NEW
          { data: submissionsData, error: submissionsError }, // NEW
        ] = await Promise.all([
          supabase.from('clients').select('*'),
          supabase.from('employees').select('*'),
          supabase.from('payslips').select('*'),
          supabase.from('document_requests').select('*'),
          supabase.from('app_settings').select('*'), // NEW
          supabase.from('employee_data_submissions').select('*'), // NEW
        ]);

        if (clientsError) throw clientsError;
        if (employeesError) throw employeesError;
        if (payslipsError) throw payslipsError;
        if (requestsError) throw requestsError;
        if (settingsError) throw settingsError; // NEW
        if (submissionsError) throw submissionsError; // NEW
        
        setState(prev => ({
          ...prev,
          clients: clientsData || [],
          employees: employeesData || [],
          payslips: payslipsData || [],
          documentRequests: requestsData || [],
          appSettings: settingsData || [], // NEW
          employeeSubmissions: submissionsData || [], // NEW
          employeeChats: {}, 
        }));
      } catch (error: any)
      {
        console.error("Error fetching initial data from Supabase:", error);
        const errorMessage = error?.message || 'Terjadi kesalahan tidak diketahui. Lihat konsol untuk detail.';
        notifier.addNotification(`Gagal memuat data awal: ${errorMessage}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);
  
  // --- AUTHENTICATION ---
  const handlePicLogin = (userId: string, pass: string): boolean => {
    const user = MOCK_PIC_USER.find(u => u.id === userId && u.password === pass);
    if (user) {
      setState(prev => ({ ...prev, currentUser: user }));
      notifier.addNotification(`Selamat datang, ${user.nama}!`, 'success');
      return true;
    }
    notifier.addNotification('ID Pengguna atau Password salah.', 'error');
    return false;
  };
  
  const logout = () => {
    notifier.addNotification('Anda telah berhasil logout.', 'info');
    setState(prev => ({ ...prev, currentUser: null }));
  };
  
  // --- CRUD OPERATIONS FOR EMPLOYEES ---
  const handleEmployeeDataChange = async (employeesToUpsert: Partial<Employee>[]) => {
    // This logic correctly merges partial data, so we can keep it.
    const employeeMap = new Map(state.employees.map(emp => [emp.id, emp]));
    const recordsToUpsert = employeesToUpsert.map(partialEmp => {
        if (!partialEmp.id) return null;
        const existingEmp = employeeMap.get(partialEmp.id) || {};
        // Fix: The custom mergeWith function only supports two source objects.
        // Chaining them ensures a correct deep merge without mutating the original object.
        const customizer = (objValue: any, srcValue: any) => {
          if (Array.isArray(objValue)) {
            return srcValue; // Replace arrays, don't merge them
          }
        };
        return mergeWith(mergeWith({}, existingEmp, customizer), partialEmp, customizer);
    }).filter((e): e is Employee => e !== null && !!e.id);

    if (recordsToUpsert.length === 0) {
        notifier.addNotification("Tidak ada data valid untuk diimpor.", "info"); return;
    }
    const { data: upsertedData, error } = await supabase.from('employees').upsert(recordsToUpsert).select();
    if (error) {
        notifier.addNotification(`Impor massal gagal: ${error.message}`, 'error'); return;
    }
    if (upsertedData) {
        const updatedEmployeeMap = new Map(state.employees.map(emp => [emp.id, emp]));
        upsertedData.forEach(dbEmp => updatedEmployeeMap.set(dbEmp.id, dbEmp as Employee));
        setState(prev => ({ ...prev, employees: Array.from(updatedEmployeeMap.values()) }));
        notifier.addNotification(`${recordsToUpsert.length} baris data karyawan berhasil diimpor/diperbarui.`, 'success');
    }
  };

  const addEmployee = async (employee: Employee) => {
    const { data, error } = await supabase.from('employees').insert([employee]).select();
    if (error) { notifier.addNotification(`Gagal menambahkan karyawan: ${error.message}`, 'error'); return; }
    if (data) {
      setState(prev => ({ ...prev, employees: [data[0], ...prev.employees]}));
      notifier.addNotification('Karyawan baru berhasil ditambahkan.', 'success');
    }
  };

  const updateEmployee = async (employeeUpdate: Partial<Employee>) => {
      if (!employeeUpdate.id) {
          notifier.addNotification("Pembaruan gagal: ID karyawan tidak valid.", "error");
          return;
      }
      const { id, ...updateData } = employeeUpdate;
      
      const existingEmployee = state.employees.find(e => e.id === id);
      if (!existingEmployee) {
          notifier.addNotification("Pembaruan gagal: Karyawan tidak ditemukan.", "error");
          return;
      }

      // Deep merge the update with existing data
      // Fix: The custom mergeWith function only supports two source objects.
      // Chaining them ensures a correct deep merge without mutating the original object.
      const customizer = (objValue: any, srcValue: any) => {
        if (Array.isArray(objValue)) {
          return srcValue; // Replace arrays, don't merge them
        }
      };
      const mergedData = mergeWith(mergeWith({}, existingEmployee, customizer), updateData, customizer);

      const { data, error } = await supabase.from('employees').update(mergedData).eq('id', id).select();

      if (error) { 
          notifier.addNotification(`Gagal memperbarui karyawan: ${error.message}`, 'error'); 
          return; 
      }
      if (data && data.length > 0) {
          setState(prev => ({ ...prev, employees: prev.employees.map(e => e.id === id ? data[0] : e) }));
          notifier.addNotification('Data karyawan berhasil diperbarui.', 'success');
      }
  };


  const deleteEmployee = async (employeeId: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', employeeId);
    if (error) { notifier.addNotification(`Gagal menghapus karyawan: ${error.message}`, 'error'); return; }
    setState(prev => ({...prev, employees: prev.employees.filter(e => e.id !== employeeId)}));
    notifier.addNotification('Karyawan berhasil dihapus.', 'success');
  };
  
  const resetEmployees = async (): Promise<boolean> => {
    const { error } = await supabase.from('employees').delete().neq('id', 'placeholder');
    if (error) { notifier.addNotification(`Gagal mereset database: ${error.message}`, 'error'); return false; }
    setState(prev => ({ ...prev, employees: [] }));
    notifier.addNotification('Seluruh data karyawan berhasil direset.', 'success');
    return true;
  };

  // --- CRUD FOR CLIENTS ---
  const addClient = async (client: Client) => {
    const { data, error } = await supabase.from('clients').insert([client]).select();
    if (error) { notifier.addNotification(`Gagal menambahkan klien: ${error.message}`, 'error'); return; }
    if (data) {
        setState(prev => ({ ...prev, clients: [data[0], ...prev.clients] }));
        notifier.addNotification('Klien baru berhasil ditambahkan.', 'success');
    }
  };

  const updateClient = async (client: Client) => {
    const { data, error } = await supabase.from('clients').update(client).eq('id', client.id).select();
    if (error) { notifier.addNotification(`Gagal memperbarui klien: ${error.message}`, 'error'); return; }
    if (data) {
        setState(prev => ({ ...prev, clients: prev.clients.map(c => c.id === client.id ? data[0] : c) }));
        notifier.addNotification('Data klien berhasil diperbarui.', 'success');
    }
  };
    
  const deleteClient = async (clientId: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (error) { notifier.addNotification(`Gagal menghapus klien: ${error.message}`, 'error'); return; }
    setState(prev => ({ ...prev, clients: prev.clients.filter(c => c.id !== clientId) }));
    notifier.addNotification('Klien berhasil dihapus.', 'success');
  };

  // --- OPERATIONS FOR PAYSLIPS ---
  const handlePayslipsChange = async (newPayslips: Payslip[]) => {
    const { error } = await supabase.from('payslips').upsert(newPayslips, { onConflict: 'id' });
    if (error) { notifier.addNotification(`Gagal menyimpan slip gaji: ${error.message}`, 'error'); return false; }
    const payslipMap = new Map(state.payslips.map(p => [p.id, p]));
    newPayslips.forEach(p => payslipMap.set(p.id, p));
    setState(prev => ({ ...prev, payslips: Array.from(payslipMap.values()) }));
    notifier.addNotification(`${newPayslips.length} slip gaji berhasil diproses.`, 'success');
    return true;
  };
  
  const deletePayslip = async (payslipId: string) => {
    const payslipToDelete = state.payslips.find(p => p.id === payslipId);
    if (!payslipToDelete) return false;
    const filePath = `payslips/${payslipToDelete.period}/${payslipToDelete.employeeId}.pdf`;
    const { error: storageError } = await supabase.storage.from('swapro_files').remove([filePath]);
    if (storageError && storageError.message !== 'The resource was not found') {
        notifier.addNotification(`Gagal menghapus file dari storage: ${storageError.message}`, 'error');
        return false;
    }
    const { error } = await supabase.from('payslips').delete().eq('id', payslipId);
    if (error) { notifier.addNotification(`Gagal menghapus slip gaji: ${error.message}`, 'error'); return false; }
    setState(prev => ({ ...prev, payslips: prev.payslips.filter(p => p.id !== payslipId) }));
    notifier.addNotification('Slip gaji berhasil dihapus.', 'success');
    return true;
  };

  // --- DOCUMENT REQUEST HANDLERS ---
  const handleCreateDocumentRequest = async (request: Omit<DocumentRequest, 'id' | 'requestTimestamp' | 'status'>) => {
    const newRequest = {
      ...request,
      status: DocumentRequestStatus.PENDING,
      requestTimestamp: new Date().toISOString()
    };
    const { data, error } = await supabase.from('document_requests').insert(newRequest).select();
    if (error) {
      notifier.addNotification(`Gagal mengirim permintaan: ${error.message}`, 'error');
      return;
    }
    if (data) {
      setState(prev => ({ ...prev, documentRequests: [...prev.documentRequests, data[0]]}));
      notifier.addNotification('Permintaan dokumen berhasil dikirim.', 'success');
    }
  };

  const handleRespondToRequest = async (
    requestId: string,
    approved: boolean,
    durationMinutes?: number,
    rejectionReason?: string
  ) => {
    if (!state.currentUser) return;
    
    const updatePayload: Partial<DocumentRequest> = {
      status: approved ? DocumentRequestStatus.APPROVED : DocumentRequestStatus.REJECTED,
      responseTimestamp: new Date().toISOString(),
      picId: state.currentUser.id
    };

    if (approved && durationMinutes) {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);
      updatePayload.accessExpiresAt = expiresAt.toISOString();
    } else if (!approved) {
      updatePayload.rejectionReason = rejectionReason;
    }

    const { data, error } = await supabase.from('document_requests').update(updatePayload).eq('id', requestId).select();
    
    if (error) {
       notifier.addNotification(`Gagal merespon permintaan: ${error.message}`, 'error');
       return;
    }
    if (data) {
       setState(prev => ({
         ...prev,
         documentRequests: prev.documentRequests.map(req => req.id === requestId ? data[0] : req)
       }));
       notifier.addNotification(`Permintaan berhasil direspon.`, 'success');
    }
  };

  // --- DATA UPDATE MODULE HANDLERS (NEW) ---
  const handleUpdateSettings = async (settings: AppSettings) => {
      // FIX: Switched from direct upsert to a hypothetical secure RPC call ('update_app_setting').
      // This is the standard pattern to perform operations requiring elevated privileges
      // from the client-side, bypassing Row-Level Security policies that block
      // anonymous writes to sensitive tables like 'app_settings'.
      const { error } = await supabase.rpc('update_app_setting', {
        key_input: settings.key,
        value_input: settings.value
      });

      if (error) {
          notifier.addNotification(`Gagal menyimpan pengaturan: ${error.message}`, 'error');
          return;
      }
      
      // Optimistically update the local state, as RPC calls don't return the updated row by default.
      // This provides a faster UI response and handles both new and existing settings correctly.
      setState(prev => {
          const newSettingsMap = new Map(prev.appSettings.map(s => [s.key, s]));
          newSettingsMap.set(settings.key, settings);
          return { ...prev, appSettings: Array.from(newSettingsMap.values()) };
      });
      notifier.addNotification('Pengaturan berhasil disimpan.', 'success');
  };

  const handleCreateSubmission = async (submission: Omit<EmployeeDataSubmission, 'id' | 'submitted_at' | 'status'>) => {
      const newSubmission = {
          ...submission,
          status: SubmissionStatus.PENDING_REVIEW,
          submitted_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from('employee_data_submissions').insert(newSubmission).select();
      if (error) {
          notifier.addNotification(`Gagal mengirim data: ${error.message}`, 'error');
          throw error;
      }
      if (data) {
          setState(prev => ({...prev, employeeSubmissions: [...prev.employeeSubmissions, data[0]]}));
          notifier.addNotification('Data Anda berhasil dikirim untuk direview.', 'success');
      }
  };

  const handleUpdateSubmissionStatus = async (submissionId: string, status: SubmissionStatus, notes?: string) => {
      if (!state.currentUser) return;
      const updatePayload = {
          status: status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: state.currentUser.id,
          review_notes: notes,
      };
      const { data, error } = await supabase.from('employee_data_submissions').update(updatePayload).eq('id', submissionId).select();
      if (error) {
          notifier.addNotification(`Gagal memperbarui status: ${error.message}`, 'error');
          throw error;
      }
      if (data) {
          setState(prev => ({
              ...prev,
              employeeSubmissions: prev.employeeSubmissions.map(s => s.id === submissionId ? data[0] : s)
          }));
          notifier.addNotification('Status submisi berhasil diperbarui.', 'success');
      }
  };


  // --- CHAT HANDLER ---
  const handleEmployeeChatUpdate = (chats: Record<string, Chat>) => {
    setState(prev => ({ ...prev, employeeChats: chats }));
  };

  const generateEmployeeReply = async (employeeId: string, currentChat: Chat) => {
    const employee = state.employees.find(e => e.id === employeeId);
    if (!employee || !state.currentUser) return;
    setState(prevState => ({ ...prevState, employeeChats: { ...prevState.employeeChats, [employeeId]: { ...currentChat, isTyping: true } }}));
    const aiResponseText = await generateChatReply(currentChat.messages, employee.fullName, state.currentUser.nama);
    const newEmployeeMessage: Message = { id: `msg-${Date.now()}`, senderId: employeeId, text: aiResponseText, timestamp: new Date().toISOString() };
    setState(prevState => {
      const latestMessages = prevState.employeeChats[employeeId]?.messages || currentChat.messages;
      return { ...prevState, employeeChats: { ...prevState.employeeChats, [employeeId]: { messages: [...latestMessages, newEmployeeMessage], isTyping: false } }};
    });
  };
  
  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="flex flex-col items-center">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
                    <img 
                        src="https://i.imgur.com/Lf2IC1Z.png" 
                        alt="HALO SWAPRO" 
                        className="w-24 h-24 relative z-10 object-contain animate-bounce [animation-duration:3s]" 
                    />
                </div>
                <div className="flex items-center space-x-3 bg-white px-6 py-3.5 rounded-2xl shadow-xl border border-slate-100 animate-fadeIn">
                    <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                    <p className="font-black text-slate-700 tracking-tight text-sm uppercase tracking-widest">Memuat data dari server...</p>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
  }

  // --- ROUTING LOGIC ---
  return (
    <>
      <AudioPlayer />
      <HashRouter>
        {state.currentUser ? (
          <div className="flex h-screen bg-[var(--background)] overflow-hidden">
            <Sidebar user={state.currentUser} onLogout={logout} pendingRequestCount={state.documentRequests.filter(r => r.status === 'PENDING').length} />
            <main className="flex-1 overflow-y-auto pb-24 min-w-0">
              <Routes>
                <Route path="/" element={<Dashboard state={state} />} />
                <Route path="/database" element={
                  <Database employees={state.employees} clients={state.clients} payslips={state.payslips} onDataChange={handleEmployeeDataChange} onAddEmployee={addEmployee} onUpdateEmployee={updateEmployee} onDeleteEmployee={deleteEmployee} onResetEmployees={resetEmployees} currentUser={state.currentUser} />
                } />
                <Route path="/dossier" element={
                  <Dossier employees={state.employees} clients={state.clients} currentUser={state.currentUser} onUpdateEmployee={updateEmployee} />
                } />
                 <Route path="/data-update" element={
                  <DataUpdate 
                    settings={state.appSettings} 
                    submissions={state.employeeSubmissions} 
                    employees={state.employees}
                    clients={state.clients}
                    currentUser={state.currentUser}
                    onUpdateSettings={handleUpdateSettings}
                    onUpdateSubmissionStatus={handleUpdateSubmissionStatus}
                    onUpdateEmployee={updateEmployee}
                    onDeleteEmployee={deleteEmployee}
                  />
                } />
                <Route path="/clients" element={
                  <ClientManagement clients={state.clients} employees={state.employees} onAddClient={addClient} onUpdateClient={updateClient} onDeleteClient={deleteClient} />
                } />
                <Route path="/payslips" element={
                  <PayslipPage payslips={state.payslips} employees={state.employees} clients={state.clients} onPayslipsChange={handlePayslipsChange} onDeletePayslip={deletePayslip} />
                } />
                 <Route path="/approval-center" element={
                  <ApprovalCenter allRequests={state.documentRequests} employees={state.employees} onRespondToRequest={handleRespondToRequest} />
                } />
                <Route path="/chat" element={
                  <ChatPage employees={state.employees} currentUser={state.currentUser} chats={state.employeeChats} onUpdate={handleEmployeeChatUpdate} onGenerateReply={generateEmployeeReply} />
                } />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        ) : (
          <Routes>
            <Route path="/admin" element={<Login onPicLogin={handlePicLogin} />} />
            <Route path="/search" element={
              <PublicSearch 
                employees={state.employees} 
                clients={state.clients}
                payslips={state.payslips}
                documentRequests={state.documentRequests}
                onRequestDocument={handleCreateDocumentRequest}
                onUpdateEmployee={updateEmployee}
                appSettings={state.appSettings}
                employeeSubmissions={state.employeeSubmissions}
                onCreateSubmission={handleCreateSubmission}
              />
            } />
            <Route path="*" element={<Landing />} />
          </Routes>
        )}
      </HashRouter>
    </>
  );
};

export default App;
