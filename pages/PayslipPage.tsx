import React, { useState, useMemo, useRef } from 'react';
import { Payslip, Employee, Client } from '../types';
import { UploadCloud, FileDown, Calendar, Search, Download, User } from 'lucide-react';
import { read, utils } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '../services/supabaseClient';
import { useNotifier } from '../components/Notifier';

interface PayslipPageProps {
    payslips: Payslip[];
    employees: Employee[];
    clients: Client[];
    onPayslipsChange: (payslips: Payslip[]) => Promise<void>;
}

const PAYSLIP_TEMPLATE_HEADERS = [
    'employeeId', 'period', 'gajiPokok', 'tunjanganJabatan', 
    'tunjanganMakan', 'bonus', 'potonganPph21', 'potonganBpjs', 'potonganLainnya'
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('id-ID', {
        month: 'long',
        year: 'numeric'
    });
};

const dataURItoBlob = (dataURI: string): Blob => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
};


const PayslipPage: React.FC<PayslipPageProps> = ({ payslips, employees, clients, onPayslipsChange }) => {
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const notifier = useNotifier();

    const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);
    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

    const uniquePeriods = useMemo(() => {
        const periods = new Set(payslips.map(p => p.period));
        return ['all', ...Array.from(periods).sort((a: string, b: string) => b.localeCompare(a))];
    }, [payslips]);

    const filteredPayslips = useMemo(() => {
        return payslips.filter(p => {
            const employee = employeeMap.get(p.employeeId);
            return (
                (selectedPeriod === 'all' || p.period === selectedPeriod) &&
                (employee?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || p.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        });
    }, [payslips, selectedPeriod, searchTerm, employeeMap]);
    
    const handleDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8," + PAYSLIP_TEMPLATE_HEADERS.join(',');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template_slip_gaji.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generatePdf = (data: any, employee: Employee, clientName: string): string => {
        const doc = new jsPDF();
        
        const gp = Number(data.gajiPokok) || 0;
        const tj = Number(data.tunjanganJabatan) || 0;
        const tm = Number(data.tunjanganMakan) || 0;
        const bn = Number(data.bonus) || 0;

        const pp21 = Number(data.potonganPph21) || 0;
        const pb = Number(data.potonganBpjs) || 0;
        const pl = Number(data.potonganLainnya) || 0;

        const totalPendapatan = gp + tj + tm + bn;
        const totalPotongan = pp21 + pb + pl;
        const takeHomePay = totalPendapatan - totalPotongan;

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text("SLIP GAJI KARYAWAN", 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Periode: ${formatPeriod(data.period)}`, 105, 28, { align: 'center' });
        
        doc.setLineWidth(0.5);
        doc.line(15, 35, 195, 35);

        (doc as any).autoTable({
            startY: 40,
            body: [
                ['Nama Karyawan', ':', employee.fullName],
                ['NIK', ':', employee.id],
                ['Jabatan', ':', employee.position],
                ['Klien', ':', clientName],
            ],
            theme: 'plain',
            styles: { fontSize: 11, cellPadding: 1.5 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 }, 1: { cellWidth: 5 }, 2: { cellWidth: 'auto' } }
        });

        const finalY = (doc as any).lastAutoTable.finalY;
        (doc as any).autoTable({
            startY: finalY + 10,
            head: [['Pendapatan', 'Jumlah'], ['Potongan', 'Jumlah']],
            body: [
                [{content: 'Gaji Pokok', styles:{fontStyle:'bold'}}, formatCurrency(gp), {content: 'Pph 21', styles:{fontStyle:'bold'}}, formatCurrency(pp21)],
                ['Tunjangan Jabatan', formatCurrency(tj), 'BPJS', formatCurrency(pb)],
                ['Tunjangan Makan', formatCurrency(tm), 'Potongan Lainnya', formatCurrency(pl)],
                ['Bonus', formatCurrency(bn), '', ''],
            ],
            theme: 'striped',
            headStyles: { fillColor: '#4A5568', textColor: '#FFFFFF' },
            foot: [[{content: 'Total Pendapatan', styles:{fontStyle:'bold'}}, formatCurrency(totalPendapatan), {content: 'Total Potongan', styles:{fontStyle:'bold'}}, formatCurrency(totalPotongan)]],
            footStyles: { fontStyle: 'bold', fillColor: '#EDF2F7', textColor: '#1A202C'},
            styles: { fontSize: 11 },
        });
        
        const finalY2 = (doc as any).lastAutoTable.finalY;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Take Home Pay:", 15, finalY2 + 15);
        doc.text(formatCurrency(takeHomePay), 195, finalY2 + 15, { align: 'right' });
        
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Dokumen ini dibuat secara otomatis oleh sistem HALO SWAPRO pada ${new Date().toLocaleDateString('id-ID')}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });

        return doc.output('datauristring');
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[] = utils.sheet_to_json(worksheet);

                if (jsonData.length === 0 || !PAYSLIP_TEMPLATE_HEADERS.every(h => jsonData[0].hasOwnProperty(h))) {
                    throw new Error("Format file Excel tidak sesuai. Pastikan nama kolom sama dengan template.");
                }

                const newPayslips: Payslip[] = [];
                for (const row of jsonData) {
                    const employee = employeeMap.get(row.employeeId);
                    if (!employee) {
                        console.warn(`Karyawan dengan ID ${row.employeeId} tidak ditemukan. Baris ini dilewati.`);
                        continue;
                    }
                    const clientName = clientMap.get(employee.clientId) || 'N/A';
                    
                    const pdfDataUrl = generatePdf(row, employee, clientName);
                    const pdfBlob = dataURItoBlob(pdfDataUrl);
                    const filePath = `payslips/${row.employeeId}-${row.period}.pdf`;

                    const { error: uploadError } = await supabase.storage.from('public').upload(filePath, pdfBlob, { upsert: true });
                    if(uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(filePath);

                    newPayslips.push({
                        id: `${row.employeeId}-${row.period}`,
                        employeeId: row.employeeId,
                        period: row.period,
                        fileUrl: publicUrl
                    });
                }
                
                if (newPayslips.length > 0) {
                    await onPayslipsChange(newPayslips);
                } else {
                    notifier.addNotification("Tidak ada data slip gaji yang valid untuk diunggah.", 'info');
                }

            } catch (error: any) {
                console.error("Error processing Excel file:", error);
                notifier.addNotification(`Gagal memproses file: ${error.message}`, 'error');
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="p-4 md:p-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Manajemen Slip Gaji</h1>
            <p className="text-lg text-slate-500 mt-1">Unggah, kelola, dan lihat slip gaji karyawan per periode.</p>

            <div className="my-6 md:my-8 bg-white p-4 rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200 space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <button onClick={handleDownloadTemplate} className="w-full md:w-auto flex items-center justify-center space-x-2 bg-white text-slate-600 border border-slate-300 px-4 py-2.5 rounded-xl font-semibold transition-all hover:bg-slate-50 text-base">
                        <FileDown className="w-4 h-4" />
                        <span>Unduh Template</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full md:w-auto flex items-center justify-center space-x-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 text-base">
                        <UploadCloud className="w-5 h-5" />
                        <span>Upload Slip Gaji</span>
                    </button>
                </div>
                 <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-3 border-t border-slate-200">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input type="text" placeholder="Cari nama/NIK karyawan..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-blue-500 text-base" />
                    </div>
                    <div className="relative flex-1 md:flex-initial">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                        <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="w-full pl-12 pr-8 py-3 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-blue-500 text-base appearance-none">
                            {uniquePeriods.map(p => <option key={p} value={p}>{p === 'all' ? 'Semua Periode' : formatPeriod(p)}</option>)}
                        </select>
                    </div>
                 </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-base tracking-wider">
                            <tr>
                                <th className="p-4 font-bold text-left">Karyawan</th>
                                <th className="p-4 font-bold text-left">Periode</th>
                                <th className="p-4 font-bold text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPayslips.map(slip => {
                                const employee = employeeMap.get(slip.employeeId);
                                return (
                                    <tr key={slip.id} className="hover:bg-slate-50/50">
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <img src={employee?.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee?.fullName || '')}&background=E0E7FF&color=4F46E5`} className="w-10 h-10 rounded-full object-cover" />
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-base">{employee?.fullName || 'N/A'}</p>
                                                    <p className="text-sm text-slate-500 font-mono">{slip.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-semibold text-slate-600 text-base">{formatPeriod(slip.period)}</td>
                                        <td className="p-4 text-right">
                                            <a href={slip.fileUrl} download={`slip-gaji-${employee?.fullName}-${slip.period}.pdf`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 bg-white text-slate-600 border border-slate-300 px-3 py-1.5 rounded-lg font-semibold transition-all hover:bg-slate-50 text-sm">
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Unduh PDF</span>
                                            </a>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredPayslips.length === 0 && (
                    <div className="text-center p-12">
                        <p className="text-slate-500 font-semibold text-lg">Tidak ada slip gaji ditemukan</p>
                        <p className="text-base text-slate-400 mt-1">Coba ubah filter periode atau unggah data baru.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PayslipPage;