
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole, AppState, Client, Employee, Message, Chat, Payslip, DocumentRequest, DocumentRequestStatus, AppSettings, EmployeeDataSubmission, SubmissionStatus } from './types';
import { supabase } from './services/supabaseClient';
import { Loader } from 'lucide-react';
import { useNotifier } from './components/Notifier';
import AudioPlayer from './components/AudioPlayer';
import { mergeWith } from './utils';

// --- LAZY LOADING PAGES ---
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Sidebar = lazy(() => import('./components/Sidebar'));
const Database = lazy(() => import('./pages/Database'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const ClientManagement = lazy(() => import('./pages/ClientManagement'));
const PublicSearch = lazy(() => import('./pages/PublicSearch'));
const PayslipPage = lazy(() => import('./pages/PayslipPage'));
const ApprovalCenter = lazy(() => import('./pages/ApprovalCenter'));
const Dossier = lazy(() => import('./pages/Dossier'));
const DataUpdate = lazy(() => import('./pages/DataUpdate'));

// Fallback component while loading chunks
const PageLoader = () => (
    <div className="flex items-center justify-center h-full w-full bg-slate-50/50 backdrop-blur-sm">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
);

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
    appSettings: [],
    employeeSubmissions: [],
  });
  const [loading, setLoading] = useState(true);
  const notifier = useNotifier();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [
          { data: clientsData, error: clientsError },
          { data: employeesData, error: employeesError },
          { data: payslipsData, error: payslipsError },
          { data: requestsData, error: requestsError },
          { data: settingsData, error: settingsError },
          { data: submissionsData, error: submissionsError },
        ] = await Promise.all([
          supabase.from('clients').select('*'),
          supabase.from('employees').select('*'),
          supabase.from('payslips').select('*'),
          supabase.from('document_requests').select('*'),
          supabase.from('app_settings').select('*'),
          supabase.from('employee_data_submissions').select('*'),
        ]);

        if (clientsError) throw clientsError;
        if (employeesError) throw employeesError;
        if (payslipsError) throw payslipsError;
        if (requestsError) throw requestsError;
        if (settingsError) throw settingsError;
        if (submissionsError) throw submissionsError;
        
        setState(prev => ({
          ...prev,
          clients: clientsData || [],
          employees: employeesData || [],
          payslips: payslipsData || [],
          documentRequests: requestsData || [],
          appSettings: settingsData || [],
          employeeSubmissions: submissionsData || [],
          employeeChats: {}, 
        }));
      } catch (error: any) {
        console.error("Error fetching initial data from Supabase:", error);
        notifier.addNotification(`Gagal memuat data: ${error?.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);
  
  // --- REALTIME SUBSCRIPTION FOR DATA UPDATE ---
  useEffect(() => {
    const channel = supabase
      .channel('employee_data_submissions_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employee_data_submissions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as EmployeeDataSubmission;
            if (newRecord && newRecord.employee_id) {
              setState(prev => ({
                ...prev,
                employeeSubmissions: [...prev.employeeSubmissions, newRecord]
              }));
              notifier.addNotification(`Ada pengajuan data baru dari ${newRecord.employee_id}`, 'info');
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as EmployeeDataSubmission;
            if (updatedRecord && updatedRecord.id) {
              setState(prev => ({
                ...prev,
                employeeSubmissions: prev.employeeSubmissions.map(s =>
                  s.id === updatedRecord.id ? updatedRecord : s
                )
              }));
            }
          } else if (payload.eventType === 'DELETE') {
            const oldRecord = payload.old as Partial<EmployeeDataSubmission>;
            if (oldRecord && oldRecord.id) {
              setState(prev => ({
                ...prev,
                employeeSubmissions: prev.employeeSubmissions.filter(s => s.id !== oldRecord.id)
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [notifier]);
  
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
  
  const handleEmployeeDataChange = async (employeesToUpsert: Partial<Employee>[]) => {
    const employeeMap = new Map(state.employees.map(emp => [emp.id, emp]));
    const recordsToUpsert = employeesToUpsert.map(partialEmp => {
        if (!partialEmp.id) return null;
        const existingEmp = employeeMap.get(partialEmp.id) || {};
        const customizer = (objValue: any, srcValue: any) => {
          if (Array.isArray(objValue)) return srcValue;
        };
        return mergeWith(mergeWith({}, existingEmp, customizer), partialEmp, customizer);
    }).filter((e): e is Employee => e !== null && !!e.id);

    if (recordsToUpsert.length === 0) return;
    const { data: upsertedData, error } = await supabase.from('employees').upsert(recordsToUpsert).select();
    if (error) { notifier.addNotification(`Impor gagal: ${error.message}`, 'error'); return; }
    if (upsertedData) {
        const updatedMap = new Map(state.employees.map(emp => [emp.id, emp]));
        upsertedData.forEach(dbEmp => updatedMap.set(dbEmp.id, dbEmp as Employee));
        setState(prev => ({ ...prev, employees: Array.from(updatedMap.values()) }));
        notifier.addNotification(`${recordsToUpsert.length} data berhasil diimpor.`, 'success');
    }
  };

  const addEmployee = async (employee: Employee) => {
    const { data, error } = await supabase.from('employees').insert([employee]).select();
    if (error) { notifier.addNotification(`Gagal tambah: ${error.message}`, 'error'); return; }
    if (data && data.length > 0) {
      setState(prev => ({ ...prev, employees: [data[0], ...prev.employees]}));
      notifier.addNotification('Karyawan berhasil ditambahkan.', 'success');
    }
  };

  const updateEmployee = async (employeeUpdate: Partial<Employee>) => {
      if (!employeeUpdate.id) return;
      const existingEmployee = state.employees.find(e => e.id === employeeUpdate.id);
      if (!existingEmployee) return;

      const customizer = (objValue: any, srcValue: any) => {
        if (Array.isArray(srcValue)) return srcValue;
        return undefined;
      };
      
      const deepClonedExisting = JSON.parse(JSON.stringify(existingEmployee));
      const mergedData = mergeWith(deepClonedExisting, employeeUpdate, customizer);

      const { data, error } = await supabase.from('employees').update(mergedData).eq('id', employeeUpdate.id).select();
      if (error) { 
          notifier.addNotification(`Gagal update: ${error.message}`, 'error'); 
          throw error;
      }
      if (data && data.length > 0) {
          setState(prev => ({ ...prev, employees: prev.employees.map(e => e.id === employeeUpdate.id ? data[0] : e) }));
          notifier.addNotification('Data berhasil diperbarui.', 'success');
      }
  };

  const deleteEmployee = async (employeeId: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', employeeId);
    if (error) { notifier.addNotification(`Gagal hapus: ${error.message}`, 'error'); return; }
    setState(prev => ({...prev, employees: prev.employees.filter(e => e.id !== employeeId)}));
    notifier.addNotification('Karyawan berhasil dihapus.', 'success');
  };
  
  const resetEmployees = async (): Promise<boolean> => {
    const { error } = await supabase.from('employees').delete().neq('id', 'placeholder');
    if (error) return false;
    setState(prev => ({ ...prev, employees: [] }));
    return true;
  };

  const addClient = async (client: Client) => {
    const { data, error } = await supabase.from('clients').insert([client]).select();
    if (error) return;
    if (data && data.length > 0) setState(prev => ({ ...prev, clients: [data[0], ...prev.clients] }));
  };

  const updateClient = async (client: Client) => {
    const { data, error } = await supabase.from('clients').update(client).eq('id', client.id).select();
    if (error) return;
    if (data && data.length > 0) setState(prev => ({ ...prev, clients: prev.clients.map(c => c.id === client.id ? data[0] : c) }));
  };
    
  const deleteClient = async (clientId: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (!error) setState(prev => ({ ...prev, clients: prev.clients.filter(c => c.id !== clientId) }));
  };

  const handlePayslipsChange = async (newPayslips: Payslip[]) => {
    const { error } = await supabase.from('payslips').upsert(newPayslips, { onConflict: 'id' });
    if (error) return false;
    const payslipMap = new Map(state.payslips.map(p => [p.id, p]));
    newPayslips.forEach(p => payslipMap.set(p.id, p));
    setState(prev => ({ ...prev, payslips: Array.from(payslipMap.values()) }));
    return true;
  };
  
  const deletePayslip = async (payslipId: string) => {
    const { error } = await supabase.from('payslips').delete().eq('id', payslipId);
    if (error) return false;
    setState(prev => ({ ...prev, payslips: prev.payslips.filter(p => p.id !== payslipId) }));
    return true;
  };

  const handleCreateDocumentRequest = async (request: Omit<DocumentRequest, 'id' | 'requestTimestamp' | 'status'>) => {
    const newRequest = { ...request, status: DocumentRequestStatus.PENDING, requestTimestamp: new Date().toISOString() };
    const { data, error } = await supabase.from('document_requests').insert(newRequest).select();
    if (data && data.length > 0) setState(prev => ({ ...prev, documentRequests: [...prev.documentRequests, data[0]]}));
  };

  const handleRespondToRequest = async (requestId: string, approved: boolean, durationMinutes?: number, rejectionReason?: string) => {
    if (!state.currentUser) return;
    const updatePayload: Partial<DocumentRequest> = { status: approved ? DocumentRequestStatus.APPROVED : DocumentRequestStatus.REJECTED, responseTimestamp: new Date().toISOString(), picId: state.currentUser.id };
    if (approved && durationMinutes) {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);
      updatePayload.accessExpiresAt = expiresAt.toISOString();
    } else if (!approved) updatePayload.rejectionReason = rejectionReason;
    const { data } = await supabase.from('document_requests').update(updatePayload).eq('id', requestId).select();
    if (data && data.length > 0) setState(prev => ({ ...prev, documentRequests: prev.documentRequests.map(req => req.id === requestId ? data[0] : req) }));
  };

  const handleUpdateSettings = async (settings: AppSettings) => {
      const { error } = await supabase.rpc('update_app_setting', { key_input: settings.key, value_input: settings.value });
      if (!error) setState(prev => {
          const map = new Map(prev.appSettings.map(s => [s.key, s]));
          map.set(settings.key, settings);
          return { ...prev, appSettings: Array.from(map.values()) };
      });
  };

  const handleCreateSubmission = async (submission: Omit<EmployeeDataSubmission, 'id' | 'submitted_at' | 'status'>) => {
      const newSubmission = { ...submission, status: SubmissionStatus.PENDING_REVIEW, submitted_at: new Date().toISOString() };
      const { data } = await supabase.from('employee_data_submissions').insert(newSubmission).select();
      if (data && data.length > 0) setState(prev => ({...prev, employeeSubmissions: [...prev.employeeSubmissions, data[0]]}));
  };

  const handleUpdateSubmissionStatus = async (submissionId: string, status: SubmissionStatus, notes?: string) => {
      if (!state.currentUser) return;
      const updatePayload = { status: status, reviewed_at: new Date().toISOString(), reviewed_by: state.currentUser.id, review_notes: notes };
      const { data, error } = await supabase.from('employee_data_submissions').update(updatePayload).eq('id', submissionId).select();
      
      if (error) {
        notifier.addNotification(`Gagal memperbarui status: ${error.message}`, 'error');
        return;
      }

      if (data && data.length > 0 && data[0]) {
        setState(prev => ({ ...prev, employeeSubmissions: prev.employeeSubmissions.map(s => s.id === submissionId ? data[0] : s) }));
      }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="flex flex-col items-center space-y-4">
                <Loader className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="font-semibold text-slate-600">Memuat Sistem...</p>
            </div>
        </div>
    );
  }

  return (
    <>
      <AudioPlayer />
      <HashRouter>
        <Suspense fallback={<PageLoader />}>
          {state.currentUser ? (
            <div className="flex h-screen bg-[var(--background)] overflow-hidden">
              <Sidebar user={state.currentUser} onLogout={logout} pendingRequestCount={state.documentRequests.filter(r => r.status === 'PENDING').length} />
              <main className="flex-1 overflow-y-auto pb-24 min-w-0">
                <Routes>
                  <Route path="/" element={<Dashboard state={state} />} />
                  <Route path="/database" element={<Database employees={state.employees} clients={state.clients} payslips={state.payslips} onDataChange={handleEmployeeDataChange} onAddEmployee={addEmployee} onUpdateEmployee={updateEmployee} onDeleteEmployee={deleteEmployee} onResetEmployees={resetEmployees} currentUser={state.currentUser} />} />
                  <Route path="/dossier" element={<Dossier employees={state.employees} clients={state.clients} currentUser={state.currentUser} onUpdateEmployee={updateEmployee} />} />
                  <Route path="/data-update" element={<DataUpdate settings={state.appSettings} submissions={state.employeeSubmissions} employees={state.employees} clients={state.clients} currentUser={state.currentUser} onUpdateSettings={handleUpdateSettings} onUpdateSubmissionStatus={handleUpdateSubmissionStatus} onUpdateEmployee={updateEmployee} onDeleteEmployee={deleteEmployee} />} />
                  <Route path="/clients" element={<ClientManagement clients={state.clients} employees={state.employees} onAddClient={addClient} onUpdateClient={updateClient} onDeleteClient={deleteClient} />} />
                  <Route path="/payslips" element={<PayslipPage payslips={state.payslips} employees={state.employees} clients={state.clients} onPayslipsChange={handlePayslipsChange} onDeletePayslip={deletePayslip} />} />
                  <Route path="/approval-center" element={<ApprovalCenter allRequests={state.documentRequests} employees={state.employees} onRespondToRequest={handleRespondToRequest} />} />
                  <Route path="/chat" element={<ChatPage employees={state.employees} currentUser={state.currentUser} chats={state.employeeChats} onUpdate={(chats) => setState(p => ({...p, employeeChats: chats}))} onGenerateReply={async () => {}} />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </main>
            </div>
          ) : (
            <Routes>
              <Route path="/admin" element={<Login onPicLogin={handlePicLogin} />} />
              <Route path="/search" element={<PublicSearch employees={state.employees} clients={state.clients} payslips={state.payslips} documentRequests={state.documentRequests} onRequestDocument={handleCreateDocumentRequest} onUpdateEmployee={updateEmployee} appSettings={state.appSettings} employeeSubmissions={state.employeeSubmissions} onCreateSubmission={handleCreateSubmission} />} />
              <Route path="*" element={<Landing />} />
            </Routes>
          )}
        </Suspense>
      </HashRouter>
    </>
  );
};

export default App;
