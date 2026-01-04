import React from 'react';
import { MapPin } from 'lucide-react';

const Marquee: React.FC = () => {
  const text = "Jl. Tj. Bar. Lama No.129, RT.3/RW.4, Tj. Bar., Kec. Jagakarsa, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12530";
  
  // Duplikasi teks untuk efek loop yang mulus
  const marqueeContent = Array(4).fill(text).map((item, index) => (
    <React.Fragment key={index}>
        <MapPin className="w-4 h-4 text-blue-300 shrink-0 mx-6" />
        <span>{item}</span>
    </React.Fragment>
  ));

  return (
    <div className="bg-slate-900 py-3 overflow-hidden whitespace-nowrap relative">
      <div className="marquee-content flex items-center text-sm font-bold text-white">
        {marqueeContent}
      </div>
       <style>{`
        .marquee-content {
          animation: marquee-scroll 60s linear infinite;
        }
        
        @keyframes marquee-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

export default Marquee;