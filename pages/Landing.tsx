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

// --- DATA KONTEN MODAL ---
interface ModalContent {
  icon: React.ReactNode;
  title: string;
  description: string[];
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
    },
    jkn: {
        icon: <Activity className="w-6 h-6" />, title: 'Aplikasi Mobile JKN', color: 'emerald',
        description: [
            "Mobile JKN adalah aplikasi resmi dari BPJS Kesehatan. Aplikasi ini memungkinkan Anda untuk mengecek status kepesertaan, melihat kartu KIS digital, mengubah data peserta, dan mendaftar antrean online di FKTP atau rumah sakit.",
            "Fitur antrean online sangat membantu untuk mengurangi waktu tunggu di fasilitas kesehatan, membuat pengalaman berobat menjadi lebih efisien."
        ],
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
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-[scaleIn_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="p-6 md:p-8">
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
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition active:scale-95">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Tombol WhatsApp Mengambang ---
const FloatingWhatsAppButton: React.FC = () => {
    const phoneNumber = '6285890285218';
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
  
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi kami di WhatsApp"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30 transform transition-all duration-300 hover:scale-110 hover:shadow-lg hover:bg-green-600 active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-7 h-7 md:w-8 md:h-8"
          fill="currentColor"
        >
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22C13.66,22 15.25,21.5 16.63,20.67L22,22L20.67,16.63C21.5,15.25 22,13.66 22,12A10,10 0 0,0 12,2M16.75,13.96C17,14.26 17,14.86 16.8,15.46C16.6,16.06 15.9,16.56 15.3,16.56C14.8,16.56 12.7,16.06 11.2,14.56C9.3,12.66 8.1,10.26 8,9.86C7.9,9.46 8.5,8.86 8.7,8.66C8.9,8.46 9.1,8.26 9.3,8.26C9.5,8.26 9.7,8.26 9.8,8.46C10,8.66 10.4,9.36 10.5,9.56C10.6,9.76 10.6,9.96 10.5,10.06C10.4,10.16 10.3,10.26 10.2,10.36C10.1,10.46 9.9,10.66 9.8,10.76C9.7,10.86 9.6,10.96 9.7,11.16C9.8,11.36 10.3,12.16 11.1,12.86C12.1,13.76 12.8,14.06 13,14.16C13.2,14.26 13.3,14.26 13.4,14.06C13.5,13.86 13.7,13.66 13.8,13.46C14,13.26 14.2,13.16 14.4,13.16C14.6,13.16 15.5,13.56 15.8,13.66C16.1,13.76 16.5,13.86 16.75,13.96Z" />
        </svg>
      </a>
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
      <FloatingWhatsAppButton />
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center space-x-2">
              <img src="https://i.imgur.com/P7t1bQy.png" alt="SIM Group Logo" className="h-7" />
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">HALO SWAPRO</span>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-500">
              <button onClick={scrollToEducation} className="hover:text-blue-600 transition-colors">Edukasi</button>
              <button 
                onClick={() => navigate('/search')}
                className="bg-slate-900 text-white px-5 py-2 rounded-full font-bold hover:bg-blue-600 transition shadow-sm active:scale-95"
              >
                Portal Karyawan
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Visual Character Representation */}
      <section className="pt-24 pb-16 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-6">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Sistem Pintar Karyawan</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.15] mb-6 tracking-tight">
              Bekerja Lebih <span className="text-blue-600 italic">Smart</span>, <br />
              Tetap Terlindungi.
            </h1>
            <p className="text-base md:text-lg text-slate-500 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed font-medium">
              Akses informasi komprehensif mulai dari pengembangan diri, produktivitas harian, hingga manajemen jaminan sosial dalam satu portal profesional.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <button 
                onClick={() => navigate('/search')}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-base hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <span>Cari Data Karyawan</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                onClick={scrollToEducation}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 rounded-2xl font-bold text-base text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition"
              >
                <BookOpen className="w-4 h-4 mr-1 text-slate-400" />
                <span>Lihat Edukasi</span>
              </button>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end order-1 lg:order-2">
            {/* Visual Character / Avatar Group */}
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              <div className="absolute inset-0 bg-blue-600/5 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-60 md:h-60 bg-white border border-slate-100 rounded-[40px] shadow-2xl flex items-center justify-center rotate-3 transition-transform hover:rotate-0 duration-500">
                <div className="relative flex flex-col items-center">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-3xl shadow-xl mb-4">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center"><Activity className="w-3 h-3 text-white" /></div>
                    <div className="w-6 h-6 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center"><Receipt className="w-3 h-3 text-white" /></div>
                    <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center"><ShieldCheck className="w-3 h-3 text-white" /></div>
                  </div>
                  <p className="mt-4 font-bold text-slate-800 text-sm">Professional Assistant</p>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-white p-3 rounded-2xl shadow-lg border border-slate-50 animate-bounce [animation-duration:3s]">
                <Brain className="w-5 h-5 text-rose-500" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-2xl shadow-lg border border-slate-50 animate-bounce [animation-delay:1s] [animation-duration:4s]">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mindset & Productivity (Compact Grid) */}
      <section ref={educationSectionRef} className="py-12 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mental Resilience */}
          <div className="bg-rose-50/50 rounded-3xl p-6 border border-rose-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-rose-500 text-white rounded-xl shadow-sm"><RotateCcw className="w-4 h-4" /></div>
              <h2 className="font-black text-slate-800 tracking-tight uppercase text-sm">Menyikapi Kegagalan</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <EduMiniCard icon={<Brain className="w-4 h-4 text-rose-600"/>} title="Growth" desc="Gagal adalah data, bukan identitas." onClick={() => setModalContent(EDUCATION_CONTENT.growth)} />
              <EduMiniCard icon={<Heart className="w-4 h-4 text-rose-600"/>} title="Kindness" desc="Bersikaplah baik pada diri sendiri." onClick={() => setModalContent(EDUCATION_CONTENT.kindness)} />
              <EduMiniCard icon={<TrendingUp className="w-4 h-4 text-rose-600"/>} title="Pivot" desc="Evaluasi dan ubah strategi Anda." onClick={() => setModalContent(EDUCATION_CONTENT.pivot)} />
              <EduMiniCard icon={<Award className="w-4 h-4 text-rose-600"/>} title="Persist" desc="Ketangguhan kunci keberhasilan." onClick={() => setModalContent(EDUCATION_CONTENT.persist)} />
            </div>
          </div>

          {/* Productivity */}
          <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-indigo-500 text-white rounded-xl shadow-sm"><Zap className="w-4 h-4" /></div>
              <h2 className="font-black text-slate-800 tracking-tight uppercase text-sm">Tips Produktivitas</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <EduMiniCard icon={<Target className="w-4 h-4 text-indigo-600"/>} title="Eat Frog" desc="Selesaikan tugas sulit di pagi hari." onClick={() => setModalContent(EDUCATION_CONTENT.eatFrog)} />
              <EduMiniCard icon={<Clock className="w-4 h-4 text-indigo-600"/>} title="Pomodoro" desc="Fokus 25 menit, istirahat 5 menit." onClick={() => setModalContent(EDUCATION_CONTENT.pomodoro)} />
              <EduMiniCard icon={<Coffee className="w-4 h-4 text-indigo-600"/>} title="Deep Work" desc="Matikan notifikasi, fokus total." onClick={() => setModalContent(EDUCATION_CONTENT.deepWork)} />
              <EduMiniCard icon={<Activity className="w-4 h-4 text-indigo-600"/>} title="Batching" desc="Gabungkan tugas-tugas sejenis." onClick={() => setModalContent(EDUCATION_CONTENT.batching)} />
            </div>
          </div>
        </div>
      </section>

      {/* BPJS Modules (Color-coded) */}
      <section className="py-12 px-6 bg-[#F8FAFC] border-y border-slate-200/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manfaat Jaminan Sosial</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Perlindungan hak dasar karyawan</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BPJS TK */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-6">
                <img src="https://i.imgur.com/kRyWzNX.png" alt="BPJS Ketenagakerjaan Logo" className="h-7" />
                <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase">Employment</div>
              </div>
              <div className="space-y-3">
                <BenefitRow title="JKK" desc="Jaminan Kecelakaan Kerja komprehensif." onClick={() => setModalContent(EDUCATION_CONTENT.jkk)} />
                <BenefitRow title="JKM" desc="Santunan kematian bagi ahli waris." onClick={() => setModalContent(EDUCATION_CONTENT.jkm)} />
                <BenefitRow title="JHT" desc="Tabungan hari tua & dana pensiun." onClick={() => setModalContent(EDUCATION_CONTENT.jht)} />
                <BenefitRow title="JKP" desc="Manfaat tunai jika kehilangan pekerjaan." onClick={() => setModalContent(EDUCATION_CONTENT.jkp)} />
              </div>
            </div>

            {/* BPJS KS */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-6">
                <img src="https://i.imgur.com/fOML1ll.png" alt="BPJS Kesehatan Logo" className="h-7" />
                <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase">Health</div>
              </div>
              <div className="space-y-3">
                <BenefitRow title="Rawat Jalan" desc="Konsultasi dokter & obat-obatan FKTP." onClick={() => setModalContent(EDUCATION_CONTENT.rawatJalan)} />
                <BenefitRow title="Rawat Inap" desc="Layanan rumah sakit sesuai kelas." onClick={() => setModalContent(EDUCATION_CONTENT.rawatInap)} />
                <BenefitRow title="Persalinan" desc="Biaya kelahiran ibu & bayi ditanggung." onClick={() => setModalContent(EDUCATION_CONTENT.persalinan)} />
                <BenefitRow title="Emergency" desc="Penanganan darurat medis 24 jam." onClick={() => setModalContent(EDUCATION_CONTENT.emergency)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PPh 21 Section (Professional & Compact) */}
      <section className="py-12 px-6 max-w-6xl mx-auto">
        <button onClick={() => setModalContent(EDUCATION_CONTENT.pph21)} className="w-full bg-slate-900 rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl text-left hover:scale-[1.01] transition-transform duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Receipt className="w-48 h-48" /></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="bg-amber-500/20 p-2 rounded-xl w-fit mb-4">
                <Coins className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-2xl font-black mb-4 tracking-tight">Transparansi Pajak PPh 21</h2>
              <p className="text-base text-slate-400 leading-relaxed mb-6">
                Memahami potongan pajak penghasilan Anda kini lebih mudah dengan skema <b>TER 2024</b>. Transparansi adalah prioritas kami dalam mengelola payroll karyawan.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-bold bg-white/5 border border-white/10 px-3 py-1 rounded-lg uppercase tracking-wider">Kategori TER A, B, C</span>
                <span className="text-xs font-bold bg-white/5 border border-white/10 px-3 py-1 rounded-lg uppercase tracking-wider">PTKP Terkini</span>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
               <h4 className="text-amber-500 font-black text-xs uppercase mb-4 tracking-widest">Detail Kategori TER</h4>
               <div className="space-y-3">
                 <TaxInfoRow label="TER A" status="TK/0, TK/1, K/0" />
                 <TaxInfoRow label="TER B" status="TK/2, TK/3, K/1, K/2" />
                 <TaxInfoRow label="TER C" status="K/3" />
               </div>
               <div onClick={e => e.stopPropagation()} className="w-full mt-6">
                 <button onClick={() => navigate('/search')} className="w-full py-2.5 bg-amber-500 text-slate-900 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-amber-400 transition active:scale-95">
                   Cek Slip Gaji Anda
                 </button>
               </div>
            </div>
          </div>
        </button>
      </section>

      {/* Digital Access (JMO & JKN) */}
      <section className="py-12 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Panduan Akses Digital</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Aktivasi mandiri akun jaminan sosial</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* JMO CARD */}
          <button onClick={() => setModalContent(EDUCATION_CONTENT.jmo)} className="w-full text-left bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:border-blue-200 transition-colors">
            <div className="flex items-center space-x-3 mb-8">
              <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-500/20"><Smartphone className="w-5 h-5" /></div>
              <div>
                <h4 className="font-black text-slate-800 text-base">Aplikasi JMO</h4>
                <p className="text-xs text-blue-600 font-bold uppercase">Ketenagakerjaan</p>
              </div>
            </div>
            <div className="space-y-4">
              <DigitalStep num="1" title="Unduh" desc="Instal JMO di Google Play Store atau App Store." icon={<Download className="w-3.5 h-3.5"/>} />
              <DigitalStep num="2" title="Buat Akun" desc="Klik 'Buat Akun Baru' (jika pengguna baru)." icon={<UserPlus className="w-3.5 h-3.5"/>} />
              <DigitalStep num="3" title="Validasi Data" desc="Input NIK, Nama & Tanggal Lahir sesuai KTP." icon={<FileText className="w-3.5 h-3.5"/>} />
              <DigitalStep num="4" title="Otentikasi" desc="Masukkan kode OTP dari Email & No. HP aktif." icon={<Fingerprint className="w-3.5 h-3.5"/>} />
              <DigitalStep num="5" title="Tambah Kartu" desc="Jika sudah punya akun, masuk ke 'Profil' untuk menambahkan No. KPJ baru." icon={<Link className="w-3.5 h-3.5"/>} />
            </div>
          </button>

          {/* JKN CARD */}
          <button onClick={() => setModalContent(EDUCATION_CONTENT.jkn)} className="w-full text-left bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:border-emerald-200 transition-colors">
            <div className="flex items-center space-x-3 mb-8">
              <div className="bg-emerald-600 p-2.5 rounded-2xl text-white shadow-lg shadow-emerald-500/20"><Activity className="w-5 h-5" /></div>
              <div>
                <h4 className="font-black text-slate-800 text-base">Mobile JKN</h4>
                <p className="text-xs text-emerald-600 font-bold uppercase">BPJS Kesehatan</p>
              </div>
            </div>
            <div className="space-y-4">
              <DigitalStep num="1" title="Daftar" desc="Pilih 'Pendaftaran Pengguna Mobile' di menu utama." icon={<UserPlus className="w-3.5 h-3.5"/>} />
              <DigitalStep num="2" title="Identitas" desc="Input NIK atau 13 digit No. Kartu BPJS." icon={<CreditCard className="w-3.5 h-3.5"/>} />
              <DigitalStep num="3" title="Verifikasi" desc="Input Captcha & verifikasi SMS (siapkan pulsa)." icon={<MessageSquare className="w-3.5 h-3.5"/>} />
              <DigitalStep num="4" title="Set Sandi" desc="Buat kata sandi 6 digit untuk akses kartu digital." icon={<Fingerprint className="w-3.5 h-3.5"/>} />
            </div>
          </button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-8">
          <div>
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
              <img src="https://i.imgur.com/P7t1bQy.png" alt="SIM Group Logo" className="h-7" />
              <span className="font-extrabold text-slate-900 tracking-tight text-base">HALO SWAPRO</span>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">© 2025 PT SWAPRO INTERNATIONAL</p>
          </div>
          <div className="flex items-center space-x-4">
              <img 
                src="https://i.imgur.com/Lf2IC1Z.png" 
                alt="Swakarya Logo - PIC Login" 
                title="PIC/Admin Login"
                className="h-7 opacity-80 cursor-pointer hover:opacity-100 transition-opacity"
                onClick={() => navigate('/admin')}
              />
          </div>
        </div>
      </footer>
    </div>
  );
};

/* --- MINI COMPONENTS --- */

const EduMiniCard = ({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) => (
  <button onClick={onClick} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-blue-200 transition-all text-left">
    <div className="mb-2">{icon}</div>
    <h3 className="text-sm font-black text-slate-800 mb-1">{title}</h3>
    <p className="text-sm text-slate-500 leading-tight font-medium">{desc}</p>
  </button>
);

const BenefitRow = ({ title, desc, onClick }: { title: string, desc: string, onClick: () => void }) => (
  <button onClick={onClick} className="w-full flex items-start space-x-3 p-3 bg-slate-50 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all text-left">
    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
    </div>
    <div>
      <h4 className="text-sm font-black text-slate-800 leading-none mb-1">{title}</h4>
      <p className="text-sm text-slate-500 font-medium leading-tight">{desc}</p>
    </div>
  </button>
);

const DigitalStep = ({ num, title, desc, icon }: { num: string, title: string, desc: string, icon: React.ReactNode }) => (
  <div className="flex items-start space-x-4">
    <div className="w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-black shrink-0">{num}</div>
    <div>
      <div className="flex items-center space-x-2 mb-0.5">
        <span className="text-slate-400">{icon}</span>
        <h5 className="text-sm font-black text-slate-800 leading-none uppercase tracking-tight">{title}</h5>
      </div>
      <p className="text-sm text-slate-500 font-medium leading-tight">{desc}</p>
    </div>
  </div>
);

const TaxInfoRow = ({ label, status }: { label: string, status: string }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-xs font-black text-amber-500">{status}</span>
  </div>
);

// This component is no longer used in the main landing flow but kept for potential future use.
const RoleCard = ({ icon, title, desc, onClick, color }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void, color: string }) => (
  <button 
    onClick={onClick}
    className="group p-6 bg-white border border-slate-200 rounded-[28px] text-left hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300 active:scale-[0.98]"
  >
    <div className={`mb-5 bg-slate-50 w-fit p-3.5 rounded-2xl border border-slate-100 group-hover:bg-${color === 'blue' ? 'blue' : 'emerald'}-600 group-hover:text-white transition-colors`}>
      {icon}
    </div>
    <h3 className="text-base font-black text-slate-900 mb-1.5 uppercase tracking-tight">{title}</h3>
    <p className="text-[12px] text-slate-500 font-medium leading-relaxed mb-6">{desc}</p>
    <div className={`flex items-center text-[11px] font-black uppercase tracking-widest ${color === 'blue' ? 'text-blue-600' : 'text-emerald-600'} group-hover:translate-x-1 transition-transform`}>
      <span>Akses Sekarang</span>
      <ChevronRight className="w-3.5 h-3.5 ml-1" />
    </div>
  </button>
);

export default Landing;