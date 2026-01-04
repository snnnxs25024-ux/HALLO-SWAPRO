import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

// URL ke file musik mars SWAPRO (di-host ulang untuk keandalan).
const AUDIO_URL = 'https://files.catbox.moe/w2358p.mp3';

const AudioPlayer: React.FC = () => {
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.15; // Atur volume agar lebih nyaman sebagai musik latar
      // Coba putar audio, tangani error jika autoplay diblokir oleh browser.
      // Pemutaran akan dimulai saat pengguna pertama kali mengklik tombol.
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented. User interaction is needed.
        });
      }
    }
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      // Jika audio dijeda (karena pembatasan autoplay), klik pertama akan memulainya.
      if (audio.paused) {
        audio.play().catch(e => console.error("Tidak dapat memutar audio:", e));
      }
      
      // Toggle status bisu (mute)
      const newMutedState = !audio.muted;
      audio.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  return (
    <>
      {/* Atribut 'muted' memastikan musik dimulai tanpa suara jika autoplay berhasil */}
      <audio ref={audioRef} src={AUDIO_URL} loop muted />
      <button
        onClick={toggleMute}
        title={isMuted ? 'Nyalakan Musik' : 'Matikan Musik'}
        aria-label="Toggle background music"
        className="fixed bottom-6 left-6 z-[100] w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-white transition-all duration-300 transform hover:scale-110 active:scale-95"
      >
        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      </button>
    </>
  );
};

export default AudioPlayer;
