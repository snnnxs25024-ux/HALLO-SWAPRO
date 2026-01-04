import React, { useMemo, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Building, 
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Cake,
  GraduationCap,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { AppState, Employee, EmployeeStatus } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface DashboardProps {
  state: AppState;
}

const ChartCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">{icon}</div>
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        <div className="h-[250px]">{children}</div>
    </div>
);

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold">{`${payload[0].name}`}</p>
          <p className="text-sm text-slate-600">{`Jumlah : ${payload[0].value}`}</p>
          <p className="text-sm text-slate-600">{`Persentase : ${(payload[0].percent * 100).toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
};

const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const { employees, clients } = state;
  const [selectedClient, setSelectedClient] = useState('overall');
  const [timeFilter, setTimeFilter] = useState<'1m' | '6m' | '1y'>('6m');

  const activeEmployees = useMemo(() => employees.filter(e => e.status === EmployeeStatus.ACTIVE), [employees]);

  const statCardData = useMemo(() => {
    const now = new Date();
    const startDate = new Date();

    if (timeFilter === '1m') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeFilter === '6m') {
      startDate.setMonth(now.getMonth() - 6);
    } else { // '1y'
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const newHires = employees.filter(e => new Date(e.joinDate) >= startDate && new Date(e.joinDate) <= now).length;
    const resignations = employees.filter(e => e.resignDate && new Date(e.resignDate) >= startDate && new Date(e.resignDate) <= now).length;

    return { newHires, resignations };
  }, [employees, timeFilter]);

  const monthlyTrendChartData = useMemo(() => {
    const data: { month: string; newHire: number; resign: number; sphk: number }[] = [];
    const relevantEmployees = selectedClient === 'overall'
        ? employees
        : employees.filter(e => e.clientId === selectedClient);

    const now = new Date();

    if (timeFilter === '1m') {
        for (let i = 3; i >= 0; i--) {
            const weekEnd = new Date(now);
            weekEnd.setDate(now.getDate() - (i * 7));
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - ((i + 1) * 7));

            const label = `W-${4-i}`;

            const newHires = relevantEmployees.filter(e => {
                const joinDate = new Date(e.joinDate);
                return joinDate >= weekStart && joinDate < weekEnd;
            }).length;
            const resigns = relevantEmployees.filter(e => e.resignDate && e.status === EmployeeStatus.RESIGNED && new Date(e.resignDate) >= weekStart && new Date(e.resignDate) < weekEnd).length;
            const terminated = relevantEmployees.filter(e => e.resignDate && e.status === EmployeeStatus.TERMINATED && new Date(e.resignDate) >= weekStart && new Date(e.resignDate) < weekEnd).length;
            
            data.push({ month: label, newHire: newHires, resign: resigns, sphk: terminated });
        }
    } else {
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const monthCount = timeFilter === '6m' ? 6 : 12;

        for (let i = monthCount - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(1);
            d.setMonth(now.getMonth() - i);
            
            const monthKey = months[d.getMonth()];
            const year = d.getFullYear();

            const startOfMonth = new Date(year, d.getMonth(), 1);
            const endOfMonth = new Date(year, d.getMonth() + 1, 0);

            const newHires = relevantEmployees.filter(e => new Date(e.joinDate) >= startOfMonth && new Date(e.joinDate) <= endOfMonth).length;
            const resigns = relevantEmployees.filter(e => e.resignDate && e.status === EmployeeStatus.RESIGNED && new Date(e.resignDate) >= startOfMonth && new Date(e.resignDate) <= endOfMonth).length;
            const terminated = relevantEmployees.filter(e => e.resignDate && e.status === EmployeeStatus.TERMINATED && new Date(e.resignDate) >= startOfMonth && new Date(e.resignDate) <= endOfMonth).length;
            
            data.push({ month: monthKey, newHire: newHires, resign: resigns, sphk: terminated });
        }
    }
    return data;
  }, [employees, selectedClient, timeFilter]);

  const demographicData = useMemo(() => {
    // Gender Data
    const gender = { 'Laki-laki': 0, 'Perempuan': 0 };
    activeEmployees.forEach(e => gender[e.gender]++);
    const genderData = Object.entries(gender).map(([name, value]) => ({ name, value }));
    const GENDER_COLORS = ['#3b82f6', '#ec4899'];

    // Age Data
    const ageGroups = { '< 25': 0, '25 - 35': 0, '36 - 45': 0, '> 45': 0, 'N/A': 0 };
    activeEmployees.forEach(e => {
        if (!e.birthDate) {
            ageGroups['N/A']++;
            return;
        }
        const age = Math.floor((new Date().getTime() - new Date(e.birthDate).getTime()) / 31557600000);
        if (age < 25) ageGroups['< 25']++;
        else if (age <= 35) ageGroups['25 - 35']++;
        else if (age <= 45) ageGroups['36 - 45']++;
        else ageGroups['> 45']++;
    });
    const ageData = Object.entries(ageGroups).map(([name, value]) => ({ name, value }));
    const AGE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

    // Education Data
    const educationLevels: Record<string, number> = { 'SMA/SMK': 0, D3: 0, S1: 0, S2: 0, S3: 0, Lainnya: 0, 'Belum Diisi': 0};
    activeEmployees.forEach(e => {
        if (e.lastEducation) {
            educationLevels[e.lastEducation]++;
        } else {
            educationLevels['Belum Diisi']++;
        }
    });
    const educationData = Object.entries(educationLevels)
        .map(([name, value]) => ({ name, Jumlah: value }))
        .filter(item => item.Jumlah > 0);

    return { genderData, GENDER_COLORS, ageData, AGE_COLORS, educationData };

  }, [activeEmployees]);

  const recentActivities = useMemo(() => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newHires = employees
        .filter(e => new Date(e.joinDate) >= thirtyDaysAgo)
        .map(e => ({...e, type: 'join'} as const));
      
      const resigns = employees
        .filter(e => e.resignDate && new Date(e.resignDate) >= thirtyDaysAgo)
        .map(e => ({...e, type: 'resign'} as const));

      return [...newHires, ...resigns]
        .sort((a,b) => {
            const dateA = new Date(a.type === 'join' ? a.joinDate : a.resignDate!);
            const dateB = new Date(b.type === 'join' ? b.joinDate : b.resignDate!);
            return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);

  }, [employees]);
  
  const timeFilterOptions = [
    { value: '1m', label: '1 Bulan' },
    { value: '6m', label: '6 Bulan' },
    { value: '1y', label: '1 Tahun' },
  ] as const;

  const timeFilterLabel = timeFilterOptions.find(opt => opt.value === timeFilter)?.label || '6 Bulan';

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Utama
          </h1>
          <p className="text-lg text-slate-500 mt-1">Status operasional SDM hari ini.</p>
        </div>
         <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg self-start md:self-center">
          {timeFilterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setTimeFilter(opt.value)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                timeFilter === opt.value
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard icon={<Users />} label="Karyawan Aktif" value={activeEmployees.length} color="indigo" />
        <StatCard icon={<UserPlus />} label={`New Hires (${timeFilterLabel})`} value={statCardData.newHires} color="emerald" />
        <StatCard icon={<UserMinus />} label={`Resigned (${timeFilterLabel})`} value={statCardData.resignations} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
        <div className="lg:col-span-3 bg-white p-4 md:p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Tren Karyawan ({timeFilterLabel})</h3>
              </div>
              <select 
                value={selectedClient} 
                onChange={e => setSelectedClient(e.target.value)}
                className="w-full sm:w-auto text-base font-semibold px-4 py-2.5 bg-slate-50 border-slate-200 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                  <option value="overall">Overall</option>
                  {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
              </select>
           </div>
           <div className="h-[280px] md:h-[350px] min-w-0">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={monthlyTrendChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                 <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 14}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 14}} allowDecimals={false} />
                 <Tooltip 
                    cursor={{fill: '#f9fafb'}} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                    itemStyle={{ fontSize: '14px' }}
                 />
                 <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize: "14px", paddingTop: "20px"}} />
                 <Line type="monotone" name="New Hire" dataKey="newHire" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                 <Line type="monotone" name="Resign" dataKey="resign" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                 <Line type="monotone" name="SPHK" dataKey="sphk" stroke="#f43f5e" strokeWidth={3} dot={{ r: 5, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
        
        <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">
            <div className="bg-white p-5 md:p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Sebaran Klien</h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {clients.sort((a, b) => a.name.localeCompare(b.name)).map(client => {
                        const count = employees.filter(e => e.clientId === client.id && e.status === EmployeeStatus.ACTIVE).length;
                        return (
                            <div key={client.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                <div className="flex items-center space-x-4 min-w-0">
                                    <div className="p-2.5 bg-slate-100 rounded-lg shrink-0"><Building className="w-5 h-5 text-slate-500" /></div>
                                    <span className="font-bold text-base text-slate-700 truncate">{client.name}</span>
                                </div>
                                <span className="font-extrabold text-lg text-blue-600 ml-4">{count}</span>
                            </div>
                        );
                    })}
                     {clients.length === 0 && <p className="text-base text-slate-400 text-center py-4 italic">Belum ada data klien.</p>}
                </div>
            </div>
            <div className="bg-white p-5 md:p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200 flex-1">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Riwayat Terbaru</h3>
                <div className="space-y-4">
                    {recentActivities.map(act => (
                        <div key={act.id + act.type} className="flex items-center space-x-4">
                            <div className={`p-2.5 rounded-lg shrink-0 ${act.type === 'join' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {act.type === 'join' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                            </div>
                            <img src={act.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(act.fullName)}&background=E0E7FF&color=4F46E5`} className="w-10 h-10 rounded-full object-cover shadow-sm border-2 border-slate-100" />
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-base text-slate-800 truncate">{act.fullName}</p>
                                <p className="text-sm text-slate-400 font-medium">
                                    {act.type === 'join' ? 'Baru Join' : 'Resign'} • {new Date(act.type === 'join' ? act.joinDate : act.resignDate!).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                                </p>
                            </div>
                        </div>
                    ))}
                    {recentActivities.length === 0 && <p className="text-base text-slate-400 text-center py-4 italic">Belum ada aktivitas dalam 30 hari.</p>}
                </div>
            </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Wawasan Demografis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <ChartCard title="Komposisi Gender" icon={<PieChartIcon className="w-6 h-6" />}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={demographicData.genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {demographicData.genderData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={demographicData.GENDER_COLORS[index % demographicData.GENDER_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Distribusi Usia" icon={<Cake className="w-6 h-6" />}>
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={demographicData.ageData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                             {demographicData.ageData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={demographicData.AGE_COLORS[index % demographicData.AGE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Tingkat Pendidikan" icon={<GraduationCap className="w-6 h-6" />}>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demographicData.educationData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="Jumlah" fill="#3b82f6" barSize={20} radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
      </div>
    </div>
  );
};

// Fix: Specified that the icon prop's element can accept a className prop to resolve the React.cloneElement type error.
const StatCard = ({ icon, label, value, color }: {icon: React.ReactElement<{ className?: string }>, label: string, value: number, color: string}) => {
    const colors = {
        indigo: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600', shadow: 'shadow-blue-500/20'},
        emerald: { bg: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600', shadow: 'shadow-emerald-500/20'},
        rose: { bg: 'from-rose-500 to-rose-600', text: 'text-rose-600', shadow: 'shadow-rose-500/20'},
    }
    const selectedColor = colors[color as keyof typeof colors] || colors.indigo;

    return (
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200 flex items-center space-x-5">
            <div className={`flex-shrink-0 p-4 md:p-5 rounded-xl md:rounded-2xl bg-gradient-to-br ${selectedColor.bg} text-white shadow-lg ${selectedColor.shadow}`}>
                {React.cloneElement(icon, { className: `w-7 h-7 md:w-8 md:h-8` })}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                <h4 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">{value}</h4>
            </div>
        </div>
    );
};

export default Dashboard;