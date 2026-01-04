import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2,
  Briefcase,
  Clock,
  Zap,
  Activity,
  ShieldHalf,
  BookOpen,
  Smartphone,
  Target,
  Coffee,
  Receipt,
  Coins,
  Download,
  UserPlus,
  Fingerprint,
  MessageSquare,
  FileText,
  CreditCard,
  ChevronRight,
  RotateCcw,
  Brain,
  Heart,
  TrendingUp,
  Award,
  Sparkles,
  User,
  Link,
  X,
} from 'lucide-react';
import Marquee from '../components/Marquee';

// --- DATA KONTEN MODAL ---
interface ModalContent {
  icon: React.ReactNode;
  title: string;
  description: string[];
  steps?: {
      title: string;
      items: string[];
  }[];
  color: string;
}

const EDUCATION_CONTENT: Record<string, ModalContent> = {
    growth: {
        icon: <Brain className="w-6 h-6" />, title: 'Growth Mindset', color: 'rose',
        description: [
            "Growth Mindset adalah keyakinan bahwa kemampuan dan kecerdasan dapat dikembangkan melalui dedikasi dan kerja keras. Kegagalan tidak dilihat sebagai akhir, melainkan sebagai kesempatan belajar.",
            "Individu dengan mindset ini lebih tangguh, lebih termotivasi, dan cenderung mencapai kesuksesan yang lebih besar dalam jangka panjang karena mereka terus-menerus mencari cara untuk memperbaiki diri."
        ],
    },
    kindness: {
        icon: <Heart className="w-6 h-6" />, title: 'Self-Kindness', color: 'rose',
        description: [
            "Bersikap baik pada diri sendiri saat menghadapi kegagalan adalah hal yang krusial. Ini bukan tentang memanjakan diri, melainkan tentang memperlakukan diri sendiri dengan pengertian dan kesabaran yang sama seperti yang Anda berikan kepada teman baik.",
            "Ini membantu mengurangi stres, meningkatkan ketahanan mental, dan memungkinkan Anda untuk bangkit kembali dengan lebih cepat dan lebih kuat."
        ],
    },
    pivot: {
        icon: <TrendingUp className="w-6 h-6" />, title: 'Evaluasi & Pivot', color: 'rose',
        description: [
            "Setelah mengalami kegagalan, luangkan waktu untuk menganalisis apa yang salah secara objektif. Apa yang bisa dipelajari dari pengalaman ini?",
            "Gunakan wawasan tersebut untuk 'pivot' atau mengubah strategi Anda. Fleksibilitas untuk beradaptasi dan mencoba pendekatan baru adalah tanda kecerdasan profesional."
        ],
    },
    persist: {
        icon: <Award className="w-6 h-6" />, title: 'Persistensi (Ketangguhan)', color: 'rose',
        description: [
            "Ketangguhan bukan berarti tidak pernah gagal, tetapi berarti terus maju meskipun menghadapi rintangan. Ini adalah kombinasi dari semangat, ketekunan, dan fokus pada tujuan jangka panjang.",
            "Ingatlah 'mengapa' Anda memulai. Tujuan yang kuat akan memberikan bahan bakar untuk melewati masa-masa sulit."
        ],
    },
    eatFrog: {
        icon: <Target className="w-6 h-6" />, title: 'Eat The Frog', color: 'indigo',
        description: [
            "Prinsip 'Eat The Frog' dari Brian Tracy menyarankan untuk menyelesaikan tugas yang paling sulit dan paling penting di awal hari kerja.",
            "Dengan melakukan ini, Anda memastikan bahwa bahkan jika sisa hari Anda tidak produktif, Anda telah menyelesaikan satu hal yang signifikan. Ini memberikan momentum dan rasa pencapaian yang luar biasa."
        ],
    },
    pomodoro: {
        icon: <Clock className="w-6 h-6" />, title: 'Teknik Pomodoro', color: 'indigo',
        description: [
            "Teknik Pomodoro adalah metode manajemen waktu yang menggunakan timer untuk memecah pekerjaan menjadi interval, biasanya berdurasi 25 menit, dipisahkan oleh istirahat singkat.",
            "Setiap interval dikenal sebagai 'pomodoro'. Setelah empat pomodoro, ambil istirahat yang lebih lama. Teknik ini terbukti meningkatkan fokus dan mengurangi kelelahan mental."
        ],
    },
    deepWork: {
        icon: <Coffee className="w-6 h-6" />, title: 'Deep Work', color: 'indigo',
        description: [
            "'Deep Work' adalah kemampuan untuk fokus tanpa gangguan pada tugas yang menuntut kognitif. Ini adalah keterampilan yang memungkinkan Anda menguasai informasi rumit dan menghasilkan hasil yang lebih baik dalam waktu yang lebih singkat.",
            "Untuk melakukannya, jadwalkan blok waktu tertentu, hilangkan semua gangguan seperti notifikasi ponsel dan email, dan latih kemampuan Anda untuk berkonsentrasi."
        ],
    },
    batching: {
        icon: <Activity className="w-6 h-6" />, title: 'Task Batching', color: 'indigo',
        description: [
            "Task Batching adalah praktik mengelompokkan tugas-tugas serupa dan menyelesaikannya bersama-sama dalam satu blok waktu. Contohnya, balas semua email sekaligus, atau lakukan semua panggilan telepon di waktu yang sama.",
            "Ini mengurangi 'context switching' (beralih dari satu jenis tugas ke tugas lain), yang menguras energi mental dan membuat Anda kurang efisien."
        ],
    },
    jkk: {
        icon: <ShieldCheck className="w-6 h-6" />, title: 'Jaminan Kecelakaan Kerja (JKK)', color: 'blue',
        description: [
            "JKK memberikan perlindungan komprehensif atas risiko kecelakaan yang terjadi dalam hubungan kerja, termasuk perjalanan dari rumah ke tempat kerja dan sebaliknya, serta penyakit yang timbul akibat lingkungan kerja.",
            "Manfaatnya mencakup biaya perawatan medis tanpa batas, santunan sementara tidak mampu bekerja, santunan cacat, hingga santunan kematian jika kecelakaan kerja berakibat fatal."
        ],
    },
    jkm: {
        icon: <Heart className="w-6 h-6" />, title: 'Jaminan Kematian (JKM)', color: 'blue',
        description: [
            "JKM memberikan manfaat uang tunai kepada ahli waris ketika peserta meninggal dunia bukan karena kecelakaan kerja. Program ini bertujuan untuk membantu meringankan beban keluarga yang ditinggalkan.",
            "Manfaatnya terdiri dari santunan kematian, biaya pemakaman, dan beasiswa pendidikan untuk anak dari peserta, dengan syarat dan ketentuan yang berlaku."
        ],
    },
    jht: {
        icon: <Coins className="w-6 h-6" />, title: 'Jaminan Hari Tua (JHT)', color: 'blue',
        description: [
            "JHT adalah program tabungan wajib jangka panjang yang dananya dapat dicairkan saat peserta mencapai usia pensiun (56 tahun), meninggal dunia, atau mengalami cacat total tetap.",
            "Dana JHT juga dapat diklaim sebagian (10% atau 30%) untuk keperluan tertentu seperti persiapan pensiun atau kepemilikan rumah, dengan syarat kepesertaan minimal 10 tahun."
        ],
    },
    jkp: {
        icon: <Briefcase className="w-6 h-6" />, title: 'Jaminan Kehilangan Pekerjaan (JKP)', color: 'blue',
        description: [
            "JKP adalah program baru yang memberikan manfaat bagi pekerja yang mengalami pemutusan hubungan kerja (PHK). Tujuannya adalah mempertahankan derajat kehidupan yang layak sebelum pekerja mendapatkan pekerjaan kembali.",
            "Manfaatnya berupa uang tunai selama 6 bulan, akses informasi pasar kerja, dan pelatihan kerja untuk meningkatkan kompetensi."
        ],
    },
    rawatJalan: {
        icon: <CheckCircle2 className="w-6 h-6" />, title: 'Rawat Jalan Tingkat Pertama (FKTP)', color: 'emerald',
        description: [
            "Ini adalah layanan kesehatan dasar yang Anda dapatkan di Fasilitas Kesehatan Tingkat Pertama (FKTP) seperti Puskesmas, klinik, atau dokter praktik perorangan tempat Anda terdaftar.",
            "Layanan mencakup konsultasi medis, tindakan medis non-spesialistik, pemberian obat, dan pemeriksaan penunjang diagnostik sesuai indikasi medis."
        ],
    },
    rawatInap: {
        icon: <CheckCircle2 className="w-6 h-6" />, title: 'Rawat Inap Tingkat Lanjutan', color: 'emerald',
        description: [
            "Jika diperlukan rujukan dari FKTP, Anda berhak mendapatkan layanan rawat inap di rumah sakit. Manfaat ini mencakup akomodasi kamar perawatan, pemeriksaan dan pengobatan oleh dokter spesialis, tindakan medis, hingga pelayanan ICU.",
            "Kelas rawat inap ditentukan oleh segmen kepesertaan Anda. Program KRIS (Kelas Rawat Inap Standar) sedang diimplementasikan secara bertahap untuk meniadakan kelas perawatan."
        ],
    },
    persalinan: {
        icon: <CheckCircle2 className="w-6 h-6" />, title: 'Jaminan Persalinan', color: 'emerald',
        description: [
            "BPJS Kesehatan menanggung biaya persalinan normal maupun caesar (dengan indikasi medis) di fasilitas kesehatan yang bekerja sama. Ini mencakup pemeriksaan kehamilan, pertolongan persalinan, serta perawatan ibu dan bayi setelah melahirkan.",
            "Pastikan untuk rutin melakukan pemeriksaan kehamilan (ANC) di FKTP Anda untuk kelancaran proses klaim."
        ],
    },
    emergency: {
        icon: <CheckCircle2 className="w-6 h-6" />, title: 'Pelayanan Gawat Darurat', color: 'emerald',
        description: [
            "Dalam kondisi gawat darurat medis, Anda dapat langsung menuju Unit Gawat Darurat (UGD) di rumah sakit mana pun (termasuk yang tidak bekerja sama dengan BPJS) dan layanan Anda akan ditanggung.",
            "Kriteria gawat darurat ditetapkan oleh tenaga medis, bukan oleh pasien, dan mencakup kondisi yang mengancam nyawa atau dapat menyebabkan kecacatan permanen jika tidak segera ditangani."
        ],
    },
    pph21: {
        icon: <Coins className="w-6 h-6" />, title: 'Pajak Penghasilan Pasal 21 (TER 2024)', color: 'amber',
        description: [
            "Mulai tahun 2024, pemerintah memperkenalkan skema perhitungan PPh 21 baru menggunakan Tarif Efektif Rata-Rata (TER). Tujuannya adalah untuk menyederhanakan perhitungan pajak bulanan.",
            "Perhitungan Januari-November menggunakan tarif TER (A, B, atau C) dikalikan penghasilan bruto. Pada bulan Desember, perhitungan kembali menggunakan skema lama (tarif Pasal 17) untuk seluruh tahun dan disesuaikan dengan pajak yang sudah dibayar, sehingga total pajak setahun tetap sama."
        ],
    },
    jmo: {
        icon: <Smartphone className="w-6 h-6" />, title: 'Aplikasi JMO', color: 'blue',
        description: [
            "JMO (Jamsostek Mobile) adalah aplikasi resmi dari BPJS Ketenagakerjaan. Melalui aplikasi ini, Anda dapat mengecek saldo JHT, melihat status kepesertaan, mengunduh kartu digital, hingga mengajukan klaim JHT secara online.",
            "Fitur unggulannya adalah proses klaim JHT yang lebih cepat (e-claim) dan fitur pelacakan status klaim secara real-time."
        ],
        steps: [
            {
                title: "Cara Pendaftaran Akun Baru",
                items: [
                    "Unduh aplikasi JMO dari Google Play Store atau App Store.",
                    "Buka aplikasi, lalu pilih 'Buat Akun Baru'.",
                    "Pilih 'Ya, Saya Sudah Daftar' sebagai peserta, lalu pilih jenis kepesertaan 'Penerima Upah (PU)'.",
                    "Isi data diri dengan benar: NIK, Nomor KPJ, Nama Lengkap, dan Tanggal Lahir.",
                    "Lakukan verifikasi akun melalui email dan nomor HP yang aktif.",
                    "Buat kata sandi untuk akun Anda dan selesaikan pendaftaran."
                ]
            },
            {
                title: "Cara Menambah KPJ Baru (jika sudah punya akun)",
                items: [
                    "Login ke aplikasi JMO Anda.",
                    "Masuk ke menu 'Profil Saya'.",
                    "Pilih opsi 'Tambah KPJ'.",
                    "Masukkan Nomor KPJ baru Anda beserta Nama Lengkap.",
                    "Lakukan verifikasi biometrik (wajah) sesuai instruksi.",
                    "KPJ baru Anda akan otomatis ditambahkan ke akun."
                ]
            }
        ]
    },
    jkn: {
        icon: <Activity className="w-6 h-6" />, title: 'Aplikasi Mobile JKN', color: 'emerald',
        description: [
            "Mobile JKN adalah aplikasi resmi dari BPJS Kesehatan. Aplikasi ini memungkinkan Anda untuk mengecek status kepesertaan, melihat kartu KIS digital, mengubah data peserta, dan mendaftar antrean online di FKTP atau rumah sakit.",
            "Fitur antrean online sangat membantu untuk mengurangi waktu tunggu di fasilitas kesehatan, membuat pengalaman berobat menjadi lebih efisien."
        ],
        steps: [
             {
                title: "Cara Pendaftaran Akun",
                items: [
                    "Unduh aplikasi Mobile JKN dari Google Play Store atau App Store.",
                    "Buka aplikasi, pilih 'Daftar', lalu 'Pendaftaran Peserta Baru'.",
                    "Baca dan setujui syarat & ketentuan.",
                    "Masukkan NIK Anda dan kode captcha, lalu data Anda akan muncul.",
                    "Lengkapi data tambahan yang diperlukan, termasuk memilih Faskes Tingkat Pertama (FKTP).",
                    "Verifikasi akun melalui kode yang dikirimkan ke email aktif Anda."
                ]
            }
        ]
    },
};

// --- MODAL KOMPONEN ---
const InfoModal: React.FC<{ content: ModalContent; onClose: () => void; }> = ({ content, onClose }) => {
  const colorClasses = {
    rose: { bg: 'bg-rose-100', text: 'text-rose-600' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
  };
  const selectedColor = colorClasses[content.color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.3s_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 animate-[scaleIn_0.3s_ease-out] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 md:p-8 overflow-y-auto">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-2xl ${selectedColor.bg} ${selectedColor.text}`}>
              {content.icon}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{content.title}</h2>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-base text-slate-600 leading-relaxed font-medium">
            {content.description.map((p, i) => <p key={i}>{p}</p>)}
            {content.steps && content.steps.map((stepSection, i) => (
                <div key={i} className="mt-5">
                    <h4 className="font-bold text-slate-900 mb-2">{stepSection.title}</h4>
                    <ol className="space-y-2 list-decimal list-inside text-slate-600">
                        {stepSection.items.map((item, j) => <li key={j}>{item}</li>)}
                    </ol>
                </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0">
          <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition active:scale-95">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Tombol Media Sosial Mengambang ---
const FloatingSocialButtons: React.FC = () => {
    const socialLinks = [
        {
            name: 'Instagram',
            url: 'https://www.instagram.com/swaprokarir?igsh=MXdvOW56ZjN6ZXJrMA==',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            ),
            bgClass: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500',
            shadowClass: 'shadow-pink-500/30'
        },
        {
            name: 'TikTok',
            url: 'https://www.tiktok.com/@swaprointernational_?_r=1&_t=ZS-91vBGI75XfE',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 30 30" fill="currentColor" className="w-7 h-7">
                    <path d="M24,4H6C4.895,4,4,4.895,4,6v18c0,1.105,0.895,2,2,2h18c1.105,0,2-0.895,2-2V6C26,4.895,25.104,4,24,4z M22.689,13.474 c-0.13,0.012-0.261,0.02-0.393,0.02c-1.495,0-2.809-0.768-3.574-1.931c0,3.049,0,6.519,0,6.577c0,2.685-2.177,4.861-4.861,4.861 C11.177,23,9,20.823,9,18.139c0-2.685,2.177-4.861,4.861-4.861c0.102,0,0.201,0.009,0.3,0.015v2.396c-0.1-0.012-0.197-0.03-0.3-0.03 c-1.37,0-2.481,1.111-2.481,2.481s1.11,2.481,2.481,2.481c1.371,0,2.581-1.08,2.581-2.45c0-0.055,0.024-11.17,0.024-11.17h2.289 c0.215,2.047,1.868,3.663,3.934,3.811V13.474z"></path>
                 </svg>
            ),
            bgClass: 'bg-black',
            shadowClass: 'shadow-slate-500/30'
        },
        {
            name: 'WhatsApp',
            url: 'https://wa.me/6285890285218',
            icon: (
                 <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-7 h-7"
                    fill="currentColor"
                >
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22C13.66,22 15.25,21.5 16.63,20.67L22,22L20.67,16.63C21.5,15.25 22,13.66 22,12A10,10 0 0,0 12,2M16.75,13.96C17,14.26 17,14.86 16.8,15.46C16.6,16.06 15.9,16.56 15.3,16.56C14.8,16.56 12.7,16.06 11.2,14.56C9.3,12.66 8.1,10.26 8,9.86C7.9,9.46 8.5,8.86 8.7,8.66C8.9,8.46 9.1,8.26 9.3,8.26C9.5,8.26 9.7,8.26 9.8,8.46C10,8.66 10.4,9.36 10.5,9.56C10.6,9.76 10.6,9.96 10.5,10.06C10.4,10.16 10.3,10.26 10.2,10.36C10.1,10.46 9.9,10.66 9.8,10.76C9.7,10.86 9.6,10.96 9.7,11.16C9.8,11.36 10.3,12.16 11.1,12.86C12.1,13.76 12.8,14.06 13,14.16C13.2,14.26 13.3,14.26 13.4,14.06C13.5,13.86 13.7,13.66 13.8,13.46C14,13.26 14.2,13.16 14.4,13.16C14.6,13.16 15.5,13.56 15.8,13.66C16.1,13.76 16.5,13.86 16.75,13.96Z" />
                </svg>
            ),
            bgClass: 'bg-[#25D366] hover:bg-green-600',
            shadowClass: 'shadow-green-500/30'
        }
    ];

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center space-y-3">
                {socialLinks.map((link, index) => (
                    <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Kunjungi ${link.name} kami`}
                        className={`text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 animate-slide-in ${link.bgClass} ${link.shadowClass}`}
                        style={{ animationDelay: `${150 * index}ms` }}
                    >
                       {link.icon}
                    </a>
                ))}
            </div>
            <style>{`
                @keyframes slideInFromBottom {
                    from {
                        opacity: 0;
                        transform: translateY(25px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .animate-slide-in {
                    opacity: 0;
                    animation: slideInFromBottom 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                }
            `}</style>
        </>
    );
};


const Landing: React.FC = () => {
  const navigate = useNavigate();
  const educationSectionRef = useRef<HTMLDivElement>(null);
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);

  const scrollToEducation = () => {
    educationSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FDFEFE] font-['Inter'] selection:bg-blue-100 selection:text-blue-700">
      {modalContent && <InfoModal content={modalContent} onClose={() => setModalContent(null)} />}
      <FloatingSocialButtons />
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <img src="https://i.imgur.com/P7t1bQy.png" alt="SIM Group Logo" className="h-8" />
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">HALLO SWAPRO</span>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-base font-semibold text-slate-500">
              <button onClick={scrollToEducation} className="hover:text-blue-600 transition-colors">Edukasi</button>
              <button 
                onClick={() => navigate('/search')}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-blue-600 transition shadow-sm active:scale-95"
              >
                Portal Karyawan
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 overflow-hidden bg-slate-50/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 bg-blue-100 px-4 py-1.5 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">Sistem Pintar Karyawan</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
              Portal Profesional Karyawan <span className="text-blue-600">SWAPRO</span>.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed font-medium">
              Sumber informasi resmi dan terintegrasi untuk seluruh kebutuhan administrasi, produktivitas, dan pengembangan diri Anda selama berkarir di SWAPRO.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button 
                onClick={() => navigate('/search')}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <span>Portal Karyawan</span>
                <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                onClick={scrollToEducation}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-xl font-bold text-lg text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 transition"
              >
                <BookOpen className="w-5 h-5 mr-1 text-slate-400" />
                <span>Lihat Edukasi</span>
              </button>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-80 h-80 md:w-96 md:h-96">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 md:w-72 md:h-72 bg-white border border-slate-100 rounded-[50px] shadow-2xl flex items-center justify-center rotate-6 transition-transform hover:rotate-0 duration-500">
                <div className="relative flex flex-col items-center">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 rounded-[30px] shadow-2xl mb-5">
                    <User className="w-16 h-16 text-white" />
                  </div>
                  <div className="flex -space-x-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center"><Activity className="w-4 h-4 text-white" /></div>
                    <div className="w-8 h-8 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center"><Receipt className="w-4 h-4 text-white" /></div>
                    <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-white" /></div>
                  </div>
                  <p className="mt-5 font-bold text-slate-800">Professional Assistant</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 animate-bounce [animation-duration:3s]">
                <Brain className="w-6 h-6 text-rose-500" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 animate-bounce [animation-delay:1s] [animation-duration:4s]">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* Edukasi Section */}
      <section ref={educationSectionRef} className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Pengembangan Diri</h2>
            <p className="text-lg md:text-xl text-slate-500 mt-4 max-w-3xl mx-auto">Tingkatkan ketangguhan mental dan produktivitas Anda dengan prinsip-prinsip teruji ini.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-rose-100 text-rose-600 rounded-xl"><RotateCcw className="w-6 h-6" /></div>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Menyikapi Kegagalan</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <EducationCard icon={<Brain className="w-6 h-6"/>} title="Growth Mindset" desc="Lihat kegagalan sebagai data untuk belajar, bukan sebagai identitas diri." onClick={() => setModalContent(EDUCATION_CONTENT.growth)} color="rose" />
                    <EducationCard icon={<Heart className="w-6 h-6"/>} title="Self-Kindness" desc="Perlakukan diri Anda dengan pengertian saat menghadapi kesulitan." onClick={() => setModalContent(EDUCATION_CONTENT.kindness)} color="rose" />
                    <EducationCard icon={<TrendingUp className="w-6 h-6"/>} title="Evaluasi & Pivot" desc="Analisis kesalahan, pelajari, dan ubah strategi Anda menjadi lebih baik." onClick={() => setModalContent(EDUCATION_CONTENT.pivot)} color="rose" />
                    <EducationCard icon={<Award className="w-6 h-6"/>} title="Persistensi" desc="Ketangguhan adalah kunci untuk terus maju mencapai tujuan jangka panjang." onClick={() => setModalContent(EDUCATION_CONTENT.persist)} color="rose" />
                </div>
            </div>
            <div>
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><Zap className="w-6 h-6" /></div>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Tips Produktivitas</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <EducationCard icon={<Target className="w-6 h-6"/>} title="Eat The Frog" desc="Selesaikan tugas tersulit di pagi hari untuk momentum maksimal." onClick={() => setModalContent(EDUCATION_CONTENT.eatFrog)} color="indigo" />
                    <EducationCard icon={<Clock className="w-6 h-6"/>} title="Teknik Pomodoro" desc="Bekerja fokus dalam interval pendek untuk menjaga konsentrasi." onClick={() => setModalContent(EDUCATION_CONTENT.pomodoro)} color="indigo" />
                    <EducationCard icon={<Coffee className="w-6 h-6"/>} title="Deep Work" desc="Alokasikan waktu tanpa gangguan untuk hasil kerja berkualitas tinggi." onClick={() => setModalContent(EDUCATION_CONTENT.deepWork)} color="indigo" />
                    <EducationCard icon={<Activity className="w-6 h-6"/>} title="Task Batching" desc="Kelompokkan tugas sejenis untuk mengurangi peralihan konteks." onClick={() => setModalContent(EDUCATION_CONTENT.batching)} color="indigo" />
                </div>
            </div>
        </div>
      </section>

      {/* BPJS Section */}
      <section className="py-24 px-6 bg-slate-50 border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Manfaat Jaminan Sosial</h2>
            <p className="text-lg md:text-xl text-slate-500 mt-4">Pahami perlindungan dan hak-hak dasar Anda sebagai karyawan SWAPRO.</p>
          </div>

          <div className="space-y-16">
            {/* BPJS Ketenagakerjaan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="text-center lg:text-left">
                    <img src="https://i.imgur.com/kRyWzNX.png" alt="BPJS Ketenagakerjaan Logo" className="h-10 mb-4 mx-auto lg:mx-0" />
                    <h3 className="text-3xl font-bold text-slate-800">BPJS Ketenagakerjaan</h3>
                    <p className="text-lg text-slate-500 mt-2 leading-relaxed">Perlindungan sosial ekonomi untuk menjamin kehidupan yang layak saat terjadi risiko kerja, hari tua, atau kehilangan pekerjaan.</p>
                </div>
                <div className="space-y-4">
                    <BenefitRow color="blue" title="Jaminan Kecelakaan Kerja (JKK)" desc="Perlindungan komprehensif atas kecelakaan kerja." onClick={() => setModalContent(EDUCATION_CONTENT.jkk)} />
                    <BenefitRow color="blue" title="Jaminan Kematian (JKM)" desc="Santunan tunai untuk ahli waris." onClick={() => setModalContent(EDUCATION_CONTENT.jkm)} />
                    <BenefitRow color="blue" title="Jaminan Hari Tua (JHT)" desc="Program tabungan untuk masa pensiun." onClick={() => setModalContent(EDUCATION_CONTENT.jht)} />
                    <BenefitRow color="blue" title="Jaminan Kehilangan Pekerjaan (JKP)" desc="Manfaat tunai saat mengalami PHK." onClick={() => setModalContent(EDUCATION_CONTENT.jkp)} />
                </div>
            </div>

            {/* BPJS Kesehatan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="text-center lg:text-left">
                    <img src="https://i.imgur.com/fOML1ll.png" alt="BPJS Kesehatan Logo" className="h-10 mb-4 mx-auto lg:mx-0" />
                    <h3 className="text-3xl font-bold text-slate-800">BPJS Kesehatan</h3>
                    <p className="text-lg text-slate-500 mt-2 leading-relaxed">Jaminan pemeliharaan kesehatan yang menyeluruh dan berkesinambungan untuk seluruh peserta dan anggota keluarga.</p>
                </div>
                <div className="space-y-4">
                    <BenefitRow color="emerald" title="Rawat Jalan (FKTP)" desc="Akses layanan kesehatan dasar dan obat." onClick={() => setModalContent(EDUCATION_CONTENT.rawatJalan)} />
                    <BenefitRow color="emerald" title="Rawat Inap (Rujukan)" desc="Pelayanan di rumah sakit sesuai rujukan." onClick={() => setModalContent(EDUCATION_CONTENT.rawatInap)} />
                    <BenefitRow color="emerald" title="Jaminan Persalinan" desc="Penanggungan biaya kelahiran ibu dan bayi." onClick={() => setModalContent(EDUCATION_CONTENT.persalinan)} />
                    <BenefitRow color="emerald" title="Pelayanan Gawat Darurat" desc="Penanganan kondisi darurat medis 24 jam." onClick={() => setModalContent(EDUCATION_CONTENT.emergency)} />
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* PPh 21 Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <button onClick={() => setModalContent(EDUCATION_CONTENT.pph21)} className="w-full bg-slate-900 rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl text-left hover:scale-[1.01] transition-transform duration-300">
          <div className="absolute -top-10 -right-10 opacity-5"><Receipt className="w-64 h-64" /></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="bg-amber-500/20 p-3 rounded-2xl w-fit mb-5">
                <Coins className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-3xl font-black mb-4 tracking-tight">Transparansi Pajak PPh 21</h2>
              <p className="text-lg text-slate-400 leading-relaxed mb-6">
                Memahami potongan pajak penghasilan Anda kini lebih mudah dengan skema <b>TER 2024</b>. Transparansi adalah prioritas kami dalam mengelola payroll karyawan.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="text-sm font-bold bg-white/5 border border-white/10 px-4 py-1.5 rounded-lg uppercase tracking-wider">Kategori TER A, B, C</span>
                <span className="text-sm font-bold bg-white/5 border border-white/10 px-4 py-1.5 rounded-lg uppercase tracking-wider">PTKP Terkini</span>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
               <h4 className="text-amber-500 font-black text-sm uppercase mb-4 tracking-widest">Detail Kategori TER</h4>
               <div className="space-y-4">
                 <TaxInfoRow label="TER A" status="TK/0, TK/1, K/0" />
                 <TaxInfoRow label="TER B" status="TK/2, TK/3, K/1, K/2" />
                 <TaxInfoRow label="TER C" status="K/3" />
               </div>
               <div onClick={e => e.stopPropagation()} className="w-full mt-6">
                 <button onClick={() => navigate('/search')} className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl font-bold text-base uppercase tracking-widest hover:bg-amber-400 transition active:scale-95">
                   Cek Slip Gaji Anda
                 </button>
               </div>
            </div>
          </div>
        </button>
      </section>

      {/* Panduan Akses Digital */}
      <section className="py-24 px-6 bg-slate-50 border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Aplikasi Jaminan Sosial</h2>
                <p className="text-lg md:text-xl text-slate-500 mt-4">Akses semua manfaat Anda dengan mudah melalui genggaman.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <DigitalAppCard 
                    icon={<Smartphone className="w-8 h-8" />}
                    title="JMO Mobile"
                    subtitle="BPJS Ketenagakerjaan"
                    bgColorClass="from-blue-500 to-indigo-600"
                    onClick={() => setModalContent(EDUCATION_CONTENT.jmo)}
                />
                <DigitalAppCard 
                    icon={<Activity className="w-8 h-8" />}
                    title="Mobile JKN"
                    subtitle="BPJS Kesehatan"
                    bgColorClass="from-emerald-500 to-green-600"
                    onClick={() => setModalContent(EDUCATION_CONTENT.jkn)}
                />
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                  <img src="https://i.imgur.com/P7t1bQy.png" alt="SWAPRO Logo" className="h-8" />
                  <span className="font-extrabold text-xl text-slate-900 tracking-tight">HALLO SWAPRO</span>
              </div>
              <p className="text-base text-slate-500 font-medium">© 2025 PT SWAPRO INTERNATIONAL</p>
            </div>
            <button 
              onClick={() => navigate('/admin')}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Login PIC / Admin"
            >
              <img src="https://i.imgur.com/Lf2IC1Z.png" alt="Admin Login" className="w-8 h-8" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};


// --- SUB-KOMPONEN LANDING PAGE ---
const DigitalAppCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    bgColorClass: string;
    onClick: () => void;
}> = ({ icon, title, subtitle, bgColorClass, onClick }) => (
    <button 
        onClick={onClick}
        className={`relative p-8 rounded-3xl text-white text-left w-full overflow-hidden transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 active:scale-100 bg-gradient-to-br ${bgColorClass}`}
    >
        <div className="relative z-10 flex flex-col h-full">
            <div className="bg-white/20 p-3 rounded-2xl w-fit mb-4 backdrop-blur-sm">
                {icon}
            </div>
            <div className="mt-auto">
                <h3 className="text-2xl font-black tracking-tight">{title}</h3>
                <p className="text-base font-semibold opacity-80 mb-6">{subtitle}</p>
                <div className="flex items-center space-x-2 text-base font-bold">
                    <span>Pelajari</span>
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>
        </div>
        <div className="absolute -bottom-8 -right-8 text-white/10">
            <Smartphone size={160} strokeWidth={1.5}/>
        </div>
    </button>
);


const EducationCard: React.FC<{ icon: React.ReactNode; title: string; desc: string; onClick: () => void; color: 'rose' | 'indigo' }> = ({ icon, title, desc, onClick, color }) => {
  const colorClasses = {
    rose: { 
      bg: 'bg-rose-50', 
      border: 'border-rose-200', 
      hoverBg: 'hover:bg-rose-100',
      hoverShadow: 'hover:shadow-rose-500/10',
      hoverBorder: 'hover:border-rose-300',
      iconBg: 'bg-rose-100', 
      iconText: 'text-rose-600',
      linkText: 'text-rose-600'
    },
    indigo: { 
      bg: 'bg-indigo-50', 
      border: 'border-indigo-200',
      hoverBg: 'hover:bg-indigo-100',
      hoverShadow: 'hover:shadow-indigo-500/10',
      hoverBorder: 'hover:border-indigo-300',
      iconBg: 'bg-indigo-100', 
      iconText: 'text-indigo-600',
      linkText: 'text-indigo-600'
    },
  };
  const selectedColor = colorClasses[color];
  return (
    <button onClick={onClick} className={`w-full p-6 rounded-2xl text-left shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300 group ${selectedColor.bg} ${selectedColor.border} ${selectedColor.hoverBg} ${selectedColor.hoverShadow} ${selectedColor.hoverBorder}`}>
      <div className={`inline-block p-3 rounded-xl ${selectedColor.iconBg} ${selectedColor.iconText} mb-4`}>
        {icon}
      </div>
      <h3 className="font-bold text-lg text-slate-900">{title}</h3>
      <p className="text-base text-slate-500 mt-1">{desc}</p>
      <div className={`flex items-center space-x-2 text-sm font-semibold mt-4 opacity-0 group-hover:opacity-100 transition-opacity ${selectedColor.linkText}`}>
        <span>Pelajari Lebih Lanjut</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </button>
  );
};


const BenefitRow: React.FC<{ title: string; desc: string; onClick: () => void; color: 'blue' | 'emerald' }> = ({ title, desc, onClick, color }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      hoverBg: 'hover:bg-blue-100',
      hoverChevronBg: 'group-hover:bg-blue-600'
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      hoverBg: 'hover:bg-emerald-100',
      hoverChevronBg: 'group-hover:bg-emerald-600'
    }
  };
  const selectedColor = colorClasses[color];

  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between text-left p-4 rounded-xl transition-colors group border hover:shadow-lg ${selectedColor.bg} ${selectedColor.border} ${selectedColor.hoverBg}`}>
      <div className="min-w-0">
        <h3 className="font-bold text-lg text-slate-800">{title}</h3>
        <p className="text-base text-slate-500 pr-4">{desc}</p>
      </div>
      <div className={`w-10 h-10 flex-shrink-0 bg-white rounded-full flex items-center justify-center transition-colors border ${selectedColor.border} ${selectedColor.hoverChevronBg}`}>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
      </div>
    </button>
  );
};

const TaxInfoRow: React.FC<{ label: string; status: string; }> = ({ label, status }) => (
  <div className="flex items-center justify-between text-base border-b border-white/10 pb-3">
    <span className="font-semibold text-white">{label}</span>
    <span className="text-slate-400 text-right">{status}</span>
  </div>
);

export default Landing;