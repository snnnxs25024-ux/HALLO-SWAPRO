import React from 'react';
import { MapPin } from 'lucide-react';

const Marquee: React.FC = () => {
  const text = "Jl. Tj. Bar. Lama No.129, RT.3/RW.4, Tj. Bar., Kec. Jagakarsa, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12530";

  const MarqueeContent = () => (
    <div className="flex items-center flex-shrink-0 whitespace-nowrap">
      <MapPin className="w-4 h-4 mx-4 text-slate-300" />
      <span className="font-semibold text-sm text-slate-100">{text}</span>
    </div>
  );

  return (
    <>
      <div 
        className="w-full h-12 bg-slate-900 flex items-center overflow-hidden"
        aria-label="Informasi Alamat Kantor"
      >
        <div className="flex animate-marquee hover:pause">
          <MarqueeContent />
          <MarqueeContent />
          <MarqueeContent />
          <MarqueeContent />
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        .hover\\:pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </>
  );
};

export default Marquee;
